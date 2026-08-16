import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseShell } from "shell-quote";
import { parse as parseToml } from "smol-toml";
import { parse as parseYaml } from "yaml";

const MIGRATION_FILE_PATTERN = /^(\d{14})_([a-z0-9_]+)\.sql$/;
const LEDGER_HEADER =
  "remote_version,remote_name,source_status,source_reference";
const LEDGER_STATUSES = new Set(["matched", "mapped", "remote_only"]);
const LEGACY_SQL_DIRECTORIES = [
  "unify-front-end/supabase/migrations",
  "unify-back-end/src/database",
];
const AUTOMATION_DIRECTORIES = [
  ".github/actions",
  ".github/workflows",
  "scripts",
  "unify-back-end/scripts",
  "unify-front-end/scripts",
];
const AUTOMATION_FILES = [
  "package.json",
  "unify-back-end/package.json",
  "unify-front-end/package.json",
];

function listSqlFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => join(directory, entry.name));
}

function listFilesRecursively(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFilesRecursively(path) : [path];
  });
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function collectRunCommands(value, commands = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectRunCommands(item, commands);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "run" && typeof child === "string") commands.push(child);
      else collectRunCommands(child, commands);
    }
  }
  return commands;
}

function automationCommands(path, repositoryRoot, errors) {
  const contents = readFileSync(path, "utf8");
  const repositoryPath = relative(repositoryRoot, path);
  const isGithubYaml =
    (repositoryPath.startsWith(`.github/workflows${sep}`) ||
      repositoryPath.startsWith(`.github/actions${sep}`)) &&
    /\.ya?ml$/i.test(path);

  if (isGithubYaml) {
    try {
      return collectRunCommands(parseYaml(contents));
    } catch {
      errors.push(`automation file must be valid YAML: ${repositoryPath}`);
      return [];
    }
  }

  return contents.replace(/\\(?:\r\n|\r|\n)[ \t]*/g, " ").split(/\r?\n|\r/);
}

function normalizeShellCommand(command) {
  try {
    return parseShell(command)
      .map((token) => (typeof token === "string" ? token : ";"))
      .join(" ");
  } catch {
    return command.replace(/["']/g, "");
  }
}

function validateConfig(databaseRoot, errors) {
  const configPath = join(databaseRoot, "config.toml");
  if (!existsSync(configPath)) return;

  let config;
  try {
    config = parseToml(readFileSync(configPath, "utf8"));
  } catch {
    errors.push("config.toml must be valid TOML");
    return;
  }

  const requiredValues = [
    [config.project_id === "unify-shared-database", "shared project_id"],
    [config.db?.major_version === 17, "PostgreSQL major version 17"],
    [config.db?.migrations?.enabled === true, "enabled migrations"],
    [config.db?.seed?.enabled === true, "enabled seed execution"],
    [
      Array.isArray(config.db?.seed?.sql_paths) &&
        config.db.seed.sql_paths.length === 1 &&
        config.db.seed.sql_paths[0] === "./seed.sql",
      "seed.sql path",
    ],
    [config.edge_runtime?.enabled === false, "disabled Edge runtime"],
  ];
  for (const [isValid, description] of requiredValues) {
    if (!isValid) errors.push(`config.toml must declare ${description}`);
  }
  if (Object.hasOwn(config, "functions")) {
    errors.push("shared database owner must not configure Edge Functions");
  }
}

function isCommentOnlySql(contents) {
  let blockDepth = 0;

  for (let index = 0; index < contents.length; index += 1) {
    const current = contents[index];
    const next = contents[index + 1];

    if (blockDepth > 0) {
      if (current === "/" && next === "*") {
        blockDepth += 1;
        index += 1;
      } else if (current === "*" && next === "/") {
        blockDepth -= 1;
        index += 1;
      }
      continue;
    }

    if (current === "-" && next === "-") {
      const lineEnding = contents.slice(index + 2).search(/[\r\n]/);
      if (lineEnding === -1) return true;
      index += lineEnding + 2;
      continue;
    }
    if (current === "/" && next === "*") {
      blockDepth = 1;
      index += 1;
      continue;
    }
    if (!/\s/.test(current) && current !== "\uFEFF") return false;
  }

  return blockDepth === 0;
}

function validateLedgerMigrationNames(databaseRoot, state, rows, errors) {
  if (!state || state.phase === "foundation") return;

  const migrationNames = new Set(
    listSqlFiles(join(databaseRoot, "migrations")).map((path) =>
      path.split(sep).at(-1),
    ),
  );
  for (const row of rows) {
    const expectedName = `${row.version}_${row.name}.sql`;
    const migrationPath = join(databaseRoot, "migrations", expectedName);
    if (!migrationNames.has(expectedName)) {
      errors.push(`missing exact production migration ${expectedName}`);
    } else if (
      row.version !== state.baselineVersion &&
      !isCommentOnlySql(readFileSync(migrationPath, "utf8"))
    ) {
      errors.push(`compatibility marker ${expectedName} must be comment-only`);
    }
  }
}

function validateNoUnsafeDatabaseAutomation(repositoryRoot, errors) {
  const candidatePaths = [
    ...AUTOMATION_DIRECTORIES.flatMap((directory) =>
      listFilesRecursively(join(repositoryRoot, directory)),
    ),
    ...AUTOMATION_FILES.map((path) => join(repositoryRoot, path)).filter(
      existsSync,
    ),
  ].filter(
    (path) =>
      relative(repositoryRoot, path) !==
      "unify-back-end/scripts/validate-shared-database.test.mjs",
  );
  const sqlClientName = ["ps", "ql"].join("");
  const subcommand = (...tokens) =>
    new RegExp(`\\b${tokens.join("\\s+")}\\b`, "i");
  const remoteFlag = /--(?:linked|db-url|project-ref)\b/i;
  const alwaysUnsafe = [
    subcommand("db", "push"),
    subcommand("migration", "repair"),
    new RegExp(`\\b${sqlClientName}\\b`, "i"),
  ];
  const remotelyUnsafe = [
    subcommand("db", "reset"),
    subcommand("migration", "up"),
  ];

  for (const path of new Set(candidatePaths)) {
    if (!statSync(path).isFile()) continue;
    const commands = automationCommands(path, repositoryRoot, errors);
    const hasUnsafeCommand = commands.some((command) => {
      const normalized = normalizeShellCommand(command);
      return (
        alwaysUnsafe.some((pattern) => pattern.test(normalized)) ||
        (remoteFlag.test(normalized) &&
          remotelyUnsafe.some((pattern) => pattern.test(normalized)))
      );
    });
    if (hasUnsafeCommand) {
      errors.push(
        `unsafe production database command in ${relative(repositoryRoot, path)}`,
      );
    }
  }
}

function validateMigrations(databaseRoot, errors) {
  const migrationsRoot = join(databaseRoot, "migrations");
  if (!existsSync(migrationsRoot)) {
    errors.push("missing canonical migrations directory");
    return [];
  }

  const versions = new Map();
  for (const path of listSqlFiles(migrationsRoot)) {
    const name = path.split(sep).at(-1);
    const match = name.match(MIGRATION_FILE_PATTERN);
    if (!match) {
      errors.push(
        `invalid migration filename ${name}; expected 14 digits and snake_case`,
      );
      continue;
    }

    const [, version] = match;
    if (versions.has(version)) {
      errors.push(
        `duplicate migration version ${version}: ${versions.get(version)} and ${name}`,
      );
    } else {
      versions.set(version, name);
    }
  }

  return [...versions.keys()].sort();
}

function validateLedger(databaseRoot, errors) {
  const ledgerPath = join(databaseRoot, "policy", "production-migrations.csv");
  if (!existsSync(ledgerPath)) {
    errors.push("missing production migration ledger");
    return { rows: [], versions: [] };
  }

  const lines = readFileSync(ledgerPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.length > 0);

  if (lines[0] !== LEDGER_HEADER) {
    errors.push(`invalid production ledger header; expected ${LEDGER_HEADER}`);
    return { rows: [], versions: [] };
  }

  const versions = new Set();
  const rows = [];
  for (const [offset, line] of lines.slice(1).entries()) {
    const lineNumber = offset + 2;
    const fields = line.split(",");
    if (fields.length !== 4) {
      errors.push(`ledger line ${lineNumber} must contain exactly four fields`);
      continue;
    }

    const [version, name, status, sourceReference] = fields;
    if (!/^\d{14}$/.test(version)) {
      errors.push(`ledger version must be 14 digits on line ${lineNumber}`);
    } else if (versions.has(version)) {
      errors.push(`duplicate ledger version ${version}`);
    } else {
      versions.add(version);
    }

    if (!/^[a-z0-9_]+$/.test(name)) {
      errors.push(`ledger name must be snake_case on line ${lineNumber}`);
    }
    if (!LEDGER_STATUSES.has(status)) {
      errors.push(
        `invalid ledger source_status ${status} on line ${lineNumber}`,
      );
    }
    if (!sourceReference) {
      errors.push(`missing ledger source_reference on line ${lineNumber}`);
    }
    rows.push({ lineNumber, name, sourceReference, status, version });
  }

  if (lines.length === 1) {
    errors.push("production migration ledger must contain at least one row");
  }

  return { rows, versions: [...versions].sort() };
}

function validateLedgerSources(repositoryRoot, rows, manifestEntries, errors) {
  for (const row of rows) {
    if (row.status === "remote_only") {
      if (row.sourceReference !== "production") {
        errors.push(
          `remote_only ledger row ${row.version} must reference production`,
        );
      }
      continue;
    }

    const sourcePaths = row.sourceReference.split(";").filter(Boolean);
    if (sourcePaths.length === 0) {
      errors.push(`ledger row ${row.version} has no repository source`);
      continue;
    }
    if (
      row.status === "matched" &&
      (sourcePaths.length !== 1 ||
        basename(sourcePaths[0]) !== `${row.version}_${row.name}.sql`)
    ) {
      errors.push(
        `matched ledger row ${row.version} must reference ${row.version}_${row.name}.sql`,
      );
    }
    for (const repositoryPath of sourcePaths) {
      if (
        !LEGACY_SQL_DIRECTORIES.some(
          (directory) =>
            repositoryPath === directory ||
            repositoryPath.startsWith(`${directory}/`),
        )
      ) {
        errors.push(
          `ledger source is outside frozen legacy SQL: ${repositoryPath}`,
        );
        continue;
      }
      const sourcePath = join(repositoryRoot, repositoryPath);
      if (
        !repositoryPath.endsWith(".sql") ||
        !existsSync(sourcePath) ||
        !statSync(sourcePath).isFile()
      ) {
        errors.push(`missing ledger source ${repositoryPath}`);
      } else if (!manifestEntries.has(repositoryPath)) {
        errors.push(
          `ledger source is not frozen in the manifest: ${repositoryPath}`,
        );
      }
    }
  }
}

function validateBaselineState(databaseRoot, errors) {
  const statePath = join(databaseRoot, "policy", "baseline-state.json");
  if (!existsSync(statePath)) {
    errors.push("missing baseline state");
    return null;
  }

  let state;
  try {
    state = JSON.parse(readFileSync(statePath, "utf8"));
  } catch {
    errors.push("baseline state must be valid JSON");
    return null;
  }

  if (state.schemaVersion !== 1) {
    errors.push("baseline state schemaVersion must be 1");
  }
  if (!["foundation", "baseline_ready", "active"].includes(state.phase)) {
    errors.push("baseline state phase is invalid");
  }
  for (const field of ["productionLedgerCount", "canonicalMigrationCount"]) {
    if (!Number.isInteger(state[field]) || state[field] < 0) {
      errors.push(`baseline state ${field} must be a non-negative integer`);
    }
  }
  if (
    state.baselineVersion !== null &&
    !/^\d{14}$/.test(state.baselineVersion)
  ) {
    errors.push("baselineVersion must be null or a 14-digit version");
  }

  return state;
}

function validateStateAgainstSources(
  state,
  migrationVersions,
  ledgerVersions,
  errors,
) {
  if (!state) return;

  if (state.productionLedgerCount !== ledgerVersions.length) {
    errors.push(
      `production ledger count is ${ledgerVersions.length}; state declares ${state.productionLedgerCount}`,
    );
  }
  if (state.canonicalMigrationCount !== migrationVersions.length) {
    errors.push(
      `canonical migration count is ${migrationVersions.length}; state declares ${state.canonicalMigrationCount}`,
    );
  }

  if (state.phase === "foundation") {
    if (migrationVersions.length !== 0) {
      errors.push("foundation phase must have zero canonical migrations");
    }
    if (state.baselineVersion !== null) {
      errors.push("foundation phase baselineVersion must be null");
    }
    return;
  }

  if (!state.baselineVersion) {
    errors.push(`${state.phase} phase requires a baselineVersion`);
    return;
  }
  if (!migrationVersions.includes(state.baselineVersion)) {
    errors.push(`baseline migration ${state.baselineVersion} is missing`);
  }

  for (const ledgerVersion of ledgerVersions) {
    if (!migrationVersions.includes(ledgerVersion)) {
      errors.push(
        `missing compatibility marker for ledger version ${ledgerVersion}`,
      );
    }
  }

  const earliestLedgerVersion = ledgerVersions[0];
  if (
    earliestLedgerVersion &&
    state.baselineVersion !== earliestLedgerVersion
  ) {
    errors.push(
      "baselineVersion must reuse the earliest production ledger version",
    );
  }

  if (
    state.phase === "baseline_ready" &&
    migrationVersions.length !== ledgerVersions.length
  ) {
    errors.push(
      "baseline_ready phase must contain only the baseline and production compatibility markers",
    );
  }

  const latestLedgerVersion = ledgerVersions.at(-1);
  for (const version of migrationVersions) {
    if (
      !ledgerVersions.includes(version) &&
      latestLedgerVersion &&
      version <= latestLedgerVersion
    ) {
      errors.push(
        `post-baseline migration ${version} is not newer than production`,
      );
    }
  }
}

function validateLegacyManifest(repositoryRoot, databaseRoot, errors) {
  const manifestPath = join(
    databaseRoot,
    "policy",
    "legacy-database-files.sha256",
  );
  if (!existsSync(manifestPath)) {
    errors.push("missing frozen legacy database file manifest");
    return new Set();
  }

  const manifestEntries = new Map();
  const lines = readFileSync(manifestPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.length > 0);

  for (const [offset, line] of lines.entries()) {
    const match = line.match(/^([a-f0-9]{64})  (.+)$/);
    if (!match) {
      errors.push(`invalid legacy manifest line ${offset + 1}`);
      continue;
    }

    const [, expectedHash, repositoryPath] = match;
    if (manifestEntries.has(repositoryPath)) {
      errors.push(`duplicate legacy manifest path ${repositoryPath}`);
      continue;
    }
    manifestEntries.set(repositoryPath, expectedHash);

    const absolutePath = resolve(repositoryRoot, repositoryPath);
    const relativePath = relative(repositoryRoot, absolutePath);
    if (relativePath.startsWith(`..${sep}`) || relativePath === "..") {
      errors.push(`legacy manifest path escapes repository: ${repositoryPath}`);
      continue;
    }
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      errors.push(`missing frozen legacy file ${repositoryPath}`);
      continue;
    }
    if (sha256File(absolutePath) !== expectedHash) {
      errors.push(`legacy file hash mismatch: ${repositoryPath}`);
    }
  }

  const legacySqlPaths = LEGACY_SQL_DIRECTORIES.flatMap((repositoryPath) =>
    listSqlFiles(join(repositoryRoot, repositoryPath)).map((path) =>
      relative(repositoryRoot, path),
    ),
  );

  for (const repositoryPath of legacySqlPaths) {
    if (!manifestEntries.has(repositoryPath)) {
      errors.push(`untracked legacy database file: ${repositoryPath}`);
    }
  }
  for (const repositoryPath of manifestEntries.keys()) {
    if (!legacySqlPaths.includes(repositoryPath)) {
      errors.push(
        `legacy manifest contains unexpected path: ${repositoryPath}`,
      );
    }
  }

  return new Set(manifestEntries.keys());
}

export function validateSharedDatabase({ databaseRoot, repositoryRoot }) {
  const errors = [];
  const requiredFiles = ["config.toml", "seed.sql", "BASELINE_STATUS.md"];

  for (const path of requiredFiles) {
    if (!existsSync(join(databaseRoot, path))) {
      errors.push(`missing required shared database file: ${path}`);
    }
  }

  if (existsSync(join(databaseRoot, "functions"))) {
    errors.push("shared database owner must not contain Edge Functions");
  }

  validateConfig(databaseRoot, errors);
  validateNoUnsafeDatabaseAutomation(repositoryRoot, errors);
  const migrationVersions = validateMigrations(databaseRoot, errors);
  const ledger = validateLedger(databaseRoot, errors);
  const state = validateBaselineState(databaseRoot, errors);
  validateStateAgainstSources(
    state,
    migrationVersions,
    ledger.versions,
    errors,
  );
  validateLedgerMigrationNames(databaseRoot, state, ledger.rows, errors);
  const seedPath = join(databaseRoot, "seed.sql");
  if (state?.phase === "foundation" && existsSync(seedPath)) {
    const seedContents = readFileSync(seedPath, "utf8");
    const executableSeedLines = seedContents
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("--"));
    if (executableSeedLines.length > 0) {
      errors.push("foundation seed must be comment-only");
    }
  }
  const manifestEntries = validateLegacyManifest(
    repositoryRoot,
    databaseRoot,
    errors,
  );
  validateLedgerSources(repositoryRoot, ledger.rows, manifestEntries, errors);

  return errors;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  const scriptDirectory = dirname(scriptPath);
  const repositoryRoot = resolve(scriptDirectory, "..", "..");
  const databaseRoot = join(repositoryRoot, "unify-back-end", "supabase");
  const errors = validateSharedDatabase({ databaseRoot, repositoryRoot });

  if (errors.length > 0) {
    console.error("Shared database policy validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log("Shared database policy validation passed.");
  }
}

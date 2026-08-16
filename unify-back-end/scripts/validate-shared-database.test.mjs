import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { validateSharedDatabase } from "./validate-shared-database.mjs";

function write(root, relativePath, contents) {
  const target = join(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

function createFixture() {
  const repositoryRoot = mkdtempSync(join(tmpdir(), "unify-shared-db-"));
  const databaseRoot = join(repositoryRoot, "unify-back-end", "supabase");
  const legacyPath =
    "unify-front-end/supabase/migrations/20250101000000_legacy.sql";
  const legacySql = "select 1;\n";

  write(repositoryRoot, legacyPath, legacySql);
  write(
    databaseRoot,
    "config.toml",
    [
      'project_id = "unify-shared-database"',
      "[db]",
      "major_version = 17",
      "[db.migrations]",
      "enabled = true",
      "[db.seed]",
      "enabled = true",
      'sql_paths = ["./seed.sql"]',
      "[edge_runtime]",
      "enabled = false",
      "",
    ].join("\n"),
  );
  write(databaseRoot, "seed.sql", "-- Intentionally empty.\n");
  write(databaseRoot, "BASELINE_STATUS.md", "# Baseline status\n");
  write(
    databaseRoot,
    "migrations/20260816000000_first_remote.sql",
    "select 1;\n",
  );
  write(
    databaseRoot,
    "policy/baseline-state.json",
    `${JSON.stringify(
      {
        schemaVersion: 1,
        phase: "baseline_ready",
        productionLedgerCount: 1,
        canonicalMigrationCount: 1,
        baselineVersion: "20260816000000",
      },
      null,
      2,
    )}\n`,
  );
  write(
    databaseRoot,
    "policy/production-migrations.csv",
    [
      "remote_version,remote_name,source_status,source_reference",
      `20260816000000,first_remote,mapped,${legacyPath}`,
      "",
    ].join("\n"),
  );
  write(
    databaseRoot,
    "policy/legacy-database-files.sha256",
    `${sha256(legacySql)}  ${legacyPath}\n`,
  );

  return { databaseRoot, legacyPath, repositoryRoot };
}

test("accepts a valid shared database layout", () => {
  const fixture = createFixture();

  assert.deepEqual(validateSharedDatabase(fixture), []);
});

test("rejects migration filenames without a unique 14-digit version", () => {
  const fixture = createFixture();
  write(fixture.databaseRoot, "migrations/20260817_bad.sql", "select 1;\n");
  write(
    fixture.databaseRoot,
    "migrations/20260816000000_duplicate_version.sql",
    "select 2;\n",
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(errors.some((error) => error.includes("20260817_bad.sql")));
  assert.ok(
    errors.some((error) => error.includes("duplicate migration version")),
  );
});

test("rejects production ledger rows with invalid or duplicate versions", () => {
  const fixture = createFixture();
  write(
    fixture.databaseRoot,
    "policy/production-migrations.csv",
    [
      "remote_version,remote_name,source_status,source_reference",
      "20260816,not_valid,matched,source.sql",
      "20260816000000,valid_name,matched,source.sql",
      "20260816000000,duplicate_name,remote_only,production",
      "",
    ].join("\n"),
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(
    errors.some((error) => error.includes("ledger version must be 14 digits")),
  );
  assert.ok(errors.some((error) => error.includes("duplicate ledger version")));
});

test("rejects edits to frozen legacy migrations", () => {
  const fixture = createFixture();
  write(fixture.repositoryRoot, fixture.legacyPath, "select 2;\n");

  const errors = validateSharedDatabase(fixture);

  assert.ok(
    errors.some((error) => error.includes("legacy file hash mismatch")),
  );
});

test("rejects legacy SQL files missing from the frozen manifest", () => {
  const fixture = createFixture();
  write(
    fixture.repositoryRoot,
    "unify-back-end/src/database/untracked.sql",
    "select 1;\n",
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(
    errors.some((error) => error.includes("untracked legacy database file")),
  );
});

test("rejects nested legacy SQL files missing from the frozen manifest", () => {
  const fixture = createFixture();
  write(
    fixture.repositoryRoot,
    "unify-back-end/src/database/functions/untracked.sql",
    "select 1;\n",
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(
    errors.some((error) => error.includes("untracked legacy database file")),
  );
});

test("rejects Edge Function source inside the database-only owner", () => {
  const fixture = createFixture();
  write(
    fixture.databaseRoot,
    "functions/example/index.ts",
    "Deno.serve(() => new Response());\n",
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(
    errors.some((error) => error.includes("must not contain Edge Functions")),
  );
});

test("rejects Edge Function configuration in the database-only owner", () => {
  for (const header of [
    "[functions.example]",
    "[ functions.example ]",
    "[functions . example]",
    "['functions'.example]",
    '["functions".example]',
  ]) {
    const fixture = createFixture();
    write(
      fixture.databaseRoot,
      "config.toml",
      `${header}\nverify_jwt = true\n`,
    );

    const errors = validateSharedDatabase(fixture);

    assert.ok(
      errors.some((error) =>
        error.includes("must not configure Edge Functions"),
      ),
      `expected ${header} to be rejected`,
    );
  }
});

test("requires production compatibility markers to be comment-only", () => {
  const fixture = createFixture();
  write(
    fixture.databaseRoot,
    "migrations/20260816000001_second_remote.sql",
    "drop table public.profiles;\n",
  );
  write(
    fixture.databaseRoot,
    "policy/production-migrations.csv",
    [
      "remote_version,remote_name,source_status,source_reference",
      `20260816000000,first_remote,mapped,${fixture.legacyPath}`,
      "20260816000001,second_remote,remote_only,production",
      "",
    ].join("\n"),
  );
  write(
    fixture.databaseRoot,
    "policy/baseline-state.json",
    `${JSON.stringify(
      {
        schemaVersion: 1,
        phase: "baseline_ready",
        productionLedgerCount: 2,
        canonicalMigrationCount: 2,
        baselineVersion: "20260816000000",
      },
      null,
      2,
    )}\n`,
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(errors.some((error) => error.includes("must be comment-only")));
});

test("treats a bare carriage return as the end of a SQL line comment", () => {
  const fixture = createFixture();
  write(
    fixture.databaseRoot,
    "migrations/20260816000001_second_remote.sql",
    "-- marker\rdrop table public.profiles;\n",
  );
  write(
    fixture.databaseRoot,
    "policy/production-migrations.csv",
    [
      "remote_version,remote_name,source_status,source_reference",
      `20260816000000,first_remote,mapped,${fixture.legacyPath}`,
      "20260816000001,second_remote,remote_only,production",
      "",
    ].join("\n"),
  );
  write(
    fixture.databaseRoot,
    "policy/baseline-state.json",
    `${JSON.stringify(
      {
        schemaVersion: 1,
        phase: "baseline_ready",
        productionLedgerCount: 2,
        canonicalMigrationCount: 2,
        baselineVersion: "20260816000000",
      },
      null,
      2,
    )}\n`,
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(errors.some((error) => error.includes("must be comment-only")));
});

test("rejects unsafe production database commands in automation", () => {
  const unsafeCommands = [
    ["supabase", "db", "push"].join(" "),
    ["npm", "exec", "supabase", "--", "db", "push"].join(" "),
    `${["ps", "ql"].join("")} "$DATABASE_URL" -f schema.sql`,
    ["supabase", "migration", "up", "--linked"].join(" "),
    ["supabase", "db", "reset", "--db-url", "$DATABASE_URL"].join(" "),
    'supabase "db" "reset" --linked',
    ["supabase", "db", "reset"].join(" "),
    ["supabase", "migration", "up"].join(" "),
    ["supabase", "link", "--project-ref", "production"].join(" "),
  ];

  for (const [index, command] of unsafeCommands.entries()) {
    const fixture = createFixture();
    write(
      fixture.repositoryRoot,
      `.github/workflows/deploy-${index}.yml`,
      `steps:\n  - run: ${command}\n`,
    );

    const errors = validateSharedDatabase(fixture);

    assert.ok(
      errors.some((error) =>
        error.includes("unsafe production database command"),
      ),
      `expected unsafe command ${index + 1} to be rejected`,
    );
  }
});

test("rejects folded workflow commands and local composite action wrappers", () => {
  for (const [path, contents] of [
    [
      ".github/workflows/folded.test.yml",
      "steps:\n  - run: >\n      npm exec supabase --\n      db push --linked\n",
    ],
    [
      ".github/workflows/continued.yml",
      "steps:\n  - run: |\n      supabase db \\\n        push --linked\n",
    ],
    [
      ".github/actions/db/action.yml",
      "name: Database\nruns:\n  using: composite\n  steps:\n    - shell: bash\n      run: supabase db reset --linked\n",
    ],
  ]) {
    const fixture = createFixture();
    write(fixture.repositoryRoot, path, contents);

    const errors = validateSharedDatabase(fixture);

    assert.ok(
      errors.some((error) =>
        error.includes("unsafe production database command"),
      ),
      `expected ${path} to be rejected`,
    );
  }
});

test("rejects production subcommands invoked through environment wrappers", () => {
  const fixture = createFixture();
  write(
    fixture.repositoryRoot,
    ".github/workflows/environment-wrapper.yml",
    "env:\n  SUPABASE_BIN: supabase\nsteps:\n  - run: $SUPABASE_BIN db push --linked\n",
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(
    errors.some((error) =>
      error.includes("unsafe production database command"),
    ),
  );
});

test("rejects a linked project followed by an unqualified database reset", () => {
  const fixture = createFixture();
  write(
    fixture.repositoryRoot,
    ".github/workflows/linked-reset.yml",
    "steps:\n  - run: supabase link --project-ref production\n  - run: supabase db reset\n",
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(
    errors.some((error) =>
      error.includes("unsafe production database command"),
    ),
  );
});

test("evaluates local flags per shell command", () => {
  for (const [path, run] of [
    [
      ".github/workflows/mixed-lines.yml",
      "|\n      supabase db reset --linked\n      supabase status --local",
    ],
    [
      ".github/workflows/mixed-operators.yml",
      "supabase migration up --linked; supabase status --local",
    ],
  ]) {
    const fixture = createFixture();
    write(fixture.repositoryRoot, path, `steps:\n  - run: ${run}\n`);

    const errors = validateSharedDatabase(fixture);

    assert.ok(
      errors.some((error) =>
        error.includes("unsafe production database command"),
      ),
      `expected ${path} to be rejected`,
    );
  }
});

test("allows explicitly local database automation", () => {
  const fixture = createFixture();
  write(
    fixture.repositoryRoot,
    ".github/workflows/local.yml",
    "steps:\n  - run: supabase db reset --local\n  - run: supabase migration up --local\n",
  );

  assert.deepEqual(validateSharedDatabase(fixture), []);
});

test("does not accept required config values from the wrong TOML section", () => {
  const fixture = createFixture();
  write(
    fixture.databaseRoot,
    "config.toml",
    [
      'project_id = "unify-shared-database"',
      "[db]",
      "major_version = 17",
      "[db.migrations]",
      "enabled = false",
      "[db.seed]",
      "enabled = true",
      'sql_paths = ["./seed.sql"]',
      "[edge_runtime]",
      "enabled = false",
      "",
    ].join("\n"),
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(errors.some((error) => error.includes("enabled migrations")));
});

test("rejects a non-object baseline state without throwing", () => {
  const fixture = createFixture();
  write(fixture.databaseRoot, "policy/baseline-state.json", "null\n");

  const errors = validateSharedDatabase(fixture);

  assert.ok(errors.some((error) => error.includes("must be a JSON object")));
});

test("requires exact production migration names once the baseline is ready", () => {
  const fixture = createFixture();
  write(
    fixture.databaseRoot,
    "policy/production-migrations.csv",
    [
      "remote_version,remote_name,source_status,source_reference",
      `20260816000000,renamed_remote,mapped,${fixture.legacyPath}`,
      "",
    ].join("\n"),
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(
    errors.some((error) => error.includes("20260816000000_renamed_remote.sql")),
  );
});

test("requires matched ledger rows to reference the exact frozen SQL file", () => {
  const fixture = createFixture();
  write(
    fixture.databaseRoot,
    "policy/production-migrations.csv",
    [
      "remote_version,remote_name,source_status,source_reference",
      `20260816000000,first_remote,matched,${fixture.legacyPath}`,
      "",
    ].join("\n"),
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(
    errors.some((error) => error.includes("matched ledger row 20260816000000")),
  );
});

test("rejects active migrations while the baseline is in foundation phase", () => {
  const fixture = createFixture();
  write(
    fixture.databaseRoot,
    "policy/baseline-state.json",
    `${JSON.stringify(
      {
        schemaVersion: 1,
        phase: "foundation",
        productionLedgerCount: 1,
        canonicalMigrationCount: 0,
        baselineVersion: null,
      },
      null,
      2,
    )}\n`,
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(
    errors.some((error) => error.includes("foundation phase must have zero")),
  );
  assert.ok(
    errors.some((error) => error.includes("canonical migration count")),
  );
});

test("requires a comment-only seed during foundation phase", () => {
  const fixture = createFixture();
  write(fixture.databaseRoot, "seed.sql", "insert into profiles values (1);\n");
  write(
    fixture.databaseRoot,
    "policy/baseline-state.json",
    `${JSON.stringify(
      {
        schemaVersion: 1,
        phase: "foundation",
        productionLedgerCount: 1,
        canonicalMigrationCount: 0,
        baselineVersion: null,
      },
      null,
      2,
    )}\n`,
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(
    errors.some((error) =>
      error.includes("foundation seed must be comment-only"),
    ),
  );
});

test("accepts block comments in the foundation seed", () => {
  const fixture = createFixture();
  write(fixture.databaseRoot, "seed.sql", "/* Intentionally empty. */\n");
  write(
    fixture.databaseRoot,
    "policy/baseline-state.json",
    `${JSON.stringify(
      {
        schemaVersion: 1,
        phase: "foundation",
        productionLedgerCount: 1,
        canonicalMigrationCount: 0,
        baselineVersion: null,
      },
      null,
      2,
    )}\n`,
  );

  const errors = validateSharedDatabase(fixture);

  assert.ok(
    !errors.some((error) =>
      error.includes("foundation seed must be comment-only"),
    ),
  );
});

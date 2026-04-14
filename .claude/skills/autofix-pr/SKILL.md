---
name: autofix-pr
description: Monitor and autofix a GitHub PR by subscribing to its activity, handling CI failures, and triaging AI code review comments (especially CodeRabbit). Use this skill when the user says "autofix PR", "monitor PR", "watch PR", "fix PR comments", "handle review comments", or references fixing issues on a pull request. Also trigger when the user wants to respond to CodeRabbit, code review bots, or CI failures on a PR.
---

Monitor a GitHub pull request for CI failures and review comments, then triage and fix legitimate issues while skipping false positives.

## Workflow

### 1. Subscribe to PR Activity

Use `subscribe_pr_activity` to start receiving CI failure and review comment events for the PR. If a PR number is not provided, check the current branch for an open PR.

### 2. Check Current State

On initial subscription, immediately check:
- **CI status**: Use `pull_request_read` with `get_check_runs` to see current CI state
- **Review comments**: Use `pull_request_read` with `get_review_comments` to get all review threads
- **PR comments**: Use `pull_request_read` with `get_comments` for general comments

### 3. Triage CodeRabbit Comments

CodeRabbit (`coderabbitai[bot]`) is an AI code reviewer. Its comments require careful triage because many are false positives. For each unresolved CodeRabbit comment:

#### Read the actual code first
Never accept a CodeRabbit suggestion at face value. Always read the referenced file and lines to verify the finding against the current code.

#### Classify each comment

**LEGITIMATE issues (fix these):**
- Security vulnerabilities (exposed secrets, missing auth, open endpoints)
- Data loss bugs (cascading deletes on empty results, overwriting valid data with defaults)
- Logic errors that produce incorrect behavior in normal usage
- Missing null/error checks at system boundaries

**FALSE POSITIVES (skip these):**
- Race conditions that require impossible timing in a single-user mobile app
- Suggestions to add database columns/RPCs for theoretical edge cases
- "Redundant check" nitpicks on defensive code that is harmless
- Re-sorting/ordering concerns when a deterministic tiebreaker already exists (e.g., `localeCompare`)
- Suggestions to fail loudly in migrations/seeds that intentionally tolerate absent data
- Comments marked as `is_outdated: true` where the code has already been fixed in subsequent commits
- Over-engineering suggestions (adding Postgres RPC functions, persisted position columns, etc.) for problems that don't occur in practice

**NITPICKS (skip unless trivial):**
- Redundant guards that are harmless
- Style preferences
- "Could be simplified" suggestions that don't affect correctness

#### Key indicators of false positives:
- The comment references line numbers from an older diff (`is_outdated: true`)
- The suggested fix requires schema changes for a minor edge case
- The comment describes a race condition in single-user/single-device context
- The comment is marked as a "Duplicate" of an already-resolved thread
- The fix would add significant complexity for minimal real-world benefit

### 4. Handle CI Failures

When CI fails:
1. Read the check run details to understand the failure
2. Check if it's a flaky test or a real failure
3. For real failures: read the relevant code, fix the issue, commit and push
4. For flaky tests: note it and ask the user before retrying

### 5. Make Fixes

For legitimate issues:
1. Read the file and surrounding context
2. Make the minimal fix needed
3. Commit with a clear message explaining what was fixed and why
4. Push to the PR branch

### 6. Report to User

After triaging all comments, provide a summary table:

| # | File | Issue | Verdict |
|---|------|-------|---------|
| 1 | path/to/file.ts | Description | **Fixed** / **False positive** / **Skip** |

Explain briefly why each false positive was skipped so the user can override if needed.

## Important Rules

- **Never blindly apply all CodeRabbit suggestions.** Many are wrong or over-engineered.
- **Always read the actual code** before deciding if a comment is valid.
- **Prefer minimal fixes** over architectural changes suggested by the bot.
- **Don't add complexity** (new DB functions, schema changes, extra queries) unless the bug is real and impacts users.
- **Check `is_outdated` and `is_resolved` flags** on review threads -- outdated/resolved threads are already handled.
- **Commit only relevant files** per the project's CLAUDE.md instructions.

---
name: autofix-pr
description: Monitors a GitHub pull request for CI failures and review comments (including CodeRabbit AI reviews), investigates each issue, and makes fixes when appropriate. Use this skill when the user asks to "autofix PR", "monitor PR", "watch PR", "fix PR issues", or "check PR comments". Also use when the user mentions CodeRabbit, code review comments, or CI failures on a PR.
---

Monitor and fix issues on a GitHub pull request. This skill subscribes to PR activity, triages CI failures and review comments (with special handling for CodeRabbit AI reviews), and applies fixes when appropriate.

## Workflow

### 1. Identify the PR

- Determine the PR number from the user's message, current branch, or conversation context.
- Use `mcp__github__pull_request_read` with method `get` to fetch PR details.

### 2. Subscribe to PR activity

- Use `mcp__github__subscribe_pr_activity` to subscribe to the PR.
- This delivers CI failures and review comments as `<github-webhook-activity>` events.

### 3. Check current state

Run these checks in parallel:
- **CI status**: `mcp__github__pull_request_read` with method `get_check_runs`
- **Review comments**: `mcp__github__pull_request_read` with method `get_review_comments`
- **PR comments**: `mcp__github__pull_request_read` with method `get_comments`

### 4. Triage each issue

For every CI failure or review comment, investigate before acting:

#### CI Failures
1. Read the check run details and logs.
2. Identify the root cause (build error, lint error, test failure, etc.).
3. If the fix is clear and small, make it.
4. If the fix is ambiguous or architecturally significant, ask the user first.

#### CodeRabbit Review Comments
CodeRabbit is an AI code reviewer. Its comments follow a specific format and require careful triage because **not all findings are valid**. Many are false positives.

**How to identify CodeRabbit comments:**
- Author is `coderabbitai` or `coderabbitai[bot]`
- Comments contain severity markers: `_Critical_`, `_Major_`, `_Minor_`
- Comments contain `<!-- This is an auto-generated comment by CodeRabbit -->`

**Triage process for each CodeRabbit comment:**
1. **Check if already resolved**: If `is_resolved: true`, skip it.
2. **Check if outdated**: If `is_outdated: true`, the code has changed since the comment — verify if the issue still exists in the current code before acting.
3. **Read the actual code** referenced in the comment. Never trust the review comment blindly.
4. **Verify the finding** against the current code:
   - Does the described problem actually exist in the current code?
   - Has it already been fixed in a subsequent commit?
   - Is the suggested fix correct and appropriate?
5. **Classify the finding**:
   - **Legitimate issue**: The problem exists and the fix is clear. Apply the fix.
   - **False positive**: The described problem doesn't exist, or the current code already handles it correctly. Skip it and inform the user.
   - **Ambiguous**: The issue might be real but the fix has trade-offs or architectural implications. Ask the user.

**Common CodeRabbit false positive patterns:**
- Commenting on code that was already fixed in a later commit (check `is_outdated`)
- Suggesting changes that conflict with project conventions or architecture
- Flagging patterns that are intentional design decisions
- Recommending over-engineering (e.g., adding database columns for minor sort stability)
- Suggesting changes to edge function code that would break Deno compatibility

#### Human Review Comments
- Read the comment carefully and understand the request.
- Check if it's actionable (question vs. change request).
- If it's a change request, evaluate and implement if appropriate.
- If it's a question, respond on the PR.

### 5. Apply fixes

When applying fixes:
1. Make the change on the current branch.
2. Stage only relevant files.
3. Commit with a clear message referencing the issue.
4. Push to the branch.
5. Inform the user of what was fixed and what was skipped (with reasons).

### 6. Report summary

After processing all issues, provide a summary:
- **Fixed**: List of issues that were fixed with brief descriptions.
- **Skipped (false positive)**: List of issues that were investigated and determined to not be real problems, with brief explanation.
- **Needs input**: List of issues that require user decision.
- **CI status**: Current state of CI checks.

## Important Guidelines

- **Always verify before fixing.** Read the actual code before making changes based on review comments.
- **Don't blindly apply AI reviewer suggestions.** CodeRabbit and similar tools can be wrong. Your job is to be the intelligent filter.
- **Preserve existing architecture.** Don't make sweeping changes to satisfy a review comment that misunderstands the design.
- **Keep fixes minimal.** Fix only what's actually broken. Don't refactor surrounding code.
- **Ask when uncertain.** If a fix could go multiple ways or has broader implications, ask the user.

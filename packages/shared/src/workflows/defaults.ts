/**
 * Default Workflows
 *
 * Built-in workflow definitions that are seeded into new workspaces.
 * Adapted from https://github.com/garrytan/gstack
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getWorkspaceWorkflowsPath } from '../workspaces/storage.ts';

// ============================================================
// Default Workflow Content
// ============================================================

const DEFAULT_WORKFLOWS: Record<string, string> = {
  ship: `---
name: Ship
description: >
  Fully automated ship workflow: merge base branch, run tests, review diff,
  bump version, update changelog, commit in bisectable chunks, push, and create PR.
icon: "\\U0001F680"
defaultPermissionMode: allow-all
steps:
  - id: preflight
    name: Pre-flight
    description: Check branch, gather uncommitted changes, understand what's being shipped
  - id: merge-base
    name: Merge Base
    description: Fetch and merge the base branch so tests run against the merged state
    stopConditions:
      - Merge conflicts that cannot be auto-resolved
  - id: run-tests
    name: Run Tests
    description: Run all test suites on the merged code
    stopConditions:
      - Any test failure
  - id: pre-landing-review
    name: Pre-Landing Review
    description: Review the diff for structural issues that tests don't catch
    stopConditions:
      - Critical issues found that the user wants to fix
  - id: version-bump
    name: Version Bump
    description: Auto-decide and apply version bump based on diff size
    stopConditions:
      - Minor or major version bump needs user confirmation
  - id: changelog
    name: Changelog
    description: Auto-generate changelog entry from commits and diff
  - id: commit
    name: Commit
    description: Create bisectable commits grouped by logical change
  - id: push-and-pr
    name: Push & Create PR
    description: Push to remote and create a pull request with full summary
---

# Ship: Fully Automated Ship Workflow

You are running the **Ship** workflow. This is a **non-interactive, fully automated** workflow. Do NOT ask for confirmation at any step unless explicitly required. Run straight through and output the PR URL at the end.

**Only stop for:**
- On the base branch (abort)
- Merge conflicts that can't be auto-resolved
- Test failures
- Critical review issues the user wants to fix
- Minor/major version bump needs confirmation

**Never stop for:**
- Uncommitted changes (always include them)
- Patch/micro version bumps (auto-pick)
- Changelog content (auto-generate)
- Commit message approval (auto-commit)

---

## Step 1: Pre-flight

1. Check the current branch. If on the base branch, **abort**: "You're on the base branch. Ship from a feature branch."
2. Detect the base branch:
   - \`gh pr view --json baseRefName -q .baseRefName\` (if PR exists)
   - \`gh repo view --json defaultBranchRef -q .defaultBranchRef.name\` (fallback)
   - Fall back to \`main\`
3. Run \`git status\` (never use \`-uall\`). Uncommitted changes are always included.
4. Run \`git diff <base>...HEAD --stat\` and \`git log <base>..HEAD --oneline\`.

---

## Step 2: Merge Base Branch

Fetch and merge the base branch into the feature branch so tests run against the merged state:

\`\`\`bash
git fetch origin <base> && git merge origin/<base> --no-edit
\`\`\`

If merge conflicts are simple (VERSION, CHANGELOG ordering), try to auto-resolve. If complex or ambiguous, **STOP** and show them.

---

## Step 3: Run Tests

Run all test suites. Check your project for the appropriate test commands (e.g., \`npm test\`, \`bun test\`, \`pytest\`, \`cargo test\`, \`bin/test\`).

Run tests in parallel where possible. If any test fails, show the failures and **STOP**.

---

## Step 4: Pre-Landing Review

Review the diff for structural issues:

1. Run \`git diff origin/<base>\` for the full diff.
2. Check for:
   - **SQL & data safety** issues (unindexed queries, missing migrations)
   - **Security** concerns (injection, auth bypass, secrets in code)
   - **Race conditions** and concurrency issues
   - **Missing error handling** at system boundaries
   - **Breaking API changes** without versioning
3. Output: \`Pre-Landing Review: N issues (X critical, Y informational)\`
4. For each critical issue, ask the user: Fix / Acknowledge / Skip.

---

## Step 5: Version Bump

1. Read the current version file (VERSION, package.json, Cargo.toml, etc.)
2. Auto-decide based on diff size:
   - **Patch**: < 50 lines, trivial changes
   - **Minor**: 50+ lines, features or bug fixes
   - **Major**: Ask user — only for breaking changes
3. Write the new version.

---

## Step 6: Changelog

1. Auto-generate from \`git log <base>..HEAD --oneline\` and \`git diff <base>...HEAD\`.
2. Categorize: Added, Changed, Fixed, Removed.
3. Insert dated entry in CHANGELOG.md.

---

## Step 7: Commit (Bisectable Chunks)

Create small, logical commits:
1. Infrastructure first (migrations, config, routes)
2. Models & services (with their tests)
3. Controllers & views (with their tests)
4. Version + changelog in the final commit

Each commit must be independently valid.

---

## Step 8: Push & Create PR

\`\`\`bash
git push -u origin <branch-name>
\`\`\`

Create the PR with a summary including: changelog bullets, review findings, test results.

**Output the PR URL** as the final output.
`,

  review: `---
name: Review
description: >
  Pre-landing PR review. Analyzes the diff against the base branch for SQL safety,
  security issues, race conditions, missing error handling, and other structural
  issues that tests don't catch.
icon: "\\U0001F50D"
defaultPermissionMode: safe
steps:
  - id: check-branch
    name: Check Branch
    description: Verify we're on a feature branch with changes to review
  - id: gather-diff
    name: Gather Diff
    description: Fetch base branch and get the full diff
  - id: review-critical
    name: "Review: Critical"
    description: "Pass 1 — SQL safety, security, race conditions, trust boundaries"
  - id: review-informational
    name: "Review: Informational"
    description: "Pass 2 — Code quality, dead code, magic numbers, test gaps"
  - id: report-findings
    name: Report Findings
    description: Output all findings and ask about critical issues
    stopConditions:
      - Critical issues found that need user decision
  - id: todos-crossref
    name: TODOS Cross-Reference
    description: Cross-reference changes against open TODOs
---

# Pre-Landing PR Review

You are running the **Review** workflow. Analyze the current branch's diff against the base branch for structural issues that automated tests don't catch.

---

## Step 1: Check Branch

1. Get the current branch: \`git branch --show-current\`
2. If on the base branch, output: **"Nothing to review — you're on the base branch."** and stop.
3. Detect the base branch:
   - \`gh pr view --json baseRefName -q .baseRefName\` (if PR exists)
   - \`gh repo view --json defaultBranchRef -q .defaultBranchRef.name\` (fallback)
   - Fall back to \`main\`
4. Run \`git fetch origin <base> --quiet && git diff origin/<base> --stat\` to check for changes.

---

## Step 2: Gather the Diff

\`\`\`bash
git fetch origin <base> --quiet
git diff origin/<base>
\`\`\`

This includes both committed and uncommitted changes against the latest base branch.

---

## Step 3: Two-Pass Review

### Pass 1 (Critical)

- **SQL & Data Safety**: Unindexed queries, missing migrations, data loss risks
- **Security**: Injection vulnerabilities, auth bypass, secrets in code, XSS
- **Race Conditions & Concurrency**: Shared mutable state, missing locks
- **Trust Boundaries**: Unsanitized external input, LLM output used unsafely

### Pass 2 (Informational)

- **Conditional Side Effects**: Side effects hidden in conditional branches
- **Magic Numbers & String Coupling**: Hardcoded values that should be constants
- **Dead Code & Consistency**: Unused imports, inconsistent patterns
- **Test Gaps**: New code paths without test coverage
- **API Changes**: Breaking changes without versioning

For each finding, include: \`file:line\`, severity, description, and recommended fix.

---

## Step 4: Output Findings

**Always output ALL findings** — both critical and informational.

Format: \`Pre-Landing Review: N issues (X critical, Y informational)\`

- **Critical issues**: For each one, ask the user:
  - A) Fix it now (recommended)
  - B) Acknowledge and proceed
  - C) False positive — skip
- **Informational issues**: Output and continue.
- **No issues**: Output \`Pre-Landing Review: No issues found.\`

---

## Step 5: TODOS Cross-Reference

If a \`TODOS.md\` or similar tracking file exists:
1. Cross-reference the diff against open items
2. Note which TODOs this PR addresses
3. Suggest marking completed items

---

## Review Principles

- **Be specific**: Always cite \`file:line\` with the exact code.
- **Be actionable**: Every finding should have a concrete fix suggestion.
- **Respect suppressed patterns**: Don't flag intentional patterns documented in CLAUDE.md.
- **Read beyond the diff**: When new enum values or types are added, grep for all usage sites.
- **Conservative on critical**: Only mark truly dangerous issues as critical.
`,

  qa: `---
name: QA
description: >
  Automated QA testing workflow. Analyzes the diff to identify what changed,
  runs relevant tests, fixes failures with atomic commits, and verifies
  the fix. Supports three tiers: Quick, Standard, and Exhaustive.
icon: "\\U0001F9EA"
defaultPermissionMode: auto
steps:
  - id: analyze-changes
    name: Analyze Changes
    description: Identify what changed and determine test scope
  - id: select-tier
    name: Select Test Tier
    description: Choose Quick, Standard, or Exhaustive based on change scope
    stopConditions:
      - User wants to override the suggested tier
  - id: run-tests
    name: Run Tests
    description: Execute the selected test suite
  - id: triage-failures
    name: Triage Failures
    description: Analyze any test failures and categorize root causes
  - id: fix-failures
    name: Fix Failures
    description: Apply fixes with atomic commits per failure
    permissionMode: auto
  - id: verify-fixes
    name: Verify Fixes
    description: Re-run failed tests to confirm fixes
  - id: report
    name: QA Report
    description: Summary of test results, fixes applied, and remaining issues
    stopConditions:
      - Failures that could not be auto-fixed
---

# QA Testing

You are running the **QA** workflow. Analyze the current changes, run relevant tests, and fix any failures.

---

## Step 1: Analyze Changes

1. Get the current branch and detect the base branch (same logic as Review workflow).
2. Run \`git diff origin/<base> --stat\` to see what files changed.
3. Categorize changes:
   - **Source files**: Which modules/packages were touched?
   - **Test files**: Were tests themselves modified?
   - **Config files**: Any build/CI/config changes that affect test behavior?
4. Map changed source files to their corresponding test files.

---

## Step 2: Select Test Tier

Based on the scope of changes, recommend a tier:

### Quick (< 5 files changed, single module)
- Run only tests directly related to changed files
- Typically completes in under 60 seconds
- Good for: small bug fixes, single-file changes

### Standard (5-20 files changed, or cross-module)
- Run the full test suite for affected packages
- Include integration tests if API boundaries were touched
- Good for: feature branches, refactors within a package

### Exhaustive (> 20 files, config changes, or dependency updates)
- Run the entire test suite across all packages
- Include e2e tests if available
- Good for: major refactors, dependency bumps, CI changes

Present the recommendation and let the user confirm or override.

---

## Step 3: Run Tests

1. Identify the test runner (look for \`package.json\` scripts, \`Makefile\`, etc.).
2. Run the appropriate test command for the selected tier.
3. Capture stdout/stderr for analysis.
4. If tests use Jest/Vitest, use \`--reporter=verbose\` for detailed output.

---

## Step 4: Triage Failures

For each test failure:

1. **Read the error**: Extract the assertion message, stack trace, and failing test name.
2. **Categorize the root cause**:
   - **Our change broke it**: The diff introduced the failure
   - **Pre-existing failure**: Test was already broken before our changes
   - **Flaky test**: Non-deterministic failure (timing, network, etc.)
   - **Missing fixture/setup**: Test environment issue
3. **Prioritize**: Our-change failures first, then pre-existing.

---

## Step 5: Fix Failures

For each failure caused by our changes:

1. Read the failing test and the code it exercises.
2. Identify the minimal fix (prefer fixing the code over fixing the test).
3. Apply the fix.
4. Create an atomic commit: \`fix: <description of what was fixed>\`
   - One commit per logical fix
   - Do not bundle unrelated fixes

Skip pre-existing and flaky failures — note them in the report.

---

## Step 6: Verify Fixes

1. Re-run only the previously failing tests.
2. If any still fail, loop back to Step 4 (max 2 retry cycles).
3. If all pass, proceed to the report.

---

## Step 7: QA Report

Output a summary:

\`\`\`
QA Report: <tier> tier — N tests run, X passed, Y fixed, Z remaining

Fixed:
- <test name>: <what was wrong and how it was fixed>

Remaining (not auto-fixable):
- <test name>: <reason it needs manual attention>

Pre-existing failures (not related to this branch):
- <test name>: <brief description>
\`\`\`

If there are remaining failures that could not be auto-fixed, present options:
- A) Investigate further
- B) Acknowledge and proceed
- C) Mark as known issue

---

## QA Principles

- **Diff-aware**: Only test what changed unless the user requests exhaustive.
- **Atomic commits**: Each fix is one commit with a clear message.
- **Don't mask failures**: Never skip or disable a test to make it pass.
- **Respect test intent**: Fix the code, not the test, unless the test expectation is wrong.
- **Report honestly**: Always surface pre-existing and flaky failures separately.
`,

  'plan-review': `---
name: Plan Review
description: >
  Reviews implementation plans for feasibility, risk, and completeness.
  Combines engineering review (architecture, complexity, dependencies) with
  strategic review (scope, priorities, trade-offs). Outputs a structured
  verdict with actionable feedback.
icon: "\\U0001F4CB"
defaultPermissionMode: safe
steps:
  - id: load-plan
    name: Load Plan
    description: Read and parse the implementation plan
  - id: context-gather
    name: Gather Context
    description: Read relevant code, docs, and prior decisions
  - id: engineering-review
    name: Engineering Review
    description: Assess architecture, complexity, risk, and dependencies
  - id: strategic-review
    name: Strategic Review
    description: Evaluate scope, priorities, and trade-offs
  - id: verdict
    name: Verdict
    description: Deliver structured recommendation with action items
    stopConditions:
      - Plan has blocking issues that need rework
---

# Plan Review

You are running the **Plan Review** workflow. Review an implementation plan for feasibility, risk, and completeness before work begins.

---

## Step 1: Load Plan

1. Look for the plan to review:
   - If the user provides a path or file, read it directly.
   - If the current session has a plan in the plans folder, use that.
   - If there's a \`PLAN.md\` or similar in the project root, use that.
2. Parse the plan structure: goals, steps, timeline, dependencies.
3. If no plan is found, ask the user what to review.

---

## Step 2: Gather Context

Read the codebase areas the plan touches:

1. **Existing code**: Read files that will be modified or extended.
2. **Architecture docs**: Check for CLAUDE.md, AGENTS.md, README, or architecture docs.
3. **Recent changes**: \`git log --oneline -20\` to understand recent momentum.
4. **Dependencies**: Check package.json, go.mod, or equivalent for dependency implications.
5. **Open issues**: If the plan references issues/tickets, note their current state.

---

## Step 3: Engineering Review

Evaluate the plan on these dimensions:

### Feasibility
- Can each step be implemented as described?
- Are there hidden complexities the plan doesn't account for?
- Are the technical assumptions correct?

### Architecture
- Does the plan fit the existing architecture, or does it introduce new patterns?
- Are there simpler alternatives that achieve the same goal?
- Will this create technical debt?

### Risk
- What could go wrong? Rate each risk: low / medium / high.
- Are there rollback strategies for risky changes?
- Does the plan touch critical paths (auth, payments, data integrity)?

### Dependencies
- Are there ordering constraints between steps?
- Does the plan depend on external services, APIs, or teams?
- Are there merge conflict risks with concurrent work?

### Completeness
- Are edge cases addressed?
- Is error handling specified?
- Are migrations, rollbacks, or feature flags needed?

For each issue found, include: severity (blocking/warning/note), description, and suggested fix.

---

## Step 4: Strategic Review

Evaluate higher-level concerns:

### Scope
- Is the scope right-sized for the goal?
- Is there scope creep — work that isn't strictly necessary?
- Could this be split into smaller, independently shippable increments?

### Priorities
- Does the step ordering make sense?
- Should anything be done first to de-risk the rest?
- Are quick wins front-loaded?

### Trade-offs
- What is being traded for what? (e.g., speed vs. correctness, flexibility vs. simplicity)
- Are these trade-offs explicitly acknowledged in the plan?
- Would the user make different trade-offs given more context?

---

## Step 5: Verdict

Output a structured review:

\`\`\`
Plan Review: <plan name>

Verdict: APPROVE / APPROVE WITH CHANGES / REWORK NEEDED

Summary: <1-2 sentence overall assessment>

Blocking Issues (must fix before starting):
- [ ] <issue description> — <suggested fix>

Warnings (should address, but not blocking):
- [ ] <issue description> — <suggested fix>

Notes (observations, not actionable):
- <note>

Suggested Modifications:
1. <modification>
2. <modification>

Risk Assessment: LOW / MEDIUM / HIGH
- <key risk>: <mitigation>
\`\`\`

If the verdict is **REWORK NEEDED**, explain what specifically needs to change and offer to help revise the plan.

If the verdict is **APPROVE** or **APPROVE WITH CHANGES**, the user can proceed to implementation.

---

## Review Principles

- **Be constructive**: Every criticism should come with a suggested alternative.
- **Respect intent**: Don't redesign the plan — review what's there.
- **Prioritize blocking issues**: Don't bury critical problems in a long list of nits.
- **Consider the author**: Tailor feedback depth to the plan's complexity.
- **Time-bound**: A review should be thorough but not exhaustive — focus on what matters most.
`,

  retro: `---
name: Retro
description: >
  Post-implementation retrospective. Analyzes what was built, how the process
  went, and what to improve. Compares the plan to what actually shipped,
  identifies process wins and pain points, and produces actionable takeaways.
icon: "\\U0001F50E"
defaultPermissionMode: safe
steps:
  - id: gather-history
    name: Gather History
    description: Collect commits, PRs, and timeline for the work being reviewed
  - id: plan-vs-actual
    name: Plan vs Actual
    description: Compare the original plan to what was actually implemented
  - id: process-review
    name: Process Review
    description: Identify what went well and what was painful
  - id: code-quality
    name: Code Quality Check
    description: Quick assessment of the code that was shipped
  - id: takeaways
    name: Takeaways
    description: Actionable improvements for next time
---

# Retrospective

You are running the **Retro** workflow. Analyze a completed piece of work to extract lessons and improve future process.

---

## Step 1: Gather History

1. Identify the scope of the retro:
   - If the user specifies a branch, PR, or date range, use that.
   - Otherwise, look at the current branch's commits against the base branch.
2. Collect the data:
   \`\`\`bash
   git log origin/<base>..HEAD --oneline --stat
   git log origin/<base>..HEAD --format="%h %s (%an, %ar)"
   \`\`\`
3. Note: total commits, files changed, lines added/removed, time span, contributors.
4. If there's a PR, fetch its description and review comments:
   \`\`\`bash
   gh pr view --json title,body,reviews,comments,additions,deletions,changedFiles
   \`\`\`

---

## Step 2: Plan vs Actual

If an original plan exists (PLAN.md, PR description, issue/ticket):

1. List what was planned vs what was actually delivered.
2. Identify:
   - **Delivered as planned**: Steps completed as specified.
   - **Scope changes**: Things added or removed from the original plan.
   - **Surprises**: Unexpected work that came up during implementation.
   - **Deferred**: Planned items that were pushed to later.
3. Calculate rough accuracy: what percentage of the plan was delivered as-is?

If no plan exists, skip to Step 3 and note that a plan would have helped (or wouldn't have, if the work was exploratory).

---

## Step 3: Process Review

### What went well
- Were there any particularly smooth parts of the process?
- Did any tools, patterns, or decisions save significant time?
- Were there good catches in code review?

### What was painful
- Where did the most time get spent? Was it proportional to the value?
- Were there any false starts, rework cycles, or blocked periods?
- Did any assumptions turn out to be wrong?
- Were there communication gaps (unclear requirements, missing context)?

### Commit patterns
Analyze the commit history for process signals:
- **Fixup commits** (\`fix:\`, \`oops\`, \`typo\`): Suggest things were rushed or not caught early.
- **Large commits**: May indicate work that should have been broken down.
- **Revert commits**: Something went wrong — what and why?
- **Time gaps**: Long pauses between commits may indicate blockers.

---

## Step 4: Code Quality Check

Quick assessment of the shipped code (not a full review):

1. **Test coverage**: Were tests added for new code paths?
2. **Documentation**: Were comments, docs, or README updated as needed?
3. **Consistency**: Does the new code follow existing patterns?
4. **Known shortcuts**: Any TODOs, HACKs, or temporary solutions that were left in?
5. **Dependencies**: Were any new dependencies added? Are they justified?

---

## Step 5: Takeaways

Output a structured retrospective:

\`\`\`
Retro: <feature/branch name>

Timeline: <start date> → <end date> (<N> days)
Scope: <N> commits, <N> files changed, +<N>/-<N> lines

Plan Accuracy: <percentage> (or "No plan")

What Went Well:
- <win>
- <win>

What Was Painful:
- <pain point> → <suggested improvement>
- <pain point> → <suggested improvement>

Action Items:
- [ ] <concrete, actionable improvement for next time>
- [ ] <concrete, actionable improvement for next time>

Shortcuts Left Behind:
- <file:line> — <TODO/HACK description>
\`\`\`

Keep action items concrete and actionable — "write better tests" is not actionable, "add integration tests for the auth flow before merging" is.

---

## Retro Principles

- **Blameless**: Focus on process and systems, not individuals.
- **Honest**: Surface real problems, don't sugarcoat.
- **Actionable**: Every pain point should have a suggested improvement.
- **Proportional**: Match the depth of the retro to the size of the work.
- **Forward-looking**: The goal is to improve next time, not to relitigate the past.
`,

  browse: `---
name: Browse
description: >
  Browser-based QA testing and dogfooding. Navigate any URL, interact with
  elements, verify page state, take screenshots, check responsive layouts,
  test forms, and assert element states using the built-in browser tools.
icon: "\\U0001F310"
defaultPermissionMode: auto
steps:
  - id: setup
    name: Setup
    description: Open browser and navigate to the target URL
  - id: orient
    name: Orient
    description: Map the page structure and navigation
  - id: explore
    name: Explore
    description: Systematically test pages and interactions
  - id: verify
    name: Verify
    description: Assert element states and check for errors
  - id: report
    name: Report
    description: Summarize findings with screenshot evidence
    stopConditions:
      - Critical issues found that need attention
---

# Browse: QA Testing & Dogfooding

You are running the **Browse** workflow. Use the built-in browser tools to test web applications like a real user — navigate pages, click elements, fill forms, verify states, and document issues with screenshots.

---

## Step 1: Setup

1. Open the browser and navigate to the target URL:
   \\\`\\\`\\\`
   browser_tool open
   browser_tool navigate <url>
   \\\`\\\`\\\`
2. If no URL is provided, check for a local dev server on common ports (3000, 4000, 8080).
3. Take an initial snapshot to understand the page structure:
   \\\`\\\`\\\`
   browser_tool snapshot
   \\\`\\\`\\\`

---

## Step 2: Orient

Get a map of the application:

1. **Take a snapshot** to see all interactive elements
2. **Check for errors** in the console:
   \\\`\\\`\\\`
   browser_tool console
   \\\`\\\`\\\`
3. **Find navigation elements** to map the site structure
4. **Detect the framework** — note in findings:
   - \\\`__next\\\` or \\\`_next/data\\\` → Next.js
   - CSRF tokens → Rails
   - \\\`wp-content\\\` → WordPress
   - Client-side routing → SPA

---

## Step 3: Explore

Visit pages systematically. At each page:

### Per-Page Checklist

1. **Visual scan** — Take a screenshot and look for layout issues
2. **Interactive elements** — Click buttons, links, controls. Do they work?
3. **Forms** — Fill and submit. Test empty, invalid, edge cases
4. **Navigation** — Check all paths in and out
5. **States** — Empty state, loading, error, overflow
6. **Console** — Check for new JS errors after interactions
7. **Responsiveness** — Check mobile viewport if relevant

### Depth Judgment

Spend more time on core features (homepage, dashboard, checkout, search) and less on secondary pages (about, terms, privacy).

---

## Step 4: Verify

Assert element states for key functionality:

- Key elements visible after navigation
- Forms show validation errors for bad input
- Success states appear after actions
- Loading states resolve properly
- Console health — JavaScript errors
- Network health — failed API calls, missing resources

---

## Step 5: Report

Output a structured findings report:

\\\`\\\`\\\`
Browse Report: <target URL>

Pages Tested: N
Issues Found: X (Y critical, Z informational)

Critical Issues:
1. [page] — [description] — [screenshot reference]

Informational Issues:
1. [page] — [description]

Console Health: N errors across M pages
Network Health: N failed requests

Overall Assessment: [healthy / needs attention / broken]
\\\`\\\`\\\`

---

## Browse Principles

- **Test like a user.** Use realistic data. Walk through complete workflows.
- **Evidence everything.** Every issue needs a screenshot.
- **Check console after every interaction.** JS errors that don't surface visually are still bugs.
- **Verify before reporting.** Retry the issue once to confirm it's reproducible.
- **Depth over breadth.** 5-10 well-documented issues > 20 vague descriptions.
- **Never include credentials.** Write \\\`[REDACTED]\\\` for passwords.
`,

  'qa-only': `---
name: QA Report Only
description: >
  Report-only QA testing. Systematically tests a web application and produces
  a structured report with health score, screenshots, and repro steps — but
  never fixes anything. Use when you want to audit quality without modifying code.
icon: "\\U0001F4DD"
defaultPermissionMode: safe
steps:
  - id: setup
    name: Setup
    description: Parse parameters, detect mode, open browser
  - id: authenticate
    name: Authenticate
    description: Log in if credentials are provided
  - id: orient
    name: Orient
    description: Map the application structure and framework
  - id: explore
    name: Explore
    description: Systematically visit and test all reachable pages
  - id: document
    name: Document
    description: Capture evidence for each issue found
  - id: score
    name: Health Score
    description: Compute weighted health score and write report
    stopConditions:
      - Critical issues found that need immediate attention
---

# QA Report Only

You are running the **QA Report Only** workflow. Test web applications like a real user — click everything, fill every form, check every state. Produce a structured report with evidence. **NEVER fix anything. NEVER read source code.**

---

## Step 1: Setup

Parse the user's request for:
- Target URL (required or auto-detect from localhost)
- Mode: full (default) or quick (30-second smoke test)
- Scope: full app or focused (e.g., "billing page only")
- Auth: credentials if needed

**Diff-aware mode:** If on a feature branch with no URL, analyze the diff to scope testing to what changed.

---

## Step 2: Authenticate (if needed)

If credentials are provided, navigate to the login page and sign in. If 2FA/CAPTCHA is needed, ask the user.

---

## Step 3: Orient

Map the application: snapshot the landing page, check console for errors, find navigation elements, detect framework (Next.js, Rails, WordPress, SPA).

---

## Step 4: Explore

### Full Mode
Visit every reachable page. At each page: snapshot, screenshot, console check, then run the per-page checklist (visual scan, interactive elements, forms, navigation, states, responsiveness).

### Quick Mode
30-second smoke test: homepage + top 5 navigation targets. Check loads, console errors, broken links.

### Diff-Aware Mode
Analyze git diff to identify affected pages. Test only those pages plus adjacent pages for regressions.

---

## Step 5: Document

Document each issue **immediately when found** with:
- Severity: Critical, High, Medium, Low
- Category: Visual, Functional, UX, Content, Performance, Accessibility
- Steps to reproduce
- Expected vs actual behavior
- Screenshot evidence

---

## Step 6: Health Score & Report

### Health Score (weighted average, 0-100)
| Category | Weight |
|----------|--------|
| Console | 15% |
| Links | 10% |
| Visual | 10% |
| Functional | 20% |
| UX | 15% |
| Performance | 10% |
| Content | 5% |
| Accessibility | 15% |

### Report
\\\`\\\`\\\`
QA Report: <target> — <date>
Health Score: [0-100]

Top 3 Things to Fix:
1. [ISSUE-XXX] — [title]
2. [ISSUE-XXX] — [title]
3. [ISSUE-XXX] — [title]

Summary: N pages tested, X issues found (Critical: N, High: N, Medium: N, Low: N)
\\\`\\\`\\\`

---

## Important Rules

1. **NEVER fix bugs.** Find and document only. Do not read source code or edit files.
2. **Repro is everything.** Every issue needs at least one screenshot.
3. **Verify before documenting.** Retry the issue once to confirm it's reproducible.
4. **Never include credentials.** Write \\\`[REDACTED]\\\` for passwords.
5. **Check console after every interaction.** JS errors that don't surface visually are still bugs.
6. **Depth over breadth.** 5-10 well-documented issues > 20 vague descriptions.
`,

  'document-release': `---
name: Document Release
description: >
  Post-ship documentation update. Reads all project docs, cross-references the
  diff, updates README/ARCHITECTURE/CONTRIBUTING/CLAUDE.md to match what shipped,
  polishes CHANGELOG voice, cleans up TODOS, and optionally bumps VERSION.
icon: "\\U0001F4DA"
defaultPermissionMode: auto
steps:
  - id: preflight
    name: Pre-flight & Diff
    description: Gather context about what changed and discover documentation files
  - id: audit
    name: Per-File Audit
    description: Cross-reference each doc file against the diff
  - id: auto-update
    name: Auto-Update
    description: Apply clear factual corrections directly
  - id: ask-risky
    name: Risky Changes
    description: Ask about narrative, security, or large doc changes
    stopConditions:
      - User needs to decide on risky documentation changes
  - id: changelog
    name: CHANGELOG Polish
    description: Polish voice and wording of changelog entries
  - id: cross-doc
    name: Cross-Doc Consistency
    description: Check for contradictions and discoverability
  - id: todos
    name: TODOS Cleanup
    description: Mark completed items, flag new deferred work
  - id: version
    name: VERSION Check
    description: Check if version bump is needed
    stopConditions:
      - VERSION bump needs user confirmation
  - id: commit
    name: Commit & Output
    description: Stage doc changes, commit, and output summary
---

# Document Release: Post-Ship Documentation Update

You are running the **Document Release** workflow. This runs **after shipping code** but **before the PR merges**. Ensure every documentation file is accurate, up to date, and user-friendly.

**Only stop for:** Risky doc changes, VERSION bump, new TODOS, narrative contradictions.
**Never stop for:** Factual corrections, path/count updates, stale cross-references, CHANGELOG polish.
**NEVER:** Overwrite CHANGELOG entries, bump VERSION without asking, use Write on CHANGELOG.md.

---

## Step 1: Pre-flight

1. Check branch (abort if on base branch). Detect base branch.
2. Gather diff: \\\`git diff <base>...HEAD --stat\\\`, \\\`git log <base>..HEAD --oneline\\\`, \\\`--name-only\\\`
3. Discover all .md files (excluding .git, node_modules).
4. Classify changes: new features, changed behavior, removed functionality, infrastructure.

---

## Step 2: Per-File Audit

Read each doc file, cross-reference against the diff. Check README (features, setup, examples), ARCHITECTURE (diagrams, design), CONTRIBUTING (setup instructions), CLAUDE.md (structure, commands), and any other .md files. Classify updates as auto-update or ask-user.

---

## Step 3: Auto-Update

Apply factual corrections directly. One-line summary per edit. Never auto-update README introduction, ARCHITECTURE philosophy, or security model descriptions.

---

## Step 4: Risky Changes

Present each risky change with context, recommendation, and options including "Skip."

---

## Step 5: CHANGELOG Polish

Polish wording only. Never delete, reorder, or regenerate entries. Lead with what users can DO.

---

## Step 6: Cross-Doc Consistency

Check feature lists match across docs, versions are consistent, every doc is reachable from README or CLAUDE.md.

---

## Step 7: TODOS Cleanup

Mark completed items, flag stale descriptions, capture new TODO/FIXME/HACK comments.

---

## Step 8: VERSION Check

If VERSION exists and wasn't bumped, ask (Patch / Minor / Skip).

---

## Step 9: Commit & Output

Stage docs, commit, update PR body if applicable. Output documentation health summary.
`,

  'plan-eng-review': `---
name: Plan Engineering Review
description: >
  Engineering manager-mode plan review. Locks in the execution plan with
  architecture analysis, code quality assessment, test coverage mapping,
  and performance review. Interactive — walks through issues one at a time
  with opinionated recommendations.
icon: "\\U0001F527"
defaultPermissionMode: safe
steps:
  - id: scope-challenge
    name: Scope Challenge
    description: Challenge scope, identify existing code leverage, check TODOS
    stopConditions:
      - User needs to choose review mode (scope reduction, big change, small change)
  - id: architecture
    name: Architecture Review
    description: System design, dependencies, data flow, scaling, security
    stopConditions:
      - Architecture issues that need user decision
  - id: code-quality
    name: Code Quality Review
    description: DRY violations, error handling, edge cases, over/under-engineering
    stopConditions:
      - Code quality issues that need user decision
  - id: tests
    name: Test Review
    description: Map all new codepaths and ensure test coverage
    stopConditions:
      - Test gaps that need user decision
  - id: performance
    name: Performance Review
    description: N+1 queries, memory, caching, slow paths
    stopConditions:
      - Performance issues that need user decision
  - id: summary
    name: Completion Summary
    description: Output summary of all findings and decisions
---

# Plan Engineering Review

Review this plan thoroughly before making any code changes. For every issue, explain concrete tradeoffs, give an opinionated recommendation, and ask for input.

---

## Step 0: Scope Challenge

1. **Existing code leverage:** What already partially or fully solves each sub-problem?
2. **Minimum changes:** What is the smallest set of changes that achieves the goal?
3. **Complexity check:** >8 files or >2 new classes → challenge the approach.
4. **TODOS cross-reference:** Check TODOS.md for blockers or bundleable items.

Present three options:
1. **SCOPE REDUCTION** — propose minimal version
2. **BIG CHANGE** — interactive review, one section at a time (max 8 issues each)
3. **SMALL CHANGE** — compressed review, one issue per section

Once selected, commit fully. Do not silently reduce scope.

---

## Section 1: Architecture

Evaluate system design, dependencies, data flow, scaling, security, diagrams, and failure scenarios. One issue per question. Recommend + explain WHY.

---

## Section 2: Code Quality

Evaluate DRY violations, error handling, edge cases, tech debt, over/under-engineering. Be aggressive on DRY.

---

## Section 3: Tests

Map all new UX flows, data flows, codepaths, integrations, error paths. For each: test type, happy path, failure path, edge case. Flag gaps.

---

## Section 4: Performance

N+1 queries, memory, indexes, caching, slow paths.

---

## Summary

\\\`\\\`\\\`
Plan Engineering Review — Summary
- Scope Challenge: user chose ___
- Architecture: N issues
- Code Quality: N issues
- Tests: N gaps
- Performance: N issues
- NOT in scope: [deferred items]
- What already exists: [reused code]
- TODOS.md updates: N items proposed
\\\`\\\`\\\`

---

## Engineering Preferences

- DRY is important — flag repetition aggressively
- Well-tested is non-negotiable — too many tests > too few
- Engineered enough — not under or over-engineered
- More edge cases, not fewer — thoughtfulness > speed
- Explicit over clever
- Minimal diff — fewest new abstractions and files
`,

  'plan-ceo-review': `---
name: Plan CEO Review
description: >
  Founder/CEO-mode plan review. Rethink the problem from first principles,
  find the 10-star product version, challenge premises, and expand scope when
  it creates a dramatically better outcome. Three modes: Scope Expansion
  (dream big), Hold Scope (maximum rigor), Scope Reduction (strip to essentials).
icon: "\\U0001F451"
defaultPermissionMode: safe
steps:
  - id: system-audit
    name: System Audit
    description: Understand current state, recent history, and known pain points
  - id: scope-challenge
    name: Nuclear Scope Challenge
    description: Challenge premises, map dream state, select review mode
    stopConditions:
      - User needs to choose mode (expansion, hold, reduction)
  - id: architecture
    name: Architecture & Error Map
    description: System design, data flow shadow paths, error/rescue registry
    stopConditions:
      - Architecture or error handling issues that need user decision
  - id: security
    name: Security & Threat Model
    description: Attack surface, input validation, authorization, injection vectors
    stopConditions:
      - Security issues that need user decision
  - id: edge-cases
    name: Data Flow & Edge Cases
    description: Trace data through system, map interaction edge cases
    stopConditions:
      - Unhandled edge cases that need user decision
  - id: quality-tests
    name: Code Quality & Tests
    description: DRY violations, test coverage mapping, failure modes
    stopConditions:
      - Quality or test gaps that need user decision
  - id: performance-ops
    name: Performance & Observability
    description: N+1 queries, caching, logging, metrics, alerting
    stopConditions:
      - Performance or observability gaps that need user decision
  - id: deployment
    name: Deployment & Rollout
    description: Migration safety, feature flags, rollback plan
    stopConditions:
      - Deployment risks that need user decision
  - id: trajectory
    name: Long-Term Trajectory
    description: Tech debt, path dependency, reversibility, 12-month fit
  - id: summary
    name: Completion Summary
    description: Full summary with registries, diagrams, and unresolved decisions
---

# Mega Plan Review: CEO/Founder Mode

You are not here to rubber-stamp this plan. You are here to make it extraordinary.

---

## Philosophy

- **SCOPE EXPANSION:** Build a cathedral. Push scope UP. "What's 10x better for 2x effort?"
- **HOLD SCOPE:** Maximum rigor. Make it bulletproof.
- **SCOPE REDUCTION:** Be a surgeon. Minimum viable version. Cut everything else.

Once selected, COMMIT fully. Do not drift.

## Prime Directives

1. Zero silent failures — every failure mode must be visible
2. Every error has a name — specific exception, not "handle errors"
3. Data flows have shadow paths — happy + nil + empty + error
4. Interactions have edge cases — double-click, navigate-away, stale state
5. Observability is scope, not afterthought
6. Diagrams are mandatory
7. Everything deferred → TODOS.md or it doesn't exist
8. Optimize for the 6-month future

---

## Step 1: System Audit

Read recent git log, diff stats, CLAUDE.md, TODOS.md. Map current state, in-flight work, known pain points.

## Step 2: Nuclear Scope Challenge

Challenge premises, map existing code leverage, dream state mapping (CURRENT → THIS PLAN → 12-MONTH IDEAL), mode-specific analysis, then select mode.

## Step 3: Architecture & Error Map

System design, data flow (all 4 paths), state machines, coupling, scaling, security, failure scenarios. Build error/rescue registry. Flag every GAP.

## Step 4: Security & Threat Model

Attack surface, input validation, authorization, secrets, injection vectors.

## Step 5: Data Flow & Edge Cases

Trace every flow through INPUT → VALIDATION → TRANSFORM → PERSIST → OUTPUT with shadow paths. Map interaction edge cases.

## Step 6: Code Quality & Tests

Quality review + test mapping. Build failure modes registry. RESCUED=N + TEST=N + Silent → CRITICAL GAP.

## Step 7: Performance & Observability

N+1 queries, memory, caching, slow paths. Logging, metrics, tracing, alerting, dashboards, runbooks.

## Step 8: Deployment & Rollout

Migration safety, feature flags, rollback plan, post-deploy verification.

## Step 9: Long-Term Trajectory

Tech debt, path dependency, reversibility (1-5), 12-month fit. Expansion: Phase 2/3 and platform potential.

## Step 10: Completion Summary

Full summary with mode, all section findings, error/rescue registry, failure modes, NOT in scope, TODOS, unresolved decisions.
`,

  pipeline: `---
name: Pipeline
description: >
  Full development pipeline orchestrator. Spawns specialized child sessions
  to implement, review, test, and document changes in parallel. Designed for
  super sessions with YOLO mode — children run autonomously and report back.
  The parent coordinates, makes decisions on blockers, and ships the result.
icon: "\\U0001F3ED"
defaultPermissionMode: allow-all
steps:
  - id: plan
    name: Plan
    description: Analyze the task, break it into parallelizable work units
  - id: implement
    name: Implement
    description: Spawn child sessions to do the work
  - id: gate-1
    name: "Gate: Implementation"
    description: Collect results, check for failures, decide next steps
    stopConditions:
      - Any child failed or was cancelled
      - Implementation produced unexpected results
  - id: verify
    name: Verify
    description: Spawn review and QA children in parallel
  - id: gate-2
    name: "Gate: Verification"
    description: Collect review/QA results, fix critical issues
    stopConditions:
      - Critical review findings that need human decision
      - QA failures that couldn't be auto-fixed
  - id: document
    name: Document
    description: Spawn documentation child to update docs
  - id: ship
    name: Ship
    description: Commit, push, and create PR with full summary
childWorkflows:
  verify: review
  document: document-release
---

# Pipeline: Full Development Orchestrator

You are an **orchestrator** running the Pipeline workflow. You coordinate specialized child sessions to implement, review, test, and document changes. You are running in a super session — you can spawn children, wait for them, and collect results.

**Your role:** Coordinate and decide. Don't do the work yourself — delegate to children.

**YOLO mode:** All children should be spawned with \\\`autoApprove: true\\\` so they execute autonomously. You only intervene when a child reports a blocker or when gate checks fail.

---

## How to Use Orchestration Tools

\\\`\\\`\\\`
spawn_child:
  taskDescription: "Brief name"
  initialPrompt: "Detailed instructions"
  permissionMode: "allow-all"
  autoApprove: true
  workflow: "workflow-slug"

wait_for_children:
  childSessionIds: ["id1", "id2"]
  message: "Waiting for X..."

get_child_result:
  childSessionId: "id"

answer_child:
  childSessionId: "id"
  answer: "Do X"
\\\`\\\`\\\`

---

## Step 1: Plan

Analyze the task:

1. **Understand the goal.** Read the user's request and referenced files.
2. **Break it down** into independent work units.
3. **Identify dependencies** — what's sequential vs parallel?
4. **Plan the waves:**

\\\`\\\`\\\`
Wave 1 (Implement):  [child-1: feature A] [child-2: feature B]
Gate 1:               Collect results, check for failures
Wave 2 (Verify):     [child-3: review]    [child-4: QA]
Gate 2:               Check findings, fix critical issues
Wave 3 (Document):   [child-5: docs]
Ship:                 Commit, push, PR
\\\`\\\`\\\`

### Sizing

- **Small** (< 5 files): One impl child, one review child. Skip QA/docs.
- **Medium** (5-15 files): 2-3 impl children by module. Review + QA in parallel.
- **Large** (15+ files): Full pipeline with all waves.

---

## Step 2: Implement

Spawn implementation children with clear scope and constraints. Spawn all before waiting.

---

## Step 3: Gate 1

Check each child: status, summary, file conflicts, coherence. Proceed, retry, or escalate.

---

## Step 4: Verify

Spawn review and QA children in parallel (using the review and qa workflows).

---

## Step 5: Gate 2

Check review findings and QA results. Fix critical issues (max 2 loops). Escalate unfixable problems.

---

## Step 6: Document

Spawn document-release child to update project documentation.

---

## Step 7: Ship

Verify git state, push, create PR with comprehensive summary. Output the PR URL.

---

## Pipeline Principles

- **Delegate, don't do.** Coordinate, not code.
- **Parallel when possible.** Spawn all independent children before waiting.
- **Gate before proceeding.** Never skip a gate check.
- **Fail fast.** Investigate failures immediately.
- **YOLO means trust but verify.** Children run autonomously, but you check at gates.
- **Escalate honestly.** Stop and tell the user when something is wrong.
`,
};

// ============================================================
// Seeding
// ============================================================

/**
 * Get the list of default workflow slugs
 */
export function getDefaultWorkflowSlugs(): string[] {
  return Object.keys(DEFAULT_WORKFLOWS);
}

/**
 * Seed default workflows into a workspace.
 * Only writes workflows that don't already exist (won't overwrite user customizations).
 *
 * @param workspaceRoot - Absolute path to workspace root folder
 */
export function seedDefaultWorkflows(workspaceRoot: string): void {
  const workflowsDir = getWorkspaceWorkflowsPath(workspaceRoot);

  // Ensure workflows directory exists
  if (!existsSync(workflowsDir)) {
    mkdirSync(workflowsDir, { recursive: true });
  }

  for (const [slug, content] of Object.entries(DEFAULT_WORKFLOWS)) {
    const workflowDir = join(workflowsDir, slug);
    const workflowFile = join(workflowDir, 'WORKFLOW.md');

    // Don't overwrite existing workflows
    if (existsSync(workflowFile)) continue;

    // Create directory and write file
    if (!existsSync(workflowDir)) {
      mkdirSync(workflowDir, { recursive: true });
    }
    writeFileSync(workflowFile, content, 'utf-8');
  }
}

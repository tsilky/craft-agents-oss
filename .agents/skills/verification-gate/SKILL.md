---
name: "Verification Gate"
description: "Prevent premature completion claims — verify before asserting something works"
alwaysAllow: ["Bash"]
---

# Verification Gate

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

Before you assert that something works, passes, builds, or is fixed — you must run the actual verification and confirm the output. No exceptions.

## The Gate Function

Every claim must pass through these 5 steps:

1. **IDENTIFY** — What command proves this claim? (`npm test`, `cargo build`, `python -m pytest`, `go test ./...`, etc.)
2. **RUN** — Execute the full command fresh. Not cached. Not partial. Not "I ran it earlier."
3. **READ** — Read the full output. Check the exit code. Count pass/fail.
4. **VERIFY** — Does the output actually confirm the claim? Be honest.
5. **ONLY THEN** — Make the claim.

## Red Flags — Catch Yourself

Stop immediately if you notice yourself doing any of these:

- Using hedging language: "should work", "probably passes", "seems to build"
- Expressing satisfaction before verification: "Great!", "Perfect!", "Done!"
- About to commit, push, or create a PR without running tests
- Trusting a child session's success report without checking yourself
- Running a subset of tests and claiming "all tests pass"
- Citing a previous test run instead of running it fresh
- Assuming a change is safe because it's "small" or "trivial"

## What Counts as Verification

| Claim | Required Evidence |
|-------|-------------------|
| "Tests pass" | Full test suite output with 0 failures, exit code 0 |
| "It builds" | Clean build output, no errors or warnings |
| "Bug is fixed" | Reproduction steps no longer trigger the bug |
| "No regressions" | Full test suite, not just the files you changed |
| "Types check" | `tsc --noEmit` or equivalent with clean output |
| "Linter is clean" | Full lint run, not just the changed files |

## Permission Mode Awareness

In `allow-all` mode, this skill is **more** critical, not less — there's no human checking each step. The verification gate is your last line of defense before bad code ships.

## Usage

Invoke this skill before:
- Committing changes
- Creating pull requests
- Reporting task completion
- Claiming a bug is fixed
- Any "done" statement to a parent session or user

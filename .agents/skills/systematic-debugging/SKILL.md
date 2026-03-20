---
name: "Systematic Debugging"
description: "4-phase debugging discipline — no fixes without root cause investigation first"
alwaysAllow: ["Bash", "Read", "Grep", "Glob"]
---

# Systematic Debugging

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

Do not jump to fix attempts. Do not guess. Do not apply shotgun changes. Follow the phases in order.

## Phase 1: Root Cause Investigation

Before touching any code:

1. **Read the error carefully.** The full stack trace, not just the first line.
2. **Reproduce consistently.** If you can't reproduce it, you can't verify a fix.
3. **Check recent changes.** Run `git log --oneline -20` and `git diff` to see what changed.
4. **Trace the data flow.** Follow the execution path from input to error. Read the actual code — don't assume.
5. **Check the obvious.** Typos, wrong variable names, missing imports, stale caches.

**Output:** A clear statement of what you believe the root cause is, with evidence.

## Phase 2: Pattern Analysis

Look for patterns that confirm or challenge your hypothesis:

1. **Find working examples.** Search the codebase for similar code that works. What's different?
2. **Check tests.** Do existing tests cover this path? If so, when did they last pass?
3. **Look for related issues.** Search git history for similar fixes: `git log --all --grep="keyword"`.
4. **Compare against references.** Check documentation, type definitions, or API contracts.

**Output:** Confirmation or revision of your root cause hypothesis.

## Phase 3: Hypothesis & Testing

Form a single, testable hypothesis:

1. **State the hypothesis clearly.** "The bug is caused by X because Y."
2. **Design a minimal test.** What's the smallest change that would confirm or deny this?
3. **Test the hypothesis.** Make the minimal change, observe the result.
4. **If wrong, go back to Phase 1.** Don't stack guesses on top of guesses.

**Rules:**
- One hypothesis at a time. Not two. Not three.
- If your first fix doesn't work, revert it before trying the next.
- Don't combine diagnostic changes with fix attempts.

## Phase 4: Implementation

Once you have a confirmed root cause and a verified hypothesis:

1. **Write a failing test** that reproduces the bug (if the project has tests).
2. **Implement the fix.** One fix for one root cause. Keep it minimal.
3. **Run the verification gate** (`[skill:verification-gate]`) — full test suite, clean build.
4. **Verify the original error is gone.** Re-run the exact reproduction steps.

## Escalation Rule

**After 3 failed fix attempts: STOP.**

Do not keep thrashing. Instead:
- Summarize what you've tried and what you've learned
- Present your best hypothesis for the root cause
- Ask the user for guidance

Three strikes means you're missing context that code alone can't give you.

## Super Session Guidance

When facing **multiple independent failures**:
- Use `spawn_session` to investigate each failure in a separate child session
- One child per failure domain — don't mix unrelated bugs in one session
- Each child should follow this same debugging discipline
- Collect results and look for shared root causes before fixing

## Anti-Patterns (Don't Do These)

- **Shotgun debugging:** Changing multiple things at once hoping one sticks
- **Cargo cult fixes:** Copying a fix from StackOverflow without understanding why it works
- **Fix-forward:** Applying a bandaid over the symptom instead of fixing the cause
- **Scope creep:** "While I'm here, let me also fix..." — stay focused on the original bug
- **Premature optimization:** Don't refactor the code while debugging it
- **Revert amnesia:** Forgetting to revert failed fix attempts before trying the next one

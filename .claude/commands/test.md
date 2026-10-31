---
description: Write edge-case unit tests for current changes or named components, then run them
argument-hint: "[file, component or folder — optional; defaults to current changes]"
---
Write and run unit tests for: $ARGUMENTS

## 1. Pick the target
- If arguments are given, test those files, components or folders.
- Otherwise test the current changes: use `git status` and `git diff` (staged and unstaged) when this is a git repository. If it is not a git repository, or there are no changes, ask which files or components to test. Don't guess.
- Read each target file fully, plus anything it imports that affects its behaviour.

## 2. Match the project's testing setup
- Find the existing framework and conventions from `package.json` (scripts, devDependencies), config files (`vitest.config.*`, `jest.config.*`, `playwright.config.*`, `pytest.ini`, `pyproject.toml`, etc.) and existing test files.
- Follow what is already there: framework, file naming and location, import style, mocking helpers, assertion style.
- If the project has no test framework, stop and say so. Recommend one that fits the stack (for example Node's built-in `node:test` for plain Node/Express, Vitest for Vite or React) and ask before installing anything or adding dependencies.

## 3. Write the tests
Cover the normal behaviour, then the edge cases that apply:
- Empty, missing, `null`/`undefined` and wrong-type inputs.
- Boundaries: zero, negative, very large values, empty and single-item lists, long strings, unicode and special characters.
- Error paths: thrown errors, rejected promises, failed network or database calls, invalid state.
- Async behaviour: ordering, timeouts, retries.
- Security-relevant input where the code handles user data: HTML/script injection, path traversal, very large payloads.
- For UI components: rendering with different props, user interactions, loading/empty/error states, accessibility roles and labels.

Rules:
- Test behaviour through the public interface, not private implementation details.
- Mock only external boundaries (network, filesystem, time, randomness, databases), never the code under test.
- Keep each test focused, with a name that says what it checks.
- Do not change source code just to make a test pass. If a test reveals a real bug, leave the test failing and report the bug.

## 4. Run and report
- Run the new tests, then the full test suite, using the project's own test command.
- If a failure comes from a mistake in a test, fix the test and run again.
- Report in a short summary:
  - which files were tested and which test files were added or changed;
  - which edge cases are covered;
  - the pass/fail result with exact counts, and the output of any failures;
  - any bugs found in the source code, with file and line.

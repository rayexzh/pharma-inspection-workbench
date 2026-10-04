# Contributing

Contributions should improve this educational QA workflow without making unsupported regulatory claims. Use fictional or public examples only.

## Propose a change

Open an issue with the problem, a concrete example, proposed behaviour and acceptance criteria. For regulatory content, include the official source URL, publication/update date, review date and relevant section. Distinguish a source requirement from a project design choice.

## Develop and check

1. Keep the app usable by opening `index.html` directly. Avoid adding dependencies without explaining the need.
2. Keep deterministic workflow rules in the core logic and interface behaviour in the browser code.
3. Add a meaningful test when changing a workflow rule, date calculation, import validation or export safety.
4. Run `node --test tests/core.test.cjs`.
5. Check edit/save/reload, failed and successful closure, review changes, exports/imports and a narrow browser viewport.
6. Update documentation when behaviour changes. State any checks you could not run.

Submit a pull request describing the problem, resulting behaviour, evidence and verification. Disclose AI assistance when it materially contributed, and review the proposed code yourself.

## Keep the limits visible

Do not describe local storage as secure, local history as tamper-proof, or typed reviewers as authenticated signatories. Do not label this prototype validated, certified or regulator-approved. Do not turn completion of a form into a claim that an investigation or corrective action is adequate.

Do not include patient details, confidential manufacturing records, passwords or personal exports in issues and pull requests. Reproduce problems using fictional data.

By submitting a contribution, you agree that your contribution is available under this repository's MIT license. Official publications and external material retain their own terms.

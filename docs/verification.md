# Verification record

Observed on **5 October 2026** for version **0.3.0**. These checks concern software behaviour in a fictional case. They are not GxP validation, a regulatory assessment, a usability study or evidence of customer benefit.

## Reproducible code checks

Run from the repository root with Node.js:

```sh
node --check data/demo-data.js
node --check data/demo-zh-CN.js
node --check src/core.js
node --check src/workflow.js
node --check src/i18n.js
node --check src/app.js
node --test tests/*.test.cjs
```

Observed with **Node.js 24.19.0**: syntax checks passed; **36 tests passed, 0 failed**.

The tests cover required-field and reference checks, blocked premature closure, review invalidation and reopening after edits, strict date boundaries, import shape and duplicate/dangling-reference validation, CSV formula neutralisation, report scope, evidence-file parity, translations that preserve stored/custom text and approvals, and incomplete new-finding creation.

Eleven added tests cover transparent work ordering, overlapping focus filters, evidence gaps distinguished from source gaps, unset deadlines, immutable sorting, explicit evidence relationships, next-step sequencing and use of the canonical core evaluator. Current but unrelated evidence can pass a completeness check; this does not establish relevance or compliance.

## Browser checks

A development harness used Chrome DevTools Protocol with an isolated **Headless Chrome 154** profile. The final runs passed **56 checks, 0 failed**: one first-use language check, 21 existing behaviour checks, 13 bilingual checks, nine guided-editing/creation checks and 12 overview/redesign checks. No browser console errors or uncaught exceptions were observed.

| Area | Observed result |
|---|---|
| Work overview | Initial queue: F-001, F-006, F-004, F-005, F-002. Counts: 5 open, 1 overdue, 2 ready for demo review, 2 open findings with evidence gaps. |
| Action cues | Queue buttons opened the relevant missing field or reference, without saving or approving records. |
| Register | Metric and quick filters, priority/date/ID sorting, search, selected-row state and clear-filter actions worked. An editor excluded by a filter remained visible with an explicit notice. |
| Evidence | Search and version-status filters worked. Explicit usage links opened the cited finding and focused the selected evidence checkbox. |
| Editing | Cross-tab drafts, local saving and reload persistence worked. Ctrl+S saved once and retained field focus; the search shortcut respected editable controls. |
| Save controls | Informational notifications no longer intercepted immediate clicks on the desktop save bar. |
| Review and closure | Incomplete review and closure were blocked. Material edits invalidated review and reopened closed records; named demo review and subsequent closure were exercised. |
| Language | First-use Chinese, preference after reload, translated supplied records, exact imported/custom text, unchanged canonical JSON and no-op translated saves were checked. |
| Exports/imports | JSON, CSV and Markdown downloads and a round-trip worked. Malformed, oversized and empty-finding JSON did not replace the workspace. |
| Responsive layout | Both languages fit 375 × 812, 720 × 500 and 1440 × 1000 viewports. No page-width overflow; the narrow navigation/evidence table scroll inside their containers. |
| Keyboard and dialogs | Detail-tab arrow/Home/End keys, field focus and narrow dialogs worked. |
| Direct opening | The app also loaded from its local HTML file without a server. |

The browser harness is a delivery-time check and is not included in GitHub Actions. The supplied workflow runs syntax checks and the 36 reproducible unit tests. Only the observed environment is covered; the viewport checks are not a complete zoom or accessibility audit.

## Published source checks

The [GitHub Actions run](https://github.com/rayexzh/pharma-inspection-workbench/actions/runs/37219107303) passed on **5 October 2026** (Shanghai date), using **Node.js 24.21.0**: syntax checks succeeded and **36 tests passed, 0 failed**. It checked source commit `3220c1cece94c42574091ee23357f50115b54b65`. This confirms reproducible software checks on the published version, not GxP validation.

## Visual references

- [English desktop overview](screenshots/desktop.png)
- [Chinese desktop overview](screenshots/desktop-zh.png)
- [English mobile overview](screenshots/mobile.png)
- [Chinese mobile overview](screenshots/mobile-zh.png)
- [English desktop editor](screenshots/editor.png)
- [Chinese desktop editor](screenshots/editor-zh.png)
- [English mobile editor](screenshots/mobile-editor.png)
- [Chinese mobile editor](screenshots/mobile-editor-zh.png)

The screenshots show the original fictional case with the final interface. No patient, employer or live manufacturing data was used.

## Remaining limits

Safari, Firefox, real mobile hardware, screen-reader use, multi-user edits, authenticated approvals, formal security review and regulated-system validation were not tested. Typed names, imported records and browser change logs remain unauthenticated and editable. Field completeness does not establish that the contents are true, relevant or adequate.

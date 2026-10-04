# Verification record

Observed on **4 October 2026** for version **0.2.0**. These checks concern software behaviour in a fictional case. They do not constitute GxP validation, a regulatory assessment, a usability study or evidence of customer benefit.

## Chinese/English and guided-workflow update

The final browser runs passed **44 checks**: 21 existing workflow checks, 13 bilingual checks, one saved-stage check and nine guided-editing/creation checks. A first-use Chinese default was also observed in the isolated-profile setup. No app console errors or uncaught exceptions were observed in these final runs.

Verified language selection and preference after reload, translated seed records/evidence/sources/notices, Chinese search, unchanged canonical JSON, preservation of custom imported text, no-op saves of translated closed records, unsaved text/checkbox retention and both-language layouts. CSV and Markdown preserve original records with English report labels.

Verified next-step field focus, grouped prerequisite/follow-up checks, gap-to-evidence navigation, a single save of edits spanning all three tabs, exactly one review invalidation/history event, incomplete new-finding creation, unique identifiers, persistence, blocked premature review and both-language mobile creation dialogs. Gap links and reading evidence do not submit unsaved drafts.

## Core logic

Run from the repository root with Node.js:

```sh
node --check data/demo-data.js
node --check data/demo-zh-CN.js
node --check src/core.js
node --check src/i18n.js
node --check src/app.js
node --test tests/*.test.cjs
```

Observed with Node.js **24.19.0**: JavaScript syntax checks passed; **25 tests passed, 0 failed**.

The tests also cover non-mutating translations, preservation of identifiers/dates/URLs, exact user text, language-independent approvals and exports, unique new findings, rejected malformed/preapproved creation and unchanged existing approvals. The workflow tests cover required-field and reference checks, blocking premature closure, re-review after edits, reopening edited closed findings, exact due-date boundaries, real calendar dates, import validation, empty cases, duplicate IDs, dangling references, CSV formula neutralisation, preservation of prior change-log entries, report scope, browser globals and parity between embedded fictional evidence and the supplied Markdown records.

## Browser checks

A separate delivery-time harness used Chrome DevTools Protocol with an isolated **Headless Chrome 154** profile. The app was served on a loopback HTTP address; direct `file://` opening was also checked. The 21 existing workflow checks were rerun successfully alongside the update checks above. The mobile navigation and table intentionally scroll inside their containers; page-width overflow was absent.

| Area | Observed result |
|---|---|
| Initial case and filters | Six findings loaded; search, severity and status filters returned the expected records. |
| Blocked transitions | Incomplete approval and closure without an effectiveness result were blocked. |
| Editing and persistence | Saved changes survived reload; response draft edits were retained. |
| Review and closure | Editing an approved record invalidated review; review, closure and reopening were exercised. |
| Evidence selection | Selections saved; superseded evidence blocked review. |
| Exports | JSON, CSV and Markdown downloads completed and contained the expected case data. |
| Imports | Export/import round-trip worked. Malformed, oversized and empty-finding JSON were rejected without replacing the workspace. |
| Navigation | Evidence records were readable; evidence, source and case views opened. |
| Desktop layout | 1440 × 1000 viewport; no page-width overflow. |
| Mobile layout | 375 × 812 viewport; page width remained 375 pixels. Navigation and the evidence table scroll within their containers. |
| Narrow reflow | 720 × 500 viewport; no page-width overflow. This is a reflow check, not a complete 200% browser-zoom audit. |
| Keyboard interaction | Finding-detail tabs responded to Right, End and Home keys. |
| Dialogs and direct opening | Mobile dialog fit the viewport; the app also loaded from its local HTML file. |
| Runtime | No browser console errors or uncaught exceptions were observed in these checks. |

The browser harness was used during development and is not part of the GitHub Actions workflow. The supplied workflow runs syntax checks and the reproducible workflow, creation and translation tests.

The published repository's [GitHub Actions run](https://github.com/rayexzh/pharma-inspection-workbench/actions/runs/37202446743) passed on **4 October 2026**, using **Node.js 24.21.0**: all syntax checks succeeded and **25 tests passed, 0 failed**. This run checked commit `a9a9e5b30fa9ce000b93f37543253976357d38c9`. It confirms software checks on the published source, not GxP validation.

## Visual references

- [Desktop screenshot](screenshots/desktop.png)
- [Mobile screenshot](screenshots/mobile.png)
- [Chinese desktop screenshot](screenshots/desktop-zh.png)
- [Chinese mobile screenshot](screenshots/mobile-zh.png)

All show the original simulated case with the updated interface. No patient, employer or live manufacturing data was used.

## Remaining limits

Only this Chromium environment was exercised. Safari, Firefox, real mobile hardware, screen-reader use, authenticated approvals, multi-user edits, formal security review and regulated-system validation were not tested. Typed names, imported records and browser change logs remain unauthenticated and editable. A field being complete does not establish that its contents are true, relevant or adequate.

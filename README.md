# Pharma Inspection Workbench

A learning tool that runs in your browser and helps you practise how pharmaceutical quality teams respond to inspection findings.

[中文说明](README.zh-CN.md) · [Case study](docs/case-study.md) · [Official sources](docs/source-notes.md) · [Interview guide](docs/interview-guide.md) · [Verification](docs/verification.md)

![English demo](docs/screenshots/desktop.png)

## Who is it for?

Students and applicants exploring pharmaceutical **QA (quality assurance)**: the work of checking that processes and records support consistent quality. It is a small module of the **Pharma Intelligence Platform** portfolio.

The practice problem is simple: a spreadsheet says an action is complete, but the evidence is missing or outdated, or nobody has reviewed the response. This tool keeps those gaps visible.

**CAPA** means corrective and preventive action: addressing a problem and reducing recurrence. **MHRA** is the UK's Medicines and Healthcare products Regulatory Agency. Three linked MHRA publications informed the fictional exercise.

## Open it

Use GitHub's **Code → Download ZIP**, extract the folder, and double-click `index.html`. No account, installation or API key is needed.

If browser storage is unreliable when opening the file directly, run this in the project folder with Python installed:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). Stop with `Ctrl+C`.

## Practise the five-step workflow

1. **Read the finding.** Identify the issue and what still needs investigation.
2. **Plan the work.** Record an owner, deadline, root cause, impact, actions and an effectiveness check.
3. **Connect references.** Select supporting demo evidence and official sources; inspect missing or outdated records.
4. **Save and review.** Resolve workflow gaps and record a typed reviewer's demo approval.
5. **Follow up.** Record an effectiveness result before closure, then export an internal report or backup.

Start with **F-001**: try closing it and inspect the blockers. Its missing training record cannot be replaced by an unrelated document.

Then open the complete, closed **F-003**. Clarify one relevant action explanation and save. This invalidates approval and reopens the record. Inspect it, record a new demo review and close it again.

## Features in version 0.2

- Six fictional findings, filters, deadlines and an editable reference date.
- **New training finding** for your own fictional observation.
- A next-step guide and gap links that open the relevant field or tab.
- Drafts retained across tabs within one finding; save once for all tabs.
- Local browser saving, a change log, JSON backup/import, and CSV/Markdown internal reports with English labels.

Unsaved drafts may be lost when closing the browser. Different browsers and addresses have separate storage; export JSON before switching.

Chinese is the first-use default; select English with the language switch. The preference is saved. Your own text stays as written. Text that matches the original demo can display a translation; the stored record stays unchanged. JSON preserves stored data exactly. Switching language does not change data or reviews.

## Limits and portfolio use

All records are **fictional**. Use no confidential patient, manufacturing or employer data.

Checks evaluate fields and reference status. They do not analyse actual document contents, verify truth or relevance, replace an inspector, or determine compliance. There is no document upload, system integration, authenticated approval, electronic signature, tamper-proof audit trail or multi-user workflow. Internal reports are not regulator submissions; evidence is retained internally unless requested.

This is an educational prototype, not a validated regulated system. It was built with AI assistance. Understand, review and adapt it before presenting it. Describe your actual contribution; do not claim professional experience, proven time savings or inspection success.

## Checks and open source

With Node.js installed:

```sh
node --test tests/*.test.cjs
```

See [verification](docs/verification.md) for observed results and limits. Contributions are welcome: [CONTRIBUTING.md](CONTRIBUTING.md). Source code uses the [MIT license](LICENSE); linked official material retains its own terms.

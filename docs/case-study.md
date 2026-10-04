# Case study: a synthetic inspection-response workflow

## Problem and intended user

A quality team needs a clear connection between each inspection finding, its action owner, planned date, supporting records and response review. This project models that connection for learning and job-portfolio discussions. The intended demo user is a QA assistant or quality-systems support colleague at a fictional organisation.

The problem choice was informed by three public MHRA publications, listed in [source notes](source-notes.md). No customer interviews or live company records were used. Market demand and operational benefit have not been established.

## Requirements

| Requirement | Implementation choice | What a reviewer can inspect |
|---|---|---|
| Make commitments traceable | Owner, deadline and action fields per finding | A saved finding and its internal report |
| Separate investigation from action | Root cause, impact, interim action and corrective action fields | Reasoning in one fictional example |
| Make follow-up visible | Effectiveness plan and result | A closure attempt with a missing result |
| Require review before closure | Pending/approved demo review and closure guards | Failed and successful closure attempts |
| Keep sources inspectable | Linked source references and internal evidence index | Source notes and record references |
| Make the demo reproducible | Fixed initial reference date, six fictional findings, JSON backup | Fresh demo, export and re-import |
| Support learning and English presentation | Chinese/English interface and translated seed-case display | Language switching without case or review changes |
| Avoid presenting a regulated product | Visible synthetic-data and prototype limits | README and interface notices |

These are project acceptance criteria. They are not an exhaustive regulatory requirements specification.

## Method

The implementation uses dependency-free browser files and deterministic JavaScript checks. It stores demo edits locally, appends events to a local change log during normal interface use and supports internal CSV, JSON and Markdown exports. The log does not retain prior-value snapshots. Import validation checks data shape and permitted values; it cannot establish whether a record is factually true.

The design separates source references from evidence references. A public guidance link explains why a topic matters. An internal record reference identifies material that a fictional team would review. Neither is proof that a finding has been resolved.

The overview displays calculated counts and deadlines. The finding workflow checks completeness and demo evidence-reference state, invalidates review after relevant edits and guards closure. A typed reviewer records demo approval. This makes the project an interactive local application with state transitions, beyond displaying a list of statuses. It does not verify actual evidence-file contents, connect to external quality systems or authenticate the reviewer.

The interface defaults to Chinese on first use and saves the selected language preference. Supplied fictional records have display translations; edited and imported text remains in its original language. JSON exports preserve canonical stored records exactly. Switching language does not alter those records, invalidate approval or change workflow results.

The code's unit tests exercise selected rules, while browser checks address user interactions and layout. This documentation does not claim GxP validation or numerical productivity improvement. Any actual verification results should be reported with the exact command and observed outcome after execution.

## Example demonstration

Inspect F-001 and explain its missing information, including the unavailable training record. Do not substitute an unrelated evidence reference to make the form appear complete. Leave that finding open.

Then inspect the complete, closed F-003, which has fictional effectiveness evidence. Clarify one relevant action explanation and save it. The edit invalidates approval and reopens the record. Inspect the change log, record a new demo review and close the finding again. Export the internal report and explain what still needs expert assessment.

The successful outcome is a reproducible demonstration of traceability and workflow checks. It is not proof of an effective corrective action or a successful inspection.

## Tradeoffs and limitations

- The simple local app is easy to open and inspect, but offers no authentication, encryption, controlled signatures or shared working environment.
- The local change log and typed review approval are editable demonstrations. They cannot support an auditable regulated decision.
- Field completeness is useful for follow-up but does not measure investigation quality or patient risk.
- Demo evidence-reference checks do not assess actual file contents, authenticity or adequacy. There are no integrations with an employer's systems.
- Display translations support learning; custom text is not automatically translated, so mixed-language records may appear.
- Public sources informed scope; they do not endorse the software or prove demand.
- All sample findings, assessments and outcomes are fictional. No external regulator submission occurs.

## Personal learning and next step

For a candidate with an electronic economics background, this module connects process analysis, structured records and English communication to a QA support task. It does not replace qualification requirements or professional experience.

The candidate should review one finding against the sources, revise it in their own words and explain the revision. The next useful evidence is a QA professional's critique using only synthetic material. A later Pharma Intelligence Platform module can address regulatory-operations tracking if that matches the target job.

This prototype was built with AI assistance. Personal portfolio claims should reflect the candidate's actual review, learning and changes.

## Guided practice extension (version 0.2.0)

A next-step control and per-gap links now move the user to the relevant action-plan, evidence or response field. The checks dialog distinguishes review prerequisites from review/closure follow-up. Drafts persist across the three tabs until a single save commits them; this is transient editing state, not an autosave or an audit record.

Candidates can create a fictional finding rather than only edit the six supplied examples. New records start open, unreviewed and without investigation or supporting references. Creation cannot invent an approved state. The example library still does not upload or evaluate actual supporting documents; new observations with no relevant evidence must remain unresolved.

## Work overview and evidence lookup (version 0.3.0)

The initial screen now shows an actionable queue rather than opening the first finding's form. The queue uses saved records and explicit ordering: overdue, due today, reference gaps, ready for demo review and other open work; dates and IDs break ties. This prioritises follow-up and does not assign regulatory risk or patient impact scores.

The four summary buttons open the corresponding finding filter. Review readiness counts saved records whose plan and references pass the core prerequisites and whose review is still pending. Evidence-gap counts include affected open findings only. The editor remains visible if a search excludes its selected finding, with an explicit notice, so filtering does not discard an unsaved draft.

Evidence search and version filters support lookup. Explicit ID links show which findings cite each record and open their reference selections. The app does not infer document relevance from these links. Pure display helpers reuse the core checks and do not change approval, closure or stored data.

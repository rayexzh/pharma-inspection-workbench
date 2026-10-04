/* MIT licensed. Browser UI for a fictional quality case. No external services. */
(function () {
  'use strict';
  const Core = window.InspectionCore;
  const Demo = window.InspectionDemo;
  const I18n = window.InspectionI18n;
  const Zh = window.InspectionDemoZh;
  const STORAGE_KEY = 'pharma-inspection-workbench:v1';
  const LANGUAGE_KEY = 'pharma-inspection-workbench:language';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const labels = {open:'Open',in_progress:'In progress',closed:'Closed',major:'Major',other:'Other',current:'Current',missing:'Missing',superseded:'Superseded'};
  const badge = value => `<span class="badge ${escape(value)}">${escape(t(labels[value] || value))}</span>`;
  const safeUrl = value => { try { const url = new URL(value); return ['https:','http:'].includes(url.protocol) ? url.href : '#'; } catch { return '#'; } };
  const displayDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-').reverse().join('/') : t('Not set');
  const fieldNames = ['owner','dueDate','rootCause','impact','interimAction','correctiveAction','effectivenessPlan','effectivenessResult','responseDraft','status'];
  let dataset = Demo.createDataset();
  let referenceDate = dataset.referenceDate;
  let selectedId = dataset.findings[0].id;
  let view = 'findings';
  let tab = 'plan';
  let filters = {search:'',status:'all',severity:'all'};
  let dirty = false;
  let storageMode = 'Saved in this browser';
  let toastTimer;
  let language = 'zh-CN';
  let draft = {};
  let renderedFields = {};
  try { if (localStorage.getItem(LANGUAGE_KEY) === 'en') language = 'en'; } catch { /* Session preference remains usable. */ }
  const staticText = $$('[data-i18n]').map(node => ({node,text:node.textContent}));
  const staticAria = $$('[aria-label]').map(node => ({node,text:node.getAttribute('aria-label')}));
  const t = value => I18n.text(value,language);
  const localize = node => I18n.localize(node,language);
  function project(record, kind) {
    const seed = kind === 'case' ? Demo.dataset.case : Demo.dataset[kind].find(item => item.id === record.id);
    const translation = kind === 'case' ? Zh.case : Zh[kind][record.id];
    return I18n.project(record,seed,translation,language);
  }
  function translatedIssues(finding) {
    const projected = {...dataset,evidence:dataset.evidence.map(record => project(record,'evidence'))};
    return evaluation(finding).issues.map(item => I18n.issue(item,projected,language));
  }
  function applyStaticLanguage() {
    document.documentElement.lang = language;
    document.title = t('Pharma Inspection Workbench');
    staticText.forEach(({node,text}) => { node.textContent = t(text); });
    staticAria.forEach(({node,text}) => { node.setAttribute('aria-label',t(text)); });
    $('#language-switch').value = language;
    $('#project-docs').href = language === 'zh-CN' ? 'README.zh-CN.md' : 'README.md';
  }
  function captureDraft() {
    const form = $('#finding-form');
    if (!form) return;
    for (const name of fieldNames) {
      const control = form.elements.namedItem(name);
      if (control && control.value !== renderedFields[name]) draft[name] = control.value;
    }
    if (tab === 'evidence') {
      draft.evidenceIds = $$('input[name="evidenceIds"]:checked',form).map(item => item.value);
      draft.sourceIds = $$('input[name="sourceIds"]:checked',form).map(item => item.value);
    }
  }
  function workflowMarkup(finding) {
    const check = evaluation(finding);
    const planComplete = !check.issues.some(item => item.code.startsWith('missing_') && !['missing_review','missing_effectivenessResult'].includes(item.code) || item.code === 'invalid_due_date');
    const referencesComplete = check.evidenceGaps === 0 && check.sourceGaps === 0;
    const reviewed = finding.review.status === 'approved';
    const stages = [['1 · Action plan',planComplete],['2 · Evidence & sources',referencesComplete],['3 · Named review',reviewed],['4 · Closure',finding.status === 'closed']];
    const next = finding.status === 'closed' ? 'Closed in the demo. A material edit requires another review.' : !planComplete ? 'Complete the missing action-plan fields, then save.' : !referencesComplete ? 'Open Evidence & sources and resolve missing or superseded references.' : !finding.effectivenessResult.trim() ? 'Record the completed effectiveness check and outcome, then save and review again.' : !reviewed ? 'Check the facts and record a named demo review.' : 'The saved record can be closed in this demo workflow.';
    const target = finding.status === 'closed' ? 'history' : !planComplete ? check.issues.find(item => item.code.startsWith('missing_') && !['missing_review','missing_effectivenessResult'].includes(item.code) || item.code === 'invalid_due_date').code : !referencesComplete ? check.issues.find(item => /^(evidence_|source_|no_evidence|no_source)/.test(item.code)).code : !finding.effectivenessResult.trim() ? 'missing_effectivenessResult' : !reviewed ? 'missing_review' : 'close';
    return `<section class="workflow-strip" aria-label="Saved workflow"><ol class="workflow-stages">${stages.map(([label,complete]) => `<li class="${complete?'complete':'pending'}"><span aria-hidden="true">${complete?'✓':'○'}</span> ${escape(t(label))}</li>`).join('')}</ol><p id="next-step"><strong>${t('Next step')}</strong> · ${t(next)}</p><button class="text-button next-step-button" id="next-step-button" data-action="resolve" data-code="${escape(target)}">${t('Go to next step')} →</button><small>${t(dirty?'This workflow uses saved records; save your draft to update the checks.':'Demo reviews and closure depend on completeness, not verified regulatory acceptance.')}</small></section>`;
  }

  function notify(message, error = false) {
    const toast = $('#toast');
    toast.textContent = t(message);
    toast.className = error ? 'error' : '';
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, error ? 6500 : 4200);
  }

  function isDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0,10) === value;
  }

  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!Core.validateDataset(saved.dataset).valid) throw new Error('Invalid saved workspace');
      dataset = saved.dataset;
      referenceDate = isDate(saved.referenceDate) ? saved.referenceDate : dataset.referenceDate;
      selectedId = dataset.findings[0].id;
    } catch {
      storageMode = 'Session only';
      notify('Saved data could not be loaded. The simulated case is displayed.', true);
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({dataset,referenceDate}));
      storageMode = 'Saved in this browser';
    } catch {
      storageMode = 'Session only';
      notify('Browser storage is unavailable or full. Export JSON to retain this session.', true);
    }
    $('#storage-status').textContent = t(storageMode);
  }

  function currentFinding() { return dataset.findings.find(item => item.id === selectedId); }
  function evaluation(finding) { return Core.evaluateFinding(finding, dataset, referenceDate); }
  function canNavigate() {
    if (!dirty) return true;
    if (!window.confirm(t('Discard unsaved changes to this finding?'))) return false;
    dirty = false;
    draft = {};
    return true;
  }
  function requireSaved() {
    if (!dirty) return true;
    notify('Save your changes before reviewing, closing or exporting.', true);
    return false;
  }

  function renderMetrics() {
    const stats = Core.summarise(dataset, referenceDate);
    const values = [
      {label:'Open findings',value:stats.open,note:`of ${stats.total} total`},
      {label:'Overdue actions',value:stats.overdue,note:'as of review date',warn:stats.overdue > 0},
      {label:'Awaiting review',value:stats.needsReview,note:'internal demo review'},
      {label:'Evidence gaps',value:stats.evidenceGaps,note:'missing or superseded'}
    ];
    $('#metrics').innerHTML = values.map(item => `<div class="metric${item.warn?' warn':''}"><span class="metric-label">${item.label}</span><span class="metric-value">${item.value}</span><span class="metric-note">${escape(item.note)}</span></div>`).join('');
    localize($('#metrics'));
  }

  function filteredFindings() {
    const search = filters.search.trim().toLowerCase();
    return dataset.findings.filter(item =>
      (filters.status === 'all' || (filters.status === 'overdue' ? evaluation(item).overdue : item.status === filters.status)) &&
      (filters.severity === 'all' || item.severity === filters.severity) &&
      (!search || [item,project(item,'findings')].map(record => [record.id,record.title,record.area,record.owner,record.description].join(' ')).join(' ').toLowerCase().includes(search))
    );
  }

  function renderList() {
    const list = filteredFindings();
    $('#finding-count').textContent = `${list.length} of ${dataset.findings.length}`;
    $('#finding-list').innerHTML = list.length ? list.map(record => {
      const check = evaluation(record);
      const item = project(record,'findings');
      return `<button type="button" class="finding-item${item.id === selectedId?' selected':''}" data-finding-id="${escape(item.id)}" aria-pressed="${item.id === selectedId}"><span class="finding-meta"><span class="finding-id">${escape(item.id)}</span>${badge(item.severity)}</span><strong data-record-text>${escape(item.title)}</strong><span class="finding-area">${escape(item.area)}</span><span class="finding-bottom">${badge(item.status)}<span>${check.overdue?'<span class="badge overdue">Overdue</span> ':''}${displayDate(item.dueDate)}</span></span></button>`;
    }).join('') : '<div class="empty-state">No findings match these filters.<br>Change your search or filter.</div>';
    $('#finding-count').textContent = t($('#finding-count').textContent);
    $$('.finding-item strong,.finding-area', $('#finding-list')).forEach(node => node.setAttribute('data-record-text',''));
    localize($('#finding-list'));
  }

  function checksMarkup(finding) {
    const check = evaluation(finding);
    if (!check.issues.length) return '<div class="attention-box good"><h3>Workflow checks complete</h3><p>All demo fields and references are present. This is not a regulatory compliance decision.</p></div>';
    const visible = translatedIssues(finding).slice(0,5);
    return `<div class="attention-box" id="workflow-checks"><h3>${check.issues.length} item${check.issues.length === 1?'':'s'} to review</h3><ul>${visible.map(issue => `<li title="${escape(issue.detail)}">${escape(issue.label)}${issue.detail && issue.label !== issue.detail ? ` — ${escape(issue.detail)}` : ''} <button class="text-button issue-link" data-action="resolve" data-code="${escape(issue.code)}">${t('Go to field')} →</button></li>`).join('')}</ul><p class="more-note"><button type="button" class="text-button" data-action="all-checks">View all checks</button></p></div>`;
  }

  function inputField(name, label, value, type = 'text') {
    return `<label class="field"><span>${label}</span><input name="${name}" id="field-${name}" type="${type}" value="${escape(value)}" ${name === 'owner'?'maxlength="120"':''}></label>`;
  }
  function textarea(name, label, value, hint = '', rows = 3) {
    return `<label class="field"><span>${label}</span>${hint?`<small>${hint}</small>`:''}<textarea name="${name}" id="field-${name}" rows="${rows}" maxlength="10000">${escape(value)}</textarea></label>`;
  }

  function renderDetail() {
    const storedFinding = currentFinding();
    const finding = project({...storedFinding,...draft},'findings');
    const review = finding.review;
    const tabs = [{id:'plan',label:'Action plan'},{id:'evidence',label:'Evidence & sources'},{id:'response',label:'Response & history'}];
    let body;
    if (tab === 'plan') {
      body = checksMarkup(storedFinding) + `<div class="form-grid">${inputField('owner','Action owner',finding.owner)}${inputField('dueDate','Committed due date',finding.dueDate,'date')}</div>`;
      body += finding.status === 'closed' ? '<div class="review-strip">This finding is closed in the simulated workflow. A material edit will invalidate its review and reopen it.</div>' : `<label class="field"><span>Action status</span><select name="status" id="field-status"><option value="open" ${finding.status === 'open'?'selected':''}>Open</option><option value="in_progress" ${finding.status === 'in_progress'?'selected':''}>In progress</option></select></label>`;
      body += textarea('rootCause','Root cause investigation',finding.rootCause,'State the evidence-led cause or the investigation still needed.') + textarea('impact','Impact and scope assessment',finding.impact,'Consider related records, batches, processes and sites.') + textarea('interimAction','Immediate / interim action',finding.interimAction) + `<div class="form-divider"><p class="section-label">CORRECTIVE & PREVENTIVE ACTION</p>${textarea('correctiveAction','Corrective and preventive action',finding.correctiveAction)}${textarea('effectivenessPlan','How effectiveness will be checked',finding.effectivenessPlan)}${textarea('effectivenessResult','Effectiveness result',finding.effectivenessResult,'A result is required to close the demo workflow. Planned work is not a result.')}</div>`;
    } else if (tab === 'evidence') {
      body = '<p class="section-label">INTERNAL EVIDENCE REFERENCES</p><p class="references-note">Select records that support this finding. Availability is a demo status; a person must assess relevance and accuracy.</p><div class="link-list">' + dataset.evidence.map(record => project(record,'evidence')).map(item => `<div class="reference-item"><input type="checkbox" name="evidenceIds" id="evidence-${escape(item.id)}" value="${escape(item.id)}" ${finding.evidenceIds.includes(item.id)?'checked':''}><div><label data-record-text for="evidence-${escape(item.id)}">${escape(item.id)} · ${escape(item.title)}</label><p data-record-text>${escape(item.summary)}</p>${badge(item.status)} <small>Version ${escape(item.version || 'not available')}</small>${item.status !== 'missing'?`<button type="button" class="text-button" data-action="view-evidence" data-id="${escape(item.id)}">Read simulated record</button>`:''}</div></div>`).join('') + '</div><div class="form-divider"><p class="section-label">REGULATORY SOURCE REFERENCES</p><p class="references-note">The source register supports manual review. Selecting a source does not establish that it applies.</p><div class="link-list">' + dataset.sources.map(record => project(record,'sources')).map(item => `<div class="reference-item"><input type="checkbox" name="sourceIds" id="source-${escape(item.id)}" value="${escape(item.id)}" ${finding.sourceIds.includes(item.id)?'checked':''}><div><label data-record-text for="source-${escape(item.id)}">${escape(item.title)}</label><p data-record-text>${escape(item.scope)}</p><a href="${escape(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer">Read official source</a><small>Source link checked ${displayDate(item.checkedOn)}</small></div></div>`).join('') + '</div></div>';
    } else {
      body = '<p class="references-note">Keep the draft concise and specific. This is an internal working note, not a submission to MHRA.</p>' + textarea('responseDraft','Working response draft',finding.responseDraft,'Explain the action and its timeline. Completed-action evidence is retained internally unless requested.',9);
      const seedReviewer = Demo.dataset.findings.find(item => item.id === finding.id)?.review.reviewer;
      const displayedReviewer = language === 'zh-CN' && review.reviewer === seedReviewer ? Zh.historyActors[review.reviewer] || review.reviewer : review.reviewer;
      body += `<div class="review-strip"><strong>${review.status === 'approved'?'Demo review recorded':'Awaiting demo review'}</strong>${review.status === 'approved'?` · <span data-record-text>${escape(displayedReviewer)}</span><br>${escape(review.reviewedAt)}`:'<br>Typed reviewer names are not authenticated signatures.'}</div><div class="form-divider"><p class="section-label">LOCAL CHANGE HISTORY</p><p class="references-note">Editable browser history for this demonstration; not a tamper-proof audit trail.</p><ol class="history-list">${finding.history.slice().reverse().map(record => I18n.history(record,Zh,language)).map(item => `<li data-record-text>${escape(item.action)}<span>${escape(item.actor)} · ${escape(item.timestamp)}</span></li>`).join('')}</ol></div>`;
    }
    $('#detail-panel').innerHTML = `<div class="detail-top"><div class="detail-identity"><span class="finding-id" data-record-text>${escape(finding.id)} · ${escape(finding.area)}</span>${badge(finding.status)}</div><h2 data-record-text>${escape(finding.title)}</h2><p class="finding-description" data-record-text>${escape(finding.description)}</p></div>${workflowMarkup(storedFinding)}<div class="tab-bar" role="tablist" aria-label="Finding details">${tabs.map(item => `<button type="button" class="tab${tab === item.id?' active':''}" id="tab-${item.id}" role="tab" aria-selected="${tab === item.id}" aria-controls="detail-body" tabindex="${tab === item.id?'0':'-1'}" data-tab="${item.id}">${item.label}</button>`).join('')}</div><form id="finding-form"><div class="detail-body" id="detail-body" role="tabpanel" aria-labelledby="tab-${tab}">${body}</div><div class="plan-footer"><button type="submit" id="save-finding" class="button">Save changes</button><span class="save-state" id="save-state">${t(dirty?'Unsaved changes':'Saved')}</span><div class="secondary-actions"><button type="button" class="button secondary" id="approve-finding" data-action="approve">Record review</button><button type="button" class="button secondary" id="close-finding" data-action="close" ${finding.status === 'closed'?'disabled':''}>Close finding</button></div></div></form>`;
    $('#finding-form').addEventListener('submit', event => { event.preventDefault(); save(); });
    localize($('#detail-panel'));
    renderedFields = {};
    for (const name of fieldNames) {
      const control = $('#finding-form').elements.namedItem(name);
      if (control) renderedFields[name] = control.value;
    }
  }

  function renderFindings() {
    $('#view-content').innerHTML = `<div class="workbench"><section class="finding-board" aria-label="Findings list"><div class="board-heading"><h2>Findings register</h2><span id="finding-count" class="count-label"></span></div><div class="filters"><label class="sr-only" for="search">Search findings</label><input id="search" type="search" placeholder="Search finding, area or owner" value="${escape(filters.search)}"><div class="filter-pair"><label class="sr-only" for="status-filter">Filter by status</label><select id="status-filter"><option value="all">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="closed">Closed</option><option value="overdue">Overdue</option></select><label class="sr-only" for="severity-filter">Filter by severity</label><select id="severity-filter"><option value="all">All severities</option><option value="major">Major</option><option value="other">Other</option></select></div></div><div id="finding-list" class="finding-list"></div></section><section id="detail-panel" class="detail-panel" aria-label="Selected finding"></section></div>`;
    $('#status-filter').value = filters.status;
    $('#severity-filter').value = filters.severity;
    $('#search').addEventListener('input', event => { filters.search = event.target.value; renderList(); });
    $('#status-filter').addEventListener('change', event => { filters.status = event.target.value; renderList(); });
    $('#severity-filter').addEventListener('change', event => { filters.severity = event.target.value; renderList(); });
    localize($('#view-content'));
    renderList();
    renderDetail();
  }

  function renderEvidence() {
    $('#view-content').innerHTML = `<section class="library-panel"><div class="library-heading"><div><h2>Evidence library</h2><p>Fictional records and their version status. Missing records remain visible.</p></div><span class="count-label">${dataset.evidence.length} records</span></div><div class="table-scroll"><table class="evidence-table"><thead><tr><th scope="col">Record ID</th><th scope="col">Document / record</th><th scope="col">Version</th><th scope="col">Status</th><th scope="col">Record</th></tr></thead><tbody>${dataset.evidence.map(record => project(record,'evidence')).map(item => `<tr><td>${escape(item.id)}</td><td><strong data-record-text>${escape(item.title)}</strong><small data-record-text>${escape(item.summary)}</small></td><td>${escape(item.version || '—')}</td><td>${badge(item.status)}</td><td>${item.status === 'missing'?'<span class="count-label">Not available</span>':`<button type="button" class="text-button" data-action="view-evidence" data-id="${escape(item.id)}">Read record</button>`}</td></tr>`).join('')}</tbody></table></div></section>`;
    localize($('#view-content'));
  }

  function renderSources() {
    $('#view-content').innerHTML = `<section class="library-panel"><div class="library-heading"><div><h2>Source register</h2><p>Official references selected for this case. Review applicability and later updates.</p></div></div>${dataset.sources.map(record => project(record,'sources')).map(item => `<article class="source-card"><span class="finding-id">${escape(item.id)}</span><h3 data-record-text>${escape(item.title)}</h3><p data-record-text>${escape(item.scope)}</p><a href="${escape(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer">Open official guidance</a><br><small>Link checked ${displayDate(item.checkedOn)} · Applicability requires human review</small></article>`).join('')}<div class="attention-box"><h3>How these references are used</h3><p class="references-note">The project applies a small set of transparent completeness checks. It does not interpret all GMP/GDP requirements or verify whether a submitted statement is true.</p><a href="docs/source-notes.md">Read the source-to-feature notes</a></div></section>`;
    localize($('#view-content'));
  }

  function renderCase() {
    $('#view-content').innerHTML = `<article class="info-panel"><p class="eyebrow">LEARNING CASE / QUALITY ASSURANCE</p><h2 data-record-text>${escape(project(dataset.case,'case').name)}</h2><p data-record-text>${escape(project(dataset.case,'case').description)}</p><dl class="case-facts"><div><dt>Case ID</dt><dd>${escape(dataset.case.id)}</dd></div><div><dt>Fictional site</dt><dd data-record-text>${escape(project(dataset.case,'case').site)}</dd></div><div><dt>Simulated inspection</dt><dd>${displayDate(dataset.case.inspectionDate)}</dd></div></dl><h3>Work through one finding</h3><ol><li>Read the finding and identify what is known and what still needs investigation.</li><li>Set an owner and due date. Describe impact, interim action, corrective action and the effectiveness check.</li><li>Connect current supporting records and appropriate official references.</li><li>Save, then record a named demo review. A later material edit invalidates that review.</li><li>Record an effectiveness result before closing the simulated workflow.</li></ol><h3>What the checks mean</h3><p>Checks look for missing fields, unavailable or superseded evidence, missing source references and pending review. A completed checklist is not a judgement that a medicine, facility or response complies with regulations.</p><h3>Where the data lives</h3><p>Changes stay in this browser when local storage is available. Export JSON for backup or to move between browsers. CSV and Markdown exports are internal working reports. No data is sent to a server by this app.</p><h3>Limits of this prototype</h3><p>There is no authenticated reviewer, electronic signature, tamper-proof history, multi-user access or validated document management. Use fictional or public information only. Source selection and factual verification need qualified human judgement.</p><h3>Portfolio documentation</h3><p><a href="docs/case-study.md">English case study</a> · <a href="docs/interview-guide.md">Interview demonstration</a> · <a href="README.zh-CN.md">中文上手指南</a> · <a href="LICENSE">MIT licence</a></p></article>`;
    localize($('#view-content'));
  }

  function render() {
    applyStaticLanguage();
    $('#case-name').textContent = project(dataset.case,'case').name;
    $('#case-site').textContent = project(dataset.case,'case').site;
    $('#case-id').textContent = `${dataset.case.id} · ${language === 'zh-CN'?'检查':'Inspection'} ${displayDate(dataset.case.inspectionDate)}`;
    $('#reference-date').value = referenceDate;
    $('#storage-status').textContent = t(storageMode);
    const headings = {findings:['Inspection findings','Connect each finding to an action, evidence and a reviewer.'],evidence:['Evidence library','Keep supporting records and their version status visible.'],sources:['Source register','Trace the official references used in this learning case.'],case:['Case & method','Understand the workflow, assumptions and limits.']};
    $('#page-title').textContent = t(headings[view][0]);
    $('#page-subtitle').textContent = t(headings[view][1]);
    $$('.nav-item').forEach(item => { item.classList.toggle('active',item.dataset.view === view); if (item.dataset.view === view) item.setAttribute('aria-current','page'); else item.removeAttribute('aria-current'); });
    renderMetrics();
    if (view === 'findings') renderFindings();
    else if (view === 'evidence') renderEvidence();
    else if (view === 'sources') renderSources();
    else renderCase();
  }

  function save() {
    const form = $('#finding-form');
    if (!form.reportValidity()) return;
    captureDraft();
    const patch = {...draft};
    try {
      const previous = currentFinding();
      dataset = Core.saveFinding(dataset,selectedId,patch,'Demo editor',new Date().toISOString());
      dirty = false; draft = {};
      persist();
      renderMetrics(); renderList(); renderDetail();
      notify(previous.review.status === 'approved' && currentFinding().review.status !== 'approved' ? 'Changes saved. The previous review is invalidated; a new review is required.' : 'Finding saved in this browser.');
    } catch (error) { notify(error.message,true); }
  }

  function modal(title,content) {
    $('#modal-title').textContent = t(title);
    $('#modal-content').innerHTML = content;
    localize($('#modal-content'));
    if (!$('#modal').open) $('#modal').showModal();
  }

  function showChecks() {
    const issues = translatedIssues(currentFinding());
    const followUp = issue => ['missing_review','missing_effectivenessResult','overdue'].includes(issue.code);
    const list = entries => entries.length ? `<ol>${entries.map(issue => `<li><strong>${escape(issue.label)}</strong><p>${escape(issue.detail)}</p><button class="text-button issue-link" data-action="resolve" data-code="${escape(issue.code)}">${t('Go to field')} →</button></li>`).join('')}</ol>` : `<p>${t('No blocking gaps in the saved record.')}</p>`;
    modal('Workflow checks',`<div class="modal-copy"><p>These are completeness checks for the simulated workflow.</p><h3 class="check-group-title">${t('Action required before review')}</h3>${list(issues.filter(issue => !followUp(issue)))}<h3 class="check-group-title">${t('Review and closure follow-up')}</h3>${list(issues.filter(followUp))}</div>`);
  }

  function goToTab(nextTab, selector) {
    if (dirty) captureDraft();
    tab = nextTab; renderDetail();
    const control = $(selector || `#tab-${tab}`);
    if (control) { control.focus(); control.scrollIntoView({block:'center'}); }
  }
  function resolveIssue(code) {
    $('#modal').close();
    if (code === 'close') { closeFinding(); return; }
    if (code === 'history') { goToTab('response','.history-list'); return; }
    if (/^(evidence_|no_evidence)/.test(code)) { goToTab('evidence','input[name="evidenceIds"]'); return; }
    if (/^(source_|no_source)/.test(code)) { goToTab('evidence','input[name="sourceIds"]'); return; }
    if (code === 'missing_review') { goToTab('response','#approve-finding'); return; }
    const field = code === 'overdue' || code === 'invalid_due_date' ? 'dueDate' : code.slice(8);
    goToTab(field === 'responseDraft' ? 'response' : 'plan',`#field-${field}`);
  }
  function newFindingDialog() {
    if (!requireSaved()) return;
    modal('New training finding',`<form id="new-finding-form"><p class="modal-copy">Use a fictional issue to practise. New findings start without evidence, investigation or review.</p><label class="field"><span>Finding title</span><input name="title" id="new-title" required maxlength="200"></label><label class="field"><span>Quality area</span><input name="area" required maxlength="200"></label><label class="field"><span>What was observed</span><small>Describe the observation without inventing a root cause or a completed action.</small><textarea name="description" required maxlength="10000" rows="3"></textarea></label><label class="field"><span>Classification</span><select name="severity"><option value="other">Other</option><option value="major">Major</option></select></label><div class="form-grid"><label class="field"><span>Optional initial owner</span><input name="owner" maxlength="120"></label><label class="field"><span>Optional committed date</span><input name="dueDate" type="date"></label></div><p id="new-finding-error" class="dialog-error" role="alert"></p><div class="modal-actions"><button type="submit" class="button" id="confirm-new-finding">Create finding</button></div></form>`);
    $('#new-finding-form').addEventListener('submit',event => {
      event.preventDefault();
      const form = event.target;
      const fields = Object.fromEntries(['title','area','description','severity','owner','dueDate'].map(name => [name,form.elements.namedItem(name).value.trim()]));
      try {
        dataset = Core.addFinding(dataset,fields,'Demo editor',new Date().toISOString());
        selectedId = dataset.findings.at(-1).id; view = 'findings'; tab = 'plan'; draft = {}; dirty = false;
        filters = {search:'',status:'all',severity:'all'}; persist(); render(); $('#modal').close();
        notify('Finding created. Investigate it and link relevant supporting records before review.');
      } catch { $('#new-finding-error').textContent = t('New finding could not be created. Check the required text, classification and date.'); }
    });
    $('#new-title').focus();
  }

  function approve() {
    if (!requireSaved()) return;
    const check = evaluation(currentFinding());
    if (!check.canApprove) { showChecks(); return; }
    modal('Record an internal demo review','<form id="review-form"><p class="modal-copy">Check the case facts, action plan and selected references before recording a review. A typed name is a demonstration only, not an authenticated approval or electronic signature.</p><label class="field" style="margin-top:18px"><span>Reviewer name</span><input id="reviewer-name" required maxlength="120" autocomplete="off" placeholder="e.g. Demo Reviewer"></label><p id="review-error" class="dialog-error" role="alert"></p><div class="modal-actions"><button class="button" type="submit" id="confirm-review">Record demo review</button></div></form>');
    $('#review-form').addEventListener('submit',event => {
      event.preventDefault();
      try {
        dataset = Core.approveFinding(dataset,selectedId,$('#reviewer-name').value,new Date().toISOString());
        persist(); renderMetrics(); renderList(); renderDetail();
        $('#modal').close(); notify('Demo review recorded. Future material edits will require a new review.');
      } catch (error) { $('#review-error').textContent = t(error.message); }
    });
    $('#reviewer-name').focus();
  }

  function closeFinding() {
    if (!requireSaved()) return;
    if (!evaluation(currentFinding()).canClose) { showChecks(); return; }
    modal('Close this simulated finding?','<div class="modal-copy"><p>The demo action plan, current references, named review and effectiveness result are present. Closing this record does not certify regulatory compliance.</p></div><div class="modal-actions"><button class="button" id="confirm-close">Close simulated finding</button><button class="button secondary" id="cancel-close">Keep open</button></div>');
    $('#cancel-close').addEventListener('click',() => $('#modal').close());
    $('#confirm-close').addEventListener('click',() => {
      try {
        dataset = Core.closeFinding(dataset,selectedId,'Demo editor',new Date().toISOString());
        persist(); renderMetrics(); renderList(); renderDetail(); $('#modal').close(); notify('Finding closed in the simulated workflow.');
      } catch (error) { notify(error.message,true); }
    });
  }

  function download(name,text,type) {
    const url = URL.createObjectURL(new Blob([text],{type}));
    const link = document.createElement('a');
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url),10000);
  }

  function exportsDialog() {
    if (!requireSaved()) return;
    modal('Export workspace','<p class="modal-copy">Exports are local working files. They contain fictional case data and your saved edits.</p><p class="modal-copy export-language-note">JSON preserves exact stored text. CSV and Markdown keep the original record text with English report labels. Display translations are not exported.</p><div style="margin-top:20px"><button class="export-option" data-export="json" id="export-json"><span class="export-format">JSON</span><span><strong>Workspace backup</strong><small>Import this file to restore the case and change history.</small></span></button><button class="export-option" data-export="csv" id="export-csv"><span class="export-format">CSV</span><span><strong>Findings register</strong><small>Open a summary of actions and checks in a spreadsheet.</small></span></button><button class="export-option" data-export="markdown" id="export-markdown"><span class="export-format">MD</span><span><strong>Internal review report</strong><small>Readable case report with evidence and source references.</small></span></button></div>');
  }

  async function importFile(file) {
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('JSON files must be smaller than 1 MB.');
      const parsed = JSON.parse(await file.text());
      const validation = Core.validateDataset(parsed);
      if (!validation.valid) throw new Error(`Import rejected: ${validation.errors.slice(0,3).join('; ')}`);
      modal('Import this workspace?',`<div class="modal-copy"><p>${language === 'zh-CN'?'用工作区':'Replace the current browser workspace with'} <strong data-record-text>${escape(parsed.case.name)}</strong>${language === 'zh-CN'?`（共 ${parsed.findings.length} 条发现）替换当前工作区？如需保留原有内容，请先导出备份。`:` containing ${parsed.findings.length} findings? Export your current workspace first if you want to retain it.`}</p><p>Structure was checked. Imported facts, review names and history are not authenticated.</p></div><div class="modal-actions"><button class="button" id="confirm-import">Replace workspace</button><button class="button secondary" id="cancel-import">Cancel</button></div>`);
      $('#cancel-import').addEventListener('click',() => $('#modal').close());
      $('#confirm-import').addEventListener('click',() => {
        dataset = Core.clone(parsed); referenceDate = parsed.referenceDate; selectedId = parsed.findings[0].id;
        filters = {search:'',status:'all',severity:'all'}; dirty = false; draft = {}; tab = 'plan'; view = 'findings';
        persist(); render(); $('#modal').close(); notify('Workspace imported. Verify imported records before using them.');
      });
    } catch (error) { notify(error.message,true); }
    finally { $('#import-file').value = ''; }
  }

  function resetDialog() {
    modal('Reset the simulated case?','<div class="modal-copy"><p>This replaces this browser’s workspace with the original fictional data and clears your edits. Export JSON first to keep a backup.</p></div><div class="modal-actions"><button class="button danger" id="confirm-reset">Reset simulated case</button><button class="button secondary" id="cancel-reset">Cancel</button></div>');
    $('#cancel-reset').addEventListener('click',() => $('#modal').close());
    $('#confirm-reset').addEventListener('click',() => {
      dataset = Demo.createDataset(); referenceDate = dataset.referenceDate; selectedId = dataset.findings[0].id;
      dirty = false; draft = {}; tab = 'plan'; view = 'findings'; filters = {search:'',status:'all',severity:'all'};
      persist(); render(); $('#modal').close(); notify('Original simulated case restored.');
    });
  }

  $('#language-switch').addEventListener('change',event => {
    if (dirty) captureDraft();
    language = event.target.value === 'en' ? 'en' : 'zh-CN';
    $('#toast').hidden = true;
    render();
    try { localStorage.setItem(LANGUAGE_KEY,language); } catch { notify('Language preference could not be saved. It applies for this session.',true); }
  });

  $('#navigation').addEventListener('click',event => {
    const button = event.target.closest('[data-view]');
    if (!button || !canNavigate()) return;
    view = button.dataset.view; render();
  });
  $('#view-content').addEventListener('click',event => {
    const finding = event.target.closest('[data-finding-id]');
    if (finding) {
      if (!canNavigate()) return;
      selectedId = finding.dataset.findingId; tab = 'plan'; renderList(); renderDetail();
      if (matchMedia('(max-width:700px)').matches) $('#detail-panel').scrollIntoView({block:'start'});
      return;
    }
    const tabButton = event.target.closest('[data-tab]');
    if (tabButton) { goToTab(tabButton.dataset.tab); return; }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'approve') approve();
    if (button.dataset.action === 'close') closeFinding();
    if (button.dataset.action === 'all-checks') showChecks();
    if (button.dataset.action === 'resolve') resolveIssue(button.dataset.code);
    if (button.dataset.action === 'view-evidence') {
      const record = project(dataset.evidence.find(item => item.id === button.dataset.id),'evidence');
      modal(`${record.id} · ${record.title}`,`<p class="modal-copy">Fictional evidence · version ${escape(record.version)} · ${escape(t(labels[record.status]))}</p><pre class="evidence-content">${escape(record.content || 'No content supplied.')}</pre>`);
    }
  });
  $('#view-content').addEventListener('keydown',event => {
    const activeTab = event.target.closest('[role="tab"]');
    if (!activeTab || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    const tabs = ['plan','evidence','response'];
    const next = event.key === 'Home'?0:event.key === 'End'?2:(tabs.indexOf(tab)+(event.key === 'ArrowRight'?1:2))%3;
    goToTab(tabs[next]);
  });
  function markDirty(event) {
    if (!event.target.closest('#finding-form') || !['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)) return;
    dirty = true; $('#save-state').textContent = t('Unsaved changes');
  }
  $('#view-content').addEventListener('input',markDirty);
  $('#view-content').addEventListener('change',markDirty);
  $('#reference-date').addEventListener('change',event => {
    if (!isDate(event.target.value)) { notify('Choose a valid review date.',true); event.target.value = referenceDate; return; }
    referenceDate = event.target.value; persist(); renderMetrics();
    if (view === 'findings') { renderList(); if (!dirty) renderDetail(); }
  });
  $('#close-modal').addEventListener('click',() => $('#modal').close());
  $('#modal').addEventListener('click',event => { if (event.target === $('#modal')) { const bounds = $('#modal').getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) $('#modal').close(); } });
  $('#modal-content').addEventListener('click',event => {
    const issueButton = event.target.closest('[data-action="resolve"]');
    if (issueButton) { resolveIssue(issueButton.dataset.code); return; }
    const button = event.target.closest('[data-export]');
    if (!button) return;
    const type = button.dataset.export;
    const prefix = `pharma-workbench-${referenceDate}`;
    if (type === 'json') download(prefix+'.json',JSON.stringify({...dataset,referenceDate},null,2),'application/json');
    if (type === 'csv') download(prefix+'.csv','\uFEFF'+Core.csvExport(dataset,referenceDate),'text/csv;charset=utf-8');
    if (type === 'markdown') download(prefix+'.md',Core.markdownReport(dataset,referenceDate),'text/markdown;charset=utf-8');
    notify('Local export downloaded.');
  });
  $('#export-button').addEventListener('click',exportsDialog);
  $('#new-finding-button').addEventListener('click',newFindingDialog);
  $('#import-button').addEventListener('click',() => { if (requireSaved()) $('#import-file').click(); });
  $('#import-file').addEventListener('change',event => importFile(event.target.files[0]));
  $('#reset-button').addEventListener('click',resetDialog);
  $('#guide-button').addEventListener('click',() => modal('A short demonstration','<div class="modal-copy"><ol><li>Open F-001 and inspect its overdue commitment and missing or superseded records. Try closing it to see the workflow block.</li><li>Open F-003. Read its completed action, effectiveness result and linked simulated evidence.</li><li>Revise a relevant explanation in F-003 and save. Its prior review is invalidated and the record reopens.</li><li>Check the revised case, record a named demo review and close it again.</li><li>Export an internal report or JSON backup. Reset the case to practise again.</li></ol><p>Use relevant records. Replacing a missing reference with an unrelated current document does not resolve a finding. This prototype checks completeness, so relevance and factual accuracy still require human judgement.</p></div>'));
  window.addEventListener('beforeunload',event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  window.InspectionWorkbench = Object.freeze({getState:() => Core.clone({dataset,referenceDate,selectedId,view,tab,dirty,language})});
  restore(); render();
})();

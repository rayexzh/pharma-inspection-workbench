/* MIT licensed. Browser UI for a fictional quality case. No external services. */
(function () {
  'use strict';
  const Core = window.InspectionCore;
  const Workflow = window.InspectionWorkflow;
  const Drafts = window.InspectionDrafts;
  const Guidance = window.InspectionGuidance;
  const Demo = window.InspectionDemo;
  const I18n = window.InspectionI18n;
  const Zh = window.InspectionDemoZh;
  const STORAGE_KEY = 'pharma-inspection-workbench:v1';
  const LANGUAGE_KEY = 'pharma-inspection-workbench:language';
  const DRAFT_KEY = 'pharma-inspection-workbench:draft:v1';
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
  let view = 'overview';
  let tab = 'plan';
  let filters = {search:'',status:'all',severity:'all',focus:'all',sort:'priority'};
  let evidenceFilters = {search:'',status:'all'};
  let dirty = false;
  let storageMode = 'Saved in this browser';
  let toastTimer;
  let language = 'zh-CN';
  let draft = {};
  let recoveryDraft = null;
  let draftWriteTimer;
  let draftStored = false;
  let draftStorageError = false;
  let draftUpdatedAt = '';
  let draftFailureNotified = false;
  let canonicalStored = true;
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
    const stored = currentFinding();
    const displayed = project(stored,'findings');
    for (const name of fieldNames) {
      const control = form.elements.namedItem(name);
      if (!control) continue;
      if (control.value === displayed[name]) delete draft[name];
      else draft[name] = control.value;
    }
    if (tab === 'evidence') {
      for (const name of ['evidenceIds','sourceIds']) {
        const checked = $$(`input[name="${name}"]:checked`,form).map(item => item.value);
        // Preserve stored reference order when a user has not changed the selection.
        const ids = stored[name].filter(id => checked.includes(id)).concat(checked.filter(id => !stored[name].includes(id)));
        if (JSON.stringify(ids) === JSON.stringify(stored[name])) delete draft[name];
        else draft[name] = ids;
      }
    }
    dirty = Object.keys(draft).length > 0;
  }
  function draftTime(value) {
    return new Date(value).toLocaleString(language === 'zh-CN'?'zh-CN':'en-GB',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  }
  function updateDraftStatus() {
    const node = $('#draft-status');
    if (node) {
      node.hidden = !dirty;
      node.dataset.state = draftStorageError?'unavailable':draftStored?'saved':'pending';
      node.textContent = t(draftStorageError?'Draft stays in this tab; recovery is unavailable.':draftStored?'Local recovery copy saved. Changes are not committed.':'Saving a local recovery copy…');
    }
    if ($('#save-state')) $('#save-state').textContent = t(dirty?'Unsaved changes':'Saved');
    if ($('#discard-draft')) $('#discard-draft').disabled = !dirty;
    const note = $('.workflow-strip small');
    if (note) note.textContent = t(dirty?'This workflow uses saved records; save your draft to update the checks.':'Demo reviews and closure depend on completeness, not verified regulatory acceptance.');
  }
  function renderRecovery() {
    const banner = $('#draft-recovery');
    banner.hidden = !recoveryDraft;
    if (!recoveryDraft) { banner.innerHTML = ''; return; }
    banner.innerHTML = `<div class="recovery-copy"><strong>${t('Uncommitted draft found')} · <span data-record-text>${escape(recoveryDraft.findingId)}</span></strong><p>${t('Restore it to continue editing, or discard it to use saved records.')} <time datetime="${escape(recoveryDraft.updatedAt)}">${escape(draftTime(recoveryDraft.updatedAt))}</time></p><small>${t('A recovery copy does not change reviews, workflow counts or exports.')}</small></div><div class="recovery-actions"><button type="button" class="button" id="restore-draft">${t('Restore draft')}</button><button type="button" class="button secondary" id="discard-recovery">${t('Discard draft')}</button></div>`;
  }
  function clearRecoveryCopy(force = false) {
    clearTimeout(draftWriteTimer);
    recoveryDraft = null; draftStored = false; draftUpdatedAt = ''; draftStorageError = false;
    try { if (canonicalStored || force) localStorage.removeItem(DRAFT_KEY); }
    catch { notify('The recovery copy could not be removed from browser storage.',true); }
    renderRecovery();
  }
  function writeRecoveryCopy() {
    clearTimeout(draftWriteTimer);
    if (!dirty) { clearRecoveryCopy(); updateDraftStatus(); return; }
    try {
      // Keep the last valid recovery envelope if saved session records differ from browser storage.
      if (!canonicalStored) throw new Error('The saved session is not persisted.');
      const entry = Drafts.createDraft(dataset,selectedId,draft,{tab,language,updatedAt:new Date().toISOString()});
      localStorage.setItem(DRAFT_KEY,JSON.stringify(entry));
      draftStored = true; draftStorageError = false; draftUpdatedAt = entry.updatedAt;
    } catch {
      draftStored = false; draftStorageError = true;
      if (!draftFailureNotified) { notify('Draft recovery is unavailable. Keep this tab open and save your changes.',true); draftFailureNotified = true; }
    }
    updateDraftStatus();
  }
  function scheduleRecoveryCopy() {
    captureDraft(); draftStored = false; updateDraftStatus();
    clearTimeout(draftWriteTimer);
    if (!dirty) { clearRecoveryCopy(); return; }
    draftWriteTimer = setTimeout(writeRecoveryCopy,150);
  }
  function loadRecoveryCopy() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const checked = Drafts.validateDraft(JSON.parse(raw),dataset);
      if (!checked.valid) {
        localStorage.removeItem(DRAFT_KEY);
        notify(checked.reason === 'stale'?'An older draft no longer matches the saved records and was not applied.':'An invalid recovery copy was ignored.',true);
        return;
      }
      recoveryDraft = checked.draft;
    } catch { notify('The recovery copy could not be read. Saved records are displayed.',true); }
  }
  function requireRecoveryDecision() {
    if (!recoveryDraft) return true;
    notify('Restore or discard the recovered draft before editing.');
    $('#restore-draft')?.focus(); $('#draft-recovery').scrollIntoView({block:'nearest'});
    return false;
  }
  function restoreDraft() {
    const checked = Drafts.validateDraft(recoveryDraft,dataset);
    if (!checked.valid) { clearRecoveryCopy(); notify('An older draft no longer matches the saved records and was not applied.',true); return; }
    selectedId = checked.draft.findingId; draft = Core.clone(checked.draft.patch); tab = checked.draft.tab;
    dirty = true; draftStored = true; draftUpdatedAt = checked.draft.updatedAt; recoveryDraft = null;
    filters = {search:'',status:'all',severity:'all',focus:'all',sort:'priority'}; view = 'findings';
    render(); $('#detail-panel').scrollIntoView({block:'start'});
    notify('Draft restored for editing. Save changes to commit it.');
  }
  function discardDraft() {
    if (!dirty && !recoveryDraft) return;
    modal('Discard this draft?',`<p class="modal-copy">${t('This removes the uncommitted edits and recovery copy. Saved findings and reviews stay as they are.')}</p><div class="modal-actions"><button type="button" class="button danger" id="confirm-discard-draft">${t('Discard draft')}</button><button type="button" class="button secondary" id="keep-draft">${t('Keep editing')}</button></div>`);
    $('#keep-draft').addEventListener('click',() => $('#modal').close());
    $('#confirm-discard-draft').addEventListener('click',() => {
      const discardedPendingRecovery = !!recoveryDraft;
      dirty = false; draft = {}; clearRecoveryCopy(discardedPendingRecovery); $('#modal').close(); render();
      notify('Draft discarded. Saved records are unchanged.');
    });
  }

  function workflowState(finding) { return Workflow.classifyFinding(finding,dataset,referenceDate,Core); }
  function priorityBadge(state) { return `<span class="badge ${escape(state.priority)}">${escape(t(state.labelKey))}</span>`; }
  function workflowMarkup(finding) {
    const check = evaluation(finding);
    const state = workflowState(finding);
    const planComplete = !check.issues.some(item => item.code.startsWith('missing_') && !['missing_review','missing_effectivenessResult'].includes(item.code) || item.code === 'invalid_due_date');
    const stages = [['1 · Action plan',planComplete],['2 · Evidence & sources',check.evidenceGaps === 0 && check.sourceGaps === 0],['3 · Named review',finding.review.status === 'approved'],['4 · Closure',finding.status === 'closed']];
    return `<section class="workflow-strip" aria-label="Saved workflow"><ol class="workflow-stages">${stages.map(([label,complete]) => `<li class="${complete?'complete':'pending'}"><span aria-hidden="true">${complete?'✓':'○'}</span> ${escape(t(label))}</li>`).join('')}</ol><div class="check-summary"><p id="next-step"><strong>${t('Next step')}</strong> · ${t(state.summaryKey)}</p><button type="button" class="text-button next-step-button" id="next-step-button" data-action="resolve" data-code="${escape(state.nextCode)}">${t('Go to next step')} →</button></div><small>${t(dirty?'This workflow uses saved records; save your draft to update the checks.':'Demo reviews and closure depend on completeness, not verified regulatory acceptance.')}</small></section>`;
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
      canonicalStored = true;
    } catch {
      storageMode = 'Session only';
      canonicalStored = false;
      notify('Browser storage is unavailable or full. Export JSON to retain this session.', true);
    }
    $('#storage-status').textContent = t(storageMode);
    return canonicalStored;
  }

  function currentFinding() { return dataset.findings.find(item => item.id === selectedId); }
  function evaluation(finding) { return Core.evaluateFinding(finding, dataset, referenceDate); }
  function canNavigate() {
    if (!dirty) return true;
    if (!window.confirm(t('Discard unsaved changes to this finding?'))) return false;
    dirty = false;
    draft = {};
    clearRecoveryCopy();
    return true;
  }
  function requireSaved() {
    if (!requireRecoveryDecision()) return false;
    if (!dirty) return true;
    notify('Save your changes before reviewing, closing or exporting.', true);
    return false;
  }

  function focusMatches(finding,focus) { return Workflow.matchesFocus(finding,dataset,referenceDate,Core,focus); }
  function renderMetrics() {
    const count = focus => dataset.findings.filter(item => focusMatches(item,focus)).length;
    const values = [
      {label:'Open findings',value:count('open'),note:`of ${dataset.findings.length} total`,focus:'open'},
      {label:'Overdue actions',value:count('overdue'),note:'as of review date',focus:'overdue',warn:count('overdue') > 0},
      {label:'Ready for demo review',value:count('review_ready'),note:'saved plan and references present',focus:'review_ready'},
      {label:'Findings with evidence gaps',value:count('evidence_gap'),note:'open findings, not document count',focus:'evidence_gap'}
    ];
    $('#metrics').innerHTML = values.map(item => `<button type="button" data-metric-focus="${item.focus}" aria-pressed="${view === 'findings' && filters.focus === item.focus}" class="metric${item.warn?' warn':''}${view === 'findings' && filters.focus === item.focus?' active':''}"><span class="metric-label">${escape(t(item.label))}</span><span class="metric-value">${item.value}</span><span class="metric-note">${escape(t(item.note))}</span></button>`).join('');
  }

  function searchText(record,kind) {
    const seed = Demo.dataset[kind].find(item => item.id === record.id);
    const translated = I18n.project(record,seed,Zh[kind][record.id],'zh-CN');
    return [record,translated].map(item => Object.values(item).filter(value => typeof value === 'string').join(' ')).join(' ').toLowerCase();
  }
  function filteredFindings() {
    const search = filters.search.trim().toLowerCase();
    const records = dataset.findings.filter(item => focusMatches(item,filters.focus) &&
      (filters.status === 'all' || (filters.status === 'overdue' ? evaluation(item).overdue : item.status === filters.status)) &&
      (filters.severity === 'all' || item.severity === filters.severity) &&
      (!search || searchText(item,'findings').includes(search))
    );
    return Workflow.sortFindings(records,dataset,referenceDate,Core,filters.sort);
  }
  function renderList() {
    const list = filteredFindings();
    $('#finding-count').textContent = t(`${list.length} of ${dataset.findings.length}`);
    $('#finding-list').innerHTML = list.length ? list.map(record => {
      const item = project(record,'findings');
      const state = workflowState(record);
      return `<button type="button" class="finding-item${item.id === selectedId?' selected':''}" data-finding-id="${escape(item.id)}" aria-pressed="${item.id === selectedId}"><span class="finding-meta"><span class="finding-id">${escape(item.id)}</span>${badge(item.severity)}</span><strong data-record-text>${escape(item.title)}</strong><span class="finding-area" data-record-text>${escape(item.area)}</span><span class="finding-owner" data-record-text>${escape(item.owner || t('Unassigned'))}</span><span class="finding-bottom">${priorityBadge(state)}<span>${displayDate(item.dueDate)}</span></span></button>`;
    }).join('') : `<div class="empty-state">${t('No findings match these filters.')}<br>${t('Change your search or filter.')}</div>`;
    const outside = !list.some(item => item.id === selectedId);
    $('#filter-context').hidden = !outside;
    $('#filter-context').innerHTML = outside ? `${t('The selected finding is outside these filters. Your editor stays open.')} <button type="button" class="text-button" data-clear-filters>${t('Clear filters')}</button>` : '';
    $$('[data-focus]').forEach(item => { item.classList.toggle('active',item.dataset.focus === filters.focus); item.setAttribute('aria-pressed',String(item.dataset.focus === filters.focus)); });
    $('#clear-filters').hidden = !filters.search && filters.status === 'all' && filters.severity === 'all' && filters.focus === 'all';
  }
  function checksMarkup(finding) {
    const check = evaluation(finding);
    if (!check.issues.length) return `<div class="attention-box good"><h3>${t('Workflow checks complete')}</h3><p>${t('All demo fields and references are present. This is not a regulatory compliance decision.')}</p></div>`;
    const visible = translatedIssues(finding).slice(0,3);
    return `<div class="attention-box" id="workflow-checks"><div class="check-summary"><h3>${t(`${check.issues.length} item${check.issues.length === 1?'':'s'} to review`)}</h3><button type="button" class="text-button" data-action="all-checks">${t('View all checks')}</button></div><ul>${visible.map(issue => `<li><button type="button" class="text-button issue-link" title="${escape(issue.detail)}" data-action="resolve" data-code="${escape(issue.code)}">${escape(issue.label)} →</button></li>`).join('')}</ul></div>`;
  }

  function renderOverview() {
    const rows = Workflow.sortFindings(dataset.findings.filter(item => item.status !== 'closed'),dataset,referenceDate,Core,'priority');
    const closed = dataset.findings.filter(item => item.status === 'closed').length;
    const current = dataset.evidence.filter(item => item.status === 'current').length;
    $('#view-content').innerHTML = `<article class="overview-panel"><div class="overview-heading"><div><span class="mini-label">INSPECTION RESPONSE</span><h2>What needs attention</h2><p class="overview-lead">Prepare a response to an inspection finding: plan an action, link supporting records, review and close.</p></div><button type="button" class="button secondary" data-open-view="case">How it works</button></div><div class="overview-grid"><section class="priority-panel" aria-label="Work queue"><div class="queue-heading"><h2>Work queue</h2><span class="count-label">${t(`${rows.length} open findings`)}</span></div><ul class="priority-list">${rows.map(record => { const item = project(record,'findings'); const state = workflowState(record); return `<li class="priority-row"><div><div class="priority-meta"><span class="finding-id">${escape(item.id)}</span>${priorityBadge(state)}${badge(item.severity)}</div><h3><button type="button" class="queue-title" data-finding-id="${escape(item.id)}" data-record-text>${escape(item.title)}</button></h3><p><span data-record-text>${escape(item.owner || t('Unassigned'))}</span> · ${t('Due')} ${displayDate(item.dueDate)}</p></div><button type="button" class="text-button priority-action" data-finding-id="${escape(item.id)}" data-next-code="${escape(state.nextCode)}">${t(state.summaryKey)} →</button></li>`; }).join('') || `<li class="empty-state">${t('No open findings in this workspace.')}</li>`}</ul><div class="queue-footer"><button type="button" class="text-button" data-open-view="findings">Open full register →</button><details class="queue-method"><summary>How this queue is ordered</summary><p>Overdue → due today → reference gaps → ready for demo review → other open work. Due date and record ID break ties. This is a work order, not a regulatory risk score.</p></details></div></section><aside class="overview-side"><h2>Case snapshot</h2><dl class="snapshot-list"><div class="snapshot-row"><dt>Closed findings</dt><dd>${t(`${closed} of ${dataset.findings.length}`)}</dd></div><div class="snapshot-row"><dt>Current evidence records</dt><dd>${current} / ${dataset.evidence.length}</dd></div><div class="snapshot-row"><dt>Source references</dt><dd>${dataset.sources.length}</dd></div><div class="snapshot-row"><dt>Review as of</dt><dd>${displayDate(referenceDate)}</dd></div></dl><section class="exercise-panel"><h3>Try a short exercise</h3><p>Compare an incomplete response with a closed example. Then edit the closed record to see why another review is required.</p><div class="exercise-links"><button type="button" class="text-button" data-finding-id="F-001">F-001 · Find the gaps →</button><button type="button" class="text-button" data-finding-id="F-003">F-003 · Inspect a closed example →</button></div></section><h3>Find the supporting record</h3><p>Search the evidence library and see which findings cite each record.</p><button type="button" class="button secondary" data-open-view="evidence">Browse evidence</button><p class="overview-note">Saved records drive these counts and action cues. Completeness does not prove that a response is correct or accepted.</p></aside></div></article>`;
    const exerciseOpen = dataset.findings.find(item => item.id === 'F-001');
    const exerciseClosed = dataset.findings.find(item => item.id === 'F-003');
    $('.exercise-panel').hidden = !exerciseOpen || !exerciseClosed || exerciseClosed.status !== 'closed' || workflowState(exerciseOpen).blockingCount === 0;
    // These exercise IDs exist only in the bundled case. Hide unavailable examples after imports.
    $$('.exercise-links [data-finding-id]').forEach(item => { item.hidden = !dataset.findings.some(record => record.id === item.dataset.findingId); });
    localize($('#view-content'));
  }

  function fieldTitle(name,label) {
    return `<div class="field-title"><label for="field-${name}">${escape(t(label))}</label><button type="button" class="text-button field-help" data-guidance="${name}" aria-label="${escape(t('Writing guide')+' · '+t(label))}">${t('Writing guide')}</button></div>`;
  }
  function inputField(name,label,value,type = 'text') {
    return `<div class="field">${fieldTitle(name,label)}<input name="${name}" id="field-${name}" type="${type}" value="${escape(value)}" ${name === 'owner'?'maxlength="120"':''}></div>`;
  }
  function textarea(name,label,value,hint = '',rows = 3) {
    return `<div class="field">${fieldTitle(name,label)}${hint?`<small id="hint-${name}">${t(hint)}</small>`:''}<textarea name="${name}" id="field-${name}" rows="${rows}" maxlength="10000" ${hint?`aria-describedby="hint-${name}"`:''}>${escape(value)}</textarea></div>`;
  }
  function showGuidance(name) {
    const guide = Guidance.forField(name,language);
    if (!guide) return;
    modal(`${t('Writing guide')} · ${guide.title}`,`<div class="guidance-copy"><p>${escape(guide.purpose)}</p><h3>${t('Questions to work through')}</h3><ul class="guidance-prompts">${guide.prompts.map(prompt => `<li>${escape(prompt)}</li>`).join('')}</ul><div class="guidance-avoid"><strong>${t('Keep the distinction clear')}</strong><p>${escape(guide.avoid)}</p></div><p class="references-note">${t('These prompts help structure your own reasoning. They do not generate or verify case facts.')}</p></div>`);
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
      body = '<p class="section-label">INTERNAL EVIDENCE REFERENCES</p><p class="references-note">Select records that support this finding. Availability is a demo status; a person must assess relevance and accuracy.</p><div class="link-list">' + dataset.evidence.map(record => project(record,'evidence')).map(item => `<div class="reference-item"><input type="checkbox" name="evidenceIds" id="evidence-${escape(item.id)}" value="${escape(item.id)}" ${finding.evidenceIds.includes(item.id)?'checked':''}><div><label data-record-text for="evidence-${escape(item.id)}">${escape(item.id)} · ${escape(item.title)}</label><p data-record-text>${escape(item.summary)}</p>${badge(item.status)} <small>Version ${escape(item.version || 'not available')}</small>${item.status !== 'missing'?`<button type="button" class="text-button" data-action="view-evidence" data-id="${escape(item.id)}">Read simulated record</button>`:''}</div></div>`).join('') + '</div><div class="form-divider"><p class="section-label">REGULATORY SOURCE REFERENCES</p><p class="references-note">The source register supports manual review. Selecting a source does not establish that it applies.</p><div class="link-list">' + dataset.sources.map(record => project(record,'sources')).map(item => `<div class="reference-item"><input type="checkbox" name="sourceIds" id="source-${escape(item.id)}" value="${escape(item.id)}" ${finding.sourceIds.includes(item.id)?'checked':''}><div><label data-record-text for="source-${escape(item.id)}">${escape(item.title)}</label><p data-record-text>${escape(item.scope)}</p><a href="${escape(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer">Open source reference</a><small>Source link checked ${displayDate(item.checkedOn)}</small></div></div>`).join('') + '</div></div>';
    } else {
      body = '<p class="references-note">Keep the draft concise and specific. This is an internal working note, not a submission to MHRA.</p>' + textarea('responseDraft','Working response draft',finding.responseDraft,'Explain the action and its timeline. Completed-action evidence is retained internally unless requested.',9);
      const seedReviewer = Demo.dataset.findings.find(item => item.id === finding.id)?.review.reviewer;
      const displayedReviewer = language === 'zh-CN' && review.reviewer === seedReviewer ? Zh.historyActors[review.reviewer] || review.reviewer : review.reviewer;
      body += `<div class="review-strip"><strong>${review.status === 'approved'?'Demo review recorded':'Awaiting demo review'}</strong>${review.status === 'approved'?` · <span data-record-text>${escape(displayedReviewer)}</span><br>${escape(review.reviewedAt)}`:'<br>Typed reviewer names are not authenticated signatures.'}</div><div class="form-divider"><p class="section-label">LOCAL CHANGE HISTORY</p><p class="references-note">Editable browser history for this demonstration; not a tamper-proof audit trail.</p><ol class="history-list" tabindex="-1">${finding.history.slice().reverse().map(record => I18n.history(record,Zh,language)).map(item => `<li data-record-text>${escape(item.action)}<span>${escape(item.actor)} · ${escape(item.timestamp)}</span></li>`).join('')}</ol></div>`;
    }
    $('#detail-panel').innerHTML = `<div id="filter-context" class="draft-note" hidden></div><div class="detail-top"><div class="detail-identity"><span class="finding-id" data-record-text>${escape(finding.id)} · ${escape(finding.area)}</span>${badge(finding.status)}</div><h2 data-record-text>${escape(finding.title)}</h2><p class="finding-description" data-record-text>${escape(finding.description)}</p></div>${workflowMarkup(storedFinding)}<div class="tab-bar" role="tablist" aria-label="Finding details">${tabs.map(item => `<button type="button" class="tab${tab === item.id?' active':''}" id="tab-${item.id}" role="tab" aria-selected="${tab === item.id}" aria-controls="detail-body" tabindex="${tab === item.id?'0':'-1'}" data-tab="${item.id}">${item.label}</button>`).join('')}</div><form id="finding-form"><div class="detail-body" id="detail-body" role="tabpanel" aria-labelledby="tab-${tab}">${body}</div><div class="plan-footer"><button type="submit" id="save-finding" class="button">Save changes</button><button type="button" class="text-button" id="discard-draft" data-action="discard-draft">Discard draft</button><span class="save-state" id="save-state">${t(dirty?'Unsaved changes':'Saved')}</span><div class="secondary-actions"><button type="button" class="button secondary" id="approve-finding" data-action="approve">Record review</button><button type="button" class="button secondary" id="close-finding" data-action="close" ${finding.status === 'closed'?'disabled':''}>Close finding</button></div></div><p class="draft-status" id="draft-status" role="status" aria-live="polite" hidden></p></form>`;
    $('#finding-form').addEventListener('submit', event => { event.preventDefault(); save(); });
    localize($('#detail-panel'));
    renderList();
    updateDraftStatus();
  }

  function clearFilters() {
    filters = {search:'',status:'all',severity:'all',focus:'all',sort:filters.sort};
    $('#search').value = ''; $('#status-filter').value = 'all'; $('#severity-filter').value = 'all';
    renderList(); renderMetrics();
  }
  function renderFindings() {
    const focuses = [['all','All findings'],['open','Open'],['overdue','Overdue'],['due_today','Due today'],['evidence_gap','Evidence gaps'],['review_ready','Ready for demo review']];
    $('#view-content').innerHTML = `<div class="register-toolbar"><div class="quick-filters" aria-label="Focus findings">${focuses.map(([id,label]) => `<button type="button" class="quick-filter${filters.focus === id?' active':''}" data-focus="${id}" aria-pressed="${filters.focus === id}">${t(label)}</button>`).join('')}<button type="button" class="text-button" id="clear-filters" data-clear-filters>${t('Clear filters')}</button></div><label class="sort-control" for="sort-filter"><span>Sort by</span><select id="sort-filter"><option value="priority">Work priority</option><option value="due_date">Due date</option><option value="id">Record ID</option></select></label></div><div class="workbench"><section class="finding-board" aria-label="Findings list"><div class="board-heading"><h2>Findings register</h2><span id="finding-count" class="count-label"></span></div><div class="filters"><label class="sr-only" for="search">Search findings</label><input id="search" type="search" placeholder="Search finding, area or owner" value="${escape(filters.search)}"><div class="filter-pair"><label class="sr-only" for="status-filter">Filter by status</label><select id="status-filter"><option value="all">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="closed">Closed</option><option value="overdue">Overdue</option></select><label class="sr-only" for="severity-filter">Filter by severity</label><select id="severity-filter"><option value="all">All severities</option><option value="major">Major</option><option value="other">Other</option></select></div></div><div id="finding-list" class="finding-list"></div></section><section id="detail-panel" class="detail-panel" aria-label="Selected finding"></section></div>`;
    $('#status-filter').value = filters.status;
    $('#severity-filter').value = filters.severity;
    $('#sort-filter').value = filters.sort;
    $('#search').addEventListener('input', event => { filters.search = event.target.value; renderList(); });
    $('#status-filter').addEventListener('change', event => { filters.status = event.target.value; renderList(); });
    $('#severity-filter').addEventListener('change', event => { filters.severity = event.target.value; renderList(); });
    $('#sort-filter').addEventListener('change', event => { filters.sort = event.target.value; renderList(); });
    localize($('#view-content'));
    renderDetail();
  }
  function renderEvidenceRows() {
    const records = dataset.evidence.filter(record => (evidenceFilters.status === 'all' || record.status === evidenceFilters.status) && (!evidenceFilters.search.trim() || searchText(record,'evidence').includes(evidenceFilters.search.trim().toLowerCase())));
    $('#evidence-count').textContent = t(`${records.length} of ${dataset.evidence.length}`);
    $('#evidence-rows').innerHTML = records.map(record => {
      const item = project(record,'evidence');
      const related = Workflow.relatedFindings(dataset,item.id);
      return `<tr><td>${escape(item.id)}</td><td><strong data-record-text>${escape(item.title)}</strong><small data-record-text>${escape(item.summary)}</small><div class="link-usage"><span>${t('Linked findings')}</span>${related.length ? related.map(finding => `<button type="button" class="text-button" data-finding-id="${escape(finding.id)}" data-next-code="no_evidence" data-evidence-id="${escape(item.id)}" title="${escape(project(finding,'findings').title)}">${escape(finding.id)}</button>`).join('') : `<span>${t('None')}</span>`}</div></td><td>${escape(item.version || '—')}</td><td>${badge(item.status)}</td><td>${item.status === 'missing'?`<span class="count-label">${t('Not available')}</span>`:`<button type="button" class="text-button" data-action="view-evidence" data-id="${escape(item.id)}">${t('Read record')}</button>`}</td></tr>`;
    }).join('') || `<tr><td colspan="5" class="empty-state">${t('No evidence matches these filters.')}</td></tr>`;
    $$('[data-evidence-status]').forEach(item => { item.classList.toggle('active',item.dataset.evidenceStatus === evidenceFilters.status); item.setAttribute('aria-pressed',String(item.dataset.evidenceStatus === evidenceFilters.status)); });
  }
  function renderEvidence() {
    $('#view-content').innerHTML = `<section class="library-panel"><div class="library-heading"><div><h2>Evidence library</h2><p>Fictional records and their version status. Missing records remain visible.</p></div><span id="evidence-count" class="count-label"></span></div><div class="evidence-toolbar"><div class="library-search"><label class="sr-only" for="evidence-search">Search evidence</label><input id="evidence-search" type="search" placeholder="Search record ID, title or summary" value="${escape(evidenceFilters.search)}"></div><div class="quick-filters" aria-label="Filter evidence">${['all','current','missing','superseded'].map(status => `<button type="button" class="quick-filter" data-evidence-status="${status}" aria-pressed="${evidenceFilters.status === status}">${t(status === 'all'?'All records':labels[status])}</button>`).join('')}</div></div><div class="table-scroll"><table class="evidence-table"><thead><tr><th scope="col">Record ID</th><th scope="col">Document / record</th><th scope="col">Version</th><th scope="col">Status</th><th scope="col">Record</th></tr></thead><tbody id="evidence-rows"></tbody></table></div><p class="library-footnote">A link shows that a finding cites this record. Relevance and factual accuracy require human review.</p></section>`;
    $('#evidence-search').addEventListener('input',event => { evidenceFilters.search = event.target.value; renderEvidenceRows(); });
    localize($('#view-content')); renderEvidenceRows();
  }

  function renderSources() {
    $('#view-content').innerHTML = `<section class="library-panel"><div class="library-heading"><div><h2>Source register</h2><p>Source references in this workspace. Review origin, applicability and later updates.</p></div></div><div class="source-index">${dataset.sources.map(record => project(record,'sources')).map(item => `<article class="source-card"><span class="finding-id">${escape(item.id)}</span><h3 data-record-text>${escape(item.title)}</h3><p data-record-text>${escape(item.scope)}</p><a href="${escape(safeUrl(item.url))}" target="_blank" rel="noopener noreferrer">Open source reference</a><br><small>Link checked ${displayDate(item.checkedOn)} · Applicability requires human review</small></article>`).join('')}</div><div class="attention-box"><h3>How these references are used</h3><p class="references-note">The project applies a small set of transparent completeness checks. It does not interpret all GMP/GDP requirements or verify whether a submitted statement is true.</p><a href="docs/source-notes.md">Read the source-to-feature notes</a></div></section>`;
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
    const headings = {overview:['Work overview','Review priorities, then work through one finding.'],findings:['Inspection findings','Connect each finding to an action, evidence and a reviewer.'],evidence:['Evidence library','Keep supporting records and their version status visible.'],sources:['Source register','Trace the references used in this workspace.'],case:['Case & method','Understand the workflow, assumptions and limits.']};
    $('#page-title').textContent = t(headings[view][0]);
    $('#page-subtitle').textContent = t(headings[view][1]);
    $$('.nav-item').forEach(item => { item.classList.toggle('active',item.dataset.view === view); if (item.dataset.view === view) item.setAttribute('aria-current','page'); else item.removeAttribute('aria-current'); });
    renderMetrics(); renderRecovery();
    if (view === 'overview') renderOverview();
    else if (view === 'findings') renderFindings();
    else if (view === 'evidence') renderEvidence();
    else if (view === 'sources') renderSources();
    else renderCase();
  }

  function save() {
    const form = $('#finding-form');
    if (!form || !form.reportValidity()) return;
    const focused = document.activeElement;
    const focusId = focused?.id;
    const selection = typeof focused?.selectionStart === 'number' ? [focused.selectionStart,focused.selectionEnd] : null;
    captureDraft();
    const patch = {...draft};
    try {
      const previous = currentFinding();
      if (dirty) writeRecoveryCopy();
      dataset = Core.saveFinding(dataset,selectedId,patch,'Demo editor',new Date().toISOString());
      dirty = false; draft = {};
      const savedInBrowser = persist();
      if (savedInBrowser) clearRecoveryCopy();
      renderMetrics(); renderDetail();
      const restored = focusId && document.getElementById(focusId);
      if (restored) { restored.focus({preventScroll:true}); if (selection && typeof restored.setSelectionRange === 'function') restored.setSelectionRange(...selection); }
      notify(!savedInBrowser?'Changes are saved in this tab only. Export JSON before closing.':previous.review.status === 'approved' && currentFinding().review.status !== 'approved' ? 'Changes saved. The previous review is invalidated; a new review is required.' : 'Finding saved in this browser.',!savedInBrowser);
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
    tab = nextTab;
    if (dirty) writeRecoveryCopy();
    renderDetail();
    const control = $(selector || `#tab-${tab}`);
    if (control) { control.focus(); control.scrollIntoView({block:'center'}); }
  }
  function resolveIssue(code) {
    $('#modal').close();
    if (code === 'close') { closeFinding(); return; }
    if (code === 'history') { goToTab('response','.history-list'); return; }
    if (/^(evidence_|no_evidence)/.test(code)) {
      const status = code.slice(9);
      const id = currentFinding().evidenceIds.find(value => dataset.evidence.find(item => item.id === value)?.status === status);
      goToTab('evidence',id ? `#evidence-${CSS.escape(id)}` : 'input[name="evidenceIds"]'); return;
    }
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
        filters = {search:'',status:'all',severity:'all',focus:'all',sort:'priority'}; persist(); render(); $('#modal').close();
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
        filters = {search:'',status:'all',severity:'all',focus:'all',sort:'priority'}; dirty = false; draft = {}; tab = 'plan'; view = 'findings';
        clearRecoveryCopy(true); persist(); render(); $('#modal').close(); notify('Workspace imported. Verify imported records before using them.');
      });
    } catch (error) { notify(error.message,true); }
    finally { $('#import-file').value = ''; }
  }

  function resetDialog() {
    modal('Reset the simulated case?','<div class="modal-copy"><p>This replaces this browser’s workspace with the original fictional data and clears your edits. Export JSON first to keep a backup.</p></div><div class="modal-actions"><button class="button danger" id="confirm-reset">Reset simulated case</button><button class="button secondary" id="cancel-reset">Cancel</button></div>');
    $('#cancel-reset').addEventListener('click',() => $('#modal').close());
    $('#confirm-reset').addEventListener('click',() => {
      dataset = Demo.createDataset(); referenceDate = dataset.referenceDate; selectedId = dataset.findings[0].id;
      dirty = false; draft = {}; tab = 'plan'; view = 'overview'; evidenceFilters = {search:'',status:'all'}; filters = {search:'',status:'all',severity:'all',focus:'all',sort:'priority'};
      clearRecoveryCopy(true); persist(); render(); $('#modal').close(); notify('Original simulated case restored.');
    });
  }

  $('#language-switch').addEventListener('change',event => {
    if (dirty) { captureDraft(); writeRecoveryCopy(); }
    language = event.target.value === 'en' ? 'en' : 'zh-CN';
    $('#toast').hidden = true;
    render();
    try { localStorage.setItem(LANGUAGE_KEY,language); } catch { notify('Language preference could not be saved. It applies for this session.',true); }
  });

  $('#navigation').addEventListener('click',event => {
    const button = event.target.closest('[data-view]');
    if (button?.dataset.view === view) return;
    if (!button || button.dataset.view === 'findings' && !requireRecoveryDecision() || !canNavigate()) return;
    view = button.dataset.view; render();
  });
  function openFinding(id,code,evidenceId) {
    if (!requireRecoveryDecision() || !dataset.findings.some(item => item.id === id)) return;
    if (view === 'findings' && id === selectedId) {
      if (evidenceId) goToTab('evidence',`#evidence-${CSS.escape(evidenceId)}`);
      else if (code) resolveIssue(code);
      else goToTab('plan');
      return;
    }
    if (!canNavigate()) return;
    selectedId = id; tab = 'plan';
    if (view !== 'findings') { filters = {search:'',status:'all',severity:'all',focus:'all',sort:'priority'}; view = 'findings'; render(); }
    else { renderDetail(); }
    if (evidenceId) goToTab('evidence',`#evidence-${CSS.escape(evidenceId)}`);
    else if (code) resolveIssue(code);
    else { $('#tab-plan').focus({preventScroll:true}); if (matchMedia('(max-width:800px)').matches) $('#detail-panel').scrollIntoView({block:'start'}); }
  }
  $('#metrics').addEventListener('click',event => {
    const button = event.target.closest('[data-metric-focus]');
    if (!button || !requireRecoveryDecision()) return;
    if (view !== 'findings' && !canNavigate()) return;
    filters = {search:'',status:'all',severity:'all',focus:button.dataset.metricFocus,sort:'priority'};
    if (!dirty) selectedId = filteredFindings()[0]?.id || selectedId;
    if (dirty) captureDraft();
    view = 'findings'; render();
    $('#finding-list').scrollIntoView({block:'nearest'});
  });
  $('#view-content').addEventListener('click',event => {
    const help = event.target.closest('[data-guidance]');
    if (help) { showGuidance(help.dataset.guidance); return; }
    const openView = event.target.closest('[data-open-view]');
    if (openView) { if ((openView.dataset.openView !== 'findings' || requireRecoveryDecision()) && canNavigate()) { view = openView.dataset.openView; render(); } return; }
    const focus = event.target.closest('[data-focus]');
    if (focus) { filters.focus = focus.dataset.focus; renderList(); renderMetrics(); return; }
    if (event.target.closest('[data-clear-filters]')) { clearFilters(); return; }
    const evidenceStatus = event.target.closest('[data-evidence-status]');
    if (evidenceStatus) { evidenceFilters.status = evidenceStatus.dataset.evidenceStatus; renderEvidenceRows(); return; }
    const finding = event.target.closest('[data-finding-id]');
    if (finding) { openFinding(finding.dataset.findingId,finding.dataset.nextCode,finding.dataset.evidenceId); return; }


    const tabButton = event.target.closest('[data-tab]');
    if (tabButton) { goToTab(tabButton.dataset.tab); return; }
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'discard-draft') discardDraft();
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
    scheduleRecoveryCopy();
  }

  $('#view-content').addEventListener('input',markDirty);
  $('#view-content').addEventListener('change',markDirty);
  $('#reference-date').addEventListener('change',event => {
    if (!isDate(event.target.value)) { notify('Choose a valid review date.',true); event.target.value = referenceDate; return; }
    referenceDate = event.target.value; persist(); renderMetrics();
    if (view === 'findings') { renderList(); if (!dirty) renderDetail(); }
    else if (view === 'overview') renderOverview();
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
  document.addEventListener('keydown',event => {
    if ($('#modal').open) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && view === 'findings') { event.preventDefault(); save(); return; }
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest('input, textarea, select, [contenteditable]')) {
      const search = view === 'findings' ? $('#search') : view === 'evidence' ? $('#evidence-search') : null;
      if (search) { event.preventDefault(); search.focus(); }
    }
  });
  $('#draft-recovery').addEventListener('click',event => {
    if (event.target.closest('#restore-draft')) restoreDraft();
    if (event.target.closest('#discard-recovery')) discardDraft();
  });
  window.addEventListener('beforeunload',event => { if (dirty) { captureDraft(); writeRecoveryCopy(); event.preventDefault(); event.returnValue = ''; } });
  window.addEventListener('pagehide',() => { if (dirty) { captureDraft(); writeRecoveryCopy(); } });
  window.InspectionWorkbench = Object.freeze({getState:() => Core.clone({dataset,referenceDate,selectedId,view,tab,dirty,language,filters,evidenceFilters,recoveryAvailable:!!recoveryDraft,draftStored,draftStorageError})});
  restore(); loadRecoveryCopy(); render();
})();

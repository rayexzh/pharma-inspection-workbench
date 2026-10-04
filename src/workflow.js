/* Display-only ordering and action cues. No DOM, persistence or regulatory-risk scoring. */
(function (root, factory) {
  'use strict';
  var commonJS = typeof module === 'object' && module.exports;
  var api = factory(commonJS ? require('./core.js') : root.InspectionCore);
  if (commonJS) module.exports = api;
  else root.InspectionWorkflow = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (defaultCore) {
  'use strict';

  var PRIORITIES = ['overdue', 'due_today', 'evidence_gap', 'review_ready', 'in_progress', 'closed'];
  var FOCUSES = ['all', 'open', 'overdue', 'due_today', 'evidence_gap', 'reference_gap', 'review_ready'];
  var LABELS = {
    overdue: 'Overdue', due_today: 'Due today', evidence_gap: 'Reference gap',
    review_ready: 'Ready for demo review', in_progress: 'In progress', closed: 'Closed'
  };
  function getCore(Core) {
    var api = Core || defaultCore;
    if (!api || typeof api.evaluateFinding !== 'function') throw new Error('InspectionCore.evaluateFinding is required.');
    return api;
  }
  function planIssue(issue) {
    return issue.code === 'invalid_due_date' || (issue.code.indexOf('missing_') === 0 && issue.code !== 'missing_review' && issue.code !== 'missing_effectivenessResult');
  }
  function referenceIssue(issue) {
    return /^(evidence_|source_|no_evidence$|no_source$)/.test(issue.code);
  }
  function classifyFinding(finding, dataset, referenceDate, Core) {
    var day = referenceDate || dataset.referenceDate;
    // All completeness, date and reference facts come from the canonical core evaluation.
    var check = getCore(Core).evaluateFinding(finding, dataset, day);
    var isOpen = finding.status !== 'closed';
    var dueToday = isOpen && finding.dueDate === day;
    var referenceGap = check.evidenceGaps > 0 || check.sourceGaps > 0;
    var reviewReady = isOpen && check.canApprove && finding.review.status !== 'approved';
    // Ordering is a transparent work-list convention: closed last; then overdue, due today,
    // missing references, readiness for a demo review and other open work. Severity is not used.
    var priority = !isOpen ? 'closed' : check.overdue ? 'overdue' : dueToday ? 'due_today' : referenceGap ? 'evidence_gap' : reviewReady ? 'review_ready' : 'in_progress';
    // An overdue flag is separate from the next completeness action. Resolve required fields,
    // then references, then named review, then the completed effectiveness result, then closure.
    // A response may be reviewed before a future effectiveness result; editing that result later
    // resets approval in the core and prompts another review. These display cues never change gates.
    var issue = check.issues.find(planIssue) || check.issues.find(referenceIssue) || check.issues.find(function (entry) { return entry.code === 'missing_review'; }) || check.issues.find(function (entry) { return entry.code === 'missing_effectivenessResult'; });
    var nextCode, stage, summaryKey;
    if (!isOpen) {
      nextCode = 'history'; stage = 'history';
      summaryKey = 'Review the closed record';
    } else if (issue && planIssue(issue)) {
      nextCode = issue.code; stage = issue.code === 'missing_responseDraft' ? 'response' : 'plan';
      summaryKey = stage === 'response' ? 'Complete the response draft' : 'Complete the action plan';
    } else if (issue && referenceIssue(issue)) {
      nextCode = issue.code; stage = 'evidence';
      summaryKey = 'Resolve reference gaps';
    } else if (issue && issue.code === 'missing_effectivenessResult') {
      nextCode = issue.code; stage = 'plan';
      summaryKey = 'Record the effectiveness result';
    } else if (issue && issue.code === 'missing_review') {
      nextCode = issue.code; stage = 'response';
      summaryKey = 'Review the response';
    } else {
      nextCode = 'close'; stage = 'close';
      summaryKey = 'Close the finding';
    }
    return {
      priority: priority, labelKey: LABELS[priority], summaryKey: summaryKey,
      nextCode: nextCode, stage: stage, isOpen: isOpen, actionable: isOpen,
      canApprove: check.canApprove, canClose: check.canClose,
      // Count closure-completeness observations, excluding the informational overdue flag.
      blockingCount: check.issues.filter(function (entry) { return entry.code !== 'overdue'; }).length,
      issuescount: check.issues.length, issuesCount: check.issues.length,
      dueToday: dueToday, evidenceGaps: check.evidenceGaps, sourceGaps: check.sourceGaps
    };
  }
  function compareText(left, right) { return left < right ? -1 : left > right ? 1 : 0; }
  function compareDates(left, right) {
    if (!left && !right) return 0;
    if (!left) return 1;
    if (!right) return -1;
    return compareText(left, right);
  }
  function sortFindings(findings, dataset, referenceDate, Core, sort) {
    var mode = sort || 'priority';
    if (['priority', 'due_date', 'id'].indexOf(mode) < 0) throw new Error('Unknown finding sort: ' + mode);
    if (!Array.isArray(findings)) throw new Error('Findings must be an array.');
    // Return a new array of the same records; never change their text, dates, approvals or order in storage.
    var rows = findings.map(function (finding, index) {
      return { finding: finding, index: index, state: classifyFinding(finding, dataset, referenceDate, Core) };
    });
    rows.sort(function (left, right) {
      var rank = mode === 'priority' ? PRIORITIES.indexOf(left.state.priority) - PRIORITIES.indexOf(right.state.priority) : 0;
      var date = mode === 'id' ? 0 : compareDates(left.finding.dueDate, right.finding.dueDate);
      return rank || date || compareText(left.finding.id, right.finding.id) || left.index - right.index;
    });
    return rows.map(function (row) { return row.finding; });
  }
  function matchesFocus(finding, dataset, referenceDate, Core, focus) {
    var mode = focus || 'all';
    if (FOCUSES.indexOf(mode) < 0) throw new Error('Unknown finding focus: ' + mode);
    var state = classifyFinding(finding, dataset, referenceDate, Core);
    if (mode === 'all') return true;
    if (mode === 'open') return state.isOpen;
    if (mode === 'overdue') return state.isOpen && state.priority === 'overdue';
    if (mode === 'due_today') return state.dueToday;
    if (mode === 'evidence_gap') return state.isOpen && state.evidenceGaps > 0;
    if (mode === 'reference_gap') return state.isOpen && (state.evidenceGaps > 0 || state.sourceGaps > 0);
    // Focuses overlap: an overdue finding may also be ready for review.
    return state.isOpen && state.canApprove && finding.review.status !== 'approved';
  }
  function relatedFindings(dataset, evidenceId) {
    if (!dataset || !Array.isArray(dataset.findings)) throw new Error('Dataset findings are required.');
    // Relationships come only from selected IDs, not from document relevance or textual similarity.
    return dataset.findings.filter(function (finding) {
      return Array.isArray(finding.evidenceIds) && finding.evidenceIds.indexOf(evidenceId) >= 0;
    });
  }
  return { classifyFinding: classifyFinding, sortFindings: sortFindings, matchesFocus: matchesFocus, relatedFindings: relatedFindings };
});

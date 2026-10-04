/* UI translations are display-only. Stored case records remain in their original language. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.InspectionI18n = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const zh = {
    'Pharma Inspection Workbench':'药企检查整改工作台',
    'Skip to workbench':'跳转到工作台', 'Workbench navigation':'工作台导航',
    'QUALITY WORKBENCH':'质量合规工作台', 'WORKSPACE':'工作区', 'CURRENT CASE':'当前案例',
    'Inspection findings':'检查发现与整改', 'Evidence library':'证据资料库',
    'Source register':'法规来源登记', 'Case & method':'案例与使用方法',
    'FICTIONAL TRAINING CASE':'虚构培训案例', 'Open-source portfolio project':'开源求职作品',
    'Project documentation':'项目说明', 'QUALITY SYSTEMS / INTERNAL REVIEW':'质量体系 / 内部复核',
    'Local demo':'本地演示', 'Demo guide':'演示指南',
    'PHARMA INSPECTION WORKBENCH':'药企检查整改工作台',
    'Connect each finding to an action, evidence and a reviewer.':'把每条检查发现连接到整改措施、支持证据和复核人员。',
    'Keep supporting records and their version status visible.':'查看支持记录及其版本状态，找到缺失和过期资料。',
    'Trace the official references used in this learning case.':'追溯本学习案例引用的官方资料。',
    'Understand the workflow, assumptions and limits.':'了解工作流程、案例假设和原型的能力范围。',
    'Export workspace':'导出工作区', 'Import JSON':'导入 JSON',
    'Simulated case.':'模拟案例。',
    'All companies, people and records are fictional. Checks show workflow gaps; a qualified person must assess compliance.':'所有企业、人员和记录均为虚构。系统提示流程缺口，合规判断仍需由具备资质的人员作出。',
    'Review as of':'检查截止日期', 'Case summary':'案例概览', 'Workbench':'工作台',
    'Internal evidence is retained for review. Provide completed-action evidence to an inspector when requested.':'证据留存供内部复核；检查人员要求提供时，再提交已完成整改的证据。',
    'Reset simulated case':'重置模拟案例', 'Close':'关闭', 'Close dialog':'关闭对话框',
    'Saved in this browser':'已保存在本浏览器', 'Session only':'仅本次会话',
    'Saved data could not be loaded. The simulated case is displayed.':'无法加载保存的数据，当前显示原始模拟案例。',
    'Browser storage is unavailable or full. Export JSON to retain this session.':'浏览器存储不可用或已满。请导出 JSON 保存本次内容。',
    'Language preference could not be saved. It applies for this session.':'无法保存语言偏好，当前语言仅在本次会话生效。',
    'Discard unsaved changes to this finding?':'放弃这条发现中尚未保存的修改吗？',
    'Save your changes before reviewing, closing or exporting.':'请先保存修改，再进行复核、关闭或导出。',
    'Open findings':'未关闭的发现', 'Overdue actions':'逾期整改', 'Awaiting review':'待复核',
    'Evidence gaps':'证据缺口', 'as of review date':'以检查截止日期为准',
    'internal demo review':'内部模拟复核', 'missing or superseded':'缺失或版本过期',
    'Open':'未开始', 'In progress':'进行中', 'Closed':'已关闭', 'Major':'主要', 'Other':'其他',
    'Current':'现行', 'Missing':'缺失', 'Superseded':'已被替代', 'Overdue':'逾期', 'Not set':'未设置',
    'No findings match these filters.':'没有符合筛选条件的发现。', 'Change your search or filter.':'请调整搜索词或筛选条件。',
    'Workflow checks complete':'流程完整性检查已通过',
    'All demo fields and references are present. This is not a regulatory compliance decision.':'演示所需字段和引用已齐备。这不代表监管合规结论。',
    'View all checks':'查看全部检查项', 'Action plan':'整改计划', 'Evidence & sources':'证据与法规来源',
    'Response & history':'回复草稿与变更记录', 'Action owner':'整改负责人', 'Committed due date':'承诺完成日期',
    'This finding is closed in the simulated workflow. A material edit will invalidate its review and reopen it.':'此项已在模拟流程中关闭。实质性修改会使原复核失效，并重新打开此项。',
    'Action status':'整改状态', 'Root cause investigation':'根本原因调查',
    'State the evidence-led cause or the investigation still needed.':'写明证据支持的原因，或尚需开展的调查。',
    'Impact and scope assessment':'影响与范围评估', 'Consider related records, batches, processes and sites.':'考虑相关记录、批次、流程和场地的影响。',
    'Immediate / interim action':'即时或临时措施', 'CORRECTIVE & PREVENTIVE ACTION':'纠正与预防措施（CAPA）',
    'Corrective and preventive action':'纠正与预防措施', 'How effectiveness will be checked':'如何确认整改有效',
    'Effectiveness result':'有效性检查结果',
    'A result is required to close the demo workflow. Planned work is not a result.':'关闭模拟流程前必须填写已完成的检查结果。计划开展的工作不能作为结果。',
    'INTERNAL EVIDENCE REFERENCES':'内部证据引用',
    'Select records that support this finding. Availability is a demo status; a person must assess relevance and accuracy.':'选择支持此项发现的记录。可用性仅为演示状态，相关性和准确性需由人判断。',
    'not available':'不可用', 'Read simulated record':'阅读模拟记录',
    'REGULATORY SOURCE REFERENCES':'监管资料引用',
    'The source register supports manual review. Selecting a source does not establish that it applies.':'来源登记用于辅助人工复核。选中一份资料并不证明其适用于本案。',
    'Read official source':'查看官方原文',
    'Keep the draft concise and specific. This is an internal working note, not a submission to MHRA.':'草稿应简洁、具体。这是内部工作笔记，并非提交给 MHRA 的文件。',
    'Working response draft':'内部回复草稿',
    'Explain the action and its timeline. Completed-action evidence is retained internally unless requested.':'说明整改措施及完成时间；除非被要求提供，已完成整改的证据留存在内部。',
    'Demo review recorded':'已记录模拟复核', 'Awaiting demo review':'待模拟复核',
    'Typed reviewer names are not authenticated signatures.':'手动填写的复核姓名未经身份认证，也不是电子签名。',
    'LOCAL CHANGE HISTORY':'本地变更记录',
    'Editable browser history for this demonstration; not a tamper-proof audit trail.':'本演示的浏览器记录可被修改，不具备防篡改审计能力。',
    'Finding details':'检查发现详情', 'Save changes':'保存修改', 'Saved':'已保存', 'Unsaved changes':'有未保存的修改',
    'Record review':'记录复核', 'Close finding':'关闭此项', 'Findings list':'检查发现列表',
    'Findings register':'检查发现登记', 'Search findings':'搜索检查发现',
    'Search finding, area or owner':'搜索发现、领域或负责人', 'Filter by status':'按状态筛选',
    'All statuses':'全部状态', 'Filter by severity':'按严重程度筛选', 'All severities':'全部分类', 'Selected finding':'选中的检查发现',
    'Fictional records and their version status. Missing records remain visible.':'查看虚构记录及其版本状态；缺失记录会保留在清单中。',
    'Record ID':'记录编号', 'Document / record':'文件或记录', 'Version':'版本', 'Status':'状态',
    'Record':'记录', 'Not available':'不可用', 'Read record':'查看记录',
    'Official references selected for this case. Review applicability and later updates.':'本案引用的官方资料。请人工核对适用性及后续更新。',
    'Open official guidance':'打开官方指南', 'How these references are used':'这些来源如何使用',
    'The project applies a small set of transparent completeness checks. It does not interpret all GMP/GDP requirements or verify whether a submitted statement is true.':'本项目提供有限、透明的完整性检查，不解释全部 GMP/GDP 要求，也不核验陈述是否真实。',
    'Read the source-to-feature notes':'查看来源与功能的对应说明',
    'LEARNING CASE / QUALITY ASSURANCE':'学习案例 / 质量保证', 'Case ID':'案例编号', 'Fictional site':'虚构场地',
    'Simulated inspection':'模拟检查日期', 'Work through one finding':'如何处理一条检查发现',
    'Read the finding and identify what is known and what still needs investigation.':'阅读检查发现，区分已知事实与尚需调查的内容。',
    'Set an owner and due date. Describe impact, interim action, corrective action and the effectiveness check.':'设置负责人和完成日期，说明影响、临时措施、纠正措施和有效性检查。',
    'Connect current supporting records and appropriate official references.':'关联现行支持记录和适用的官方资料。',
    'Save, then record a named demo review. A later material edit invalidates that review.':'保存后记录具名的模拟复核；后续实质性修改会使该复核失效。',
    'Record an effectiveness result before closing the simulated workflow.':'填写已完成的有效性检查结果，再关闭模拟流程。',
    'What the checks mean':'这些检查意味着什么',
    'Checks look for missing fields, unavailable or superseded evidence, missing source references and pending review. A completed checklist is not a judgement that a medicine, facility or response complies with regulations.':'系统提示缺失字段、不可用或过期证据、未关联的来源以及待复核项。清单完成不代表药品、设施或回复已符合监管要求。',
    'Where the data lives':'数据保存在哪里',
    'Changes stay in this browser when local storage is available. Export JSON for backup or to move between browsers. CSV and Markdown exports are internal working reports. No data is sent to a server by this app.':'本地存储可用时，修改保存在本浏览器。可导出 JSON 备份或迁移到其他浏览器。CSV 和 Markdown 用于内部工作报告。本应用不会把数据发送到服务器。',
    'Limits of this prototype':'原型的能力范围',
    'There is no authenticated reviewer, electronic signature, tamper-proof history, multi-user access or validated document management. Use fictional or public information only. Source selection and factual verification need qualified human judgement.':'本原型没有复核身份认证、电子签名、防篡改记录、多人协作或经过验证的文件管理。仅使用虚构或公开资料。来源选择和事实核验需要具备资质的人员判断。',
    'Portfolio documentation':'作品说明文档', 'English case study':'英文案例说明', 'Interview demonstration':'面试演示说明', 'MIT licence':'MIT 开源许可',
    'Changes saved. The previous review is invalidated; a new review is required.':'已保存。原复核已失效，需要重新复核。',
    'Finding saved in this browser.':'此项已保存在本浏览器。', 'Workflow checks':'流程完整性检查',
    'These are completeness checks for the simulated workflow.':'以下为模拟流程的完整性检查项。',
    'Record an internal demo review':'记录内部模拟复核',
    'Check the case facts, action plan and selected references before recording a review. A typed name is a demonstration only, not an authenticated approval or electronic signature.':'记录复核前，请核对案例事实、整改计划和引用资料。填写姓名仅用于演示，不代表经过认证的审批或电子签名。',
    'Reviewer name':'复核人员姓名', 'e.g. Demo Reviewer':'例如：演示复核员', 'Record demo review':'记录模拟复核',
    'Demo review recorded. Future material edits will require a new review.':'已记录模拟复核。后续实质性修改需要重新复核。',
    'Close this simulated finding?':'关闭这条模拟发现吗？',
    'The demo action plan, current references, named review and effectiveness result are present. Closing this record does not certify regulatory compliance.':'模拟整改计划、现行引用、具名复核和有效性结果已齐备。关闭记录不代表监管合规认证。',
    'Close simulated finding':'关闭模拟发现', 'Keep open':'保持打开', 'Finding closed in the simulated workflow.':'此项已在模拟流程中关闭。',
    'Exports are local working files. They contain fictional case data and your saved edits.':'导出的是本地工作文件，包含虚构案例和已保存的修改。',
    'Workspace backup':'工作区备份', 'Import this file to restore the case and change history.':'导入此文件可恢复案例和变更记录。',
    'Open a summary of actions and checks in a spreadsheet.':'在电子表格中查看整改与检查概览。', 'Internal review report':'内部复核报告',
    'Readable case report with evidence and source references.':'包含证据和来源引用的可读案例报告。',
    'JSON preserves exact stored text. CSV and Markdown keep the original record text with English report labels. Display translations are not exported.':'JSON 保留原始存储文本。CSV 和 Markdown 保留记录原文，报告标签使用英文。界面的显示译文不写入导出文件。',
    'JSON files must be smaller than 1 MB.':'JSON 文件大小不能超过 1 MB。', 'Import this workspace?':'导入这个工作区吗？',
    'Structure was checked. Imported facts, review names and history are not authenticated.':'已检查数据结构。导入的事实、复核姓名和历史记录未经认证。',
    'Replace workspace':'替换工作区', 'Cancel':'取消', 'Workspace imported. Verify imported records before using them.':'工作区已导入，使用前请核验导入记录。',
    'Reset the simulated case?':'重置模拟案例吗？',
    'This replaces this browser’s workspace with the original fictional data and clears your edits. Export JSON first to keep a backup.':'这会用原始虚构数据替换当前浏览器工作区，并清除修改。如需备份，请先导出 JSON。',
    'Original simulated case restored.':'已恢复原始模拟案例。', 'No content supplied.':'未提供内容。',
    'Choose a valid review date.':'请选择有效的检查截止日期。', 'Local export downloaded.':'本地导出文件已下载。',
    'A short demonstration':'简短演示指南',
    'Open F-001 and inspect its overdue commitment and missing or superseded records. Try closing it to see the workflow block.':'打开 F-001，查看逾期承诺以及缺失、过期记录。尝试关闭此项，观察流程为何阻止关闭。',
    'Open F-003. Read its completed action, effectiveness result and linked simulated evidence.':'打开 F-003，查看已完成整改、有效性结果及关联的模拟证据。',
    'Revise a relevant explanation in F-003 and save. Its prior review is invalidated and the record reopens.':'修改 F-003 的相关说明并保存。原复核会失效，此项会重新打开。',
    'Check the revised case, record a named demo review and close it again.':'核对修改后的案例，记录具名模拟复核，再次关闭。',
    'Export an internal report or JSON backup. Reset the case to practise again.':'导出内部报告或 JSON 备份；也可以重置案例，再练习一次。',
    'Use relevant records. Replacing a missing reference with an unrelated current document does not resolve a finding. This prototype checks completeness, so relevance and factual accuracy still require human judgement.':'请关联相关记录。用一份无关的现行文件替换缺失引用，并不能解决检查发现。本原型检查完整性，相关性与事实准确性仍需人工判断。',
    'Next step':'下一步', 'Saved workflow':'已保存记录的流程', '1 · Action plan':'1 · 整改计划',
    '2 · Evidence & sources':'2 · 证据与来源', '3 · Named review':'3 · 具名复核', '4 · Closure':'4 · 关闭',
    'Complete the missing action-plan fields, then save.':'补齐整改计划中的缺失字段，然后保存。',
    'Open Evidence & sources and resolve missing or superseded references.':'打开“证据与法规来源”，处理缺失或过期引用。',
    'Check the facts and record a named demo review.':'核对事实，记录具名的模拟复核。',
    'Record the completed effectiveness check and outcome, then save and review again.':'填写已完成的有效性检查及结果，保存并重新复核。',
    'The saved record can be closed in this demo workflow.':'已保存的记录可以在此模拟流程中关闭。',
    'Closed in the demo. A material edit requires another review.':'此项已在演示中关闭。实质性修改需要重新复核。',
    'This workflow uses saved records; save your draft to update the checks.':'流程状态依据已保存记录；请保存草稿以更新检查结果。',
    'This workbench helps prepare and review a response to an inspection finding.':'本工作台用于准备和复核检查发现的整改回复。',
    'Read the issue → plan an action → link evidence → review → close.':'阅读问题 → 制定整改 → 关联证据 → 复核 → 关闭。',
    'Demo reviews and closure depend on completeness, not verified regulatory acceptance.':'模拟复核与关闭依据内容完整性，不代表已经获得监管认可。',
    'Cannot approve: complete the required fields, current evidence and source mapping first.':'无法记录复核：请先补齐必要字段、现行证据及来源关联。',
    'Cannot close: current evidence, complete response fields, an effectiveness result and approved technical review are required.':'无法关闭：需要现行证据、完整回复字段、有效性结果和已通过的技术复核。',
    'A non-empty actor / reviewer name is required.':'操作人或复核人员姓名不能为空。',
    'Timestamp must not be earlier than the existing history or review.':'操作时间不能早于现有变更记录或复核时间。',
    'Finding is already closed.':'此项已经关闭。',
    'Go to next step':'前往下一步', 'Go to field':'去处理',
    'New training finding':'新建练习发现', 'Create finding':'创建发现',
    'Use a fictional issue to practise. New findings start without evidence, investigation or review.':'请使用虚构问题进行练习。新建发现不会自动拥有证据、调查结论或复核记录。',
    'Finding title':'发现标题', 'Quality area':'质量领域', 'What was observed':'观察到的问题', 'Classification':'分类（练习设定）',
    'Describe the observation without inventing a root cause or a completed action.':'描述观察到的事实，不要把未查明的原因或未完成的措施写成结论。',
    'Optional initial owner':'初始负责人（可选）', 'Optional committed date':'承诺日期（可选）',
    'Finding created. Investigate it and link relevant supporting records before review.':'发现已创建。复核前请完成调查，并关联相关支持记录。',
    'Created a fictional training finding; investigation and supporting records remain pending.':'创建虚构练习发现；调查和支持记录仍待完成。',
    'New finding could not be created. Check the required text, classification and date.':'无法创建发现，请核对必填文本、分类及日期。',
    'Draft retained across tabs. Save once to apply the complete record.':'页签切换会保留草稿；保存一次即可更新整条记录。',
    'Action required before review':'复核前需补齐', 'Review and closure follow-up':'复核与关闭跟进',
    'No blocking gaps in the saved record.':'已保存记录没有阻止复核的完整性缺口。',
    "Trace the references used in this workspace.":"追溯此工作区使用的来源资料。",
    "Source references":"来源引用",
    "Open source reference":"打开来源资料",
    "Source references in this workspace. Review origin, applicability and later updates.":"此工作区引用的来源资料。请人工核对出处、适用性和后续更新。",
    "Work overview":"工作概览",
    "QUALITY WORKSPACE":"质量工作区",
    "Review priorities, then work through one finding.":"先查看优先事项，再逐条处理检查发现。",
    "Fictional records. For learning, not a compliance decision.":"虚构记录，用于学习；不构成合规判断。",
    "Ready for demo review":"可进行模拟复核",
    "saved plan and references present":"已保存计划与引用齐备",
    "Findings with evidence gaps":"有证据缺口的发现",
    "open findings, not document count":"统计未关闭发现，而非文件数",
    "Due today":"当天到期",
    "Reference gap":"引用资料有缺口",
    "Complete the action plan":"补齐整改计划",
    "Complete the response draft":"补齐回复草稿",
    "Resolve reference gaps":"处理引用资料缺口",
    "Review the response":"复核整改回复",
    "Record the effectiveness result":"记录有效性结果",
    "Close the finding":"关闭这条发现",
    "Review the closed record":"查看已关闭记录",
    "Unassigned":"未分配负责人",
    "Due":"到期",
    "The selected finding is outside these filters. Your editor stays open.":"当前发现不在筛选结果中，编辑区仍保留。",
    "Clear filters":"清除筛选",
    "All findings":"全部发现",
    "Focus findings":"筛选工作重点",
    "Sort by":"排序",
    "Work priority":"工作优先次序",
    "Due date":"到期日期",
    "INSPECTION RESPONSE":"检查整改回复",
    "What needs attention":"当前需要处理什么",
    "Prepare a response to an inspection finding: plan an action, link supporting records, review and close.":"为检查发现准备整改回复：制定计划、关联支持记录、复核并关闭。",
    "How it works":"使用方法",
    "Work queue":"待处理事项",
    "No open findings in this workspace.":"此工作区没有未关闭的发现。",
    "Open full register →":"查看全部发现 →",
    "How this queue is ordered":"这些事项如何排序",
    "Overdue → due today → reference gaps → ready for demo review → other open work. Due date and record ID break ties. This is a work order, not a regulatory risk score.":"逾期 → 当天到期 → 引用缺口 → 可模拟复核 → 其他未关闭事项。同组按到期日期和编号排序。这是工作次序，不是监管风险评分。",
    "Case snapshot":"案例概况",
    "Closed findings":"已关闭发现",
    "Current evidence records":"现行证据记录",
    "Official sources":"官方资料",
    "Try a short exercise":"尝试一个小练习",
    "Compare an incomplete response with a closed example. Then edit the closed record to see why another review is required.":"比较尚未齐备的回复与已关闭案例；再修改已关闭记录，观察为什么需要重新复核。",
    "F-001 · Find the gaps →":"F-001 · 查看缺口 →",
    "F-003 · Inspect a closed example →":"F-003 · 查看关闭案例 →",
    "Find the supporting record":"查找支持记录",
    "Search the evidence library and see which findings cite each record.":"搜索证据库，查看每份记录被哪些发现引用。",
    "Browse evidence":"查看证据库",
    "Saved records drive these counts and action cues. Completeness does not prove that a response is correct or accepted.":"统计和操作提示依据已保存记录。内容齐备不代表回复正确或已被接受。",
    "Linked findings":"关联发现",
    "None":"暂无",
    "Search evidence":"搜索证据",
    "Search record ID, title or summary":"搜索记录编号、标题或摘要",
    "No evidence matches these filters.":"没有符合筛选条件的证据。",
    "Filter evidence":"筛选证据",
    "All records":"全部记录",
    "A link shows that a finding cites this record. Relevance and factual accuracy require human review.":"关联表示这条发现引用了该记录；相关性和事实准确性需人工复核。"
  };
  function text(value, language) {
    const source = String(value ?? '');
    if (language !== 'zh-CN') return source;
    const trimmed = source.trim();
    let translated = zh[trimmed];
    let match;
    if (!translated && (match = trimmed.match(/^of (\d+) total$/))) translated = `共 ${match[1]} 条`;
    if (!translated && (match = trimmed.match(/^(\d+) of (\d+)$/))) translated = `${match[1]} / ${match[2]} 条`;
    if (!translated && (match = trimmed.match(/^(\d+) items? to review$/))) translated = `${match[1]} 项需要处理`;
    if (!translated && (match = trimmed.match(/^(\d+) more item\(s\)\.$/))) translated = `还有 ${match[1]} 项。`;
    if (!translated && (match = trimmed.match(/^(\d+) records$/))) translated = `${match[1]} 份记录`;
    if (!translated && (match = trimmed.match(/^(\d+) open findings$/))) translated = `${match[1]} 条待处理`;
    if (!translated && (match = trimmed.match(/^expected (.+)$/))) translated = `预计 ${match[1]}`;
    if (!translated && (match = trimmed.match(/^Version (.+)$/))) translated = `版本 ${text(match[1],language)}`;
    if (!translated && (match = trimmed.match(/^Source link checked (.+)$/))) translated = `来源链接核对日期 ${match[1]}`;
    if (!translated && (match = trimmed.match(/^Link checked (.+) · Applicability requires human review$/))) translated = `链接核对日期 ${match[1]} · 适用性需人工复核`;
    if (!translated && (match = trimmed.match(/^Fictional evidence · version (.+) · (.+)$/))) translated = `虚构证据 · 版本 ${match[1]} · ${text(match[2],language)}`;
    if (!translated && trimmed.startsWith('Import rejected:')) translated = '导入失败，数据结构不符合要求：' + trimmed.slice(16);
    if (!translated && /JSON/.test(trimmed) && /Unexpected token|Expected property|Unexpected end/.test(trimmed)) translated = 'JSON 格式错误：' + trimmed;
    return translated ? source.replace(trimmed, translated) : source;
  }
  // Translate only known interface strings. Record content is explicitly excluded by the caller.
  function localize(root, language) {
    const walker = root.ownerDocument.createTreeWalker(root, 4);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement.closest('[data-record-text], textarea, pre, script, style')) node.textContent = text(node.textContent,language);
    }
    for (const node of root.querySelectorAll('[placeholder], [aria-label]')) {
      for (const key of ['placeholder','aria-label']) if (node.hasAttribute(key)) node.setAttribute(key,text(node.getAttribute(key),language));
    }
  }
  function project(record, seed, translated, language) {
    const result = {...record};
    if (language !== 'zh-CN' || !seed || !translated) return result;
    for (const key of Object.keys(translated)) {
      if (typeof translated[key] === 'string' && record[key] === seed[key]) result[key] = translated[key];
    }
    return result;
  }
  const fieldLabels = {owner:'负责人',dueDate:'承诺完成日期',rootCause:'根本原因',impact:'影响与范围评估',interimAction:'临时措施或无需采取的理由',correctiveAction:'纠正措施',effectivenessPlan:'有效性检查计划',effectivenessResult:'有效性结果',responseDraft:'回复草稿',status:'状态',evidenceIds:'证据关联',sourceIds:'来源关联'};
  function issue(item, dataset, language) {
    if (language !== 'zh-CN') return item;
    const code = item.code;
    const fixed = {
      missing_review:['技术复核尚未完成','需要具名人员复核记录；本应用无法判断其资质或审批权限。'],
      missing_effectivenessResult:['缺少有效性检查结果','关闭前需记录已完成的检查及结果；计划检查不能作为结果。'],
      invalid_due_date:['完成日期无效','请使用 YYYY-MM-DD 格式的真实日期。'],
      no_evidence:['尚未关联证据','至少关联一份现行内部证据；有链接并不代表证据充分。'],
      no_source:['尚未关联法规来源','人员需要选择并评估相关来源；本应用不判断法律适用性。'],
      overdue:['承诺完成日期已过','评估延误及需要开展的沟通；逾期提示不代表对监管可接受性的判断。']
    };
    let pair = fixed[code];
    if (!pair && code.startsWith('missing_')) {
      const field = fieldLabels[code.slice(8)] || code.slice(8);
      pair = [`缺少${field}`,`请填写与本案例具体情况对应的${field}。`];
    }
    if (!pair && code.startsWith('evidence_')) {
      const id = item.label.match(/Evidence (\S+)/)?.[1];
      const entry = dataset.evidence.find(record => record.id === id);
      pair = [`证据 ${id || ''} ${text({missing:'Missing',superseded:'Superseded',unknown:'不可用'}[code.slice(9)] || '',language)}`,entry ? `${entry.title}：${entry.summary}` : '请修复不存在的证据引用。'];
    }
    if (!pair && code === 'source_unknown') pair = ['法规来源不可用','请修复来源引用，并人工核对其适用性。'];
    return pair ? {...item,label:pair[0],detail:pair[1]} : item;
  }
  function history(entry, translations, language) {
    if (language !== 'zh-CN') return {...entry};
    let action = translations.historyActions[entry.action] || entry.action;
    if (entry.action === 'Created a fictional training finding; investigation and supporting records remain pending.') action = text(entry.action,language);
    const edited = entry.action.match(/^Edited (.+?)(; previous technical approval reset)?\.$/);
    if (edited) action = '已修改：' + edited[1].split(', ').map(name => fieldLabels[name] || name).join('、') + (edited[2] ? '；原技术复核已失效。' : '。');
    return {...entry,action,actor:translations.historyActors[entry.actor] || entry.actor};
  }
  return {text,localize,project,issue,history};
});

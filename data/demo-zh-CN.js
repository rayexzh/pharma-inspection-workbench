/* Display translations for unchanged fictional seed values only; never overwrite user records. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.InspectionDemoZh = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function recordContent(title, id, version, status, body) {
    return '# ' + title + '\n\n虚构培训记录 — 不是企业的 GMP 记录。\n\n记录：' + id + '\n版本：' + version + '\n演示中的状态：' + status + '\n\n' + body + '\n';
  }
  function translatedFinding(values) {
    var fields = ['title', 'area', 'description', 'owner', 'rootCause', 'impact', 'interimAction', 'correctiveAction', 'effectivenessPlan', 'effectivenessResult', 'responseDraft'];
    var result = {};
    fields.forEach(function (key) { result[key] = Object.prototype.hasOwnProperty.call(values, key) ? values[key] : ''; });
    return result;
  }

  return {
    case: {
      name: '虚构检查后整改案例',
      site: 'Northbridge 培训场所 — 虚构',
      description: '用于开源求职作品的六项虚构 GMP/GDP 风格检查发现。分类、人员、记录和结果均为培训设定，不代表任何真实组织、检查、产品或客户数据。'
    },
    sources: {
      'S-RESPONSE': {
        title: 'MHRA：如何回复 GMP/GDP 检查后函件',
        scope: '回复格式、针对具体案例的行动与日期、扩展审查范围、临时控制措施及可能延误的承诺。证据在内部保留，仅在被要求时提交。该来源不能验证某一项具体行动计划。'
      },
      'S-AI': {
        title: 'MHRA：在 GXP 检查回复中使用 AI',
        scope: '无论采用何种起草方式，都应保证准确性、事实陈述可核实、引用适用，并由承担责任的人员进行技术复核。本原型不生成或认证监管回复。'
      },
      'S-INVESTIGATION': {
        title: 'MHRA：GMDP 环境中的调查',
        scope: '以证据为基础开展调查、考虑更广泛的影响、采取有意义的纠正措施并评价效果。检查发现与来源的对应关系是人工选择的培训示例，不是自动作出的法律判断。'
      }
    },
    evidence: {
      'E-001': {
        title: '分销交接操作规程',
        summary: '第一轮回复引用了旧版规程；案例中应提供版本 2.0，但目前尚未取得。',
        content: recordContent('分销交接操作规程', 'E-001', '1.0', 'superseded', '该旧版规程将交接检查分配给一个未明确指定人员的班次角色。\n\n虚构检查后计划修订规程，但这一版本不能证明新流程已经实施。应将其作为历史记录保留，并在复核前取得适用的现行版本。')
      },
      'E-002': {
        title: '培训完成情况矩阵',
        summary: '目前没有已完成的培训矩阵。计划编写的文件不能证明培训已经完成。',
        content: ''
      },
      'E-003': {
        title: '温度报警调查',
        summary: '对三次模拟报警确认延迟的调查；记录了因果过程及更广泛的检查。',
        content: recordContent('温度报警调查', 'E-003', '1.0', 'current', '虚构调查 INV-004，日期为 2026-09-25。\n\nB 区三次模拟报警未及时确认。核查通知配置与排班表后发现，岗位变更后未更新主要通知联系人名单，备用联系人也处于不可用状态。\n\n调查还检查了另外两个存储区及六次模拟报警测试；其联系人名单均为现行名单。受影响的模拟库存流转已被暂缓，等待具备资质的人员评估。本培训记录不作出产品放行或患者安全判断。')
      },
      'E-004': {
        title: '报警临时控制日志',
        summary: '在修改通知流程期间，采用模拟每日报警测试及第二人确认。',
        content: recordContent('报警临时控制日志', 'E-004', '1.0', 'current', '控制日志 CTL-004，虚构日期范围为 2026-09-26 至 2026-10-03。\n\n班次负责人在交接时检查通知联系人，第二人确认每日测试报警是否得到响应。演示记录显示完成了八次检查，均在虚构的五分钟目标内得到确认。\n\n这一短期观察仅支持临时控制措施，不能证明计划中的永久措施长期有效。')
      },
      'E-005': {
        title: '受控文件变更记录',
        summary: '已实施的虚构变更：删除重复的可编辑副本，并纠正受控主文件索引。',
        content: recordContent('受控文件变更记录', 'E-005', '2.0', 'current', '变更记录 CHG-011，实施日期为 2026-09-20。\n\n共享文件夹迁移后，模拟主文件索引未明确指定唯一有效文件的位置，因此同一操作规程出现了两个可编辑副本。\n\n该变更指定一个只读主文件位置，将旧文件夹链接重定向，删除可编辑的重复副本，并规定每周核对索引与文件夹。培训数据记录上述四项行动于 2026-09-20 完成。')
      },
      'E-006': {
        title: '文件控制效果复核',
        summary: '已完成的虚构复核：20 次文件选取均指向受控主文件，未发现剩余的可编辑重复副本。',
        content: recordContent('文件控制效果复核', 'E-006', '1.0', 'current', '效果复核 EFF-011，完成日期为 2026-10-02。\n\n预设验收标准：20 次模拟文件选取均应指向索引中的现行主文件；两个被检查的共享文件夹内不得残留可编辑重复副本。\n\n结果：20 次选取全部指向主文件，两个文件夹中未发现可编辑重复副本。三次模拟员工操作演练均选取了正确版本。虚构复核人 Rowan 于 2026-10-03 复核了相关变更及此结果。\n\n结论仅适用于这一模拟样本及观察期。每周持续核对仍属于演示行动的一部分。')
      },
      'E-007': {
        title: '供应商批准评估',
        summary: '草稿中描述了重新评估，但尚未提供完成后的批准记录。',
        content: ''
      },
      'E-008': {
        title: '草稿引用核查清单',
        summary: '虚构复核发现了一项未经核实的引用；已从工作草稿中删除，仍需技术复核。',
        content: recordContent('草稿引用核查清单', 'E-008', '1.0', 'current', '引用清单 REF-006，日期为 2026-10-01。\n\n一份模拟回复引用了起草人无法找到的指导文件标题。该未经核实的引用已从工作草稿中删除。来源登记表目前关联了三篇直接核查过的 MHRA 出版物，并由人员记录每一篇的相关性。\n\n这份清单仅检查引用。仍需由具备技术经验的人员核查具体场所的事实陈述及拟采取的行动。检查发现 F-005 尚未完成该技术复核。')
      },
      'E-009': {
        title: '承诺及延误沟通日志',
        summary: '记录了虚构的内部计划调整及提前沟通；未将等待回复描述为检查员已接受。',
        content: recordContent('承诺及延误沟通日志', 'E-009', '1.0', 'current', '承诺日志 COM-008，日期为 2026-10-03。\n\n原虚构内部行动目标日期：2026-10-04。依赖项审查发现模拟报警系统变更可能延期。演示质量负责人于 2026-10-03 记录了向虚构检查联系人提前沟通的情况，说明原因、临时控制措施及建议调整至 2026-10-12 的行动日期。\n\n没有实际发送任何消息，也不宣称检查员已经接受。在承担责任的人员完成变更处理前，本数据中的目标日期仍为 2026-10-04。跟进任务已安排在 2026-10-04。')
      }
    },
    findings: {
      'F-001': translatedFinding({
        title: '引用旧版 SOP；培训证据缺失',
        area: '文件控制与培训',
        description: '模拟回复引用了已被替代的交接 SOP v1.0，并声称培训已完成，但尚未找到现行规程和已完成的培训记录。',
        impact: '检查其他分销交接规程及两个虚构班次；范围审查尚未完成。',
        interimAction: '在查找适用规程期间，由班次负责人执行并记录第二次交接检查。',
        responseDraft: '工作草稿：将更新规程并培训相关人员。具体行动、责任人及支持“已完成”陈述的依据仍未明确。'
      }),
      'F-002': translatedFinding({
        title: '温度报警确认反复延迟',
        area: '调查与纠正预防措施（CAPA）',
        description: '三次模拟报警确认延迟最初分别调查，随后才发现共同的通知名单问题。',
        owner: '演示工程负责人',
        rootCause: '岗位变更流程没有要求更新报警联系人；排班变化后，主要和备用联系人均不可用。调查证据支持这一因果过程。',
        impact: '检查三个虚构存储区及其他按岗位分配的通知。B 区模拟库存流转仍待具备资质的人员评估；不作出产品安全结论。',
        interimAction: '班次负责人在交接时检查联系人是否可响应，并由第二人核实每日测试报警。',
        correctiveAction: '在岗位变更清单中加入报警联系人，配置并测试备用联系人，并要求每季度核对联系人名单。',
        effectivenessPlan: '实施后检查 30 次每日测试报警及模拟运行中每次实际触发的报警，确认是否在预设的五分钟目标内响应；在关闭前调查任何不符合情况。',
        responseDraft: '调查发现，岗位变更后存在联系人更新流程缺口。临时检查自 26/09/2026 开始。计划于 12/10/2026 前完成永久通知机制及排班相关变更，随后进行 30 天的效果监测。目前尚无长期效果结果。'
      }),
      'F-003': translatedFinding({
        title: '文件夹迁移后出现重复可编辑规程',
        area: '受控文件',
        description: '共享文件夹迁移后，一份模拟规程仍有两个可编辑副本，员工可能选取不同版本。',
        owner: '演示文件管理员',
        rootCause: '迁移清单遗漏了责任归属及唯一有效文件位置的核对，因此旧的可编辑文件夹仍可访问。',
        impact: '检查了两个迁移文件夹及全部 20 次模拟现行规程选取。变更后未发现其他残留的可编辑重复副本。',
        interimAction: '变更期间禁用了旧文件夹编辑，并引导员工使用受控主文件索引。',
        correctiveAction: '指定一个主文件位置，重定向旧链接，删除可编辑重复副本，并在迁移清单中加入每周索引核对。',
        effectivenessPlan: '检查 20 次预设文件选取及两个迁移文件夹；要求所有选取均指向索引中的现行主文件，且可编辑重复副本为零。',
        effectivenessResult: '于 02/10/2026 完成：20 次选取全部指向索引中的现行主文件；两个文件夹中未发现可编辑重复副本。三次模拟员工操作演练均选取了正确版本。每周核对持续进行。',
        responseDraft: '文件夹迁移流程遗漏了唯一有效主文件的核对。变更于 20/09/2026 实施。预设效果检查于 02/10/2026 完成，并满足验收标准。内部证据仍保留在索引中，仅在被要求时提供。'
      }),
      'F-004': translatedFinding({
        title: '声称供应商已重新评估，但缺少批准记录',
        area: '供应商资质管理',
        description: '工作草稿声称某虚构供应商已重新评估，但批准记录缺失，相关指导来源也尚未对应。',
        owner: '演示供应商质量协调员',
        rootCause: '在核查完成后的评估及授权批准前，就依据任务状态更新了草稿。',
        impact: '检查同一周被标记为重新评估已完成的其他模拟供应商条目。',
        interimAction: '保持重新评估任务为未完成，并将任何新的模拟采购决策交由负责的质量人员处理。',
        correctiveAction: '在将重新评估标记为完成前，必须关联批准记录并完成授权复核。',
        effectivenessPlan: '检查接下来的五次模拟重新评估，确认任务完成前均关联了已完成的评估和批准记录。',
        responseDraft: '在取得并复核批准记录前，从工作草稿中撤回“已完成”的陈述。草稿将分别说明已完成的工作和尚待完成的行动。'
      }),
      'F-005': translatedFinding({
        title: 'AI 辅助工作草稿中存在未经核实的引用',
        area: '回复核查',
        description: '模拟 AI 辅助工作草稿引用了起草人无法核实的指导文件标题；具体场所的陈述仍需技术复核。',
        owner: '演示质量复核人',
        rootCause: '在将内容复制到工作回复前，起草流程未设置强制引用核查，也未指定技术复核人。',
        impact: '检查这份模拟检查回复中的每一项引用和事实性的完成陈述；没有提交过真实回复。',
        interimAction: '草稿仅供内部使用，并删除未经核实的引用，等待事实核查和技术复核。',
        correctiveAction: '在发布工作回复前，加入来源登记表、针对具体案例的事实核查及具名技术复核。',
        effectivenessPlan: '按照清单检查接下来的三份模拟草稿；每份均须具备可核实的引用、有依据的陈述和具名复核，才满足验收标准。',
        responseDraft: '未经核实的引用已删除。直接核查过的来源及其适用范围限制已列明。具名技术复核人将在 06/10/2026 前核查具体场所的陈述和拟采取的行动。仅凭引用清单，不能证明回复充分。'
      }),
      'F-006': translatedFinding({
        title: '承诺可能延期：提前沟通延误',
        area: '承诺跟踪',
        description: '虚构报警系统变更可能无法在原行动日期前完成。团队记录了提前沟通，但跟进和效果检查仍待完成。',
        owner: '演示质量负责人',
        rootCause: '在完成依赖项和资源审查之前，就对行动计划作出了承诺。',
        impact: '检查每一项模拟未完成承诺的依赖项，并对照相关日期，防止出现相互矛盾的承诺。',
        interimAction: '在永久变更尚未完成期间，继续每日报警联系人检查和第二人确认。',
        correctiveAction: '在批准承诺前加入依赖项审查，明确承担责任的负责人，并每周检查有延期风险的日期。',
        effectivenessPlan: '连续四周每周检查全部模拟承诺；要求每项有延期风险的日期都有依赖项审查记录及提前升级处理。',
        responseDraft: '虚构团队于 03/10/2026 记录了对潜在延误的提前沟通，说明原因、临时控制措施及建议调整后的日期。不宣称检查员已经接受。在责任人完成复核前，仍保留原日期 04/10/2026，跟进任务今天到期。'
      })
    },
    historyActions: {
      'Recorded fictional training finding from simulated inspection.': '记录模拟检查中的虚构培训发现。',
      'Recorded fictional training finding.': '记录虚构培训发现。',
      'Recorded implementation of controlled-location change.': '记录受控文件位置变更的实施情况。',
      'Recorded completed effectiveness check against predefined criteria.': '记录按照预设标准完成的效果检查。',
      'Reviewed current evidence and recorded technical approval.': '复核现行证据并记录技术批准。',
      'Closed simulated finding after internal workflow checks; no regulatory acceptance asserted.': '通过内部流程检查后关闭模拟发现；不宣称监管机构已接受。',
      'Recorded a fictional advance delay communication; no actual message sent.': '记录虚构的提前延误沟通；没有实际发送消息。',
      'Reviewed response plan; effectiveness result remains pending.': '复核回复计划；效果结果仍待完成。',
      'Recorded named technical review approval (portfolio workflow; no identity or qualification verification).': '记录具名技术复核批准（作品集流程；未核实身份或资质）。',
      'Closed after internal workflow checks; closure does not establish regulatory acceptance.': '通过内部流程检查后关闭；关闭不代表监管机构已接受。'
    },
    historyActors: {
      '': '',
      'Demo quality coordinator': '演示质量协调员',
      'Demo engineering lead': '演示工程负责人',
      'Demo document controller': '演示文件管理员',
      'Demo supplier quality coordinator': '演示供应商质量协调员',
      'Demo quality reviewer': '演示质量复核人',
      'Demo quality lead': '演示质量负责人',
      'Rowan — fictional technical reviewer': 'Rowan — 虚构技术复核人',
      'Alex — fictional technical reviewer': 'Alex — 虚构技术复核人',
      'Demo editor': '演示编辑者',
      'Demo reviewer': '演示复核人',
      'Demo technical reviewer': '演示技术复核人',
      'Demo coordinator': '演示协调员',
      'Portfolio editor': '作品集编辑者',
      'Portfolio reviewer': '作品集复核人',
      'Portfolio user': '作品集用户'
    }
  };
});

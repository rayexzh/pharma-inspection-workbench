/* Writing prompts for a fictional learning case. This module never fills or evaluates a record. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.InspectionGuidance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var guidance = {
    owner: {
      en: {
        title: 'Owner',
        purpose: 'Make responsibility for the follow-up clear.',
        prompts: ['Who will coordinate this action?', 'Who will confirm progress and raise delays?'],
        avoid: 'A name here records an assignment; it does not prove that the person accepted or completed it.'
      },
      'zh-CN': {
        title: '负责人',
        purpose: '说明由谁负责推进后续工作。',
        prompts: ['谁来协调这项措施？', '谁来确认进度并报告延误？'],
        avoid: '填写姓名表示责任分配，不代表此人已接受任务或完成工作。'
      }
    },
    dueDate: {
      en: {
        title: 'Due date',
        purpose: 'Record a planned completion date for this action.',
        prompts: ['What date can the owner reasonably commit to?', 'Does the plan account for dependencies and follow-up checks?'],
        avoid: 'Choose the date manually. This app does not calculate a regulatory deadline or approve a commitment.'
      },
      'zh-CN': {
        title: '到期日期',
        purpose: '记录这项措施的计划完成日期。',
        prompts: ['负责人能合理承诺在哪一天完成？', '计划是否考虑了前置工作和后续检查？'],
        avoid: '请自行确定日期。本应用不会计算法规期限，也不会批准这一承诺。'
      }
    },
    rootCause: {
      en: {
        title: 'Root cause',
        purpose: 'Explain why the problem happened, using the investigation.',
        prompts: ['What did the investigation establish, and which records support it?', 'Which possible causes remain untested or uncertain?'],
        avoid: 'Repeating the observation is not a cause. Keep assumptions separate from supported findings.'
      },
      'zh-CN': {
        title: '根本原因',
        purpose: '根据调查说明问题为什么发生。',
        prompts: ['调查确认了什么，哪些记录能够支持？', '哪些可能原因尚未验证或仍不确定？'],
        avoid: '重复描述问题不等于解释原因。请将假设与有证据支持的调查结论分开。'
      }
    },
    impact: {
      en: {
        title: 'Impact assessment',
        purpose: 'Describe the known scope and consequences of the problem.',
        prompts: ['Which products, batches, records or activities were checked, and over what period?', 'What impact was found, and what still needs assessment?'],
        avoid: 'Do not state “no impact” just because no problem has yet been reported; explain the assessment and its limits.'
      },
      'zh-CN': {
        title: '影响评估',
        purpose: '说明目前已知的影响范围和后果。',
        prompts: ['检查了哪些产品、批次、记录或活动，时间范围是什么？', '发现了什么影响，还有哪些方面需要评估？'],
        avoid: '暂时没有收到问题报告，不等于“没有影响”。请说明评估方法及其局限。'
      }
    },
    interimAction: {
      en: {
        title: 'Interim action',
        purpose: 'Explain how the immediate problem is being contained while work continues.',
        prompts: ['What temporary measure is planned or already in place?', 'Who checks it, and when will it be reviewed or replaced?'],
        avoid: 'Distinguish planned steps from completed measures. Temporary containment does not establish that the cause is resolved.'
      },
      'zh-CN': {
        title: '临时措施',
        purpose: '说明整改期间如何控制当前问题。',
        prompts: ['计划采取什么临时措施，哪些已实际实施？', '由谁检查，何时复核或替换这些措施？'],
        avoid: '请区分计划与已完成的措施。临时控制并不能证明根本原因已经解决。'
      }
    },
    correctiveAction: {
      en: {
        title: 'Corrective action',
        purpose: 'Connect the proposed change to the investigated cause.',
        prompts: ['What specific change addresses the supported cause?', 'Who will do it, by when, and what record will show completion?'],
        avoid: 'Do not describe a plan as completed. Explain the link to the cause rather than listing generic training or reminders.'
      },
      'zh-CN': {
        title: '纠正措施',
        purpose: '把拟采取的改进与调查确认的原因连接起来。',
        prompts: ['哪项具体改进能够针对有证据支持的原因？', '谁来执行、何时完成、用什么记录证明完成？'],
        avoid: '不要把计划写成已完成。请说明措施与原因的关系，而不是只列出笼统的培训或提醒。'
      }
    },
    effectivenessPlan: {
      en: {
        title: 'Effectiveness check plan',
        purpose: 'Plan how to check whether the change works.',
        prompts: ['What will be checked, when, and by whom?', 'What evidence and success criteria will be used, including the sample or period?'],
        avoid: 'Completing an action and confirming its effectiveness are different steps. Set the check before claiming success.'
      },
      'zh-CN': {
        title: '有效性检查计划',
        purpose: '计划如何确认改进是否有效。',
        prompts: ['检查什么、何时检查、由谁检查？', '采用什么证据和成功标准，抽样范围或观察周期是什么？'],
        avoid: '完成措施与确认措施有效是两个步骤。请先设计检查，再判断是否成功。'
      }
    },
    effectivenessResult: {
      en: {
        title: 'Completed effectiveness result',
        purpose: 'Record what a completed effectiveness check actually found.',
        prompts: ['What method, date, sample or period was actually used, and what were the results and exceptions?', 'Where is the supporting record, and how does the outcome compare with the planned criteria?'],
        avoid: 'A future check is a plan, not a result. Do not claim success without a completed check and supporting evidence.'
      },
      'zh-CN': {
        title: '已完成的有效性检查结果',
        purpose: '记录实际完成的有效性检查发现了什么。',
        prompts: ['实际使用了什么方法，日期、抽样范围或观察周期是什么，结果和异常有哪些？', '支持记录在哪里，结果与计划标准相比如何？'],
        avoid: '未来的检查属于计划，不是结果。没有完成检查和支持证据时，不要宣称整改有效。'
      }
    },
    responseDraft: {
      en: {
        title: 'Response draft',
        purpose: 'Give a clear account of the finding and the follow-up.',
        prompts: ['What was observed, what did the investigation establish, and what remains unknown?', 'Which actions are planned or completed, who owns them, what are the dates, and what follow-up and records support the account?'],
        avoid: 'Keep claims tied to evidence. Check the applicable instructions before choosing attachments; this app does not submit a response.'
      },
      'zh-CN': {
        title: '回复草稿',
        purpose: '清楚说明检查发现和后续整改。',
        prompts: ['观察到了什么，调查确认了什么，还有哪些未知事项？', '哪些措施计划实施或已经完成，由谁负责、日期是什么，后续工作和支持记录有哪些？'],
        avoid: '所有结论都应有证据支持。选择附件前请核对适用要求；本应用不会向监管机构提交回复。'
      }
    }
  };

  function forField(name, language) {
    if (typeof name !== 'string' || !Object.prototype.hasOwnProperty.call(guidance, name)) return null;
    var text = guidance[name][language === 'zh-CN' ? 'zh-CN' : 'en'];
    return { title: text.title, purpose: text.purpose, prompts: text.prompts.slice(), avoid: text.avoid };
  }

  return { forField: forField };
});

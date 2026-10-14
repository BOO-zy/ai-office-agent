import React from 'react';
import { FileSpreadsheet, FileText, Sparkles, ArrowRight } from 'lucide-react';

const QUICK_TEMPLATES = [
  {
    type: 'excel',
    title: '销售业绩与提成核算表',
    desc: '自动生成完成率公式、提成比例与总计汇总行',
    prompt: '帮我制作一份2026年Q1销售业绩核算与提成统计 Excel，包含5个销售员的月度目标、实际完成额、完成率、提成比例与最终提成金额，附带求和与平均值公式。'
  },
  {
    type: 'excel',
    title: '部门月度考勤与工时表',
    desc: '自动统计出勤天数、迟到早退、加班及出勤率',
    prompt: '请生成一份规范的部门月度考勤与加班工时统计表 Excel，包含员工工号、姓名、应出勤、实际出勤、迟到次数、加班工时及出勤率公式。'
  },
  {
    type: 'word',
    title: '项目立项与商业可行性报告',
    desc: '痛点剖析、架构设计、投资回报与里程碑表格',
    prompt: '请撰写一份详实的《企业级办公智能体项目立项与商业可行性报告》Word 文档，包括项目背景、痛点分析、核心功能架构、实施里程碑表格以及预期投资回报。'
  },
  {
    type: 'word',
    title: '研发团队周度工作总结',
    desc: '本周上线成果、重点风险排查与下周规划表',
    prompt: '请帮我整理一份专业的技术研发团队周度工作汇报 Word 文档，涵盖本周上线成果、待解决关键风险、团队任务进度表以及下周重点规划。'
  }
];

export default function Templates({ onSelectTemplate }) {
  return (
    <div className="w-full max-w-3xl mx-auto mt-6">
      <div className="flex items-center justify-center gap-2 mb-3 text-xs font-medium text-emerald-400/80">
        <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
        <span>推荐办公场景（点击自动填入）</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {QUICK_TEMPLATES.map((item, idx) => {
          const isExcel = item.type === 'excel';
          return (
            <button
              key={idx}
              onClick={() => onSelectTemplate(item.prompt)}
              className="flex items-start text-left p-3.5 rounded-xl bg-[#0B1A30]/60 hover:bg-[#0E2240]/90 border border-slate-800/80 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all group backdrop-blur-md"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 mr-3 transition-transform group-hover:scale-110 ${
                isExcel 
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              }`}>
                {isExcel ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-200 group-hover:text-emerald-300 transition-colors truncate">
                    {item.title}
                  </h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium ${
                    isExcel ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    {isExcel ? 'Excel' : 'Word'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

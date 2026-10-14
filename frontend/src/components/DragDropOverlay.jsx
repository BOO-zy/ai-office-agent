import React from 'react';
import { UploadCloud, FileSpreadsheet, FileText, Image } from 'lucide-react';

export default function DragDropOverlay({ isDragging }) {
  if (!isDragging) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060A17]/90 backdrop-blur-md pointer-events-none transition-all duration-300">
      <div className="w-[90%] max-w-xl p-8 rounded-3xl border-3 border-dashed border-white bg-white/10 shadow-2xl flex flex-col items-center text-center animate-pulse">
        <div className="w-20 h-20 rounded-full bg-[#7cc133] border-4 border-white flex items-center justify-center text-slate-900 shadow-xl mb-4">
          <UploadCloud className="w-10 h-10 animate-bounce" />
        </div>
        
        <h3 className="text-2xl font-bold text-white tracking-wide">
          释放文件以导入
        </h3>
        <p className="text-sm text-white/80 mt-1.5 max-w-sm">
          支持直接拖入图片、发票凭证、Excel 表格、Word 文档或 PDF
        </p>

        <div className="flex items-center gap-3 mt-6 text-xs text-white">
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 border border-white/30">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#7cc133]" /> Excel
          </span>
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 border border-white/30">
            <FileText className="w-3.5 h-3.5 text-cyan-300" /> Word / PDF
          </span>
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 border border-white/30">
            <Image className="w-3.5 h-3.5 text-emerald-300" /> 截图 / 照片
          </span>
        </div>
      </div>
    </div>
  );
}

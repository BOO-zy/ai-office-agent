import React from 'react';
import { FileSpreadsheet, FileText, Download, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function FileCard({ file }) {
  const isExcel = file.file_type === 'excel' || (file.filename && file.filename.endsWith('.xlsx'));
  const isWord = file.file_type === 'word' || (file.filename && file.filename.endsWith('.docx'));

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const downloadUrl = `${API_BASE_URL}/api/download/${file.file_id}`;

  return (
    <a
      href={downloadUrl}
      download={file.filename}
      target="_blank"
      rel="noopener noreferrer"
      className={`uiverse-morph-card group mt-3.5 block p-4 sm:p-4.5 ${
        isExcel ? 'is-excel' : 'is-word'
      }`}
      title={`点击下载 ${file.filename}`}
    >
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="file-icon-box w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all duration-300">
            {isExcel ? <FileSpreadsheet className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="file-title font-shuhei text-sm font-bold truncate transition-colors duration-300" title={file.filename}>
                {file.filename}
              </h4>
              <span className="file-badge font-shuhei text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors duration-300">
                {isExcel ? 'Excel' : 'Word'}
              </span>
            </div>
            <p className="file-meta text-xs mt-0.5 flex items-center gap-1.5 transition-colors duration-300">
              <span>{formatSize(file.file_size)}</span>
              <span>•</span>
              <span className="file-ready flex items-center font-medium transition-colors duration-300">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 已就绪
              </span>
            </p>
          </div>
        </div>

        <div className="file-download-btn inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all duration-300 shrink-0">
          <Download className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />
          <span>下载文件</span>
        </div>
      </div>
    </a>
  );
}

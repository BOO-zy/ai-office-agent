import React, { useRef, useState } from 'react';
import { Send, X, Loader2, Paperclip, UploadCloud, FileSpreadsheet, FileText, Image as ImageIcon } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  files,
  setFiles,
  onSend,
  isLoading,
  isCenter = true,
  selectedModel = 'gemini',
  setSelectedModel
}) {
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [isBoxDragging, setIsBoxDragging] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && (input.trim() || files.length > 0)) {
        onSend();
      }
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Local drag & drop for the input container
  const handleBoxDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBoxDragging(true);
  };

  const handleBoxDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBoxDragging(false);
  };

  const handleBoxDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBoxDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const getFileIcon = (fileName) => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-[#7cc133]" />;
    }
    if (lower.endsWith('.docx') || lower.endsWith('.doc') || lower.endsWith('.pdf')) {
      return <FileText className="w-3.5 h-3.5 text-cyan-300" />;
    }
    return <ImageIcon className="w-3.5 h-3.5 text-emerald-300" />;
  };

  return (
    <div className={`w-full transition-all duration-500 uiverse-3d-input-wrapper ${isCenter ? 'max-w-2xl mx-auto' : 'max-w-3xl mx-auto'}`}>
      <div 
        onDragOver={handleBoxDragOver}
        onDragLeave={handleBoxDragLeave}
        onDrop={handleBoxDrop}
        className={`uiverse-3d-input-container p-3.5 sm:p-4.5 ${
          isBoxDragging ? 'scale-[1.02] border-[#7cc133]' : ''
        }`}
      >
        <div className="uiverse-3d-input-shadow"></div>

        {/* 3D Top Badge (Click to toggle Gemini / Doubao) */}
        <div 
          onClick={() => setSelectedModel && setSelectedModel(selectedModel === 'gemini' ? 'doubao' : 'gemini')}
          className="uiverse-3d-badge group"
          title="点击快速切换模型 (Gemini / 豆包)"
        >
          <span>{selectedModel === 'doubao' ? '🥟 豆包大模型 (国内直连)' : '🌐 Gemini 3.5 Flash'}</span>
          <span className="text-[10px] opacity-75 underline group-hover:opacity-100 transition-opacity">切换</span>
        </div>

        {/* Box Dragging Overlay Indicator */}
        {isBoxDragging && (
          <div className="absolute inset-0 z-30 rounded-[22px] bg-[#3344c1]/95 backdrop-blur-sm flex items-center justify-center gap-2 text-white text-sm font-semibold pointer-events-none animate-pulse">
            <UploadCloud className="w-5 h-5 text-[#7cc133]" />
            <span>松开立即附加到输入框</span>
          </div>
        )}

        {/* Selected File Previews Chips */}
        {files.length > 0 && (
          <div className="relative z-10 flex flex-wrap gap-2 px-1 pt-1 pb-2.5 mb-2.5 border-b border-white/10">
            {files.map((f, idx) => (
              <div 
                key={idx} 
                className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 text-xs shadow-xs text-white"
              >
                {getFileIcon(f.name)}
                <span className="truncate max-w-[160px]" title={f.name}>
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-white/60 hover:text-white p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Input Area */}
        <div className="relative z-10 flex items-end gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,.pdf,.xlsx,.xls,.docx,.doc,.csv,.txt"
            className="hidden"
          />

          {/* 3D Upload Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="uiverse-3d-btn shrink-0"
            title="上传或拖入图片/表格/文档"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* 3D Expanding Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={isCenter ? 2 : 1}
            placeholder={
              selectedModel === 'doubao'
                ? "输入办公需求 (豆包国内直连处理)，或直接拖入发票图片/表格文档..."
                : "输入办公需求 (Gemini 3.5 智能处理)，或直接拖入发票图片/表格文档..."
            }
            className="uiverse-3d-textarea flex-1 max-h-40 resize-none selection:bg-[#7cc133]/40 selection:text-white"
            style={{ minHeight: isCenter ? '46px' : '38px' }}
          />

          {/* Uiverse Paper Airplane Send Button */}
          <button
            type="button"
            onClick={onSend}
            disabled={isLoading || (!input.trim() && files.length === 0)}
            className={`uiverse-send-button shrink-0 ${isLoading ? 'is-sending' : ''}`}
            style={{ transform: 'translateZ(20px)' }}
          >
            <div className="outline"></div>
            <div className="state state--default">
              <div className="icon">
                <svg
                  width="1.15em"
                  height="1.15em"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g style={{ filter: 'url(#btnPlaneShadow)' }}>
                    <path
                      d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z"
                      fill="currentColor"
                    />
                    <path
                      d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z"
                      fill="currentColor"
                    />
                  </g>
                  <defs>
                    <filter id="btnPlaneShadow">
                      <feDropShadow
                        dx="0"
                        dy="1"
                        stdDeviation="0.6"
                        floodOpacity="0.4"
                      />
                    </filter>
                  </defs>
                </svg>
              </div>
              <p>
                <span style={{ '--i': 0 }}>S</span>
                <span style={{ '--i': 1 }}>e</span>
                <span style={{ '--i': 2 }}>n</span>
                <span style={{ '--i': 3 }}>d</span>
              </p>
            </div>
            <div className="state state--sent">
              <div className="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  height="1.15em"
                  width="1.15em"
                  strokeWidth="0.5px"
                  stroke="currentColor"
                >
                  <g style={{ filter: 'url(#btnPlaneShadow)' }}>
                    <path
                      fill="currentColor"
                      d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z"
                    />
                    <path
                      fill="currentColor"
                      d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z"
                    />
                  </g>
                </svg>
              </div>
              <p>
                <span style={{ '--i': 0 }}>S</span>
                <span style={{ '--i': 1 }}>e</span>
                <span style={{ '--i': 2 }}>n</span>
                <span style={{ '--i': 3 }}>t</span>
              </p>
            </div>
          </button>
        </div>

        {/* Quick Drop Hint Bar */}
        <div className="relative z-10 flex items-center justify-between px-1.5 pt-2 text-[11px] text-white/50">
          <span className="flex items-center gap-1.5 text-white/70">
            <UploadCloud className="w-3.5 h-3.5 text-[#7cc133]" />
            <span>支持拖拽任意文件直接放入</span>
          </span>
          <span className="hidden sm:inline text-white/40">
            按 <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] border border-white/20">Enter</kbd> 发送
          </span>
        </div>
      </div>
    </div>
  );
}

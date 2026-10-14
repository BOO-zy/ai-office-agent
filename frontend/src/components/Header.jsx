import React from 'react';
import { PlusCircle, Globe, Cpu } from 'lucide-react';

export default function Header({ 
  onClearChat, 
  messagesCount,
  selectedModel = 'gemini',
  setSelectedModel
}) {
  return (
    <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 flex items-center justify-between select-none box-border">
      {/* Brand */}
      <div className="flex items-center space-x-2.5">
        <div className="w-7 h-7 rounded-full bg-[#3344c1] border-2 border-white flex items-center justify-center text-white shadow-md">
          <span className="text-xs font-bold">Y</span>
        </div>
        <span className="font-bold font-shuhei text-white text-base tracking-wide hidden sm:inline">
          Yiz Office Copilot
        </span>
      </div>

      {/* Center/Right Actions: Model Switcher & New Chat */}
      <div className="flex items-center space-x-2.5">
        {/* Model Switcher Neon Checkbox Container */}
        <div className="uiverse-neon-switcher font-shuhei">
          {/* Gemini 3.5 Option */}
          <label 
            className={`uiverse-model-checkbox theme-gemini ${selectedModel === 'gemini' ? 'is-checked' : ''}`}
            title="Google Gemini 3.5 Flash (国际云端大模型)"
          >
            <input 
              type="radio" 
              name="ai-model" 
              value="gemini"
              checked={selectedModel === 'gemini'}
              onChange={() => setSelectedModel && setSelectedModel('gemini')}
            />
            <div className="checkmark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M20 6L9 17L4 12"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="model-label">
              <Globe className="w-3.5 h-3.5" />
              <span>Gemini 3.5</span>
            </span>
          </label>

          {/* Doubao Option */}
          <label 
            className={`uiverse-model-checkbox theme-doubao ${selectedModel === 'doubao' ? 'is-checked' : ''}`}
            title="字节跳动豆包大模型 (火山引擎方舟·国内直连)"
          >
            <input 
              type="radio" 
              name="ai-model" 
              value="doubao"
              checked={selectedModel === 'doubao'}
              onChange={() => setSelectedModel && setSelectedModel('doubao')}
            />
            <div className="checkmark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M20 6L9 17L4 12"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="model-label">
              <Cpu className="w-3.5 h-3.5" />
              <span>豆包大模型</span>
              <span className={`inline-flex items-center text-[9px] px-1.5 py-0.5 rounded-full font-bold border leading-none transition-colors ${
                selectedModel === 'doubao'
                  ? 'bg-[#7cc133]/20 text-[#7cc133] border-[#7cc133]/50'
                  : 'bg-emerald-400/10 text-emerald-300/80 border-emerald-400/20'
              }`}>
                国内直连
              </span>
            </span>
          </label>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onClearChat}
          className="uiverse-morph-btn group font-shuhei"
          title="新对话 / 清空记录"
        >
          <div className="relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold">
            <PlusCircle className="morph-btn-icon w-3.5 h-3.5" />
            <span>新对话</span>
          </div>
        </button>
      </div>
    </header>
  );
}

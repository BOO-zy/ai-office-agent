import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Sparkles } from 'lucide-react';
import FileCard from './FileCard';

export default function MessageItem({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`uiverse-chat-stack my-3.5 transition-all ${
      isUser 
        ? 'is-user ml-4 sm:ml-12' 
        : 'is-assistant mr-4 sm:mr-12'
    }`}>
      <div className="uiverse-chat-card">
        <div className="flex items-start space-x-3.5">
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-md ${
            isUser 
              ? 'bg-[#3344c1] text-white border-2 border-white' 
              : 'bg-[#7cc133] text-slate-900 font-bold border-2 border-white shadow-sm'
          }`}>
            {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold ${isUser ? 'text-[#7084ff]' : 'text-[#7cc133]'}`}>
                {isUser ? '我' : 'Yiz Office Copilot'}
              </span>
              <span className="text-[11px] text-white/50">
                {message.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Uploaded images preview (if user uploaded) */}
            {message.images && message.images.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1 pb-2">
                {message.images.map((imgUrl, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border-2 border-white/40 group max-w-[220px] max-h-[160px] shadow-sm">
                    <img src={imgUrl} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Text / Markdown */}
            <div className="text-sm text-white leading-relaxed prose prose-invert max-w-none prose-p:my-1.5 prose-headings:text-white prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5 prose-code:text-[#7cc133] prose-code:bg-black/20 prose-strong:text-white">
              <ReactMarkdown>{message.text}</ReactMarkdown>
              {message.isTyping && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-[#7cc133] rounded-xs animate-pulse align-middle shadow-[0_0_8px_#7cc133]" />
              )}
            </div>

            {/* Generated File Cards */}
            {message.files && message.files.length > 0 && (
              <div className="pt-2 space-y-2">
                {message.files.map((file, idx) => (
                  <FileCard key={idx} file={file} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

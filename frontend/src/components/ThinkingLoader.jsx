import React from 'react';

export default function ThinkingLoader() {
  return (
    <div className="py-6 px-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg flex flex-col items-center justify-center my-4 select-none">
      <div className="thinking-wrapper">
        <div className="thinking-circle"></div>
        <div className="thinking-circle"></div>
        <div className="thinking-circle"></div>
        <div className="thinking-shadow"></div>
        <div className="thinking-shadow"></div>
        <div className="thinking-shadow"></div>
      </div>
      <p className="mt-4 text-xs tracking-widest text-white/70 font-medium">
        Agent 正在思考与构建文档...
      </p>
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import MessageItem from './components/MessageItem';
import ChatInput from './components/ChatInput';
import EarthGlobe from './components/EarthGlobe';
import DragDropOverlay from './components/DragDropOverlay';
import ThinkingLoader from './components/ThinkingLoader';
import SpaceBackground from './components/SpaceBackground';
import { Sparkles } from 'lucide-react';
import { API_BASE_URL } from './config';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('ai_office_model') || 'gemini';
  });
  const [doubaoEndpoint, setDoubaoEndpoint] = useState(() => {
    return localStorage.getItem('doubao_endpoint') || '';
  });
  const dragCounter = useRef(0);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('ai_office_model', selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('doubao_endpoint', doubaoEndpoint);
  }, [doubaoEndpoint]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }
    };
  }, []);

  // Window-level Drag and Drop handling
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      setIsDragging(false);
      dragCounter.current = 0;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('确定要清空当前的会话记录并开启新对话吗？')) {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
      }
      setMessages([]);
      setInput('');
      setFiles([]);
    }
  };

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() && files.length === 0) return;

    // Create object URLs for local image preview
    const imagePreviews = files
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => URL.createObjectURL(f));

    const userMessage = {
      role: 'user',
      text: textToSend,
      images: imagePreviews,
      files: [],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    const filesToUpload = [...files];
    setFiles([]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('prompt', textToSend);
      formData.append('model', selectedModel);
      if (selectedModel === 'doubao' && doubaoEndpoint) {
        formData.append('doubao_endpoint', doubaoEndpoint);
      }

      // Append clean chat history (filter out errors)
      const historyContext = messages
        .filter((m) => !m.text.startsWith('⚠️'))
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text
        }));
      formData.append('history', JSON.stringify(historyContext));

      // Append files
      filesToUpload.forEach((file) => {
        formData.append('files', file);
      });

      const response = await axios.post(`${API_BASE_URL}/api/chat`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const data = response.data;
      const fullText = data.text || '已为您处理完成。';
      const generatedFiles = data.generated_files || [];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const msgId = Date.now();

      // Dismiss thinking loader
      setIsLoading(false);

      // Add initial typing message
      setMessages((prev) => [
        ...prev,
        {
          id: msgId,
          role: 'model',
          text: '',
          isTyping: true,
          files: [],
          time: timeStr
        }
      ]);

      // Fast typewriter effect (finishes in ~0.6s to 1.0s)
      let currentIndex = 0;
      const totalLen = fullText.length;
      const steps = Math.min(35, Math.max(12, Math.floor(totalLen / 5)));
      const stepSize = Math.max(2, Math.ceil(totalLen / steps));
      const intervalMs = 20;

      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current);
      }

      typingTimerRef.current = setInterval(() => {
        currentIndex += stepSize;
        if (currentIndex >= totalLen) {
          clearInterval(typingTimerRef.current);
          typingTimerRef.current = null;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? { ...m, text: fullText, isTyping: false, files: generatedFiles }
                : m
            )
          );
        } else {
          const currentSub = fullText.slice(0, currentIndex);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId ? { ...m, text: currentSub } : m
            )
          );
        }
      }, intervalMs);

    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = err.response?.data?.detail || err.message || '网络请求失败，请稍后重试。';
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'model',
          text: `⚠️ **请求处理失败**：${errorMsg}\n\n请检查后端服务是否启动正常或 API Key 限额。`,
          files: [],
          isTyping: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div 
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative flex flex-col min-h-screen bg-[#060A17] text-white overflow-x-hidden selection:bg-[#7cc133]/40 selection:text-white"
    >
      {/* Dynamic Cosmic Space & Shooting Stars Background */}
      <SpaceBackground />

      {/* Drag & Drop Visual Overlay */}
      <DragDropOverlay isDragging={isDragging} />

      {/* Minimal Top Header with Model Switcher */}
      <Header 
        onClearChat={handleClearChat} 
        messagesCount={messages.length} 
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />

      {/* Main Content Area */}
      <main className="relative flex-1 flex flex-col justify-between w-full max-w-4xl mx-auto px-4 z-10">
        
        {!hasMessages ? (
          /* ========================================================= */
          /* 1. CENTERED HERO STAGE (Empty State)                      */
          /* Earth + Center Input Box ONLY                             */
          /* ========================================================= */
          <div className="flex-1 flex flex-col items-center justify-center py-10 my-auto text-center w-full">
            
            {/* Animated Earth Element */}
            <div className="mb-8 cursor-default">
              <EarthGlobe compact={false} />
            </div>

            {/* The Centralized Input Box */}
            <div className="w-full max-w-2xl">
              <ChatInput
                input={input}
                setInput={setInput}
                files={files}
                setFiles={setFiles}
                onSend={() => handleSend()}
                isLoading={isLoading}
                isCenter={true}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
              />
            </div>

          </div>
        ) : (
          /* ========================================================= */
          /* 2. CONVERSATION VIEW (Active Chat State)                  */
          /* Scrollable Messages + Compact Earth + Input Dock          */
          /* ========================================================= */
          <div className="flex-1 flex flex-col justify-between py-4">
            
            {/* Compact Earth at top of chat */}
            <div className="flex items-center justify-center pb-2">
              <EarthGlobe compact={true} />
            </div>

            {/* Message Stream */}
            <div className="space-y-4 pb-6 flex-1">
              {messages.map((msg, index) => (
                <MessageItem key={index} message={msg} />
              ))}

              {isLoading && (
                <ThinkingLoader />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Docked Central Input Box at bottom of conversation */}
            <div className="sticky bottom-0 bg-gradient-to-t from-[#060A17] via-[#060A17]/95 to-transparent pt-3 pb-5">
              <ChatInput
                input={input}
                setInput={setInput}
                files={files}
                setFiles={setFiles}
                onSend={() => handleSend()}
                isLoading={isLoading}
                isCenter={false}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
              />
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

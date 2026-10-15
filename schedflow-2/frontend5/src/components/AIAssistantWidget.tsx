import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  RotateCcw,
} from 'lucide-react';
import api, { getErrorMessage } from '../api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

const PRESET_QUERIES = [
  'Which rooms are free on Monday period 3?',
  'Who is free on Tuesday P1?',
  'Any conflicts right now?',
  'What does Section A have on Wednesday?',
  'Who is over their workload cap?',
  'Latest announcements',
];

export default function AIAssistantWidget() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Hello! I am your SchedFlow Chrono Assistant. Ask me about room availability, teacher schedules, section timetables, or live conflict detection.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, messages]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText ?? input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/assistant/ask', { message: textToSend });
      const reply = res.data?.reply || 'No information found.';

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: getErrorMessage(err, 'Unable to query the assistant. Please verify backend connection.'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        text: 'Chat history cleared. How can I assist you with scheduling today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Blurred Backdrop overlay to completely eliminate background visual overlap */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
          />
        )}
      </AnimatePresence>

      <div className="ai-assistant-widget no-wave fixed bottom-6 right-6 z-[9999] select-none pointer-events-auto" data-no-wave="true">
        <AnimatePresence mode="wait">
          {/* Floating Refined Pill Trigger (No neon lightning, no spinning stars) */}
          {!isOpen && (
            <motion.button
              key="chat-trigger"
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[#0f141f]/95 border border-white/15 backdrop-blur-xl shadow-xl hover:border-white/30 hover:bg-[#141b29] text-white cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>

              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white tracking-tight">Assistant</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/60 font-mono">Chrono AI</span>
                </div>
              </div>
            </motion.button>
          )}

          {/* Solid Dark Glass Chat Dialog Window */}
          {isOpen && (
            <motion.div
              key="chat-window"
              initial={{ opacity: 0, scale: 0.92, y: 20, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="w-[92vw] sm:w-[440px] h-[580px] max-h-[85vh] rounded-3xl bg-[#0b0f17] border border-white/15 backdrop-blur-3xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-3.5 border-b border-white/10 bg-white/[0.03] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">Chrono Assistant</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-mono">
                        Active
                      </span>
                    </div>
                    <div className="text-[11px] text-white/50">Timetable & Campus Intelligence</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={clearChat}
                    title="Clear history"
                    className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    title="Close"
                    className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Chips Bar */}
              <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                {PRESET_QUERIES.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q)}
                    disabled={loading}
                    className="px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer shrink-0"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Message Thread */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 text-xs">
                {messages.map((m) => {
                  const isUser = m.sender === 'user';
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                          isUser
                            ? 'bg-blue-600 text-white font-medium'
                            : 'bg-white/10 text-white/80 border border-white/10'
                        }`}
                      >
                        {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      </div>

                      <div
                        className={`max-w-[82%] rounded-2xl px-4 py-2.5 leading-relaxed whitespace-pre-wrap break-words ${
                          isUser
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white/[0.05] border border-white/10 text-white/90 shadow-sm'
                        }`}
                      >
                        <div>{m.text}</div>
                        <div
                          className={`text-[9px] mt-1 text-right font-mono ${
                            isUser ? 'text-white/70' : 'text-white/40'
                          }`}
                        >
                          {m.time}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-white/10 text-white/80 border border-white/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3" />
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '200ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: '400ms' }} />
                      <span className="text-[11px] text-white/50 font-mono ml-2">Querying database...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="p-3 border-t border-white/10 bg-white/[0.02] shrink-0">
                <div className="flex items-center gap-2 bg-black/50 rounded-2xl border border-white/15 px-3 py-1.5 focus-within:border-blue-500/70 transition-all">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about rooms, faculty, or conflicts…"
                    className="flex-1 bg-transparent border-none text-white text-xs placeholder:text-white/40 focus:outline-none py-1.5"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className="w-7 h-7 rounded-xl bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500 transition-all flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>,
    document.body
  );
}

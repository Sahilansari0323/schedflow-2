import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, RotateCcw } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Hello! I am your SchedFlow Chrono Assistant. Ask me about room availability, faculty schedules, section timetables, or live conflict detection.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
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
      const reply = res.data?.reply || 'No schedule information found.';

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

  const handleClear = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        text: 'Session refreshed. How can I assist with your timetable today?',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="btn-primary rounded-full px-5 py-3 shadow-[0_12px_36px_rgba(116,201,71,0.35)] flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-[#081a05] transition-all duration-300 hover:scale-105"
        >
          <span className="shine" />
          <span className="w-2 h-2 rounded-full bg-[#081a05] animate-ping" />
          <span>SchedFlow Assist</span>
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* Slide-out Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] z-50 p-4 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="glass-strong rounded-3xl border border-white/15 h-[620px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#74C947]/20 border border-[#74C947]/40 flex items-center justify-center text-[#74C947]">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Chrono Assistant</h4>
                  <p className="text-[10px] font-mono text-[#74C947]">Live NLP Constraint Radar</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleClear}
                  title="Clear conversation"
                  className="btn-glass p-2 rounded-xl text-white/50 hover:text-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-glass p-2 rounded-xl text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="px-4 py-2 border-b border-white/[0.06] flex gap-2 overflow-x-auto no-scrollbar">
              {PRESET_QUERIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono bg-white/[0.05] border border-white/10 text-white/70 hover:text-[#74C947] hover:border-[#74C947]/30 transition"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-[#74C947]/20 flex items-center justify-center text-[#74C947] shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-wrap ${
                      m.sender === 'user'
                        ? 'bg-[#74C947] text-[#081a05] font-semibold rounded-tr-none'
                        : 'glass text-white/90 border border-white/10 rounded-tl-none font-mono text-[11px]'
                    }`}
                  >
                    {m.text}
                    <div
                      className={`text-[9px] mt-1 text-right ${
                        m.sender === 'user' ? 'text-[#081a05]/60' : 'text-white/40'
                      }`}
                    >
                      {m.time}
                    </div>
                  </div>
                  {m.sender === 'user' && (
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 items-center text-xs font-mono text-[#74C947] p-2">
                  <span className="w-2 h-2 rounded-full bg-[#74C947] animate-ping" />
                  <span>Evaluating live constraints...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t border-white/10 bg-white/[0.02] flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about rooms, teachers, clashes..."
                className="flex-1 glass rounded-2xl px-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#74C947]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary p-2.5 rounded-2xl disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

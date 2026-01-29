import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { geminiService } from '../services/geminiService';

// Use any to bypass potential type mismatches in ESM environment
const Motion = motion as any;

interface NexusAIProps {
  businessData?: any;
}

const NexusAI: React.FC<NexusAIProps> = ({ businessData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isThinking]);

  const handleSend = async () => {
    if (!query.trim() || isThinking) return;

    const userMsg = query;
    setQuery('');
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsThinking(true);

    try {
      // Context preparation: Send a snapshot of the current business state for more accurate strategy
      const response = await geminiService.performDeepThinking(userMsg, businessData);
      setHistory(prev => [...prev, { role: 'ai', content: response }]);
    } catch (err) {
      setHistory(prev => [...prev, { role: 'ai', content: "I encountered a synchronization error. Please try again." }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      {/* Floating Toggle Button */}
      <Motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
          isOpen ? 'bg-slate-900 text-white rotate-90' : 'bg-emerald-600 text-white'
        }`}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-brain'} text-xl`}></i>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
          </span>
        )}
      </Motion.button>

      {/* Thinking Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
            className="absolute bottom-20 right-0 w-[450px] max-h-[700px] h-[80vh] bg-white rounded-[40px] shadow-3xl border border-slate-100 flex flex-col overflow-hidden backdrop-blur-xl bg-white/95"
          >
            <header className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <i className="fas fa-network-wired"></i>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Nexus Intelligence</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Strategy Engine Active</span>
                  </div>
                </div>
              </div>
              <div className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                Pro 3.0
              </div>
            </header>

            {/* Conversation Flow */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar"
            >
              {history.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-2xl">
                    <i className="fas fa-comment-alt"></i>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] max-w-[200px]">
                    Ask Nexus for strategic inventory analysis, growth projections, or marketing blueprints.
                  </p>
                </div>
              )}

              {history.map((msg, idx) => (
                <Motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-5 rounded-[24px] text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-emerald-600 text-white font-bold rounded-tr-none shadow-lg' 
                      : 'bg-slate-50 text-slate-600 font-medium rounded-tl-none border border-slate-100'
                  }`}>
                    {msg.content}
                  </div>
                </Motion.div>
              ))}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] p-5 bg-slate-900 rounded-[24px] rounded-tl-none shadow-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                      </div>
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Deep Strategic Analysis...</span>
                    </div>
                    <div className="w-full bg-white/10 h-0.5 rounded-full overflow-hidden">
                      <Motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-1/2 h-full bg-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Command Input Area */}
            <footer className="p-8 border-t bg-white">
              <div className="relative group">
                <textarea
                  rows={2}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask for a strategic analysis..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-[28px] pl-6 pr-16 py-4 outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs font-bold no-scrollbar resize-none"
                ></textarea>
                <button
                  onClick={handleSend}
                  disabled={isThinking || !query.trim()}
                  className={`absolute right-3 bottom-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    query.trim() ? 'bg-emerald-600 text-white shadow-lg scale-100' : 'bg-slate-200 text-slate-400 scale-90'
                  }`}
                >
                  <i className="fas fa-paper-plane text-xs"></i>
                </button>
              </div>
              <div className="flex justify-between items-center mt-4">
                 <div className="flex items-center gap-2">
                    <i className="fas fa-bolt text-amber-500 text-[10px]"></i>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Reasoning engine: Thinking Mode (32K Tokens)</span>
                 </div>
                 <button 
                  onClick={() => setHistory([])}
                  className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition"
                >
                  Clear Feed
                </button>
              </div>
            </footer>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NexusAI;
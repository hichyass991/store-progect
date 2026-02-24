
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SupportRequest, User, UserRole } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface SupportDeskProps {
  supportRequests: SupportRequest[];
  setSupportRequests: React.Dispatch<React.SetStateAction<SupportRequest[]>>;
  onReply: (requestId: string, message: string) => void;
  currentUser: User;
}

const SupportDesk: React.FC<SupportDeskProps> = ({ supportRequests, setSupportRequests, onReply, currentUser }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selectedReq, setSelectedReq] = useState<SupportRequest | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Hooks must be called before any conditional returns
  const filtered = useMemo(() => {
    if (filter === 'all') return supportRequests;
    return supportRequests.filter(r => r.status === filter);
  }, [supportRequests, filter]);

  const activeReq = useMemo(() => {
    if (!selectedReq) return null;
    return supportRequests.find(r => r.id === selectedReq.id) || selectedReq;
  }, [selectedReq, supportRequests]);

  if (currentUser.role !== UserRole.ADMIN) {
    return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">Restricted Access</div>;
  }

  const toggleStatus = (id: string) => {
    setSupportRequests(prev => prev.map(r => 
      r.id === id ? { ...r, status: r.status === 'pending' ? 'resolved' : 'pending' } : r
    ));
    if (selectedReq?.id === id) setSelectedReq(prev => prev ? ({ ...prev, status: prev.status === 'pending' ? 'resolved' : 'pending' }) : null);
  };

  const deleteRequest = (id: string) => {
    if (window.confirm('Delete this support transmission from the ledger?')) {
      setSupportRequests(prev => prev.filter(r => r.id !== id));
      setSelectedReq(null);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !replyMessage.trim()) return;
    onReply(selectedReq.id, replyMessage);
    setReplyMessage('');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">Support Desk</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Personnel Inquiry & Access Restoration Terminal</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
           {(['all', 'pending', 'resolved'] as const).map(f => (
             <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {f}
             </button>
           ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Requests List */}
        <div className="lg:col-span-5 space-y-4">
           {filtered.map(r => (
             <Motion.div 
                layout
                key={r.id}
                onClick={() => setSelectedReq(r)}
                className={`p-6 rounded-[32px] border-2 cursor-pointer transition-all ${activeReq?.id === r.id ? 'bg-white border-indigo-600 shadow-2xl scale-[1.02] z-10' : 'bg-white border-transparent border-slate-100 hover:border-indigo-100 shadow-sm'}`}
             >
                <div className="flex justify-between items-start mb-4">
                   <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${r.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                      {r.status}
                   </div>
                   <span className="text-[9px] font-bold text-slate-300 uppercase">{r.timestamp}</span>
                </div>
                <h4 className="font-black text-slate-800 text-sm leading-tight mb-2 truncate">{r.subject}</h4>
                <div className="flex items-center gap-3">
                   <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                      {r.userName.substring(0, 1)}
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-600">{r.userName}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{r.userEmail}</p>
                   </div>
                </div>
             </Motion.div>
           ))}
           {filtered.length === 0 && (
             <div className="py-20 text-center space-y-4 opacity-20">
                <i className="fas fa-inbox text-6xl text-slate-400"></i>
                <p className="text-[10px] font-black uppercase tracking-widest">No Transmissions Logged</p>
             </div>
           )}
        </div>

        {/* Detailed View */}
        <div className="lg:col-span-7">
           <AnimatePresence mode="wait">
              {activeReq ? (
                <Motion.div 
                  key={activeReq.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-[48px] border border-slate-200 shadow-3xl p-12 space-y-10 min-h-[600px] flex flex-col overflow-hidden"
                >
                   <header className="flex justify-between items-start border-b pb-8">
                      <div>
                         <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Transmission ID: {activeReq.id}</p>
                         <h3 className="text-3xl font-black text-slate-800 tracking-tight italic">{activeReq.subject}</h3>
                         <div className="flex items-center gap-6 mt-4">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black">
                                  {activeReq.userName.substring(0, 1)}
                               </div>
                               <div>
                                  <p className="text-xs font-black text-slate-800">{activeReq.userName}</p>
                                  <p className="text-[10px] font-bold text-slate-400">{activeReq.userEmail}</p>
                               </div>
                            </div>
                            <div className="h-8 w-px bg-slate-100" />
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               Sent at {activeReq.timestamp}
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => toggleStatus(activeReq.id)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition shadow-sm border ${activeReq.status === 'resolved' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white text-slate-300 hover:text-emerald-600'}`}
                          title="Mark as Resolved"
                        >
                          <i className="fas fa-check-double"></i>
                        </button>
                        <button 
                          onClick={() => deleteRequest(activeReq.id)}
                          className="w-12 h-12 rounded-2xl bg-white text-slate-300 hover:text-red-500 transition shadow-sm border"
                          title="Delete Request"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                   </header>

                   <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pr-2">
                      <div className="p-8 bg-slate-50 rounded-[32px] border border-white">
                        <p className="text-lg font-medium text-slate-600 leading-relaxed italic">
                          "{activeReq.message}"
                        </p>
                      </div>

                      {activeReq.attachments && activeReq.attachments.length > 0 && (
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <i className="fas fa-paperclip"></i> Visual Evidence Attachments
                           </h4>
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {activeReq.attachments.map((at, idx) => (
                                <div key={idx} className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-100 hover:border-indigo-400 transition-all cursor-zoom-in shadow-sm">
                                   {at.type === 'image' ? (
                                      <img src={at.url} className="w-full h-full object-cover" />
                                   ) : (
                                      <video src={at.url} className="w-full h-full object-cover" controls />
                                   )}
                                   <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <span className="bg-white text-indigo-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase">Inspect</span>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      {activeReq.replies && activeReq.replies.length > 0 && (
                        <div className="space-y-6 pt-6 border-t">
                           <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Administrative Response Feed</h4>
                           {activeReq.replies.map((reply) => (
                             <Motion.div 
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               key={reply.id} 
                               className="bg-indigo-50 border border-indigo-100 p-8 rounded-[32px] space-y-4 relative overflow-hidden"
                             >
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                   <i className="fas fa-reply-all text-4xl"></i>
                                </div>
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-lg">
                                         {reply.adminName.substring(0, 1)}
                                      </div>
                                      <p className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">{reply.adminName}</p>
                                   </div>
                                   <span className="text-[9px] font-bold text-indigo-300 uppercase">{reply.timestamp}</span>
                                </div>
                                <p className="text-sm font-medium text-indigo-700 leading-relaxed italic">
                                   {reply.message}
                                </p>
                             </Motion.div>
                           ))}
                        </div>
                      )}
                   </div>

                   <footer className="pt-8 border-t space-y-6">
                      <form onSubmit={handleSendReply} className="space-y-4">
                         <div className="relative">
                            <textarea 
                               rows={3}
                               className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-[32px] px-8 py-6 outline-none transition-all font-bold text-sm text-slate-800 placeholder:text-slate-300 resize-none"
                               placeholder="Draft your administrative response..."
                               value={replyMessage}
                               onChange={(e) => setReplyMessage(e.target.value)}
                            />
                            <div className="absolute bottom-4 right-4 flex gap-2">
                               <button 
                                  type="button"
                                  onClick={() => window.location.href = `mailto:${activeReq.userEmail}?subject=Re: ${activeReq.subject}`}
                                  className="w-10 h-10 rounded-full bg-white text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 flex items-center justify-center transition"
                               >
                                  <i className="fas fa-external-link-alt text-xs"></i>
                               </button>
                               <button 
                                  type="submit"
                                  disabled={!replyMessage.trim()}
                                  className="bg-slate-900 text-white px-8 h-10 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all disabled:opacity-30 disabled:pointer-events-none"
                               >
                                  Send Response
                               </button>
                            </div>
                         </div>
                      </form>
                   </footer>
                </Motion.div>
              ) : (
                <div className="bg-slate-50 border-4 border-dashed border-slate-200 rounded-[56px] h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20 opacity-30">
                   <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl mb-6 shadow-sm">
                      <i className="fas fa-mouse-pointer"></i>
                   </div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Select Transmission</h3>
                   <p className="text-xs font-bold text-slate-400 mt-2">Pick an inquiry from the left panel to review personnel communications.</p>
                </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SupportDesk;

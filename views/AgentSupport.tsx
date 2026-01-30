
import React, { useState } from 'react';
import { User, SupportRequest, SupportAttachment } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface AgentSupportProps {
  supportRequests: SupportRequest[];
  onSendRequest: (req: Omit<SupportRequest, 'id' | 'timestamp' | 'status'>) => void;
  currentUser: User;
}

const AgentSupport: React.FC<AgentSupportProps> = ({ supportRequests, onSendRequest, currentUser }) => {
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const myRequests = supportRequests.filter(r => r.userId === currentUser.id);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIDE = 1200;
          if (width > MAX_SIDE) {
            height *= MAX_SIDE / width;
            width = MAX_SIDE;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsUploading(true);
    
    // Explicitly cast to File[] to avoid unknown type inference errors
    const fileArray = Array.from(files) as File[];
    for (const file of fileArray) {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file);
        setAttachments(prev => [...prev, { type: 'image', url: compressed }]);
      } else if (file.type.startsWith('video/')) {
        // Videos are handled as data URLs in this local simulation
        const reader = new FileReader();
        reader.onload = (ev) => {
          setAttachments(prev => [...prev, { type: 'video', url: ev.target?.result as string }]);
        };
        reader.readAsDataURL(file);
      }
    }
    setIsUploading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendRequest({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      subject: formData.subject,
      message: formData.message,
      attachments
    });
    setFormData({ subject: '', message: '' });
    setAttachments([]);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 5000);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-32">
      <header>
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">Support Portal</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Direct Communication Channel with Operations Command</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Form Section */}
        <div className="lg:col-span-7">
          <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-2xl shadow-slate-200/40 space-y-8 relative overflow-hidden">
             <AnimatePresence>
                {isSuccess && (
                  <Motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-0 left-0 w-full h-full bg-emerald-600 z-50 flex flex-col items-center justify-center text-center p-10"
                  >
                     <i className="fas fa-check-circle text-6xl text-white mb-6"></i>
                     <h3 className="text-3xl font-black text-white italic tracking-tighter">Transmission Successful</h3>
                     <p className="text-emerald-100 font-medium mt-4 max-w-xs">Your inquiry has been logged in the Administrative ledger.</p>
                     <button onClick={() => setIsSuccess(false)} className="mt-8 px-8 py-3 bg-white text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest">Send Another</button>
                  </Motion.div>
                )}
             </AnimatePresence>

             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Inquiry Subject</label>
                   <input 
                    type="text" required
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-bold"
                    placeholder="e.g. Lead Synchronization Issue"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Detailed Narrative</label>
                   <textarea 
                    rows={6} required
                    className="w-full bg-slate-50 border-none rounded-[32px] px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-medium text-sm resize-none"
                    placeholder="Describe the situation in detail..."
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                   />
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center px-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Multi-Media Evidence</label>
                      <span className="text-[9px] font-bold text-indigo-600 uppercase">Proof-of-Issue Required</span>
                   </div>
                   
                   <div className="grid grid-cols-4 gap-4">
                      {attachments.map((at, idx) => (
                        <div key={idx} className="aspect-square bg-slate-50 rounded-2xl border-2 border-white shadow-sm relative group overflow-hidden">
                           {at.type === 'image' ? (
                             <img src={at.url} className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white gap-1">
                                <i className="fas fa-video text-xs"></i>
                                <span className="text-[7px] font-black uppercase">Video Proof</span>
                             </div>
                           )}
                           <button 
                            type="button"
                            onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
                           >
                             <i className="fas fa-times text-[10px]"></i>
                           </button>
                        </div>
                      ))}
                      
                      {attachments.length < 4 && (
                        <label className={`aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                           <i className={`fas ${isUploading ? 'fa-circle-notch fa-spin' : 'fa-camera'} text-slate-300 group-hover:text-indigo-500 text-xl`}></i>
                           <span className="text-[8px] font-black text-slate-400 uppercase mt-2">{isUploading ? 'Processing' : 'Upload Proof'}</span>
                           <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
                        </label>
                      )}
                   </div>
                </div>

                <footer className="pt-6 border-t flex items-center justify-between">
                   <div className="flex items-center gap-2 text-slate-400">
                      <i className="fas fa-info-circle text-[10px]"></i>
                      <p className="text-[9px] font-bold uppercase tracking-widest">Response ETA: 12-24 Hours</p>
                   </div>
                   <button 
                    type="submit"
                    className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all active:scale-95"
                   >
                     Submit Transmission
                   </button>
                </footer>
             </form>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-5 space-y-6">
           <header className="flex justify-between items-center px-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Communication History</h4>
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{myRequests.length} LOGS</span>
           </header>

           <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 no-scrollbar">
              {myRequests.map(r => (
                <div 
                  key={r.id} 
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className={`bg-white p-6 rounded-[32px] border transition-all cursor-pointer group shadow-sm ${expandedId === r.id ? 'border-indigo-600 ring-4 ring-indigo-50 shadow-xl' : 'border-slate-100 hover:border-indigo-200'}`}
                >
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                         <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${r.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {r.status}
                         </div>
                         {r.replies && r.replies.length > 0 && (
                           <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse">
                              Admin Reply Active
                           </div>
                         )}
                      </div>
                      <span className="text-[9px] font-bold text-slate-300">{r.timestamp}</span>
                   </div>
                   <h5 className="font-black text-slate-800 text-sm leading-tight mb-2">{r.subject}</h5>
                   <p className={`text-[11px] font-medium text-slate-500 leading-relaxed italic ${expandedId === r.id ? '' : 'line-clamp-2'}`}>
                      "{r.message}"
                   </p>
                   
                   <AnimatePresence>
                      {expandedId === r.id && (
                        <Motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-6 pt-6"
                        >
                           {r.attachments && r.attachments.length > 0 && (
                             <div className="flex flex-wrap gap-2 pt-2">
                                {r.attachments.map((at, i) => (
                                  <div key={i} className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                     {at.type === 'image' ? <img src={at.url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-800 flex items-center justify-center"><i className="fas fa-video text-[10px] text-white/50"></i></div>}
                                  </div>
                                ))}
                             </div>
                           )}

                           {/* Replies Section */}
                           {r.replies && r.replies.length > 0 ? (
                             <div className="space-y-4 pt-4 border-t border-slate-50">
                                <h6 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Admin Responses</h6>
                                {r.replies.map(reply => (
                                  <div key={reply.id} className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 space-y-2 relative">
                                     <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black text-indigo-900 uppercase">{reply.adminName}</p>
                                        <span className="text-[8px] font-bold text-indigo-300">{reply.timestamp}</span>
                                     </div>
                                     <p className="text-xs text-indigo-700 font-medium leading-relaxed italic">
                                        {reply.message}
                                     </p>
                                  </div>
                                ))}
                             </div>
                           ) : (
                             <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-slate-300">
                                <i className="fas fa-clock text-[10px]"></i>
                                <p className="text-[9px] font-bold uppercase tracking-widest">Awaiting Command Response</p>
                             </div>
                           )}
                        </Motion.div>
                      )}
                   </AnimatePresence>
                </div>
              ))}
              {myRequests.length === 0 && (
                <div className="py-20 text-center space-y-4 opacity-20">
                   <i className="fas fa-inbox text-5xl"></i>
                   <p className="text-[10px] font-black uppercase tracking-widest">No Transmissions Recorded</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AgentSupport;

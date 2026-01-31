
import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, Product, User, UserRole } from '../types';
import { supabaseService } from '../services/supabaseService';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface CallCenterProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  products: Product[];
  currentUser: User;
}

const CallCenter: React.FC<CallCenterProps> = ({ leads, setLeads, products, currentUser }) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LeadStatus | 'all'>('new');
  const [isShipping, setIsShipping] = useState(false);

  const selectedLead = useMemo(() => leads.find(l => l.id === selectedLeadId), [selectedLeadId, leads]);
  const product = useMemo(() => products.find(p => p.id === selectedLead?.product_id), [selectedLead, products]);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search) || l.id_num.includes(search);
      const matchesFilter = filter === 'all' ? true : l.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [leads, search, filter]);

  const handleUpdateStatus = async (status: LeadStatus) => {
    if (!selectedLead) return;
    const updated = { ...selectedLead, status, updatedAt: new Date().toLocaleString() };
    setLeads(prev => prev.map(l => l.id === selectedLead.id ? updated : l));
    await supabaseService.syncLead(updated, product);
  };

  const handleShipOrder = async () => {
    if (!selectedLead) return;
    setIsShipping(true);
    await handleUpdateStatus(LeadStatus.SHIPPED);
    setTimeout(() => {
        setIsShipping(false);
        alert("Order handed over to Logistics Queue.");
    }, 800);
  };

  const statusActions = [
    { status: LeadStatus.CONFIRMED, icon: 'fa-check-circle', color: 'bg-emerald-500', label: 'Confirm Order' },
    { status: LeadStatus.NO_REPLY, icon: 'fa-phone-slash', color: 'bg-amber-500', label: 'No Reply' },
    { status: LeadStatus.CALL_LATER, icon: 'fa-clock', color: 'bg-blue-500', label: 'Call Later' },
    { status: LeadStatus.WRONG, icon: 'fa-user-times', color: 'bg-slate-400', label: 'Wrong Number' },
    { status: LeadStatus.CANCELLED, icon: 'fa-times-circle', color: 'bg-red-500', label: 'Cancelled' },
  ];

  return (
    <div className="flex h-full bg-slate-50 overflow-hidden font-inter">
      {/* Sidebar: Lead Queue */}
      <aside className="w-96 border-r bg-white flex flex-col shadow-sm z-10">
        <header className="p-6 border-b space-y-4">
           <div>
              <h2 className="text-2xl font-black text-slate-800 italic tracking-tighter">Call Terminal</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Lead Validation Queue</p>
           </div>
           <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
              <input 
                type="text" 
                placeholder="Search phone, ID or name..." 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>
           <div className="flex gap-1 overflow-x-auto no-scrollbar pb-2">
              {['all', 'new', 'no reply', 'confirmed', 'shipped'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition ${filter === f ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                >
                  {f}
                </button>
              ))}
           </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredLeads.map(l => (
            <div 
              key={l.id} 
              onClick={() => setSelectedLeadId(l.id)}
              className={`p-5 border-b cursor-pointer transition-all hover:bg-slate-50 group ${selectedLeadId === l.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'}`}
            >
               <div className="flex justify-between items-start mb-1">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-slate-800 text-sm group-hover:text-emerald-600 transition-colors truncate">{l.name}</h4>
                    <span className="text-[9px] font-mono text-slate-400 font-bold">{l.id_num}</span>
                  </div>
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">{l.createdAt.split(',')[0]}</span>
               </div>
               <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                    <i className="fas fa-phone-alt text-[10px] opacity-40"></i>
                    {l.phone}
                  </div>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                    l.status === 'new' ? 'bg-indigo-100 text-indigo-600' : 
                    l.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 
                    l.status === 'shipped' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {l.status}
                  </span>
               </div>
            </div>
          ))}
          {filteredLeads.length === 0 && (
            <div className="py-20 text-center opacity-20">
               <i className="fas fa-headset text-4xl mb-4"></i>
               <p className="text-[10px] font-black uppercase tracking-widest">Queue is Empty</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel: Dossier & Control */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        <AnimatePresence mode="wait">
          {selectedLead ? (
            <Motion.div 
              key={selectedLead.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-10 max-w-5xl mx-auto space-y-10 pb-20"
            >
               {/* Client Header Card */}
               <section className="bg-white p-10 rounded-[48px] border-2 border-white shadow-2xl shadow-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-10">
                  <div className="flex items-center gap-8">
                     <div className="w-24 h-24 rounded-[32px] bg-slate-900 flex items-center justify-center text-white text-3xl font-black shadow-xl italic">
                        {selectedLead.name.substring(0, 1)}
                     </div>
                     <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tighter italic">{selectedLead.name}</h1>
                        <div className="flex items-center gap-4 mt-3">
                           <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-2 text-emerald-600 font-black text-lg hover:underline decoration-emerald-300">
                              <i className="fas fa-phone-alt"></i>
                              {selectedLead.phone}
                           </a>
                           <div className="h-4 w-px bg-slate-200" />
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Ref: {selectedLead.id_num}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => window.open(`https://wa.me/${selectedLead.phone.replace(/\s/g, '')}`, '_blank')} className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shadow-lg shadow-emerald-100 hover:scale-110 transition-transform">
                        <i className="fab fa-whatsapp"></i>
                     </button>
                     <a href={`tel:${selectedLead.phone}`} className="w-16 h-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-xl hover:scale-110 transition-transform">
                        <i className="fas fa-phone-volume animate-pulse"></i>
                     </a>
                  </div>
               </section>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Artifact / Order Intelligence */}
                  <section className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8 flex flex-col">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <i className="fas fa-box-open text-indigo-500"></i> Artifact & Label
                     </h3>
                     
                     <div className="flex gap-6 items-start">
                        {product && (
                           <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border shadow-sm flex-shrink-0">
                              <img src={product.photo} className="w-full h-full object-cover" />
                           </div>
                        )}
                        <div className="flex-1 space-y-2">
                           <h4 className="text-lg font-black text-slate-800 tracking-tight">{product?.title || 'Unknown Product'}</h4>
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product?.sku || '---'}</div>
                           <div className="text-xl font-black text-emerald-600">{product?.price.toFixed(2)} <span className="text-xs">{product?.currency}</span></div>
                        </div>
                     </div>

                     {/* QR Code Container - FIXED URL WITH ENCODING */}
                     <div className="mt-auto pt-6 border-t border-slate-50 flex flex-col items-center justify-center gap-4 bg-slate-50/50 rounded-3xl p-6">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-slate-100 min-w-[160px] min-h-[160px] flex items-center justify-center">
                           <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(selectedLead.id_num)}`} 
                              alt="Order QR Code"
                              className="w-32 h-32 object-contain"
                              onError={(e) => {
                                 (e.target as HTMLImageElement).src = 'https://placehold.co/150x150?text=QR+Error';
                              }}
                           />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Scan to Validate Dispatch</p>
                     </div>
                  </section>

                  {/* Delivery Intelligence */}
                  <section className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-6">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-red-500"></i> Logistics Data
                     </h3>
                     <div className="space-y-6">
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Full Name (Consignee)</p>
                           <p className="text-lg font-black text-slate-800">{selectedLead.firstName} {selectedLead.lastName}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Deployment City</p>
                           <p className="text-lg font-black text-slate-800 uppercase">{selectedLead.city || 'Not Specified'}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Digital Mail</p>
                           <p className="text-sm font-bold text-slate-600">{selectedLead.email || 'No email provided'}</p>
                        </div>
                        <div className="pt-4 border-t border-slate-50">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Internal Notes</p>
                           <textarea className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold outline-none" rows={2} placeholder="Add delivery instructions..."></textarea>
                        </div>
                     </div>
                  </section>
               </div>

               {/* Command Center: Action Panel */}
               <section className="bg-slate-900 p-12 rounded-[56px] text-white space-y-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                     <i className="fas fa-headset text-[10rem]"></i>
                  </div>
                  <div className="flex justify-between items-end">
                     <div>
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Command Execution</h3>
                        <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Commit pipeline status update</p>
                     </div>
                     {selectedLead.status === LeadStatus.CONFIRMED && (
                        <button 
                          onClick={handleShipOrder}
                          disabled={isShipping}
                          className="bg-emerald-600 text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                        >
                           {isShipping ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-truck"></i>}
                           Dispatch Order
                        </button>
                     )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                     {statusActions.map(action => (
                        <button
                          key={action.status}
                          onClick={() => handleUpdateStatus(action.status)}
                          className={`flex flex-col items-center justify-center p-6 rounded-[32px] border-2 border-white/5 transition-all group hover:scale-105 ${selectedLead.status === action.status ? action.color + ' border-white/40 shadow-2xl' : 'bg-white/5 hover:bg-white/10'}`}
                        >
                           <i className={`fas ${action.icon} text-2xl mb-4 group-hover:scale-110 transition-transform`}></i>
                           <span className="text-[9px] font-black uppercase tracking-widest text-center">{action.label}</span>
                        </button>
                     ))}
                  </div>

                  <footer className="flex justify-between items-center pt-10 border-t border-white/5">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Terminal Active</span>
                     </div>
                     <button onClick={() => setSelectedLeadId(null)} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition">Exit Dossier</button>
                  </footer>
               </section>
            </Motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 text-center opacity-30">
               <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-5xl mb-8 shadow-sm">
                  <i className="fas fa-headset"></i>
               </div>
               <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Operational Queue</h2>
               <p className="text-sm font-bold text-slate-400 mt-4 uppercase tracking-[0.3em] max-w-xs mx-auto leading-relaxed">Select a prospect from the queue to initiate identity validation protocol.</p>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default CallCenter;

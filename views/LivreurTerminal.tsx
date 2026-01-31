
import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, Product, User } from '../types';
import { supabaseService } from '../services/supabaseService';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface LivreurTerminalProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  products: Product[];
  currentUser: User;
}

const LivreurTerminal: React.FC<LivreurTerminalProps> = ({ leads, setLeads, products, currentUser }) => {
  const [view, setView] = useState<'list' | 'scan' | 'detail'>('list');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  // IMPORTANT: Only show orders assigned to THIS specific delivery driver
  const scannedOrders = useMemo(() => {
    return leads.filter(l => 
      (l.status === LeadStatus.SHIPPED || l.status === LeadStatus.CONFIRMED || l.status === LeadStatus.PROCESSING) &&
      l.assignedTo === currentUser.id
    );
  }, [leads, currentUser.id]);

  const selectedLead = useMemo(() => leads.find(l => l.id === selectedLeadId), [selectedLeadId, leads]);
  const product = useMemo(() => products.find(p => p.id === selectedLead?.product_id), [selectedLead, products]);

  const handleNewScan = () => {
    setView('scan');
  };

  const handleScanSimulation = async () => {
    setIsProcessing(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Find the lead in the master list that is ready for shipment and matches the ID
    const target = leads.find(l => 
      (l.id_num.includes(manualId) || l.id_num === '#' + manualId) &&
      (l.status === LeadStatus.CONFIRMED || l.status === LeadStatus.SHIPPED)
    );
    
    if (target) {
        // AUTO-ASSIGN: Claim the order for this livreur
        const updatedLead = { 
          ...target, 
          status: LeadStatus.PROCESSING, // Move to processing stage for the livreur
          assignedTo: currentUser.id,
          updatedAt: new Date().toLocaleString() 
        };
        
        setLeads(prev => prev.map(l => l.id === target.id ? updatedLead : l));
        await supabaseService.syncLead(updatedLead, products.find(p => p.id === target.product_id));
        
        setSelectedLeadId(target.id);
        setManualId('');
        setView('detail');
    } else {
        alert("Order not found or already assigned to another driver. Please verify with dispatch.");
    }
    setIsProcessing(false);
  };

  const handleUpdateStatus = async (status: LeadStatus) => {
    if (!selectedLead) return;
    setIsProcessing(true);
    
    const updatedLead = { 
      ...selectedLead, 
      status, 
      updatedAt: new Date().toLocaleString() 
    };
    
    setLeads(prev => prev.map(l => l.id === selectedLead.id ? updatedLead : l));
    await supabaseService.syncLead(updatedLead, product, { delivery_note: orderNote });
    
    setIsProcessing(false);
    setOrderNote('');
    setSelectedLeadId(null);
    setView('list');
  };

  return (
    <div className="min-h-full bg-slate-950 text-white font-inter pb-32 relative">
      <header className="p-8 sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 z-40 flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Fleet Console</h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Personnel: {currentUser.name}</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="text-right">
               <p className="text-[8px] font-black text-slate-500 uppercase">My Active Manifest</p>
               <p className="text-sm font-black text-emerald-500">{scannedOrders.length} ORDERS</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-emerald-500 shadow-xl">
               <i className="fas fa-truck-ramp-box"></i>
            </div>
         </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <Motion.div 
              key="list-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
               <div className="flex justify-between items-center px-2">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Scanned Inventory</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[8px] font-black text-slate-400 uppercase">Personalized Ledger Active</span>
                  </div>
               </div>

               {scannedOrders.length > 0 ? (
                  <div className="space-y-4">
                     {scannedOrders.map(l => {
                        const p = products.find(prod => prod.id === l.product_id);
                        return (
                           <div 
                              key={l.id} 
                              onClick={() => { setSelectedLeadId(l.id); setView('detail'); }}
                              className="bg-white/5 border border-white/5 p-6 rounded-[32px] flex justify-between items-center group active:bg-white/10 transition-all hover:border-emerald-500/30"
                           >
                              <div className="flex items-center gap-5">
                                 <div className="w-14 h-14 rounded-2xl bg-slate-900 overflow-hidden border border-white/10 flex-shrink-0">
                                    <img src={p?.photo} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                 </div>
                                 <div>
                                    <h4 className="font-black text-base italic leading-tight">{l.name}</h4>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{l.city}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                       <span className={`text-[8px] font-black px-2 py-0.5 rounded ${
                                          l.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                                       }`}>{l.status}</span>
                                       <span className="text-[8px] font-bold text-slate-600 font-mono">{l.id_num}</span>
                                    </div>
                                 </div>
                              </div>
                              <i className="fas fa-chevron-right text-slate-800 group-hover:text-emerald-500 transition-colors"></i>
                           </div>
                        );
                     })}
                  </div>
               ) : (
                  <div className="py-24 text-center opacity-20 space-y-4">
                     <i className="fas fa-barcode text-6xl"></i>
                     <p className="text-[10px] font-black uppercase tracking-[0.4em]">Scan an order to add it to your manifest</p>
                  </div>
               )}
            </Motion.div>
          )}

          {view === 'scan' && (
            <Motion.div 
              key="scan-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
               <button onClick={() => setView('list')} className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-white transition">
                  <i className="fas fa-arrow-left"></i> Manifest Ledger
               </button>

               <section className="bg-white/5 border border-white/10 rounded-[56px] p-12 flex flex-col items-center text-center space-y-10 shadow-3xl">
                  <div className={`w-48 h-48 rounded-[48px] border-4 border-dashed border-emerald-500/40 flex items-center justify-center relative overflow-hidden ${isProcessing ? 'animate-pulse' : ''}`}>
                     {isProcessing && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-scan-line" />}
                     <i className="fas fa-qrcode text-7xl text-slate-800 opacity-50"></i>
                  </div>
                  <div>
                     <h3 className="text-2xl font-black uppercase tracking-widest italic">Awaiting Order Link</h3>
                     <p className="text-xs text-slate-500 mt-3 max-w-[200px] mx-auto leading-relaxed">Enter the order identifier to claim the load for your shift.</p>
                  </div>

                  <div className="w-full space-y-6">
                     <input 
                        type="text" 
                        placeholder="Terminal ID (e.g. 1024)" 
                        className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-5 text-center text-xl font-black outline-none focus:border-emerald-500 transition-all placeholder:text-white/5"
                        value={manualId}
                        onChange={e => setManualId(e.target.value)}
                        autoFocus
                     />
                     <button 
                        onClick={handleScanSimulation}
                        disabled={isProcessing || !manualId}
                        className="w-full bg-emerald-600 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-30"
                     >
                        {isProcessing ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-link"></i>}
                        {isProcessing ? 'Validating ID...' : 'Claim & Start Delivery'}
                     </button>
                  </div>
               </section>
            </Motion.div>
          )}

          {view === 'detail' && selectedLead && (
            <Motion.div 
              key="detail-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
               <header className="flex justify-between items-center">
                  <button onClick={() => setView('list')} className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-white transition">
                     <i className="fas fa-arrow-left"></i> Exit Dossier
                  </button>
                  <span className="text-[10px] font-mono font-black text-emerald-500">{selectedLead.id_num}</span>
               </header>

               <section className="bg-white rounded-[56px] p-10 text-slate-900 space-y-10 shadow-3xl border-t-[12px] border-emerald-500">
                  <div className="flex justify-between items-start">
                     <div>
                        <h3 className="text-4xl font-black tracking-tighter leading-none italic uppercase">{selectedLead.name}</h3>
                        <div className="flex items-center gap-3 mt-4">
                           <span className="bg-slate-100 px-3 py-1 rounded-lg text-[9px] font-black uppercase text-slate-500">Target City: {selectedLead.city}</span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedLead.createdAt.split(',')[0]}</span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                     <div className="flex gap-5 items-center p-5 bg-slate-50 rounded-[32px] border border-slate-100">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg"><i className="fas fa-map-pin text-sm"></i></div>
                        <div className="flex-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Client Location</p>
                           <p className="font-bold text-sm leading-tight uppercase text-slate-700">{selectedLead.city}</p>
                        </div>
                        <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedLead.city)}`, '_blank')} className="w-10 h-10 rounded-full bg-white text-emerald-500 shadow-sm border flex items-center justify-center hover:scale-110 transition"><i className="fas fa-location-arrow text-xs"></i></button>
                     </div>
                     
                     <div className="flex gap-5 items-center p-5 bg-emerald-50 rounded-[32px] border border-emerald-100">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg"><i className="fas fa-phone-alt text-sm"></i></div>
                        <div className="flex-1">
                           <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Mobile Link</p>
                           <a href={`tel:${selectedLead.phone}`} className="font-black text-xl leading-none text-emerald-900 tracking-tight">{selectedLead.phone}</a>
                        </div>
                        <button onClick={() => window.open(`https://wa.me/${selectedLead.phone.replace(/\s/g, '')}`, '_blank')} className="w-10 h-10 rounded-full bg-white text-emerald-500 shadow-sm border flex items-center justify-center hover:scale-110 transition"><i className="fab fa-whatsapp text-xs"></i></button>
                     </div>
                  </div>

                  {product && (
                     <div className="p-6 bg-slate-900 rounded-[40px] text-white flex items-center gap-6 shadow-2xl relative overflow-hidden group">
                        <img src={product.photo} className="w-16 h-16 rounded-[24px] object-cover border-2 border-white/10" />
                        <div>
                           <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Artifact Information</p>
                           <h4 className="font-black text-base uppercase leading-tight italic truncate max-w-[180px]">{product.title}</h4>
                           <div className="mt-2 text-2xl font-black text-emerald-400">{product.price.toFixed(2)} <span className="text-[10px] text-white/40">{product.currency}</span></div>
                        </div>
                     </div>
                  )}

                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Driver's Narrative / Notes</label>
                     <textarea 
                        rows={3}
                        placeholder="State any delivery feedback or issues..."
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] px-8 py-6 text-sm font-bold outline-none focus:border-emerald-500 transition-all resize-none"
                        value={orderNote}
                        onChange={e => setOrderNote(e.target.value)}
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <button 
                        onClick={() => handleUpdateStatus(LeadStatus.DELIVERED)}
                        disabled={isProcessing}
                        className="w-full bg-emerald-600 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-3xl hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-3"
                     >
                        {isProcessing ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-check-circle"></i>}
                        Safi, T-liva
                     </button>
                     <button 
                        onClick={() => handleUpdateStatus(LeadStatus.RETURNED)}
                        disabled={isProcessing}
                        className="w-full bg-slate-100 text-slate-400 border-2 border-slate-100 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] active:scale-95 transition-all hover:bg-red-50 hover:text-red-500"
                     >
                        Rj3at (Returned)
                     </button>
                  </div>
               </section>
            </Motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action: NEW SCAN */}
      {view === 'list' && (
         <div className="fixed bottom-10 left-0 w-full px-8 z-50 pointer-events-none">
            <button 
               onClick={handleNewScan}
               className="pointer-events-auto w-full bg-emerald-600 text-white py-6 rounded-[40px] font-black text-xs uppercase tracking-[0.4em] shadow-[0_25px_50px_-12px_rgba(16,185,129,0.5)] hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
            >
               <i className="fas fa-barcode-read text-lg"></i>
               NEW SCAN (ASSIGN ORDER)
            </button>
         </div>
      )}

      <style>{`
        @keyframes scan-line {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LivreurTerminal;

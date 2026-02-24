
import React, { useState } from 'react';
import { Sheet, Product, User, SyncLog } from '../types';
import { syncService } from '../services/syncService';
import { supabaseService } from '../services/supabaseService';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface SheetsProps {
  sheets: Sheet[];
  setSheets: React.Dispatch<React.SetStateAction<Sheet[]>>;
  products: Product[];
  leads: any[];
  currentUser: User;
}

const Sheets: React.FC<SheetsProps> = ({ sheets, setSheets, products, currentUser }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSheet, setEditingSheet] = useState<Sheet | null>(null);
  const [formData, setFormData] = useState({ name: '', googleSheetUrl: '', productIds: [] as string[] });
  const [isSyncing, setIsSyncing] = useState(false);

  const resetForm = () => {
    setFormData({ name: '', googleSheetUrl: '', productIds: [] });
    setEditingSheet(null);
    setShowModal(false);
  };

  const handleEdit = (s: Sheet) => {
    setEditingSheet(s);
    setFormData({ name: s.name, googleSheetUrl: s.googleSheetUrl, productIds: s.productIds });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sever link with this external sheet?')) {
      await supabaseService.deleteSheet(id);
      setSheets(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sheetToSave: Sheet = editingSheet 
      ? { ...editingSheet, ...formData }
      : {
          id: 'sheet_' + Math.random().toString(36).substr(2, 9),
          ...formData,
          isSyncEnabled: true,
          syncLogs: [],
          createdAt: new Date().toLocaleDateString()
        };

    await supabaseService.syncSheet(sheetToSave);

    if (editingSheet) {
      setSheets(prev => prev.map(s => s.id === editingSheet.id ? sheetToSave : s));
    } else {
      setSheets(prev => [sheetToSave, ...prev]);
    }
    resetForm();
  };

  const toggleProduct = (pid: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(pid) 
        ? prev.productIds.filter(id => id !== pid)
        : [...prev.productIds, pid]
    }));
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic uppercase">Cloud Connect</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">External Ledger Synchronization Hub</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-slate-900 text-white px-10 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-emerald-600 transition-all active:scale-95"
        >
          + Initialize Connector
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sheets.map(s => (
          <Motion.div 
            layout
            key={s.id}
            className="bg-white rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden flex flex-col group"
          >
            <div className="p-10 space-y-8 flex-1">
               <div className="flex justify-between items-start">
                  <div className="flex items-center gap-5">
                     <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 text-2xl border border-emerald-100 shadow-sm">
                        <i className="fas fa-file-excel"></i>
                     </div>
                     <div>
                        <h4 className="text-2xl font-black text-slate-800 tracking-tight">{s.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Sink Node</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => handleEdit(s)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center border border-slate-100"><i className="fas fa-edit text-xs"></i></button>
                     <button onClick={() => handleDelete(s.id)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center border border-slate-100"><i className="fas fa-trash-alt text-xs"></i></button>
                  </div>
               </div>

               <div className="space-y-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Synched Artifacts</p>
                  <div className="flex flex-wrap gap-2">
                     {s.productIds.length > 0 ? (
                        s.productIds.map(pid => {
                           const p = products.find(prod => prod.id === pid);
                           return (
                              <span key={pid} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                 {p?.title || 'Unknown Unit'}
                              </span>
                           );
                        })
                     ) : (
                        <span className="text-[10px] font-medium text-slate-300 italic">No artifact filters applied (Syncing All)</span>
                     )}
                  </div>
               </div>

               <div className="space-y-4 pt-6 border-t border-slate-50">
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Latest Log Transmission</p>
                    <span className="text-[8px] font-bold text-slate-300 uppercase">Archive Mode Active</span>
                  </div>
                  <div className="space-y-2 max-h-[120px] overflow-y-auto no-scrollbar">
                     {s.syncLogs?.slice(0, 3).map(log => (
                        <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-white text-[10px]">
                           <div className="flex items-center gap-3">
                              <i className={`fas ${log.status === 'success' ? 'fa-check-circle text-emerald-500' : 'fa-exclamation-triangle text-red-500'} text-[10px]`}></i>
                              <span className="font-black text-slate-700">{log.entityName}</span>
                           </div>
                           <span className="text-[8px] font-bold text-slate-300">{log.timestamp}</span>
                        </div>
                     ))}
                     {(!s.syncLogs || s.syncLogs.length === 0) && (
                        <div className="text-center py-6 opacity-20">
                           <i className="fas fa-satellite-dish mb-2 block"></i>
                           <span className="text-[9px] font-black uppercase">Waiting for first trigger...</span>
                        </div>
                     )}
                  </div>
               </div>
            </div>
            
            <footer className="px-10 py-6 bg-slate-950 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <i className="fas fa-link text-indigo-400 text-xs"></i>
                  <span className="text-[9px] font-mono text-slate-500 truncate max-w-[200px]">{s.googleSheetUrl}</span>
               </div>
               <button 
                  onClick={() => window.open(s.googleSheetUrl, '_blank')}
                  className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:text-white transition-colors"
               >
                  Verify Link <i className="fas fa-external-link-alt ml-1"></i>
               </button>
            </footer>
          </Motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
            <Motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} 
               animate={{ scale: 1, opacity: 1, y: 0 }} 
               exit={{ scale: 0.9, opacity: 0, y: 20 }} 
               className="relative bg-white w-full max-w-2xl rounded-[48px] shadow-3xl overflow-hidden my-auto"
            >
              <header className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">Synchronization Protocol</h3>
                <button onClick={resetForm} className="w-12 h-12 rounded-full hover:bg-white flex items-center justify-center text-slate-400 hover:text-red-500 transition shadow-sm border border-slate-100 bg-white"><i className="fas fa-times"></i></button>
              </header>
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Node Nomenclature</label>
                    <input type="text" required className="w-full bg-slate-50 border-none rounded-2xl px-8 py-5 outline-none font-black text-slate-800 focus:ring-4 focus:ring-indigo-500/10 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Master Logistics Hub" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Google Deployment URL</label>
                    <input type="url" required className="w-full bg-slate-50 border-none rounded-2xl px-8 py-5 outline-none font-mono text-xs text-slate-600 focus:ring-4 focus:ring-indigo-500/10 transition-all" value={formData.googleSheetUrl} onChange={e => setFormData({...formData, googleSheetUrl: e.target.value})} placeholder="https://script.google.com/macros/s/..." />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Entity Filter (Sink Subset)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto no-scrollbar p-2 bg-slate-50 rounded-[32px] border border-slate-100 shadow-inner">
                    {products.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        className={`p-4 rounded-2xl text-[10px] font-black uppercase text-left transition-all border-2 ${formData.productIds.includes(p.id) ? 'bg-white border-emerald-500 text-emerald-700 shadow-lg' : 'bg-transparent border-transparent text-slate-400 hover:bg-white/50'}`}
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                </div>

                <footer className="pt-6 border-t flex gap-4">
                  <button type="button" onClick={resetForm} className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Abort</button>
                  <button type="submit" className="flex-[2] bg-slate-900 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-emerald-600 transition-all">
                     {editingSheet ? 'Commit Updates' : 'Manifest Connector'}
                  </button>
                </footer>
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sheets;

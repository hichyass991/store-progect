
import React, { useState, useMemo } from 'react';
import { Sheet, Product, Lead, LeadStatus, SyncLog, User } from '../types';
import { syncService } from '../services/syncService';
import { supabaseService } from '../services/supabaseService';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Motion = motion as any;

interface SheetsProps {
  sheets: Sheet[];
  setSheets: React.Dispatch<React.SetStateAction<Sheet[]>>;
  products: Product[];
  leads: Lead[];
  // Added missing currentUser prop to fix App.tsx error
  currentUser: User;
}

const Sheets: React.FC<SheetsProps> = ({ sheets, setSheets, products, leads, currentUser }) => {
  const navigate = useNavigate();
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSheet, setEditingSheet] = useState<Sheet | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({ 
    name: '', 
    productIds: [] as string[], 
    googleSheetUrl: '',
    isSyncEnabled: true 
  });

  const selectedSheet = sheets.find(s => s.id === selectedSheetId);

  const resetForm = () => {
    setFormData({ name: '', productIds: [], googleSheetUrl: '', isSyncEnabled: true });
    setEditingSheet(null);
    setShowFormModal(false);
    setProductSearchQuery('');
  };

  const openAdd = () => {
    setEditingSheet(null);
    setFormData({ name: '', productIds: [], googleSheetUrl: '', isSyncEnabled: true });
    setShowFormModal(true);
  };

  const openEdit = (s: Sheet) => {
    setEditingSheet(s);
    setFormData({ 
      name: s.name, 
      productIds: s.productIds, 
      googleSheetUrl: s.googleSheetUrl || '',
      isSyncEnabled: s.isSyncEnabled 
    });
    setShowFormModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this sheet manager? This will disconnect your catalog from Google Sheets.')) {
      await supabaseService.deleteSheet(id);
      setSheets(prev => prev.filter(s => s.id !== id));
      if (selectedSheetId === id) setSelectedSheetId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let sheetToSave: Sheet;

    if (editingSheet) {
      sheetToSave = { 
        ...editingSheet, 
        name: formData.name, 
        productIds: formData.productIds,
        googleSheetUrl: formData.googleSheetUrl,
        isSyncEnabled: formData.isSyncEnabled
      };
      setSheets(prev => prev.map(s => s.id === editingSheet.id ? sheetToSave : s));
    } else {
      sheetToSave = {
        id: 'sheet_' + Math.random().toString(36).substr(2, 9),
        name: formData.name,
        productIds: formData.productIds,
        googleSheetUrl: formData.googleSheetUrl,
        isSyncEnabled: formData.isSyncEnabled,
        syncLogs: [],
        createdAt: new Date().toLocaleString()
      };
      setSheets(prev => [sheetToSave, ...prev]);
    }

    // Sync to Supabase
    await supabaseService.syncSheet(sheetToSave);
    resetForm();
  };

  const toggleProduct = (pid: string) => {
    setFormData(prev => {
      const isSelected = prev.productIds.includes(pid);
      return {
        ...prev,
        productIds: isSelected ? prev.productIds.filter(id => id !== pid) : [...prev.productIds, pid]
      };
    });
  };

  const getLeadsForSheet = (sheet: Sheet) => {
    return leads.filter(l => sheet.productIds.includes(l.product_id));
  };

  const filteredProductsInModal = useMemo(() => {
    return products.filter(p => 
      p.title.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(productSearchQuery.toLowerCase())
    );
  }, [products, productSearchQuery]);

  if (selectedSheetId && selectedSheet) {
    const sheetLeads = getLeadsForSheet(selectedSheet);
    const sheetProducts = products.filter(p => selectedSheet.productIds.includes(p.id));

    return (
      <div className="p-8 space-y-8 animate-in fade-in duration-500">
        <header className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button onClick={() => setSelectedSheetId(null)} className="w-12 h-12 rounded-full hover:bg-white transition flex items-center justify-center text-slate-400 border border-slate-200 bg-slate-50 shadow-sm">
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic">{selectedSheet.name}</h2>
                {selectedSheet.googleSheetUrl ? (
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Google Sheets Sync
                  </span>
                ) : (
                   <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-200">
                    Offline Ledger
                  </span>
                )}
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Auto-Sync Logic: Lead Entry → Webhook → Spreadsheet Append</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/sheets/guide')} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 hover:bg-slate-50">
              <i className="fas fa-book"></i> Documentation
            </button>
            <button onClick={() => openEdit(selectedSheet)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
              <i className="fas fa-cog"></i> Connector Settings
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
             {/* Linked Products Panel */}
             <div className="bg-white p-8 rounded-[40px] border-2 border-slate-50 shadow-sm space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <i className="fas fa-boxes text-indigo-500"></i> Linked for Sync
                </h4>
                <div className="space-y-3">
                   {sheetProducts.map(p => (
                     <div key={p.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <img src={p.photo} className="w-8 h-8 rounded-lg object-cover" />
                        <div className="min-w-0">
                           <div className="text-[10px] font-black uppercase truncate text-slate-800">{p.title}</div>
                           <div className="text-[8px] font-bold text-slate-400">{p.sku}</div>
                        </div>
                     </div>
                   ))}
                   {sheetProducts.length === 0 && (
                     <p className="text-[9px] font-black uppercase text-slate-400 text-center py-4">No products linked.</p>
                   )}
                </div>
                <button onClick={() => openEdit(selectedSheet)} className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-[9px] font-black uppercase text-slate-400 hover:border-indigo-500 hover:text-indigo-600 transition">
                   Manage Linkages
                </button>
             </div>

             {/* Connection Info Panel */}
             <div className="bg-emerald-600 p-8 rounded-[40px] text-white space-y-4 shadow-xl shadow-emerald-100">
                <div className="flex justify-between items-start">
                   <h4 className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Google Sync Active</h4>
                   <i className="fas fa-file-excel text-xl opacity-40"></i>
                </div>
                {selectedSheet.googleSheetUrl ? (
                   <>
                      <p className="text-[11px] font-bold leading-relaxed opacity-90">Every new lead or order for linked products is automatically mapped to your spreadsheet.</p>
                      <a 
                        href={selectedSheet.googleSheetUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-white text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition"
                      >
                        <i className="fas fa-external-link-alt"></i> Open Spreadsheet
                      </a>
                   </>
                ) : (
                   <p className="text-[11px] font-bold opacity-70 italic leading-relaxed">Add your Apps Script URL in settings to enable real-time cloud sync.</p>
                )}
             </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {/* Lead Activity Table */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
              <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                 <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                   <i className="fas fa-stream text-indigo-500"></i> Synced Lead History
                 </h4>
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tracking {sheetLeads.length} Linked Leads</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b text-slate-400 uppercase text-[9px] font-black tracking-[0.3em]">
                    <tr>
                      <th className="px-8 py-6">Identity</th>
                      <th className="px-6 py-6">Linked SKU</th>
                      <th className="px-6 py-6">Source Channel</th>
                      <th className="px-8 py-6 text-right">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sheetLeads.map(l => {
                      const p = products.find(prod => prod.id === l.product_id);
                      return (
                        <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="font-black text-slate-800">{l.name}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase">{l.phone || l.email}</div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{p?.sku || 'N/A'}</span>
                              <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{p?.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                              l.source === 'Storefront' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                            }`}>
                              {l.source || 'Manual'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right text-[10px] font-bold text-slate-300 uppercase">{l.createdAt}</td>
                        </tr>
                      );
                    })}
                    {sheetLeads.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-32 text-center text-slate-300 font-black uppercase tracking-widest text-lg opacity-20 italic">No sync activity for this sheet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sync Logic Documentation */}
            <div className="bg-slate-900 rounded-[40px] p-8 text-white space-y-4">
               <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Configuration Instructions</h4>
               <p className="text-xs font-medium text-slate-400 leading-relaxed">
                 To enable synchronization, your Google Sheet URL must be a <strong>Google Apps Script Web App</strong>. 
                 Deploy a script with a <code>doPost(e)</code> function that appends rows based on the incoming JSON payload.
               </p>
               <div className="bg-slate-800 p-4 rounded-2xl font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre">
                 {syncService.getAppsScriptTemplate()}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">Source (Sheets)</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Enterprise-Grade Google Sheets Integration</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/sheets/guide')} className="bg-white border-2 border-slate-100 text-slate-400 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center gap-2">
            <i className="fas fa-book"></i> Guide d'installation
          </button>
          <button onClick={openAdd} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 transition-all">
            + Create Sync Manager
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {sheets.map(s => {
          const sLeads = getLeadsForSheet(s);
          return (
            <Motion.div
              whileHover={{ y: -5 }}
              key={s.id}
              onClick={() => setSelectedSheetId(s.id)}
              className="bg-white p-8 rounded-[48px] border-2 border-slate-50 shadow-xl shadow-slate-200/40 cursor-pointer group relative overflow-hidden flex flex-col justify-between min-h-[300px]"
            >
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); openEdit(s); }} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-indigo-600 shadow-sm border border-slate-100 flex items-center justify-center transition">
                    <i className="fas fa-edit text-[10px]"></i>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-red-500 shadow-sm border border-slate-100 flex items-center justify-center transition">
                    <i className="fas fa-trash-alt text-[10px]"></i>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-sm border transition-all duration-500 ${s.googleSheetUrl ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                  <i className={`fas ${s.googleSheetUrl ? 'fa-file-excel' : 'fa-file-invoice'}`}></i>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-1">{s.name}</h4>
                  {s.googleSheetUrl ? (
                    <div className="flex items-center gap-2 mt-2">
                       <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                       <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Sync Enabled</span>
                    </div>
                  ) : (
                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">Local Manager Only</div>
                  )}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-50 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Yield Count</span>
                  <span className="text-emerald-600">{sLeads.length} Leads</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Products</span>
                  <span className="text-indigo-600">{s.productIds.length} Linked</span>
                </div>
              </div>
            </Motion.div>
          );
        })}
        {sheets.length === 0 && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center text-center opacity-20">
            <i className="fas fa-link text-8xl mb-6 text-slate-300"></i>
            <h3 className="text-2xl font-black uppercase tracking-widest italic text-slate-800">No Sheets Active</h3>
            <p className="text-xs font-bold uppercase tracking-widest mt-2 text-slate-400">Link your catalog to Google Sheets for automated data distribution.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto no-scrollbar">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
            <Motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-2xl rounded-[48px] shadow-3xl overflow-hidden my-auto">
              <header className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic leading-none">{editingSheet ? 'Sync Configuration' : 'Establish New Sync'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Connecting Products to Google Sheets Pipeline</p>
                </div>
                <button onClick={resetForm} className="w-12 h-12 rounded-full border-2 border-white hover:bg-white hover:text-red-500 transition-all flex items-center justify-center text-slate-400 shadow-sm bg-slate-50">
                  <i className="fas fa-times"></i>
                </button>
              </header>

              <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Sheet Name</label>
                    <input
                      type="text" required
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-800 text-lg"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Main Architecture Cluster"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Google Apps Script URL</label>
                    <div className="relative">
                      <input
                        type="url"
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-500 text-xs"
                        value={formData.googleSheetUrl}
                        onChange={(e) => setFormData({ ...formData, googleSheetUrl: e.target.value })}
                        placeholder="https://script.google.com/macros/s/.../exec"
                      />
                      <i className="fas fa-link absolute right-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Products to Sync</label>
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{formData.productIds.length} Linked</span>
                  </div>

                  <div className="relative">
                    <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-6 py-3 outline-none text-xs font-bold text-slate-600"
                      placeholder="Search existing products..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                    {filteredProductsInModal.length > 0 ? filteredProductsInModal.map(p => {
                      const isSelected = formData.productIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleProduct(p.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.01]' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-white hover:border-indigo-100 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl overflow-hidden border bg-white flex-shrink-0">
                              <img src={p.photo} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left">
                              <div className={`text-[11px] font-black uppercase leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>{p.title}</div>
                              <div className={`text-[9px] font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{p.sku}</div>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition ${isSelected ? 'bg-white text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                            <i className={`fas ${isSelected ? 'fa-check' : 'fa-plus'} text-[10px]`}></i>
                          </div>
                        </button>
                      );
                    }) : (
                      <div className="text-center py-12 opacity-40 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100">
                         <i className="fas fa-box-open text-4xl mb-4 text-slate-300"></i>
                         <p className="text-[10px] font-black uppercase tracking-widest">No products found</p>
                      </div>
                    )}
                  </div>
                </div>

                <footer className="pt-8 border-t flex gap-4 sticky bottom-0 bg-white">
                  <button type="button" onClick={resetForm} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition">Discard</button>
                  <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-102 transition-all">
                    {editingSheet ? 'Sync Artifact' : 'Establish Link'}
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

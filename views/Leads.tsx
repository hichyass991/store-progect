
import React, { useState, useRef, useMemo } from 'react';
import { Lead, LeadStatus, Product, Sheet, SyncLog, User, UserRole } from '../types';
import { syncService } from '../services/syncService';
import { csvService } from '../services/csvService';
import { supabaseService } from '../services/supabaseService';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface LeadsProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  products: Product[];
  sheets: Sheet[];
  setSheets: React.Dispatch<React.SetStateAction<Sheet[]>>;
  currentUser: User;
}

const Leads: React.FC<LeadsProps> = ({ leads, setLeads, products, sheets, setSheets, currentUser }) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [syncingSheet, setSyncingSheet] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newLead, setNewLead] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContact: 'both' as 'phone' | 'email' | 'both',
    company: '',
    country: '',
    region: '',
    city: '',
    product_id: ''
  });

  const handleExport = () => {
    csvService.exportToCSV(filtered, 'gwapa_leads_master');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const imported = await csvService.importLeadsFromCSV(file);
      if (imported.length > 0) {
        const enriched = imported.map(l => ({ ...l, assignedTo: currentUser.id }));
        // Sync each imported lead to Cloud
        for (const lead of enriched as Lead[]) {
           await supabaseService.syncLead(lead, products.find(p => p.id === lead.product_id));
        }
        setLeads(prev => [...(enriched as Lead[]), ...prev]);
        alert(`Successfully ingested ${imported.length} leads into the pipeline.`);
      }
    } catch (err) {
      alert("Format violation detected. Ensure CSV headers match the Gwapashop schema.");
    }
    e.target.value = ''; // Reset
  };

  const updateStatus = async (id: string, newStatus: LeadStatus) => {
    const updatedLeads = leads.map(l => l.id === id ? { ...l, status: newStatus, updatedAt: new Date().toLocaleString() } : l);
    setLeads(updatedLeads);
    const lead = updatedLeads.find(l => l.id === id);
    if (lead) {
      await supabaseService.syncLead(lead, products.find(p => p.id === lead.product_id));
    }
  };

  const deleteLead = async (id: string) => {
    if (window.confirm('Delete this lead?')) {
      await supabaseService.deleteLead(id);
      setLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  const startEdit = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setNewLead({
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      email: lead.email || '',
      phone: lead.phone || '',
      preferredContact: lead.preferredContact || 'both',
      company: lead.company || '',
      country: lead.country || '',
      region: lead.region || '',
      city: lead.city || '',
      product_id: lead.product_id || ''
    });
    setShowModal(true);
  };

  const closeForm = () => {
    setShowModal(false);
    setEditingLeadId(null);
    setNewLead({ 
      firstName: '', lastName: '', email: '', phone: '', 
      preferredContact: 'both', company: '', country: '', 
      region: '', city: '', product_id: '' 
    });
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.firstName || !newLead.lastName || (!newLead.phone && !newLead.email) || !newLead.product_id) {
      alert("Please fill in required fields (Name, Contact, and Product).");
      return;
    }

    const now = new Date().toLocaleString();
    let leadToSync: Lead;
    
    if (editingLeadId) {
      const existing = leads.find(l => l.id === editingLeadId)!;
      leadToSync = {
        ...existing,
        ...newLead,
        name: `${newLead.firstName} ${newLead.lastName}`,
        updatedAt: now
      };
      setLeads(prev => prev.map(l => l.id === editingLeadId ? leadToSync : l));
    } else {
      leadToSync = {
        id: 'lead_' + Math.random().toString(36).substr(2, 9),
        id_num: '#' + (Math.floor(Math.random() * 9000) + 1000),
        name: `${newLead.firstName} ${newLead.lastName}`,
        firstName: newLead.firstName,
        lastName: newLead.lastName,
        email: newLead.email,
        phone: newLead.phone,
        preferredContact: newLead.preferredContact,
        company: newLead.company,
        country: newLead.country,
        region: newLead.region,
        city: newLead.city,
        product_id: newLead.product_id,
        status: LeadStatus.NEW,
        source: 'Manual',
        assignedTo: currentUser.id,
        createdAt: now,
        updatedAt: now
      };
      setLeads(prev => [leadToSync, ...prev]);
    }

    const product = products.find(p => p.id === leadToSync.product_id);
    
    // 1. Sync to Supabase
    await supabaseService.syncLead(leadToSync, product);

    // 2. Sync to Google Sheets if linked
    const targetSheet = sheets.find(s => s.productIds.includes(leadToSync.product_id) && s.googleSheetUrl);
    if (targetSheet && targetSheet.googleSheetUrl) {
      setSyncingSheet(targetSheet.name);
      const syncResult = await syncService.pushLead(targetSheet.googleSheetUrl, leadToSync, product);
      
      const newLog: SyncLog = {
        id: 'log_' + Math.random().toString(36).substr(2, 5),
        timestamp: now,
        entityName: leadToSync.name,
        status: syncResult.success ? 'success' : 'failure',
        message: syncResult.message
      };

      const updatedSheets = sheets.map(s => s.id === targetSheet.id ? {
        ...s,
        syncLogs: [newLog, ...(s.syncLogs || [])].slice(0, 10)
      } : s);
      setSheets(updatedSheets);
      
      // Update the sheet in Supabase too
      const sheetObj = updatedSheets.find(s => s.id === targetSheet.id);
      if (sheetObj) await supabaseService.syncSheet(sheetObj);

      setTimeout(() => setSyncingSheet(null), 2500);
    }
    
    closeForm();
  };

  const filtered = useMemo(() => {
    let base = leads;
    if (currentUser.role === UserRole.AGENT) {
      base = leads.filter(l => l.assignedTo === currentUser.id);
    }
    return base.filter(l => 
      l.name?.toLowerCase().includes(search.toLowerCase()) || 
      l.phone?.includes(search) || 
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.company?.toLowerCase().includes(search.toLowerCase())
    );
  }, [leads, currentUser, search]);

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
      
      <AnimatePresence>
        {syncingSheet && (
          <Motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] bg-emerald-600 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-emerald-400"
          >
            <i className="fas fa-sync fa-spin"></i>
            <div className="text-xs font-black uppercase tracking-widest">
              Pushing Lead Row to <span className="underline italic">{syncingSheet}</span>...
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">
            {currentUser.role === UserRole.ADMIN ? 'Global Leads Ledger' : 'My Leads Pipeline'}
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Direct Catalog Entry Pipeline</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {currentUser.role === UserRole.ADMIN && (
            <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
               <button onClick={handleImportClick} className="px-4 py-2 hover:bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition">
                 <i className="fas fa-file-import"></i> Import
               </button>
               <div className="w-px h-4 bg-slate-200 mx-1"></div>
               <button onClick={handleExport} className="px-4 py-2 hover:bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition">
                 <i className="fas fa-file-export"></i> Export
               </button>
            </div>
          )}
          
          <div className="relative flex-1 md:w-64">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500 transition shadow-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 transition-all whitespace-nowrap"
          >
            + Create Lead
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-400 uppercase text-[9px] font-black tracking-[0.3em]">
              <tr>
                <th className="px-8 py-6">Customer Ledger</th>
                <th className="px-6 py-6">Identity & Contact</th>
                <th className="px-6 py-6">Artifact</th>
                <th className="px-6 py-6">SKU</th>
                <th className="px-6 py-6">Source</th>
                <th className="px-6 py-6 text-center">Pipeline</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(l => {
                const product = products.find(p => p.id === l.product_id);
                const leadSheets = sheets.filter(s => s.productIds.includes(l.product_id));
                const hasGoogleSync = leadSheets.some(s => s.googleSheetUrl);
                
                return (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-emerald-600 font-black text-[10px] border shadow-sm uppercase">
                           {l.firstName?.[0] || ''}{l.lastName?.[0] || 'L'}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-sm leading-tight">{l.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{l.company || 'Private Prospect'}</div>
                            {hasGoogleSync && (
                              <div className="flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                <i className="fas fa-file-excel text-emerald-500 text-[8px]" title="Auto-Synced Active"></i>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        {l.phone && <div className="text-xs font-bold text-slate-600"><i className="fas fa-phone mr-2 text-[10px] text-slate-300"></i>{l.phone}</div>}
                        {l.email && <div className="text-xs font-bold text-slate-600"><i className="fas fa-envelope mr-2 text-[10px] text-slate-300"></i>{l.email}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 overflow-hidden border">
                          {product?.photo ? (
                            <img src={product.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-300"><i className="fas fa-box"></i></div>
                          )}
                        </div>
                        <div className="text-xs font-black text-slate-600 truncate max-w-[140px]">
                          {product?.title || 'Unknown Product'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-mono font-black text-slate-400 uppercase">
                        {product?.sku || '---'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${l.source === 'Storefront' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                        {l.source || 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <select 
                        className={`text-[9px] font-black uppercase px-3 py-2 rounded-xl border-2 transition appearance-none cursor-pointer outline-none ${
                          l.status === LeadStatus.CONFIRMED ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                          l.status === LeadStatus.CANCELLED ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-indigo-200'
                        }`}
                        value={l.status}
                        onChange={(e) => updateStatus(l.id, e.target.value as LeadStatus)}
                      >
                        {Object.values(LeadStatus).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEdit(l)}
                          className="w-10 h-10 rounded-xl hover:bg-emerald-50 text-slate-300 hover:text-emerald-600 transition-all flex items-center justify-center border border-transparent hover:border-emerald-100"
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button 
                          onClick={() => deleteLead(l.id)}
                          className="w-10 h-10 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all flex items-center justify-center border border-transparent hover:border-red-100"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-32 text-center">
                    <div className="opacity-10 text-6xl mb-4 text-slate-400"><i className="fas fa-address-book"></i></div>
                    <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-lg italic">No leads found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeForm} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
            <Motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-4xl rounded-[48px] shadow-3xl overflow-hidden my-auto">
              <header className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic leading-none">
                    {editingLeadId ? 'Update Prospect Profile' : 'New Prospect Entry'}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                    {editingLeadId ? 'Refining operational data for active pipeline item' : 'Connecting Local Leads to Cloud Infrastructure'}
                  </p>
                </div>
                <button onClick={closeForm} className="w-12 h-12 rounded-full border-2 border-white hover:bg-white hover:text-red-500 transition-all flex items-center justify-center text-slate-400 shadow-sm bg-slate-50">
                  <i className="fas fa-times"></i>
                </button>
              </header>
              <form onSubmit={handleSaveLead} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">First Name *</label>
                    <input type="text" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800" value={newLead.firstName} onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Last Name *</label>
                    <input type="text" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800" value={newLead.lastName} onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                    <input type="email" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                    <input type="tel" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800" value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Linked Product *</label>
                  <select required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-slate-600 appearance-none cursor-pointer" value={newLead.product_id} onChange={(e) => setNewLead({ ...newLead, product_id: e.target.value })}>
                    <option value="">Select a Product...</option>
                    {products.map(p => (<option key={p.id} value={p.id}>{p.title} ({p.sku})</option>))}
                  </select>
                </div>
                <footer className="pt-8 border-t flex gap-4">
                  <button type="button" onClick={closeForm} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition">Discard</button>
                  <button type="submit" className="flex-[2] bg-emerald-600 text-white py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:scale-102 transition-all">
                    {editingLeadId ? 'Commit Changes' : 'Register Lead & Sync'}
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

export default Leads;

import React, { useState } from 'react';
import { Lead, LeadStatus, Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface LeadsProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  products: Product[];
}

const Leads: React.FC<LeadsProps> = ({ leads, setLeads, products }) => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
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

  const updateStatus = (id: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus, updatedAt: new Date().toLocaleString() } : l));
  };

  const deleteLead = (id: string) => {
    if (window.confirm('Delete this lead?')) {
      setLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.firstName || !newLead.lastName || (!newLead.phone && !newLead.email) || !newLead.product_id) {
      alert("Please fill in required fields (Name, Contact, and Product).");
      return;
    }

    const now = new Date().toLocaleString();
    const lead: Lead = {
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
      createdAt: now,
      updatedAt: now
    };

    setLeads(prev => [lead, ...prev]);
    setShowModal(false);
    setNewLead({ 
      firstName: '', lastName: '', email: '', phone: '', 
      preferredContact: 'both', company: '', country: '', 
      region: '', city: '', product_id: '' 
    });
  };

  const filtered = leads.filter(l => 
    l.name?.toLowerCase().includes(search.toLowerCase()) || 
    l.phone?.includes(search) || 
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Processing Leads</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Direct Channel & Storefront Pipeline</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder="Search by name, company..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-emerald-500 transition shadow-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
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
                <th className="px-6 py-6">Pipeline</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(l => {
                const product = products.find(p => p.id === l.product_id);
                return (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-emerald-600 font-black text-[10px] border shadow-sm uppercase">
                           {l.firstName?.[0] || ''}{l.lastName?.[0] || 'L'}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-sm leading-tight">{l.name}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{l.company || 'Private Lead'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        {l.phone && <div className="text-xs font-bold text-slate-600"><i className="fas fa-phone mr-2 text-[10px] text-slate-300"></i>{l.phone}</div>}
                        {l.email && <div className="text-xs font-bold text-slate-600"><i className="fas fa-envelope mr-2 text-[10px] text-slate-300"></i>{l.email}</div>}
                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">
                          {l.city && `${l.city}, `}{l.country}
                        </div>
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
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <td colSpan={5} className="px-6 py-32 text-center">
                    <div className="opacity-10 text-6xl mb-4 text-slate-400"><i className="fas fa-address-book"></i></div>
                    <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-lg italic">No leads in queue</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Lead Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto">
            <Motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <Motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-[48px] shadow-3xl overflow-hidden my-auto"
            >
              <header className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic leading-none">New Prospect Entry</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Comprehensive Lead Profiling Engine</p>
                </div>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-12 h-12 rounded-full border-2 border-white hover:bg-white hover:text-red-500 transition-all flex items-center justify-center text-slate-400 shadow-sm bg-slate-50"
                >
                  <i className="fas fa-times"></i>
                </button>
              </header>
              
              <form onSubmit={handleCreateLead} className="p-10 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                {/* Name Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">First Name *</label>
                    <input 
                      type="text" required
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800"
                      value={newLead.firstName}
                      onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                      placeholder="Ex: Hicham"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Last Name *</label>
                    <input 
                      type="text" required
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800"
                      value={newLead.lastName}
                      onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                      placeholder="Idali"
                    />
                  </div>
                </div>

                {/* Contact Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                    <input 
                      type="email"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800"
                      value={newLead.email}
                      onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                      placeholder="hello@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                    <input 
                      type="tel"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800"
                      value={newLead.phone}
                      onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                      placeholder="0612345678"
                    />
                  </div>
                </div>

                {/* Metadata Group */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Company Name</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800"
                      value={newLead.company}
                      onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                      placeholder="Nexus Enterprises"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone or Email Preference</label>
                    <select 
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-slate-600 appearance-none cursor-pointer"
                      value={newLead.preferredContact}
                      onChange={(e) => setNewLead({ ...newLead, preferredContact: e.target.value as any })}
                    >
                      <option value="both">Both Channels</option>
                      <option value="phone">Phone Primary</option>
                      <option value="email">Email Primary</option>
                    </select>
                  </div>
                </div>

                {/* Geographic Group */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Country</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800"
                      value={newLead.country}
                      onChange={(e) => setNewLead({ ...newLead, country: e.target.value })}
                      placeholder="Morocco"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Region</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800"
                      value={newLead.region}
                      onChange={(e) => setNewLead({ ...newLead, region: e.target.value })}
                      placeholder="Casablanca-Settat"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">City</label>
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-800"
                      value={newLead.city}
                      onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                      placeholder="Casablanca"
                    />
                  </div>
                </div>

                {/* Artifact Link */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Interested Artifact *</label>
                  <div className="relative">
                    <select 
                      required
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-slate-600 appearance-none cursor-pointer"
                      value={newLead.product_id}
                      onChange={(e) => setNewLead({ ...newLead, product_id: e.target.value })}
                    >
                      <option value="">Select a Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.title} ({p.sku})</option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
                  </div>
                </div>

                <footer className="pt-8 border-t flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit" 
                    className="flex-[2] bg-emerald-600 text-white py-4 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Register Prospect
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
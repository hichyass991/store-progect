
import React, { useState } from 'react';
import { Lead, LeadStatus, Product } from '../types';

interface LeadsProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  products: Product[];
}

const Leads: React.FC<LeadsProps> = ({ leads, setLeads, products }) => {
  const [search, setSearch] = useState('');

  const updateStatus = (id: string, newStatus: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus, updatedAt: new Date().toLocaleString() } : l));
  };

  const deleteLead = (id: string) => {
    if (window.confirm('Delete this lead?')) {
      setLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  const filtered = leads.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search));

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800">Processing Leads</h2>
        <div className="relative w-64">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search leads..." 
            className="w-full pl-10 pr-4 py-2 bg-white border rounded-xl text-sm outline-none focus:border-emerald-500 transition shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b text-slate-400 uppercase text-[10px] font-bold tracking-widest">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Status / Workflow</th>
              <th className="px-6 py-4">Last Update</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(l => {
              const product = products.find(p => p.id === l.product_id);
              return (
                <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{l.name}</div>
                    <div className="text-xs text-slate-400 font-medium">{l.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-600 truncate max-w-[150px]">
                      {product?.title || 'Unknown Product'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      className={`text-[10px] font-black uppercase px-2 py-1.5 rounded-lg border-none outline-none cursor-pointer transition ${
                        l.status === LeadStatus.CONFIRMED ? 'bg-emerald-100 text-emerald-700' : 
                        l.status === LeadStatus.CANCELLED ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                      }`}
                      value={l.status}
                      onChange={(e) => updateStatus(l.id, e.target.value as LeadStatus)}
                    >
                      {Object.values(LeadStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">{l.updatedAt}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => deleteLead(l.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">No leads in the pipeline.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leads;

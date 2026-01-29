import React, { useState } from 'react';
import { Discount, Product } from '../types';

interface DiscountsProps {
  discounts: Discount[];
  setDiscounts: React.Dispatch<React.SetStateAction<Discount[]>>;
  products: Product[];
}

const Discounts: React.FC<DiscountsProps> = ({ discounts, setDiscounts, products }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Discount>>({
    name: '',
    type: 'percentage',
    value: 0,
    appliesTo: 'all',
    status: 'active'
  });

  const resetForm = () => {
    setFormData({ name: '', type: 'percentage', value: 0, appliesTo: 'all', status: 'active' });
    setShowModal(false);
  };

  const toggleProductSelection = (productId: string) => {
    const current = formData.appliesTo === 'all' ? [] : (formData.appliesTo as string[]);
    const next = current.includes(productId) ? current.filter(id => id !== productId) : [...current, productId];
    setFormData({ ...formData, appliesTo: next.length === 0 ? 'all' : next });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDiscount: Discount = {
      id: 'dsc_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toLocaleDateString(),
      ...(formData as Discount)
    };
    setDiscounts(prev => [newDiscount, ...prev]);
    resetForm();
  };

  const getTargetLabel = (appliesTo: 'all' | string[]) => {
    if (appliesTo === 'all') return 'Universal Storefront';
    return `${appliesTo.length} Targeted Product(s)`;
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Discount Engine</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Growth & Conversion Optimization Cluster</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
        >
          + New Campaign
        </button>
      </div>

      <div className="bg-white rounded-[40px] border-2 border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 border-b text-slate-400 uppercase text-[9px] font-black tracking-[0.3em]">
            <tr>
              <th className="px-10 py-6">Campaign Identity</th>
              <th className="px-6 py-6">Yield / Value</th>
              <th className="px-6 py-6">Distribution Target</th>
              <th className="px-6 py-6">Lifecycle Status</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {discounts.map(d => (
              <tr key={d.id} className="hover:bg-indigo-50/20 transition-colors group">
                <td className="px-10 py-6">
                  <div className="font-black text-slate-800 text-base">{d.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {d.id}</div>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-black text-sm">
                       {d.value}{d.type === 'percentage' ? '%' : ' SAR'}
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{d.type}</span>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <div className="text-slate-500 font-bold text-xs uppercase tracking-tight">{getTargetLabel(d.appliesTo)}</div>
                </td>
                <td className="px-6 py-6">
                  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ${
                    d.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-300'
                  }`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-10 py-6 text-right">
                   <button onClick={() => setDiscounts(prev => prev.filter(disc => disc.id !== d.id))} className="text-slate-300 hover:text-red-500 transition">
                      <i className="fas fa-trash-alt"></i>
                   </button>
                </td>
              </tr>
            ))}
            {discounts.length === 0 && (
              <tr><td colSpan={5} className="px-10 py-24 text-center text-slate-300 font-black uppercase tracking-widest text-lg opacity-20 italic">No Active Campaigns</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl" onClick={resetForm}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[54px] shadow-3xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in duration-500">
            {/* Left Panel: Form */}
            <div className="flex-1 p-12 space-y-10">
              <header>
                <h3 className="text-4xl font-black text-slate-800 tracking-tighter italic">Promo Design</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Campaign Architectural Blueprint</p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Campaign Name</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-800"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.g. Ramadan Midnight Sale"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Yield Logic</label>
                    <select 
                      className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-600 appearance-none cursor-pointer"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    >
                      <option value="percentage">Percentage Markdown (%)</option>
                      <option value="fixed">Fixed Reduction Amount (SAR)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Markdown Magnitude</label>
                    <input 
                      type="number" required
                      className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-indigo-600 text-2xl"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <footer className="pt-10 flex gap-4">
                   <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all">
                      Deploy Campaign
                   </button>
                </footer>
              </form>
            </div>

            {/* Right Panel: Targeting */}
            <div className="w-full md:w-96 bg-slate-50 p-12 flex flex-col border-l border-slate-100">
               <header className="mb-8">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Targeting Logic</h4>
                  <p className="text-xs font-bold text-slate-500 mt-2">Link this yield to specific entities or global catalog.</p>
               </header>

               <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
                  <button 
                    onClick={() => setFormData({ ...formData, appliesTo: 'all' })}
                    className={`w-full p-6 rounded-[28px] border-4 transition-all text-left group ${
                      formData.appliesTo === 'all' ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl' : 'bg-white border-transparent hover:border-indigo-100'
                    }`}
                  >
                    <i className={`fas fa-globe text-2xl mb-4 ${formData.appliesTo === 'all' ? 'text-white' : 'text-slate-200'}`}></i>
                    <div className="font-black text-xs uppercase tracking-widest">Global Catalog</div>
                    <div className={`text-[9px] font-bold mt-1 uppercase ${formData.appliesTo === 'all' ? 'text-indigo-100' : 'text-slate-400'}`}>Universal Deployment</div>
                  </button>

                  <div className="pt-4 space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Or Target Entities</label>
                    <div className="space-y-2">
                       {products.map(p => {
                         const isSelected = Array.isArray(formData.appliesTo) && formData.appliesTo.includes(p.id);
                         return (
                           <button
                             key={p.id}
                             onClick={() => toggleProductSelection(p.id)}
                             className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                               isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-transparent text-slate-500 hover:border-indigo-100'
                             }`}
                           >
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden">
                                   <img src={p.photo} alt="" className="w-full h-full object-cover" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-tight truncate max-w-[120px]">{p.title}</span>
                             </div>
                             <i className={`fas ${isSelected ? 'fa-check-circle' : 'fa-plus-circle opacity-10'}`}></i>
                           </button>
                         );
                       })}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discounts;

import React, { useState } from 'react';
import { Discount, Product, User } from '../types';
import { supabaseService } from '../services/supabaseService';

interface DiscountsProps {
  discounts: Discount[];
  setDiscounts: React.Dispatch<React.SetStateAction<Discount[]>>;
  products: Product[];
  currentUser: User;
}

const Discounts: React.FC<DiscountsProps> = ({ discounts, setDiscounts, products, currentUser }) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newDiscount: Discount = {
      id: 'dsc_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toLocaleDateString(),
      ...(formData as Discount)
    };

    // Cloud Sync
    await supabaseService.syncDiscount(newDiscount);

    setDiscounts(prev => [newDiscount, ...prev]);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this campaign?')) {
        await supabaseService.deleteDiscount(id);
        setDiscounts(prev => prev.filter(disc => disc.id !== id));
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Discount Engine</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Growth Engine</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
          + New Campaign
        </button>
      </div>

      <div className="bg-white rounded-[40px] border-2 border-slate-100 shadow-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 border-b text-slate-400 uppercase text-[9px] font-black tracking-[0.3em]">
            <tr>
              <th className="px-10 py-6">Campaign</th>
              <th className="px-6 py-6">Value</th>
              <th className="px-6 py-6">Target</th>
              <th className="px-10 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {discounts.map(d => (
              <tr key={d.id} className="hover:bg-indigo-50/20 transition-colors">
                <td className="px-10 py-6 font-black text-slate-800">{d.name}</td>
                <td className="px-6 py-6">
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-black text-sm inline-block">
                    {d.value}{d.type === 'percentage' ? '%' : ' SAR'}
                  </div>
                </td>
                <td className="px-6 py-6 text-xs text-slate-500 uppercase">{d.appliesTo === 'all' ? 'Universal' : 'Targeted'}</td>
                <td className="px-10 py-6 text-right">
                   <button onClick={() => handleDelete(d.id)} className="text-slate-300 hover:text-red-500"><i className="fas fa-trash-alt"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xl" onClick={resetForm}></div>
          <form onSubmit={handleSubmit} className="relative bg-white w-full max-lg rounded-[54px] p-12 space-y-8">
            <h3 className="text-3xl font-black text-slate-800 italic">Deploy Promo</h3>
            <input type="text" required className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 outline-none font-black" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Campaign Name" />
            <div className="grid grid-cols-2 gap-4">
              <select className="bg-slate-50 rounded-3xl px-6 py-4 outline-none font-black" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}>
                <option value="percentage">Markdown (%)</option>
                <option value="fixed">Fixed (SAR)</option>
              </select>
              <input type="number" required className="bg-slate-50 rounded-3xl px-6 py-4 outline-none font-black text-indigo-600" value={formData.value} onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })} />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[28px] font-black text-xs uppercase shadow-2xl">Launch Campaign</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Discounts;

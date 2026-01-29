import React, { useState } from 'react';
import { Category } from '../types';

interface CategoriesProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const Categories: React.FC<CategoriesProps> = ({ categories, setCategories }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: 'fa-tag' });

  const resetForm = () => {
    setFormData({ name: '', description: '', icon: 'fa-tag' });
    setEditingCategory(null);
    setShowModal(false);
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description, icon: cat.icon });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Archive this category? Products assigned to it will remain but the category tag will be lost from global filters.')) {
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, ...formData } : c));
    } else {
      const newCat: Category = {
        id: 'cat_' + Math.random().toString(36).substr(2, 9),
        ...formData,
        createdAt: new Date().toLocaleDateString()
      };
      setCategories(prev => [newCat, ...prev]);
    }
    resetForm();
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Taxonomy & Organization</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Global Product Classification Engine</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 transition-all"
        >
          + Create Category
        </button>
      </div>

      <div className="bg-white rounded-[40px] border-2 border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 border-b text-slate-400 uppercase text-[9px] font-black tracking-[0.3em]">
            <tr>
              <th className="px-10 py-6">Namespace</th>
              <th className="px-6 py-6">Narrative Description</th>
              <th className="px-6 py-6 text-center">Icon Asset</th>
              <th className="px-6 py-6">Created</th>
              <th className="px-10 py-6 text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-emerald-50/20 transition-colors group">
                <td className="px-10 py-6">
                  <div className="font-black text-slate-800 text-base">{cat.name}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {cat.id}</div>
                </td>
                <td className="px-6 py-6">
                  <p className="text-slate-500 font-medium max-w-md line-clamp-1 italic text-xs">{cat.description}</p>
                </td>
                <td className="px-6 py-6 text-center">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 m-auto group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <i className={`fas ${cat.icon}`}></i>
                  </div>
                </td>
                <td className="px-6 py-6 text-slate-400 font-bold text-[11px]">{cat.createdAt}</td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(cat)} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 transition flex items-center justify-center shadow-sm">
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600 transition flex items-center justify-center shadow-sm">
                      <i className="fas fa-trash-alt text-xs"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={5} className="px-10 py-24 text-center text-slate-300 font-black uppercase tracking-widest text-lg opacity-20 italic">No Categories Configured</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={resetForm}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[48px] shadow-3xl overflow-hidden animate-in zoom-in duration-300">
            <header className="p-10 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Category Blueprint</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure global classification item</p>
              </div>
              <button onClick={resetForm} className="w-12 h-12 rounded-full border-2 border-white hover:bg-white hover:text-red-500 transition-all flex items-center justify-center text-slate-400 shadow-sm bg-slate-50">
                <i className="fas fa-times"></i>
              </button>
            </header>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Display Name</label>
                  <input 
                    type="text" required
                    className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-slate-800"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="E.g. High-End Audio"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Visual Icon Asset (FontAwesome Class)</label>
                  <div className="flex gap-4">
                    <input 
                      type="text"
                      className="flex-1 bg-slate-50 border-none rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono text-xs"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="fa-laptop"
                    />
                    <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-xl">
                      <i className={`fas ${formData.icon}`}></i>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Narrative Description</label>
                  <textarea 
                    rows={4}
                    className="w-full bg-slate-50 border-none rounded-[32px] px-8 py-6 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold text-slate-600 leading-relaxed"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What defines this collection?"
                  ></textarea>
                </div>
              </div>

              <footer className="pt-8 border-t flex gap-4">
                <button type="button" onClick={resetForm} className="flex-1 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition">Discard</button>
                <button type="submit" className="flex-[2] bg-emerald-600 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all">
                  {editingCategory ? 'Sync Metadata' : 'Launch Category'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
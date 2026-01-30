
import React, { useState } from 'react';
import { Category, User } from '../types';
import { supabaseService } from '../services/supabaseService';

interface CategoriesProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  currentUser: User;
}

const Categories: React.FC<CategoriesProps> = ({ categories, setCategories, currentUser }) => {
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

  const handleDelete = async (id: string) => {
    if (window.confirm('Archive this category?')) {
      await supabaseService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const catToSave: Category = editingCategory 
      ? { ...editingCategory, ...formData }
      : {
          id: 'cat_' + Math.random().toString(36).substr(2, 9),
          ...formData,
          createdAt: new Date().toLocaleDateString()
        };

    // Cloud Sync
    await supabaseService.syncCategory(catToSave);

    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? catToSave : c));
    } else {
      setCategories(prev => [catToSave, ...prev]);
    }
    resetForm();
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Taxonomy</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Classification Engine</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 transition-all">
          + Create Category
        </button>
      </div>

      <div className="bg-white rounded-[40px] border-2 border-slate-100 shadow-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 border-b text-slate-400 uppercase text-[9px] font-black tracking-[0.3em]">
            <tr>
              <th className="px-10 py-6">Namespace</th>
              <th className="px-6 py-6">Narrative</th>
              <th className="px-10 py-6 text-right">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-emerald-50/20 transition-colors">
                <td className="px-10 py-6">
                  <div className="font-black text-slate-800">{cat.name}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-tighter">{cat.id}</div>
                </td>
                <td className="px-6 py-6 italic text-slate-500">{cat.description}</td>
                <td className="px-10 py-6 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(cat)} className="text-slate-400 hover:text-blue-600"><i className="fas fa-edit"></i></button>
                    <button onClick={() => handleDelete(cat.id)} className="text-slate-400 hover:text-red-600"><i className="fas fa-trash-alt"></i></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={resetForm}></div>
          <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-xl rounded-[48px] shadow-3xl p-10 space-y-8">
            <h3 className="text-3xl font-black text-slate-800">Category Blueprint</h3>
            <input type="text" required className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 outline-none font-black" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Display Name" />
            <textarea rows={4} className="w-full bg-slate-50 border-none rounded-[32px] px-8 py-6 outline-none font-bold text-slate-600" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Narrative Description" />
            <div className="flex gap-4">
              <button type="button" onClick={resetForm} className="flex-1 py-5 text-[10px] font-black uppercase text-slate-400">Discard</button>
              <button type="submit" className="flex-[2] bg-emerald-600 text-white py-5 rounded-[24px] font-black text-xs uppercase shadow-2xl">Save Category</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Categories;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from '../types';

interface StoresProps {
  stores: Store[];
  setStores: React.Dispatch<React.SetStateAction<Store[]>>;
}

const Stores: React.FC<StoresProps> = ({ stores, setStores }) => {
  const navigate = useNavigate();

  const createStore = () => {
    const name = prompt("Enter Store Name:");
    if (!name) return;

    // Fix: Added missing 'sections' property to comply with the Store interface
    const newStore: Store = {
      id: 'store_' + Math.random().toString(36).substr(2, 9),
      name: name,
      logo: '',
      banner: '',
      sections: [],
      social: { wa: '', ig: '', fb: '' },
      createdAt: new Date().toLocaleDateString()
    };
    setStores(prev => [newStore, ...prev]);
  };

  const deleteStore = (id: string) => {
    if (window.confirm('Delete this store? All designs will be lost.')) {
      setStores(prev => prev.filter(s => s.id !== id));
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-800">My Stores</h2>
        <button 
          onClick={createStore}
          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:scale-[1.02] transition"
        >
          + Add New Store
        </button>
      </div>

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b text-slate-400 uppercase text-[10px] font-bold tracking-widest">
            <tr>
              <th className="px-8 py-5">Store Identity</th>
              <th className="px-6 py-5">Created On</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stores.map(s => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border">
                      {s.logo ? <img src={s.logo} alt="" className="w-full h-full object-contain" /> : <i className="fas fa-store text-slate-300"></i>}
                    </div>
                    <div>
                      <div className="font-black text-slate-800 text-base">{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {s.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-slate-500 font-medium">{s.createdAt}</td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => navigate(`/stores/design/${s.id}`)}
                      className="bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm hover:scale-105 transition"
                    >
                      Manage Design
                    </button>
                    <button 
                      onClick={() => deleteStore(s.id)}
                      className="p-2 text-slate-300 hover:text-red-500 transition"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr>
                <td colSpan={3} className="px-8 py-20 text-center text-slate-400 italic">No stores created yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Stores;

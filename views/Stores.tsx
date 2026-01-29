
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from '../types';

interface StoresProps {
  stores: Store[];
  setStores: React.Dispatch<React.SetStateAction<Store[]>>;
}

const Stores: React.FC<StoresProps> = ({ stores, setStores }) => {
  const navigate = useNavigate();
  
  const [isAdding, setIsAdding] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [customizingStore, setCustomizingStore] = useState<Store | null>(null);

  const handleStartCreation = () => {
    setIsAdding(true);
  };

  const handleCustomizeStore = () => {
    if (!newStoreName.trim()) {
      alert("Please enter a store name.");
      return;
    }

    const newStore: Store = {
      id: 'store_' + Math.random().toString(36).substr(2, 9),
      name: newStoreName,
      logo: '',
      banner: '',
      sections: [],
      social: { wa: '', ig: '', fb: '' },
      createdAt: new Date().toLocaleDateString()
    };
    
    setStores(prev => [newStore, ...prev]);
    setCustomizingStore(newStore);
    setIsAdding(false);
    setNewStoreName('');
  };

  const deleteStore = (id: string) => {
    if (window.confirm('Delete this store? All designs will be lost.')) {
      setStores(prev => prev.filter(s => s.id !== id));
    }
  };

  const saveCustomization = (updatedStore: Store) => {
    setStores(prev => prev.map(s => s.id === updatedStore.id ? updatedStore : s));
    setCustomizingStore(null);
  };

  return (
    <div className="p-8 space-y-6 relative overflow-hidden min-h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">My Stores</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage and preview your digital storefronts</p>
        </div>
        {!isAdding && (
          <button 
            onClick={handleStartCreation}
            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:scale-[1.02] transition"
          >
            + Add New Store
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl border-2 border-emerald-500 shadow-xl shadow-emerald-50 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-2">New Store Identity</label>
              <input 
                type="text" 
                placeholder="Enter your store's brand name..." 
                className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 px-6 py-4 rounded-2xl outline-none transition font-bold text-slate-800"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto mt-6 md:mt-0">
              <button 
                onClick={handleCustomizeStore}
                className="flex-1 md:flex-none bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 whitespace-nowrap"
              >
                Customize Store
              </button>
              <button 
                onClick={() => { setIsAdding(false); setNewStoreName(''); }}
                className="bg-slate-100 text-slate-400 px-6 py-4 rounded-2xl font-bold text-xs uppercase hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-400 uppercase text-[10px] font-bold tracking-widest">
              <tr>
                <th className="px-8 py-5">Store Identity</th>
                <th className="px-6 py-5 text-center">Design Status</th>
                <th className="px-6 py-5">Created On</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border transition-transform group-hover:scale-110">
                        {s.logo ? <img src={s.logo} alt="" className="w-full h-full object-contain" /> : <div className="text-emerald-600 font-black text-xs">{s.name.substring(0, 2).toUpperCase()}</div>}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-base">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {s.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${s.sections?.length > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {s.sections?.length > 0 ? 'Designed' : 'Empty Shell'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-slate-500 font-medium">{s.createdAt}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end items-center gap-3">
                      <button 
                        onClick={() => window.open(`#/s/${s.id}`, '_blank')}
                        className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition shadow-sm active:scale-95"
                      >
                        <i className="fas fa-external-link-alt"></i>
                        View Live
                      </button>
                      <button 
                        onClick={() => setCustomizingStore(s)}
                        className="bg-white border-2 border-slate-100 text-slate-800 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 transition shadow-sm active:scale-95"
                      >
                        Quick Edit
                      </button>
                      <button 
                        onClick={() => navigate(`/stores/design/${s.id}`)}
                        className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-600 transition active:scale-95"
                      >
                        Studio Designer
                      </button>
                      <button 
                        onClick={() => deleteStore(s.id)}
                        className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition rounded-xl hover:bg-red-50"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {stores.length === 0 && !isAdding && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic font-medium">
                    No stores created yet. Click "+ Add New Store" to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {customizingStore && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCustomizingStore(null)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <header className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Customize Details</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configuring {customizingStore.name}</p>
              </div>
              <button onClick={() => setCustomizingStore(null)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 hover:text-red-500 transition shadow-sm border border-slate-100 bg-white">
                <i className="fas fa-times"></i>
              </button>
            </header>
            
            <div className="flex-1 p-8 overflow-y-auto space-y-8">
              <section className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Brand Logo (Image overrides name)</label>
                <div className="aspect-video bg-slate-50 rounded-3xl border-4 border-dashed border-slate-100 flex flex-col items-center justify-center p-6 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition group relative overflow-hidden">
                  {customizingStore.logo ? (
                    <img src={customizingStore.logo} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-300 shadow-sm group-hover:text-emerald-500 transition-colors mb-2">
                        <i className="fas fa-cloud-upload-alt text-xl"></i>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Logo Image</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const result = ev.target?.result as string;
                          setCustomizingStore({ ...customizingStore, logo: result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </section>

              <section className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Brand Display Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 p-4 rounded-2xl outline-none transition font-bold"
                    value={customizingStore.name}
                    onChange={(e) => setCustomizingStore({ ...customizingStore, name: e.target.value })}
                  />
                </div>
              </section>

              <section className="space-y-4 pt-4 border-t">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Contact Channels</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl group focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
                    <i className="fab fa-whatsapp text-emerald-500 text-lg"></i>
                    <input 
                      type="text" placeholder="WhatsApp Number" 
                      className="bg-transparent flex-1 outline-none text-xs font-bold"
                      value={customizingStore.social.wa}
                      onChange={(e) => setCustomizingStore({ ...customizingStore, social: { ...customizingStore.social, wa: e.target.value } })}
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl group focus-within:ring-2 focus-within:ring-pink-500 transition-all">
                    <i className="fab fa-instagram text-pink-500 text-lg"></i>
                    <input 
                      type="text" placeholder="Instagram Username" 
                      className="bg-transparent flex-1 outline-none text-xs font-bold"
                      value={customizingStore.social.ig}
                      onChange={(e) => setCustomizingStore({ ...customizingStore, social: { ...customizingStore.social, ig: e.target.value } })}
                    />
                  </div>
                </div>
              </section>
            </div>

            <footer className="p-8 border-t bg-slate-50/50 flex gap-3">
              <button 
                onClick={() => setCustomizingStore(null)}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition shadow-sm"
              >
                Discard
              </button>
              <button 
                onClick={() => saveCustomization(customizingStore)}
                className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:opacity-90 transition active:scale-[0.98]"
              >
                Save & Update Store
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stores;

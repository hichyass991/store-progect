
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store, Product, StoreSection, SectionType } from '../types';

interface StoreDesignerProps {
  stores: Store[];
  setStores: React.Dispatch<React.SetStateAction<Store[]>>;
  products: Product[];
}

const StoreDesigner: React.FC<StoreDesignerProps> = ({ stores, setStores, products }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [activeView, setActiveView] = useState<'pc' | 'mobile'>('pc');
  const [editingSection, setEditingSection] = useState<StoreSection | null>(null);

  useEffect(() => {
    const store = stores.find(s => s.id === id);
    if (store) setEditingStore({ ...store, sections: store.sections || [] });
  }, [id, stores]);

  if (!editingStore) return <div className="p-10 text-center font-bold">Loading Nexus Studio...</div>;

  const addSection = (type: SectionType) => {
    const newSection: StoreSection = {
      id: 'sec_' + Math.random().toString(36).substr(2, 9),
      type,
      content: type === 'hero' ? { title: 'New Story', subtitle: 'Craft your brand message.', image: '' } :
               type === 'banner' ? { title: 'Flash Sale', subtitle: 'Get 20% off today!' } :
               { title: 'New Arrivals' }
    };
    setEditingStore(prev => prev ? ({ ...prev, sections: [...prev.sections, newSection] }) : null);
  };

  const removeSection = (secId: string) => {
    setEditingStore(prev => prev ? ({ ...prev, sections: prev.sections.filter(s => s.id !== secId) }) : null);
    if (editingSection?.id === secId) setEditingSection(null);
  };

  const moveSection = (index: number, direction: number) => {
    if (!editingStore) return;
    const sections = [...editingStore.sections];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    [sections[index], sections[targetIndex]] = [sections[targetIndex], sections[index]];
    setEditingStore({ ...editingStore, sections });
  };

  const updateSectionContent = (secId: string, field: string, value: string) => {
    setEditingStore(prev => {
      if (!prev) return null;
      const updated = prev.sections.map(s => s.id === secId ? { ...s, content: { ...s.content, [field]: value } } : s);
      return { ...prev, sections: updated };
    });
  };

  const saveStore = () => {
    setStores(prev => prev.map(s => s.id === id ? editingStore! : s));
    alert("Storefront Design Published!");
    navigate('/stores');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-black">N</div>
            <span className="font-black text-xs uppercase tracking-widest text-slate-800">Nexus <span className="text-emerald-600">Studio</span></span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveView('pc')} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase transition ${activeView === 'pc' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}>Desktop</button>
            <button onClick={() => setActiveView('mobile')} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase transition ${activeView === 'mobile' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}>Mobile</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => window.open(`#/s/${id}`, '_blank')} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-800 transition">Preview Live</button>
          <button onClick={saveStore} className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-100 hover:scale-105 transition-all">Publish Site</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Components */}
        <aside className="w-64 border-r bg-white flex flex-col overflow-y-auto p-4 space-y-6">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Library</h4>
            <div className="space-y-1">
              {[
                { type: 'hero', label: 'Main Hero', icon: 'fa-star' },
                { type: 'grid', label: 'Product Grid', icon: 'fa-th' },
                { type: 'banner', label: 'Offer Banner', icon: 'fa-percent' }
              ].map(item => (
                <button 
                  key={item.type}
                  onClick={() => addSection(item.type as SectionType)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left group"
                >
                  <div className="w-8 h-8 bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white rounded-lg flex items-center justify-center transition-colors text-slate-400">
                    <i className={`fas ${item.icon} text-xs`}></i>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Layer Management</h4>
            <div className="space-y-2">
              {editingStore.sections.map((sec, idx) => (
                <div key={sec.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{sec.type}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveSection(idx, -1)} className="p-1 text-slate-400 hover:text-emerald-600"><i className="fas fa-chevron-up text-[10px]"></i></button>
                    <button onClick={() => moveSection(idx, 1)} className="p-1 text-slate-400 hover:text-emerald-600"><i className="fas fa-chevron-down text-[10px]"></i></button>
                    <button onClick={() => removeSection(sec.id)} className="p-1 text-slate-400 hover:text-red-500"><i className="fas fa-trash text-[10px]"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 bg-slate-100 overflow-y-auto p-12 flex justify-center no-scrollbar">
          <div className={`bg-white shadow-2xl transition-all duration-700 ${activeView === 'pc' ? 'w-full max-w-5xl rounded-3xl' : 'w-[375px] h-[812px] rounded-[54px] border-[12px] border-slate-900 relative'}`}>
            <div className="pointer-events-none">
              <nav className="p-6 border-b flex justify-between items-center opacity-50">
                <span className="font-black text-emerald-600 uppercase text-sm tracking-tighter">{editingStore.name}.</span>
                <div className="flex gap-4 text-[8px] font-black uppercase text-slate-400"><span>Menu</span><span>Contact</span></div>
              </nav>
              {editingStore.sections.map((sec) => (
                <div 
                  key={sec.id} 
                  onClick={(e) => { e.stopPropagation(); setEditingSection(sec); }}
                  className="pointer-events-auto cursor-pointer border-2 border-transparent hover:border-emerald-500 transition-colors relative"
                >
                  {sec.type === 'hero' && (
                    <div className="h-96 bg-slate-900 flex items-center justify-center overflow-hidden relative">
                      {sec.content.image && <img src={sec.content.image} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                      <div className="relative text-center p-8">
                        <h1 className="text-white text-4xl font-black mb-4 tracking-tighter">{sec.content.title}</h1>
                        <p className="text-slate-300 text-xs">{sec.content.subtitle}</p>
                      </div>
                    </div>
                  )}
                  {sec.type === 'banner' && (
                    <div className="bg-emerald-600 m-4 p-8 rounded-3xl text-center text-white">
                      <h3 className="text-xl font-black mb-2">{sec.content.title}</h3>
                      <p className="text-xs text-emerald-100">{sec.content.subtitle}</p>
                    </div>
                  )}
                  {sec.type === 'grid' && (
                    <div className="p-8 bg-white text-center">
                      <h4 className="text-sm font-black mb-6 uppercase tracking-widest">{sec.content.title}</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {products.slice(0, 4).map(p => (
                          <div key={p.id} className="aspect-square bg-slate-50 rounded-2xl"></div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar: Context Editor */}
        <aside className="w-80 border-l bg-white flex flex-col overflow-y-auto p-6 space-y-8 shadow-xl">
          {!editingSection ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
              <i className="fas fa-hand-pointer text-slate-200 text-4xl"></i>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Select an element in the canvas to edit its properties.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-center pb-4 border-b">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Edit {editingSection.type}</h3>
                <button onClick={() => setEditingSection(null)} className="text-slate-400 hover:text-slate-800"><i className="fas fa-times"></i></button>
              </div>

              {editingSection.type === 'hero' && (
                <div className="space-y-4">
                   <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Background Asset</label>
                    <div className="aspect-video bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-2 relative group hover:border-emerald-500 transition">
                      {editingSection.content.image ? (
                        <img src={editingSection.content.image} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <i className="fas fa-camera text-slate-300"></i>
                      )}
                      <input 
                        type="file" className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onload = (ev) => updateSectionContent(editingSection.id, 'image', ev.target?.result as string);
                            r.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Main Heading</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                      value={editingSection.content.title}
                      onChange={(e) => updateSectionContent(editingSection.id, 'title', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Subheading</label>
                    <textarea 
                      className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                      value={editingSection.content.subtitle}
                      onChange={(e) => updateSectionContent(editingSection.id, 'subtitle', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {(editingSection.type === 'banner' || editingSection.type === 'grid') && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Heading Text</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                      value={editingSection.content.title}
                      onChange={(e) => updateSectionContent(editingSection.id, 'title', e.target.value)}
                    />
                  </div>
                  {editingSection.type === 'banner' && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Subheading</label>
                      <input 
                        type="text" 
                        className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-emerald-500"
                        value={editingSection.content.subtitle}
                        onChange={(e) => updateSectionContent(editingSection.id, 'subtitle', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={() => setEditingSection(null)}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-colors"
              >
                Apply Changes
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default StoreDesigner;

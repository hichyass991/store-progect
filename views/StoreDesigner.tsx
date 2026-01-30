import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store, Product, StoreSection, SectionType, User } from '../types';
import HeroSection from '../components/HeroSection';
import { motion, AnimatePresence } from 'framer-motion';

// Use any to bypass broken framer-motion type definitions in the environment
const Motion = motion as any;

interface StoreDesignerProps {
  stores: Store[];
  setStores: React.Dispatch<React.SetStateAction<Store[]>>;
  products: Product[];
  // Added missing currentUser prop to fix App.tsx error
  currentUser: User;
}

const StoreDesigner: React.FC<StoreDesignerProps> = ({ stores, setStores, products, currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [activeView, setActiveView] = useState<'pc' | 'mobile'>('pc');
  const [editingSection, setEditingSection] = useState<StoreSection | null>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);

  useEffect(() => {
    const store = stores.find(s => s.id === id);
    if (store) setEditingStore({ ...store, sections: store.sections || [] });
  }, [id, stores]);

  if (!editingStore) return <div className="p-10 text-center font-bold">Loading Studio...</div>;

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIDE = 2500;
          if (width > height) {
            if (width > MAX_SIDE) {
              height *= MAX_SIDE / width;
              width = MAX_SIDE;
            }
          } else {
            if (height > MAX_SIDE) {
              width *= MAX_SIDE / height;
              height = MAX_SIDE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject('Canvas context error');
          ctx.drawImage(img, 0, 0, width, height);
          
          let quality = 0.85;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while (dataUrl.length > 2700000 && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const addSection = (type: SectionType) => {
    const newSection: StoreSection = {
      id: 'sec_' + Math.random().toString(36).substr(2, 9),
      type,
      content: type === 'hero' ? { 
        title: 'Defining Modern Space.', 
        subtitle: 'High-performance architectural components.', 
        media: [], 
        autoplay: true,
        transition: 'fade',
        cta: 'Shop Collection'
      } :
               type === 'banner' ? { title: 'Flash Sale', subtitle: 'Get 20% off today!' } :
               type === 'testimonials' ? { items: [{ name: 'John D.', text: 'Best quality architectural items!' }] } :
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

  const updateSectionContent = (secId: string, field: string, value: any) => {
    setEditingStore(prev => {
      if (!prev) return null;
      const updated = prev.sections.map(s => s.id === secId ? { ...s, content: { ...s.content, [field]: value } } : s);
      return { ...prev, sections: updated };
    });
    if (editingSection?.id === secId) {
        setEditingSection(prev => prev ? ({ ...prev, content: { ...prev.content, [field]: value } }) : null);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, secId: string) => {
    const files = e.target.files;
    if (!files || !editingSection) return;

    setIsProcessingMedia(true);
    try {
        const currentMedia = editingSection.content.media || [];
        const remainingSlots = 5 - currentMedia.length;
        // Explicitly cast to File[] to avoid unknown type inference errors
        const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];

        const processed = await Promise.all(filesToProcess.map(async (file: File) => {
            if (file.type.startsWith('image')) {
                const compressed = await compressImage(file);
                return { type: 'image', url: compressed };
            } else if (file.type.startsWith('video')) {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve({ type: 'video', url: ev.target?.result as string });
                    reader.readAsDataURL(file);
                });
            }
            return null;
        }));

        const validMedia = processed.filter(Boolean);
        const newMedia = [...currentMedia, ...validMedia];
        updateSectionContent(secId, 'media', newMedia);
    } catch (err) {
        console.error("Media processing failed", err);
        alert("Failed to process one or more assets.");
    } finally {
        setIsProcessingMedia(false);
    }
  };

  const saveStore = () => {
    setStores(prev => prev.map(s => s.id === id ? editingStore! : s));
    alert("Storefront Design Published!");
    navigate('/stores');
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 font-inter">
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-lg shadow-emerald-100">G</div>
            <span className="font-black text-xs uppercase tracking-[0.2em] text-slate-800">Gwapashop <span className="text-emerald-600">Studio</span></span>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveView('pc')} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase transition ${activeView === 'pc' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}>Desktop</button>
            <button onClick={() => setActiveView('mobile')} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase transition ${activeView === 'mobile' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}>Mobile</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => window.open(`#/s/${id}`, '_blank')} className="text-[10px] font-black uppercase text-slate-400 hover:text-emerald-600 transition px-3">
            <i className="far fa-eye mr-2"></i> Preview Live
          </button>
          <button onClick={saveStore} className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-100 hover:scale-105 transition-all">Publish Changes</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Components Library */}
        <aside className="w-64 border-r bg-white flex flex-col overflow-y-auto p-4 space-y-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Add Sections</h4>
            <div className="grid grid-cols-1 gap-2">
              {[
                { type: 'hero', label: 'Hero Carousel', icon: 'fa-star' },
                { type: 'grid', label: 'Product Grid', icon: 'fa-th' },
                { type: 'banner', label: 'Promo Banner', icon: 'fa-percent' },
                { type: 'testimonials', label: 'Feedback Grid', icon: 'fa-quote-left' }
              ].map(item => (
                <button 
                  key={item.type}
                  onClick={() => addSection(item.type as SectionType)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all text-left group"
                >
                  <div className="w-8 h-8 bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white rounded-lg flex items-center justify-center transition-colors text-slate-400">
                    <i className={`fas ${item.icon} text-xs`}></i>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-slate-600 group-hover:text-emerald-700">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-50">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Layer Stack</h4>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {editingStore.sections.map((sec, idx) => (
                    <Motion.div 
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={sec.id} 
                        onClick={() => setEditingSection(sec)} 
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${editingSection?.id === sec.id ? 'border-emerald-500 bg-emerald-50' : 'bg-slate-50 border-slate-100 hover:border-emerald-200'}`}
                    >
                        <span className="text-[10px] font-black text-slate-500 uppercase">{sec.type}</span>
                        <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); moveSection(idx, -1); }} className="p-1 text-slate-300 hover:text-emerald-600"><i className="fas fa-arrow-up text-[10px]"></i></button>
                            <button onClick={(e) => { e.stopPropagation(); moveSection(idx, 1); }} className="p-1 text-slate-300 hover:text-emerald-600"><i className="fas fa-arrow-down text-[10px]"></i></button>
                        </div>
                    </Motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </aside>

        {/* Workspace Canvas */}
        <main className="flex-1 bg-slate-100 overflow-y-auto p-12 flex justify-center no-scrollbar">
          <div className={`bg-white shadow-2xl transition-all duration-700 ease-in-out ${activeView === 'pc' ? 'w-full max-w-5xl rounded-3xl' : 'w-[375px] h-[812px] rounded-[54px] border-[12px] border-slate-900 relative'}`}>
            <div className="min-h-full">
              {/* Header */}
              <nav className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  {editingStore.logo ? (
                    <img src={editingStore.logo} alt={editingStore.name} className="h-8 object-contain" />
                  ) : (
                    <span className="font-black text-lg tracking-tighter text-emerald-600 uppercase italic">
                      {editingStore.name}.
                    </span>
                  )}
                </div>
                <div className="flex gap-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  <span className="hover:text-emerald-600 transition">Catalogue</span>
                  <span className="hover:text-emerald-600 transition">Contact</span>
                </div>
              </nav>

              {editingStore.sections.length === 0 ? (
                <div className="p-24 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto text-3xl"><i className="fas fa-plus"></i></div>
                  <h2 className="text-xl font-black text-slate-800">Your Canvas is Empty</h2>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto">Add a Hero section from the left library to start building your brand story.</p>
                </div>
              ) : (
                editingStore.sections.map((sec) => (
                  <div 
                    key={sec.id} 
                    onClick={(e) => { e.stopPropagation(); setEditingSection(sec); }}
                    className={`relative border-2 transition-all group ${editingSection?.id === sec.id ? 'border-emerald-500' : 'border-transparent hover:border-emerald-200'}`}
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition z-10 flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); removeSection(sec.id); }} className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center text-xs shadow-lg hover:bg-red-600"><i className="fas fa-trash"></i></button>
                    </div>

                    {sec.type === 'hero' && (
                      <HeroSection
                        title={sec.content.title}
                        subtitle={sec.content.subtitle}
                        cta={sec.content.cta}
                        media={sec.content.media || []}
                        autoplay={sec.content.autoplay !== false}
                        transition={sec.content.transition || 'fade'}
                        height="400px"
                        isEditing={true}
                      />
                    )}

                    {sec.type === 'banner' && (
                      <div className="bg-emerald-600 m-8 p-12 rounded-[40px] text-center text-white shadow-2xl shadow-emerald-100">
                        <h3 className="text-3xl font-black mb-3 tracking-tight">{sec.content.title}</h3>
                        <p className="text-emerald-50 font-medium text-lg">{sec.content.subtitle}</p>
                      </div>
                    )}

                    {sec.type === 'grid' && (
                      <div className="py-20 px-8 bg-white text-center">
                        <h4 className="text-xl font-black mb-12 uppercase tracking-widest text-slate-800">{sec.content.title}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                          {products.filter(p => p.status === 'Active').slice(0, 4).map(p => (
                            <div key={p.id} className="text-left space-y-3">
                              <div className="aspect-square bg-slate-50 rounded-[32px] overflow-hidden border border-slate-100">
                                <img src={p.photo} className="w-full h-full object-cover" />
                              </div>
                              <div className="px-2">
                                <div className="font-bold text-sm text-slate-800 truncate">{p.title}</div>
                                <div className="text-emerald-600 font-black text-base">{p.price} SAR</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sec.type === 'testimonials' && (
                      <div className="py-20 px-10 bg-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {(sec.content.items || []).map((t: any, idx: number) => (
                            <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                              <div className="text-emerald-500 mb-4 text-2xl"><i className="fas fa-quote-left"></i></div>
                              <p className="text-slate-600 italic text-sm leading-relaxed mb-6">"{t.text}"</p>
                              <div className="font-black text-[10px] uppercase tracking-widest text-slate-400">{t.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              {/* Footer Preview */}
              <footer className="py-20 px-12 bg-slate-900 text-white text-center space-y-8">
                <div className="font-black text-2xl tracking-tighter uppercase italic">{editingStore.name}.</div>
                <div className="flex justify-center gap-8 text-white/40 text-lg">
                  <i className="fab fa-whatsapp"></i><i className="fab fa-instagram"></i><i className="fab fa-facebook-f"></i>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">&copy; Crafted with Gwapashop Studio</div>
              </footer>
            </div>
          </div>
        </main>

        {/* Contextual Properties Editor */}
        <aside className="w-80 border-l bg-white flex flex-col overflow-y-auto p-6 space-y-8 shadow-2xl z-20 no-scrollbar">
          {!editingSection ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-3xl">
                <i className="fas fa-mouse-pointer"></i>
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Live Editor</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose max-w-[200px] mx-auto">
                  Click on any section in the workspace to open its customization properties.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-12">
              <header className="flex justify-between items-center pb-6 border-b">
                <div>
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Properties</h3>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase mt-1">{editingSection.type} Controller</p>
                </div>
                <button onClick={() => setEditingSection(null)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-slate-800 transition"><i className="fas fa-times"></i></button>
              </header>

              {editingSection.type === 'hero' && (
                <div className="space-y-8">
                   <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Media Slider Assets</label>
                      <span className="text-[9px] font-bold text-emerald-600">
                          {isProcessingMedia ? (
                              <span className="animate-pulse"><i className="fas fa-cog fa-spin mr-1"></i> Optimizing...</span>
                          ) : `${(editingSection.content.media?.length || 0)}/5`}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                       {editingSection.content.media?.map((m: any, idx: number) => (
                         <div key={idx} className="aspect-square bg-slate-50 rounded-xl border border-slate-100 relative group overflow-hidden">
                            {m.type === 'video' ? (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white text-[8px] font-black uppercase">Video</div>
                            ) : (
                              <img src={m.url} className="w-full h-full object-cover" />
                            )}
                            <button 
                              onClick={() => {
                                const newMedia = [...editingSection.content.media];
                                newMedia.splice(idx, 1);
                                updateSectionContent(editingSection.id, 'media', newMedia);
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm"
                            >
                              <i className="fas fa-times text-[8px]"></i>
                            </button>
                         </div>
                       ))}
                       {(editingSection.content.media?.length || 0) < 5 && (
                        <label className={`aspect-square bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition group ${isProcessingMedia ? 'opacity-50 pointer-events-none' : ''}`}>
                           <i className={`fas ${isProcessingMedia ? 'fa-spinner fa-spin' : 'fa-plus'} text-slate-300 group-hover:text-emerald-500 text-xs`}></i>
                           <input 
                              type="file" multiple className="hidden" accept="image/*,video/*"
                              onChange={(e) => handleMediaUpload(e, editingSection.id)}
                              disabled={isProcessingMedia}
                            />
                        </label>
                       )}
                    </div>
                  </div>

                  <div className="space-y-4 p-4 bg-slate-50 rounded-2xl">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Slider Configuration</label>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-slate-600">Autoplay Media</span>
                       <button 
                          onClick={() => updateSectionContent(editingSection.id, 'autoplay', !editingSection.content.autoplay)}
                          className={`w-10 h-5 rounded-full relative transition-colors ${editingSection.content.autoplay ? 'bg-emerald-500' : 'bg-slate-300'}`}
                       >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${editingSection.content.autoplay ? 'left-6' : 'left-1'}`}></div>
                       </button>
                    </div>
                    <div className="space-y-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Transition Style</span>
                       <div className="flex gap-2">
                          {['slide', 'fade'].map(style => (
                            <button 
                              key={style}
                              onClick={() => updateSectionContent(editingSection.id, 'transition', style)}
                              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${editingSection.content.transition === style ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-400'}`}
                            >
                              {style}
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Heading</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                      value={editingSection.content.title}
                      onChange={(e) => updateSectionContent(editingSection.id, 'title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Narrative Text</label>
                    <textarea 
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-[11px] font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 transition leading-relaxed"
                      rows={3}
                      value={editingSection.content.subtitle}
                      onChange={(e) => updateSectionContent(editingSection.id, 'subtitle', e.target.value)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">CTA Label</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                      value={editingSection.content.cta}
                      onChange={(e) => updateSectionContent(editingSection.id, 'cta', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {editingSection.type === 'testimonials' && (
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Feedback Cards</label>
                  {(editingSection.content.items || []).map((t: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl space-y-3 relative">
                      <button 
                        onClick={() => {
                          const items = [...editingSection.content.items];
                          items.splice(idx, 1);
                          updateSectionContent(editingSection.id, 'items', items);
                        }}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-600"
                      ><i className="fas fa-trash-alt text-[10px]"></i></button>
                      <input 
                        type="text" placeholder="Client Name"
                        className="w-full bg-white border-none text-[10px] font-black uppercase outline-none px-2 py-1 rounded-lg"
                        value={t.name}
                        onChange={(e) => {
                          const items = [...editingSection.content.items];
                          items[idx].name = e.target.value;
                          updateSectionContent(editingSection.id, 'items', items);
                        }}
                      />
                      <textarea 
                        className="w-full bg-white border-none text-[11px] font-medium outline-none px-2 py-1 rounded-lg"
                        placeholder="Feedback text..."
                        rows={3}
                        value={t.text}
                        onChange={(e) => {
                          const items = [...editingSection.content.items];
                          items[idx].text = e.target.value;
                          updateSectionContent(editingSection.id, 'items', items);
                        }}
                      />
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const items = [...(editingSection.content.items || []), { name: 'New Client', text: 'Enter client feedback here...' }];
                      updateSectionContent(editingSection.id, 'items', items);
                    }}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition"
                  >
                    + Add Feedback Card
                  </button>
                </div>
              )}

              {(editingSection.type === 'banner' || editingSection.type === 'grid') && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Header Text</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                      value={editingSection.content.title}
                      onChange={(e) => updateSectionContent(editingSection.id, 'title', e.target.value)}
                    />
                  </div>
                  {editingSection.type === 'banner' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Detailed Message</label>
                      <textarea 
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-[11px] font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 transition"
                        rows={4}
                        value={editingSection.content.subtitle}
                        onChange={(e) => updateSectionContent(editingSection.id, 'subtitle', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-6 border-t flex flex-col gap-3">
                <button 
                  onClick={() => setEditingSection(null)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-emerald-600 transition-all active:scale-95"
                >
                  Sync Changes
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default StoreDesigner;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Store, Product, StoreSection, SectionType, User } from '../types';
import HeroSection from '../components/HeroSection';
import { motion, AnimatePresence } from 'framer-motion';
import { supabaseService } from '../services/supabaseService';

const Motion = motion as any;

interface StoreDesignerProps {
  stores: Store[];
  setStores: React.Dispatch<React.SetStateAction<Store[]>>;
  products: Product[];
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
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, secId: string) => {
    const files = e.target.files;
    if (!files || !editingStore) return;
    setIsProcessingMedia(true);
    try {
        const section = editingStore.sections.find(s => s.id === secId);
        const currentMedia = section?.content.media || [];
        const filesToProcess = Array.from(files).slice(0, 5 - currentMedia.length) as File[];
        const processed = await Promise.all(filesToProcess.map(async (file: File) => {
            if (file.type.startsWith('image')) return { type: 'image', url: await compressImage(file) };
            if (file.type.startsWith('video')) return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve({ type: 'video', url: ev.target?.result as string });
                reader.readAsDataURL(file);
            });
            return null;
        }));
        const newMedia = [...currentMedia, ...processed.filter(Boolean)];
        updateSectionContent(secId, 'media', newMedia);
    } catch (err) { alert("Asset processing failed."); } finally { setIsProcessingMedia(false); }
  };

  const saveStore = async () => {
    if (editingStore) {
        await supabaseService.syncStore(editingStore);
        setStores(prev => prev.map(s => s.id === id ? editingStore : s));
        alert("Storefront Design Published to Cloud!");
        navigate('/stores');
    }
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
        <aside className="w-64 border-r bg-white flex flex-col overflow-y-auto p-4 space-y-6">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Add Sections</h4>
            <div className="grid grid-cols-1 gap-2">
              {['hero', 'grid', 'banner', 'testimonials'].map(type => (
                <button key={type} onClick={() => addSection(type as SectionType)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all text-left group">
                  <div className="w-8 h-8 bg-slate-50 group-hover:bg-emerald-600 group-hover:text-white rounded-lg flex items-center justify-center transition-colors text-slate-400">
                    <i className={`fas fa-${type === 'hero' ? 'star' : type === 'grid' ? 'th' : type === 'banner' ? 'percent' : 'quote-left'} text-xs`}></i>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight text-slate-600 group-hover:text-emerald-700">{type}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-slate-100 overflow-y-auto p-12 flex justify-center no-scrollbar">
          <div className={`bg-white shadow-2xl transition-all duration-700 ease-in-out ${activeView === 'pc' ? 'w-full max-w-5xl rounded-3xl' : 'w-[375px] h-[812px] rounded-[54px] border-[12px] border-slate-900 relative'}`}>
            <div className="min-h-full">
              <nav className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-20">
                <div className="flex items-center gap-2">
                  {editingStore.logo ? <img src={editingStore.logo} className="h-8 object-contain" /> : <span className="font-black text-lg text-emerald-600 italic">{editingStore.name}.</span>}
                </div>
              </nav>
              {editingStore.sections.map((sec, idx) => (
                <div key={sec.id} onClick={() => setEditingSection(sec)} className={`relative border-2 transition-all ${editingSection?.id === sec.id ? 'border-emerald-500' : 'border-transparent hover:border-emerald-100'}`}>
                   {sec.type === 'hero' && <HeroSection {...sec.content} height="400px" isEditing={true} />}
                   {sec.type === 'banner' && <div className="bg-emerald-600 m-8 p-12 rounded-[40px] text-center text-white shadow-xl"><h3 className="text-3xl font-black">{sec.content.title}</h3><p>{sec.content.subtitle}</p></div>}
                   <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-2">
                     <button onClick={() => removeSection(sec.id)} className="w-8 h-8 bg-red-500 text-white rounded-lg"><i className="fas fa-trash"></i></button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        <aside className="w-80 border-l bg-white flex flex-col overflow-y-auto p-6 space-y-8 shadow-2xl z-20">
          {editingSection ? (
            <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-12">
               <header className="flex justify-between items-center pb-6 border-b">
                 <h3 className="font-black text-slate-800 uppercase text-xs">Properties: {editingSection.type}</h3>
                 <button onClick={() => setEditingSection(null)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400"><i className="fas fa-times"></i></button>
               </header>
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Heading</label>
                  <input type="text" className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold" value={editingSection.content.title} onChange={(e) => updateSectionContent(editingSection.id, 'title', e.target.value)} />
               </div>
               {editingSection.type === 'hero' && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Upload Media</label>
                    <input type="file" multiple className="w-full text-xs" onChange={(e) => handleMediaUpload(e, editingSection.id)} />
                  </div>
               )}
            </div>
          ) : (
            <div className="p-10 text-center opacity-20"><i className="fas fa-mouse-pointer text-4xl mb-4"></i><p className="text-xs font-black uppercase">Select a section to edit</p></div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default StoreDesigner;

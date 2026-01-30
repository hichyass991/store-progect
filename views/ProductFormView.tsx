
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product, ProductStatus, User, ProductVariant } from '../types';
import { geminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface ProductFormViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  defaultCurrency?: string;
  currentUser: User;
}

const ProductFormView: React.FC<ProductFormViewProps> = ({ products, setProducts, defaultCurrency = 'SAR', currentUser }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState<'basic' | 'inventory' | 'marketing'>('basic');
  const [upsellSearch, setUpsellSearch] = useState('');
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    sku: '',
    price: 0,
    costPrice: 0,
    backupPrice: 0,
    stock: 0,
    purchasedStock: 0,
    soldStock: 0,
    description: '',
    photo: '',
    allPhotos: [],
    currency: defaultCurrency,
    stockStatus: 'In Stock',
    status: ProductStatus.DRAFT,
    category: '',
    upsellIds: [],
    discountType: 'none',
    discountValue: 0,
    confirmationRate: 0,
    deliveryRate: 0,
    variants: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const existing = products.find(p => p.id === id);
      if (existing) setFormData({ ...existing, variants: existing.variants || [] });
    }
  }, [id, isEdit, products]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsCompressing(true);
    try {
      const remainingSlots = 5 - (formData.allPhotos?.length || 0);
      const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];
      const uploadPromises = filesToProcess.map(file => compressImage(file));
      const compressedImages = await Promise.all(uploadPromises);
      
      setFormData(prev => {
        const updatedPhotos = [...(prev.allPhotos || []), ...compressedImages];
        return { 
          ...prev, 
          allPhotos: updatedPhotos, 
          photo: prev.photo || updatedPhotos[0] 
        };
      });
    } catch (error) {
      console.error("Compression failed:", error);
      alert("Failed to process one or more images.");
    } finally {
      setIsCompressing(false);
      e.target.value = '';
    }
  };

  const generateAI = async () => {
    if (!formData.title) return alert("Please enter a product title to provide context for the AI strategist.");
    setIsGenerating(true);
    
    // Passing rich context for a professional description
    const desc = await geminiService.generateDescription({
      title: formData.title,
      category: formData.category || 'Premium Collection',
      price: formData.price || 0,
      currency: formData.currency || 'SAR',
      sku: formData.sku || 'PENDING',
      variants: formData.variants
    });

    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const setPrimaryPhoto = (url: string) => {
    setFormData(prev => ({ ...prev, photo: url }));
  };

  const removePhoto = (idx: number) => {
    setFormData(prev => {
      const photoToRemove = prev.allPhotos?.[idx];
      const updatedPhotos = prev.allPhotos?.filter((_, i) => i !== idx) || [];
      let newMain = prev.photo;
      
      if (photoToRemove === prev.photo) {
        newMain = updatedPhotos[0] || '';
      }
      
      return { 
        ...prev, 
        allPhotos: updatedPhotos,
        photo: newMain
      };
    });
  };

  const addVariant = () => {
    const newV: ProductVariant = {
      id: 'var_' + Math.random().toString(36).substr(2, 9),
      name: 'Size',
      value: '',
      sku: `${formData.sku || 'PROD'}-${(formData.variants?.length || 0) + 1}`,
      price: formData.price || 0,
      stock: 0
    };
    setFormData(prev => ({ ...prev, variants: [...(prev.variants || []), newV] }));
  };

  const removeVariant = (vid: string) => {
    setFormData(prev => ({ ...prev, variants: prev.variants?.filter(v => v.id !== vid) || [] }));
  };

  const updateVariant = (vid: string, field: keyof ProductVariant, val: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants?.map(v => v.id === vid ? { ...v, [field]: val } : v) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toLocaleString();
    const finalStock = (formData.purchasedStock || 0) - (formData.soldStock || 0);
    
    const productToSave: Product = {
      id: formData.id || 'prod_' + Math.random().toString(36).substr(2, 9),
      id_num: formData.id_num || '#' + (products.length > 0 ? Math.max(...products.map(p => parseInt(p.id_num.replace('#', '')))) + 1 : 1001),
      createdAt: formData.createdAt || now,
      updatedAt: now,
      costPrice: formData.costPrice || 0,
      purchasedStock: formData.purchasedStock || 0,
      soldStock: formData.soldStock || 0,
      upsellIds: formData.upsellIds || [],
      discountType: formData.discountType || 'none',
      discountValue: formData.discountValue || 0,
      confirmationRate: formData.confirmationRate || 0,
      deliveryRate: formData.deliveryRate || 0,
      stock: finalStock >= 0 ? finalStock : 0,
      variants: formData.variants || [],
      ...(formData as Product)
    };

    if (isEdit) {
      setProducts(prev => prev.map(p => p.id === id ? productToSave : p));
    } else {
      setProducts(prev => [productToSave, ...prev]);
    }
    navigate('/products');
  };

  const categories = ["Electronics", "Fashion", "Home & Studio", "Beauty", "Architectural Pieces", "Minimalism"];

  const filteredUpsellProducts = useMemo(() => {
    return products.filter(p => {
      const isCurrent = p.id === id;
      if (isCurrent) return false;
      const matchesSearch = p.title.toLowerCase().includes(upsellSearch.toLowerCase()) || p.sku.toLowerCase().includes(upsellSearch.toLowerCase());
      const isSelected = formData.upsellIds?.includes(p.id);
      if (showSelectedOnly) return isSelected && matchesSearch;
      return matchesSearch;
    });
  }, [products, id, upsellSearch, showSelectedOnly, formData.upsellIds]);

  return (
    <div className="p-8 max-w-5xl mx-auto pb-32">
      <div className="bg-white rounded-[48px] border-2 border-slate-100 shadow-2xl p-10 space-y-10 overflow-hidden relative">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">
              {isEdit ? `Modifying Artifact` : 'Architecting New Item'}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">
               {isEdit ? `Blueprint Reference: ${formData.id_num}` : 'Configuring high-performance catalog entity'}
            </p>
          </div>
          <button onClick={() => navigate('/products')} className="w-12 h-12 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-all border-2 border-slate-50 hover:border-emerald-500 hover:text-emerald-600 shadow-sm bg-white">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex bg-slate-50/80 p-1.5 rounded-[24px] border border-slate-100">
          {[
            { id: 'basic', label: 'Identity & Narrative', icon: 'fa-fingerprint' },
            { id: 'inventory', label: 'Stock & Intelligence', icon: 'fa-vault' },
            { id: 'marketing', label: 'Marketing Engine', icon: 'fa-rocket' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-3 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${
                activeTab === tab.id ? 'bg-white text-emerald-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {activeTab === 'basic' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-left duration-500">
              <section className="space-y-6">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-camera text-emerald-500"></i> Artifact Visuals (Max 5)
                  </h4>
                  {isCompressing && (
                    <span className="text-[9px] font-black text-emerald-600 animate-pulse uppercase tracking-widest">
                       <i className="fas fa-cog fa-spin mr-1"></i> Processing...
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {formData.allPhotos?.map((p, idx) => {
                    const isMain = p === formData.photo;
                    return (
                      <div key={idx} className={`aspect-square rounded-[32px] border-4 overflow-hidden relative group shadow-xl transition-all hover:scale-105 ${isMain ? 'border-emerald-500' : 'border-white'}`}>
                        <img src={p} alt="" className="w-full h-full object-cover" />
                        
                        {isMain && (
                          <div className="absolute top-2 left-2 z-10">
                            <span className="bg-emerald-500 text-white text-[7px] font-black uppercase px-2 py-1 rounded-full shadow-lg">Primary</span>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                           {!isMain && (
                             <button 
                                type="button"
                                onClick={() => setPrimaryPhoto(p)}
                                className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-[10px] shadow-2xl hover:scale-110 transition"
                                title="Set as Main"
                              >
                                <i className="fas fa-star"></i>
                              </button>
                           )}
                           <button 
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center text-[10px] shadow-2xl hover:scale-110 transition"
                              title="Delete Photo"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                        </div>
                      </div>
                    );
                  })}
                  {(formData.allPhotos?.length || 0) < 5 && (
                    <label className={`aspect-square rounded-[32px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition-all group bg-slate-50/50 ${isCompressing ? 'opacity-50 pointer-events-none' : ''}`}>
                      <i className={`fas ${isCompressing ? 'fa-spinner fa-spin' : 'fa-plus'} text-slate-300 group-hover:text-emerald-500 text-2xl mb-2`}></i>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                        {isCompressing ? 'Syncing' : 'Upload'}
                      </span>
                      <input type="file" multiple className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isCompressing} />
                    </label>
                  )}
                </div>
              </section>
              <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Product Nomenclature</label>
                  <input type="text" required placeholder="Enter branding title..." className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-slate-800 text-lg" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">System SKU (Unique ID)</label>
                  <input type="text" required placeholder="E.g. STUDIO-2024-X" className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 outline-none font-mono focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-slate-500" value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} />
                </div>
              </section>
              
              {/* Enhanced Description Field with AI Intelligence */}
              <section className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Artifact Narrative</label>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-1 italic">Professional e-commerce descriptions drive 40% higher conversion.</p>
                  </div>
                  <Motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button" 
                    onClick={generateAI} 
                    disabled={isGenerating} 
                    className={`relative overflow-hidden group px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-2xl ${
                      isGenerating ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-500/20'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r from-emerald-500 to-indigo-600 opacity-0 group-hover:opacity-20 transition-opacity ${isGenerating ? 'hidden' : ''}`} />
                    <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'} ${isGenerating ? 'text-slate-300' : 'text-emerald-400 group-hover:text-white'}`}></i>
                    {isGenerating ? 'Analyzing Context...' : 'Craft Strategic Narrative'}
                    {!isGenerating && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    )}
                  </Motion.button>
                </div>
                
                <div className="relative group">
                  <textarea 
                    rows={8} 
                    placeholder="Describe the essence of this product..." 
                    className={`w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-[40px] px-8 py-8 outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all leading-relaxed font-bold text-slate-600 text-sm placeholder:opacity-40 no-scrollbar ${isGenerating ? 'opacity-40 select-none grayscale' : ''}`} 
                    value={formData.description} 
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  ></textarea>
                  
                  <AnimatePresence>
                    {isGenerating && (
                      <Motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/40 backdrop-blur-[2px] rounded-[40px] z-10"
                      >
                         <div className="flex gap-2">
                           {[0, 1, 2].map(i => (
                             <Motion.span 
                               key={i}
                               animate={{ 
                                 scale: [1, 1.5, 1],
                                 backgroundColor: ['#10b981', '#6366f1', '#10b981']
                               }}
                               transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                               className="w-2 h-2 rounded-full"
                             />
                           ))}
                         </div>
                         <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.4em] ml-2">Nexus AI Strategist is Composing</p>
                      </Motion.div>
                    )}
                  </AnimatePresence>

                  <div className="absolute bottom-6 right-8 flex items-center gap-2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                     <i className="fas fa-feather-pointed text-[10px] text-slate-400"></i>
                     <span className="text-[9px] font-black text-slate-300 uppercase">{formData.description?.length || 0} Chars</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-10 rounded-[48px] space-y-8 border border-white">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <i className="fas fa-coins text-amber-500"></i> Financial Architecture
                  </h4>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">MSRP / Listing Price ({formData.currency})</label>
                      <input type="number" required className="w-full bg-white border-2 border-slate-100 rounded-[28px] px-8 py-5 outline-none focus:border-emerald-500 transition-all font-black text-3xl text-emerald-600 shadow-xl" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Acquisition Cost (Cost Price)</label>
                      <input type="number" placeholder="Cost per unit..." className="w-full bg-white border-2 border-slate-100 rounded-[28px] px-8 py-5 outline-none focus:border-emerald-500 transition-all text-slate-500 font-black shadow-lg" value={formData.costPrice} onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) }))} />
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimated Margin</span>
                     <span className="text-xl font-black text-indigo-600">
                       +{(formData.price! - (formData.costPrice || 0)).toFixed(0)} <span className="text-xs">{formData.currency}</span>
                     </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-10 rounded-[48px] space-y-8 border border-white">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <i className="fas fa-cubes text-indigo-500"></i> Lifetime Stock Ledger
                  </h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Units Acquired</label>
                      <input type="number" placeholder="Total ever bought" className="w-full bg-white border-2 border-slate-100 rounded-[28px] px-6 py-4 outline-none focus:border-emerald-500 transition-all font-black text-xl text-slate-800 shadow-md" value={formData.purchasedStock} onChange={(e) => setFormData(prev => ({ ...prev, purchasedStock: parseInt(e.target.value) }))} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Units Sold</label>
                      <input type="number" placeholder="System confirmed sales" className="w-full bg-white border-2 border-slate-100 rounded-[28px] px-6 py-4 outline-none focus:border-emerald-500 transition-all font-black text-xl text-emerald-600 shadow-md" value={formData.soldStock} onChange={(e) => setFormData(prev => ({ ...prev, soldStock: parseInt(e.target.value) }))} />
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Real-time Inventory</p>
                       <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-400 uppercase">Automated Sync</span>
                    </div>
                    <div className="text-5xl font-black text-slate-800 tracking-tighter">
                      {(formData.purchasedStock || 0) - (formData.soldStock || 0)} <span className="text-base font-bold text-slate-300 ml-1">UNITS</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Variants Section */}
              <div className="bg-white p-10 rounded-[48px] border-2 border-slate-100 space-y-8 shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                      <i className="fas fa-layer-group text-indigo-500"></i> Product Variants
                    </h4>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Manage variations like Color, Size, or Material</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={addVariant}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition"
                  >
                    + Add Variant
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.variants && formData.variants.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest border-b">
                            <th className="pb-4 px-2">Variation Name</th>
                            <th className="pb-4 px-2">Option Value</th>
                            <th className="pb-4 px-2">SKU</th>
                            <th className="pb-4 px-2 text-right">Price ({formData.currency})</th>
                            <th className="pb-4 px-2 text-right">In Stock</th>
                            <th className="pb-4 px-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {formData.variants.map((v) => (
                            <tr key={v.id} className="group hover:bg-slate-50/50 transition-colors">
                              <td className="py-4 px-2">
                                <input 
                                  type="text" 
                                  placeholder="e.g. Size"
                                  className="w-full bg-transparent border-none text-[11px] font-black text-slate-700 outline-none focus:text-indigo-600"
                                  value={v.name}
                                  onChange={(e) => updateVariant(v.id, 'name', e.target.value)}
                                />
                              </td>
                              <td className="py-4 px-2">
                                <input 
                                  type="text" 
                                  placeholder="e.g. Large"
                                  className="w-full bg-transparent border-none text-[11px] font-bold text-slate-500 outline-none focus:text-slate-800"
                                  value={v.value}
                                  onChange={(e) => updateVariant(v.id, 'value', e.target.value)}
                                />
                              </td>
                              <td className="py-4 px-2">
                                <input 
                                  type="text" 
                                  className="w-full bg-transparent border-none text-[10px] font-mono font-black text-slate-400 outline-none"
                                  value={v.sku}
                                  onChange={(e) => updateVariant(v.id, 'sku', e.target.value)}
                                />
                              </td>
                              <td className="py-4 px-2 text-right">
                                <input 
                                  type="number" 
                                  className="w-20 bg-transparent border-none text-right text-[11px] font-black text-emerald-600 outline-none"
                                  value={v.price}
                                  onChange={(e) => updateVariant(v.id, 'price', parseFloat(e.target.value))}
                                />
                              </td>
                              <td className="py-4 px-2 text-right">
                                <input 
                                  type="number" 
                                  className="w-16 bg-transparent border-none text-right text-[11px] font-black text-slate-800 outline-none"
                                  value={v.stock}
                                  onChange={(e) => updateVariant(v.id, 'stock', parseInt(e.target.value))}
                                />
                              </td>
                              <td className="py-4 px-2 text-right">
                                <button 
                                  type="button"
                                  onClick={() => removeVariant(v.id)}
                                  className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                >
                                  <i className="fas fa-trash-alt text-[10px]"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-slate-200 mb-3 shadow-sm">
                        <i className="fas fa-plus"></i>
                      </div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">No variation configurations defined</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-indigo-600 p-10 rounded-[48px] space-y-10 shadow-2xl shadow-indigo-100">
                 <h4 className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em] flex items-center gap-2">
                    <i className="fas fa-chart-bar"></i> Performance Benchmarks (Historical)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-white">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-80">Confirmation Rate</label>
                        <span className="text-2xl font-black">{formData.confirmationRate}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="1" className="w-full h-3 bg-indigo-500 rounded-full appearance-none cursor-pointer accent-white" value={formData.confirmationRate} onChange={(e) => setFormData(prev => ({ ...prev, confirmationRate: parseInt(e.target.value) }))} />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-white">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-80">Final Delivery Rate</label>
                        <span className="text-2xl font-black">{formData.deliveryRate}%</span>
                      </div>
                      <input type="range" min="0" max="100" step="1" className="w-full h-3 bg-indigo-500 rounded-full appearance-none cursor-pointer accent-white" value={formData.deliveryRate} onChange={(e) => setFormData(prev => ({ ...prev, deliveryRate: parseInt(e.target.value) }))} />
                    </div>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-10 rounded-[48px] space-y-8 border border-white relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <i className="fas fa-tag text-emerald-500"></i> Dynamic Discount Engine
                  </h4>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Promo Logic</label>
                      <select className="w-full bg-white border-2 border-slate-100 rounded-3xl px-8 py-5 outline-none focus:border-emerald-500 transition-all font-black text-slate-600 appearance-none cursor-pointer shadow-sm" value={formData.discountType} onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as any }))}>
                        <option value="none">Standard Global Price</option>
                        <option value="percentage">Percentage Markdown (%)</option>
                        <option value="fixed">Fixed Reduction Amount</option>
                      </select>
                    </div>
                    {formData.discountType !== 'none' && (
                      <div className="space-y-3 animate-in zoom-in duration-300">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Markdown Value</label>
                        <input type="number" className="w-full bg-white border-2 border-emerald-500/20 rounded-3xl px-8 py-5 outline-none transition-all font-black text-3xl text-emerald-600 shadow-xl" value={formData.discountValue} onChange={(e) => setFormData(prev => ({ ...prev, discountValue: parseFloat(e.target.value) }))} />
                      </div>
                    )}
                  </div>
                  <div className="pt-6 border-t border-slate-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block mb-3">Assigned Category</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button key={cat} type="button" onClick={() => setFormData(prev => ({ ...prev, category: cat }))} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${formData.category === cat ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>{cat}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-10 rounded-[48px] space-y-8 border border-white relative overflow-hidden flex flex-col min-h-[500px]">
                  <header className="flex justify-between items-center">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <i className="fas fa-link text-indigo-500"></i> Upsell Cluster Manager
                      </h4>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">Frequently Bought Together Links</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setShowSelectedOnly(!showSelectedOnly)}
                        className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${showSelectedOnly ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200'}`}
                      >
                        {showSelectedOnly ? 'All Items' : 'Show Selected'}
                      </button>
                      <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-indigo-100">
                        {formData.upsellIds?.length || 0}
                      </span>
                    </div>
                  </header>

                  <div className="space-y-4 flex-1 flex flex-col min-h-0">
                     <div className="relative">
                        <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                        <input 
                          type="text"
                          placeholder="Search for catalog artifacts..."
                          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                          value={upsellSearch}
                          onChange={(e) => setUpsellSearch(e.target.value)}
                        />
                     </div>
                     
                     <div className="flex-1 overflow-y-auto pr-2 space-y-3 no-scrollbar min-h-[300px]">
                        <AnimatePresence mode="popLayout">
                          {filteredUpsellProducts.length > 0 ? (
                            filteredUpsellProducts.map(p => {
                              const isSelected = formData.upsellIds?.includes(p.id);
                              return (
                                <Motion.button
                                  layout
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    const current = formData.upsellIds || [];
                                    const next = isSelected ? current.filter(cid => cid !== p.id) : [...current, p.id];
                                    setFormData(prev => ({ ...prev, upsellIds: next }));
                                  }}
                                  className={`w-full flex items-center justify-between p-4 rounded-[24px] transition-all border-2 text-left group overflow-hidden relative ${
                                    isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.01]' : 'bg-white border-transparent text-slate-500 hover:border-indigo-100 hover:bg-indigo-50/10'
                                  }`}
                                >
                                  <div className="flex items-center gap-4 relative z-10">
                                     <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                        <img src={p.photo} alt="" className="w-full h-full object-cover" />
                                     </div>
                                     <div>
                                        <div className={`text-[10px] font-black uppercase tracking-tight leading-none mb-1.5 ${isSelected ? 'text-white' : 'text-slate-800'}`}>{p.title}</div>
                                        <div className="flex items-center gap-2">
                                           <div className={`text-[9px] font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{p.price} {p.currency}</div>
                                           <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-300' : 'bg-slate-200'}`}></div>
                                           <div className={`text-[8px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-200' : 'text-slate-300'}`}>{p.sku}</div>
                                        </div>
                                     </div>
                                  </div>
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all relative z-10 ${isSelected ? 'bg-white text-indigo-600 shadow-inner' : 'bg-slate-100 text-slate-300'}`}>
                                    <i className={`fas ${isSelected ? 'fa-check' : 'fa-plus'} text-[10px]`}></i>
                                  </div>
                                </Motion.button>
                              );
                            })
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30 py-10">
                               <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-xl text-slate-400"><i className="fas fa-layer-group"></i></div>
                               <p className="text-[10px] font-black uppercase tracking-widest max-w-[200px] leading-relaxed">
                                  {upsellSearch ? `No catalog entities matching "${upsellSearch}"` : 'Link complementary items to increase Average Order Value (AOV).'}
                               </p>
                            </div>
                          )}
                        </AnimatePresence>
                     </div>
                  </div>
                  
                  <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${formData.upsellIds?.length ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em]">Trigger: Bundle Recommendation Active</p>
                    </div>
                    {formData.upsellIds?.length ? (
                       <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                          AOV Potential: +{formData.upsellIds.length * 20}% Est.
                       </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-slate-100 gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Lifecycle State</span>
              <div className="px-6 py-3 bg-slate-50 rounded-2xl border-2 border-white flex items-center gap-3 shadow-sm">
                <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${formData.status === ProductStatus.ACTIVE ? 'bg-emerald-500' : formData.status === ProductStatus.DRAFT ? 'bg-amber-400' : 'bg-slate-300'}`}></div>
                <select className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer text-slate-800" value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ProductStatus }))}>
                  <option value={ProductStatus.DRAFT}>Work in Progress</option>
                  <option value={ProductStatus.ACTIVE}>Live Production</option>
                  <option value={ProductStatus.ARCHIVED}>System Archive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <button type="button" onClick={() => navigate('/products')} className="flex-1 md:flex-none px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-500 transition-all">Abort</button>
              <button type="submit" className="flex-1 md:flex-none bg-emerald-600 text-white px-16 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-emerald-100 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all">
                {isEdit ? 'Sync Artifact' : 'Manifest Product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormView;

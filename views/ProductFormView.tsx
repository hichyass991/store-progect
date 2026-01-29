import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product, ProductStatus } from '../types';
import { geminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface ProductFormViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductFormView: React.FC<ProductFormViewProps> = ({ products, setProducts }) => {
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
    currency: 'SAR',
    stockStatus: 'In Stock',
    status: ProductStatus.DRAFT,
    category: '',
    upsellIds: [],
    discountType: 'none',
    discountValue: 0,
    confirmationRate: 0,
    deliveryRate: 0
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const existing = products.find(p => p.id === id);
      if (existing) setFormData(existing);
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
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
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
      // Reset input so the same file can be selected again if deleted
      e.target.value = '';
    }
  };

  const generateAI = async () => {
    if (!formData.title) return alert("Enter a product title first.");
    setIsGenerating(true);
    const desc = await geminiService.generateDescription(formData.title, formData.category || 'Luxury');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toLocaleString();
    const finalStock = (formData.purchasedStock || 0) - (formData.soldStock || 0);
    
    if (isEdit) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...formData as Product, stock: finalStock >= 0 ? finalStock : 0, updatedAt: now } : p));
    } else {
      const lastIdNum = products.length > 0 ? Math.max(...products.map(p => parseInt(p.id_num.replace('#', '')))) : 1000;
      const newProduct: Product = {
        id: 'prod_' + Math.random().toString(36).substr(2, 9),
        id_num: '#' + (lastIdNum + 1),
        createdAt: now,
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
        ...(formData as Product)
      };
      setProducts(prev => [newProduct, ...prev]);
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
              <section className="space-y-3">
                <div className="flex justify-between items-center px-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Artifact Narrative</label>
                  <button type="button" onClick={generateAI} disabled={isGenerating} className="text-[9px] font-black uppercase text-emerald-600 hover:text-white hover:bg-emerald-600 px-4 py-1.5 rounded-full border border-emerald-600 transition-all disabled:opacity-50 flex items-center gap-2">
                    <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                    Compose with AI
                  </button>
                </div>
                <textarea rows={6} placeholder="Describe the essence of this product..." className="w-full bg-slate-50 border-none rounded-[40px] px-8 py-6 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all leading-relaxed font-bold text-slate-600" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}></textarea>
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
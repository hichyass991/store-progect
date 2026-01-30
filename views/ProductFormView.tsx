
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product, ProductStatus, User, ProductVariant } from '../types';
import { geminiService } from '../services/geminiService';
import { supabaseService } from '../services/supabaseService';
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
      return { ...prev, allPhotos: updatedPhotos, photo: newMain };
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Sync to Supabase
    await supabaseService.syncProduct(productToSave);

    if (isEdit) {
      setProducts(prev => prev.map(p => p.id === id ? productToSave : p));
    } else {
      setProducts(prev => [productToSave, ...prev]);
    }
    navigate('/products');
  };

  const categoriesList = ["Electronics", "Fashion", "Home & Studio", "Beauty", "Architectural Pieces", "Minimalism"];

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
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {formData.allPhotos?.map((p, idx) => {
                    const isMain = p === formData.photo;
                    return (
                      <div key={idx} className={`aspect-square rounded-[32px] border-4 overflow-hidden relative group shadow-xl transition-all hover:scale-105 ${isMain ? 'border-emerald-500' : 'border-white'}`}>
                        <img src={p} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                           {!isMain && (
                             <button type="button" onClick={() => setPrimaryPhoto(p)} className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-[10px] shadow-2xl hover:scale-110 transition">
                                <i className="fas fa-star"></i>
                              </button>
                           )}
                           <button type="button" onClick={() => removePhoto(idx)} className="w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center text-[10px] shadow-2xl hover:scale-110 transition">
                              <i className="fas fa-trash-alt"></i>
                            </button>
                        </div>
                      </div>
                    );
                  })}
                  {(formData.allPhotos?.length || 0) < 5 && (
                    <label className={`aspect-square rounded-[32px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition-all group bg-slate-50/50 ${isCompressing ? 'opacity-50 pointer-events-none' : ''}`}>
                      <i className={`fas ${isCompressing ? 'fa-spinner fa-spin' : 'fa-plus'} text-slate-300 group-hover:text-emerald-500 text-2xl mb-2`}></i>
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
              <section className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 gap-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Artifact Narrative</label>
                  <button type="button" onClick={generateAI} disabled={isGenerating} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all">
                    {isGenerating ? 'Analyzing...' : 'AI Generate'}
                  </button>
                </div>
                <textarea rows={8} className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-100 rounded-[40px] px-8 py-8 outline-none transition-all leading-relaxed font-bold text-slate-600 text-sm" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}></textarea>
              </section>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-10 rounded-[48px] space-y-8 border border-white">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Financial Architecture</h4>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">MSRP / Listing Price</label>
                      <input type="number" required className="w-full bg-white border-2 border-slate-100 rounded-[28px] px-8 py-5 outline-none font-black text-3xl text-emerald-600" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Cost Price</label>
                      <input type="number" className="w-full bg-white border-2 border-slate-100 rounded-[28px] px-8 py-5 outline-none font-black" value={formData.costPrice} onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) }))} />
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-10 rounded-[48px] space-y-8 border border-white">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Stock Ledger</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Acquired</label>
                      <input type="number" className="w-full bg-white border-2 border-slate-100 rounded-[28px] px-6 py-4 outline-none font-black" value={formData.purchasedStock} onChange={(e) => setFormData(prev => ({ ...prev, purchasedStock: parseInt(e.target.value) }))} />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Sold</label>
                      <input type="number" className="w-full bg-white border-2 border-slate-100 rounded-[28px] px-6 py-4 outline-none font-black" value={formData.soldStock} onChange={(e) => setFormData(prev => ({ ...prev, soldStock: parseInt(e.target.value) }))} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom duration-500">
               <div className="bg-slate-50 p-10 rounded-[48px] space-y-8 border border-white">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categoriesList.map(cat => (
                      <button key={cat} type="button" onClick={() => setFormData(prev => ({ ...prev, category: cat }))} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${formData.category === cat ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-100'}`}>{cat}</button>
                    ))}
                  </div>
                </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center justify-between pt-12 border-t border-slate-100 gap-8">
            <div className="px-6 py-3 bg-slate-50 rounded-2xl border-2 border-white flex items-center gap-3 shadow-sm">
                <select className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer" value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ProductStatus }))}>
                  <option value={ProductStatus.DRAFT}>Work in Progress</option>
                  <option value={ProductStatus.ACTIVE}>Live Production</option>
                </select>
            </div>
            <button type="submit" className="bg-emerald-600 text-white px-16 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:scale-105 transition-all">
              {isEdit ? 'Sync Artifact' : 'Manifest Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormView;

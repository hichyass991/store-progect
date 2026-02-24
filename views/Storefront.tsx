
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, Lead, LeadStatus, AbandonedCart, Sheet } from '../types';
import { syncService } from '../services/syncService';
import { supabaseService } from '../services/supabaseService';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface StorefrontProps {
  products: Product[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  setAbandonedCarts: React.Dispatch<React.SetStateAction<AbandonedCart[]>>;
  sheets: Sheet[];
  setSheets: React.Dispatch<React.SetStateAction<Sheet[]>>;
}

const Storefront: React.FC<StorefrontProps> = ({ products, setLeads, setAbandonedCarts, sheets, setSheets }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id === productId);

  const [mainImg, setMainImg] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  
  const [customer, setCustomer] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    address: '', 
    city: '', 
    zipCode: '' 
  });
  const [isOrdered, setIsOrdered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedUpsells, setSelectedUpsells] = useState<Set<string>>(new Set());

  const upsellProducts = useMemo(() => {
    if (!product || !product.upsellIds) return [];
    return products.filter(p => product.upsellIds.includes(p.id));
  }, [product, products]);

  const totalPrice = useMemo(() => {
    if (!product) return 0;
    let total = product.price;
    if (selectedVariant) {
        const v = product.variants?.find(v => v.id === selectedVariant);
        if (v) total = v.price;
    }
    upsellProducts.forEach(up => {
      if (selectedUpsells.has(up.id)) total += up.price;
    });
    return total;
  }, [product, upsellProducts, selectedUpsells, selectedVariant]);

  useEffect(() => {
    if (product) {
        setMainImg(product.photo);
        if (product.variants && product.variants.length > 0) {
            setSelectedVariant(product.variants[0].id);
        }
    }
  }, [product]);

  useEffect(() => {
    if (customer.firstName.length > 2 || customer.phone.length > 5) {
      const timer = setTimeout(async () => {
        const id = 'abc_' + Math.random().toString(36).substr(2, 5);
        const cart: AbandonedCart = {
          id,
          name: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone,
          product_id: productId!,
          timestamp: new Date().toLocaleString()
        };
        await supabaseService.syncAbandonedCart(cart);
        setAbandonedCarts(prev => {
          const existingIdx = prev.findIndex(c => c.phone === customer.phone);
          if (existingIdx > -1) {
            const copy = [...prev];
            copy[existingIdx] = cart;
            return copy;
          }
          return [cart, ...prev];
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [customer, productId, setAbandonedCarts]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-950 font-inter">
        <h1 className="text-8xl font-black text-white/5 uppercase italic">Missing Node</h1>
        <button onClick={() => navigate(-1)} className="mt-8 px-12 py-4 bg-emerald-600 text-white rounded-full font-black text-xs uppercase tracking-widest">Back to Hub</button>
      </div>
    );
  }

  const toggleUpsell = (id: string) => {
    setSelectedUpsells(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.firstName || !customer.phone || !customer.city) {
      return alert("Required: Name, Phone, and City.");
    }

    setIsSubmitting(true);
    const now = new Date().toLocaleString();
    const fullName = `${customer.firstName} ${customer.lastName}`;

    const newLead: Lead = {
      id: 'lead_' + Math.random().toString(36).substr(2, 9),
      id_num: '#' + (Math.floor(Math.random() * 9000) + 1000),
      name: fullName,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      preferredContact: 'phone',
      company: '',
      country: '',
      region: '',
      city: customer.city,
      product_id: productId!,
      status: LeadStatus.NEW,
      source: 'Storefront',
      createdAt: now,
      updatedAt: now
    };

    const variantLabel = product.variants?.find(v => v.id === selectedVariant)?.value || '';

    await supabaseService.syncLead(newLead, product, {
      address: customer.address,
      city: customer.city,
      zipCode: customer.zipCode,
      email: customer.email,
      totalAmount: totalPrice,
      variant: variantLabel,
      upsells: Array.from(selectedUpsells)
    });

    const targetSheet = sheets.find(s => s.productIds.includes(productId!) && s.googleSheetUrl);
    if (targetSheet && targetSheet.googleSheetUrl) {
      await syncService.pushLead(targetSheet.googleSheetUrl, newLead, product);
    }
    
    setLeads(prev => [newLead, ...prev]);
    setAbandonedCarts(prev => prev.filter(c => c.phone !== customer.phone));
    setIsSubmitting(false);
    setIsOrdered(true);
  };

  if (isOrdered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-white font-inter">
        <Motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-[48px] flex items-center justify-center text-5xl mb-12 shadow-2xl shadow-emerald-200"
        >
          <i className="fas fa-check"></i>
        </Motion.div>
        <h2 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter uppercase italic">Dispatch Locked.</h2>
        <p className="text-slate-400 max-w-md mb-12 font-medium text-lg leading-relaxed">System identity confirmed. Dispatching to <span className="text-slate-900 font-black">{customer.city}</span>. Payment via COD upon delivery cycle.</p>
        <button onClick={() => navigate(-1)} className="px-20 py-6 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-[0.4em] shadow-3xl hover:scale-105 transition-all">Proceed to Terminal</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-inter text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Product Detail Nav */}
      <nav className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-[100] flex items-center justify-between px-8 md:px-16 shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition">
              <i className="fas fa-arrow-left"></i>
           </button>
           <h4 className="hidden md:block font-black text-xs uppercase tracking-widest text-slate-400">{product.category} / {product.sku}</h4>
        </div>
        <div className="flex items-center gap-8">
           <div className="hidden lg:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Protocol Active</span>
           </div>
           <button className="bg-slate-900 text-white px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">Order Now</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 md:p-16 grid grid-cols-1 lg:grid-cols-12 gap-20">
        {/* Left: Product Architecture (Images) */}
        <div className="lg:col-span-7 space-y-10">
          <div className="aspect-square bg-slate-50 rounded-[64px] overflow-hidden border border-slate-100 shadow-sm relative group">
            <Motion.img 
              key={mainImg}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              src={mainImg} 
              className="w-full h-full object-cover" 
            />
            {product.discountType !== 'none' && (
              <div className="absolute top-10 left-10 bg-emerald-600 text-white px-8 py-3 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl">
                -{product.discountValue}{product.discountType === 'percentage' ? '%' : ' ' + product.currency} Performance Credit
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-5 gap-4">
            {product.allPhotos.map((src, i) => (
              <div 
                key={i} 
                onClick={() => setMainImg(src)}
                className={`aspect-square rounded-[32px] border-4 overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 ${mainImg === src ? 'border-emerald-500 shadow-xl' : 'border-white shadow-sm'}`}
              >
                <img src={src} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <div className="pt-16 border-t border-slate-100 space-y-12">
             <div className="flex gap-12 border-b border-slate-100 pb-6">
                {['details', 'specs', 'reviews'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setActiveTab(t as any)}
                    className={`text-[11px] font-black uppercase tracking-[0.4em] transition-all relative pb-4 ${activeTab === t ? 'text-slate-900' : 'text-slate-300'}`}
                  >
                    {t}
                    {activeTab === t && <Motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-full" />}
                  </button>
                ))}
             </div>

             <AnimatePresence mode="wait">
                {activeTab === 'details' && (
                  <Motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Artifact Dossier</h3>
                    <p className="text-xl font-medium text-slate-600 leading-relaxed italic">{product.description}</p>
                  </Motion.div>
                )}
                {activeTab === 'specs' && (
                  <Motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {[
                      { l: "Platform", v: "High Frequency Tech" },
                      { l: "Unit SKU", v: product.sku },
                      { l: "Class", v: product.category },
                      { l: "Build", v: "Industrial Alloy" },
                      { l: "Cycle", v: "24-Month Protocol" },
                      { l: "Origin", v: "Global Distribution" }
                    ].map((s, i) => (
                      <div key={i} className="flex justify-between items-center p-8 bg-slate-50 rounded-[32px] border border-slate-100 group hover:border-emerald-200 transition-colors">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.l}</span>
                         <span className="text-xs font-black text-slate-900 uppercase italic">{s.v}</span>
                      </div>
                    ))}
                  </Motion.div>
                )}
                {activeTab === 'reviews' && (
                   <Motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    {[
                      { n: "Ismail M.", r: "Exceptional fidelity and the packaging was military-grade.", s: 5 },
                      { n: "Laila J.", r: "Best gadget in my daily stack. Fast delivery cycle.", s: 5 }
                    ].map((r, i) => (
                      <div key={i} className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 space-y-4">
                         <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black uppercase text-slate-900">{r.n}</span>
                            <div className="flex gap-1 text-[8px] text-emerald-500">
                               {[...Array(r.s)].map((_, j) => <i key={j} className="fas fa-star"></i>)}
                            </div>
                         </div>
                         <p className="text-slate-500 font-medium italic">"{r.r}"</p>
                      </div>
                    ))}
                  </Motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>

        {/* Right: Pricing & Deployment (Checkout) */}
        <div className="lg:col-span-5 space-y-12">
          <header className="space-y-6">
            <div className="flex items-center gap-4">
               <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">{product.category}</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archive Reference {product.sku}</span>
            </div>
            <h1 className="text-6xl font-black text-slate-900 leading-[0.9] tracking-tighter uppercase italic">{product.title}</h1>
            <div className="flex items-baseline gap-4 pt-4">
               <span className="text-6xl font-black text-slate-900">{product.price.toFixed(2)}</span>
               <span className="text-2xl font-bold text-slate-400 uppercase">{product.currency}</span>
            </div>
          </header>

          {/* Configuration Matrix (Variants) */}
          {product.variants && product.variants.length > 0 && (
            <section className="space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Configuration Matrix</h4>
              <div className="grid grid-cols-2 gap-3">
                 {product.variants.map(v => (
                   <button 
                    key={v.id}
                    onClick={() => setSelectedVariant(v.id)}
                    className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-start gap-2 text-left ${selectedVariant === v.id ? 'border-emerald-600 bg-emerald-50 shadow-xl' : 'border-slate-100 bg-white hover:border-slate-300'}`}
                   >
                      <span className={`text-[10px] font-black uppercase tracking-widest ${selectedVariant === v.id ? 'text-emerald-700' : 'text-slate-400'}`}>{v.name}</span>
                      <span className="text-sm font-black text-slate-800">{v.value}</span>
                      <span className="text-[10px] font-bold text-emerald-600 mt-2">{v.price} {product.currency}</span>
                   </button>
                 ))}
              </div>
            </section>
          )}

          {/* Upsell Cluster */}
          {upsellProducts.length > 0 && (
             <section className="bg-slate-50 p-10 rounded-[48px] border border-slate-100 space-y-8">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Component Synergy
                </h4>
                <div className="space-y-4">
                   {upsellProducts.map(up => (
                     <div 
                      key={up.id} 
                      onClick={() => toggleUpsell(up.id)}
                      className={`flex items-center justify-between p-5 rounded-[32px] border-2 transition-all cursor-pointer group ${selectedUpsells.has(up.id) ? 'bg-white border-indigo-600 shadow-xl' : 'bg-white/50 border-transparent hover:border-slate-300'}`}
                     >
                        <div className="flex items-center gap-5">
                           <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-100 bg-white shadow-sm group-hover:scale-105 transition-transform">
                              <img src={up.photo} className="w-full h-full object-cover" />
                           </div>
                           <div>
                              <p className="text-[11px] font-black uppercase text-slate-800">{up.title}</p>
                              <p className="text-[10px] font-bold text-indigo-600 mt-1">+{up.price} {up.currency}</p>
                           </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${selectedUpsells.has(up.id) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                           <i className="fas fa-plus"></i>
                        </div>
                     </div>
                   ))}
                </div>
             </section>
          )}

          {/* Order Terminal (Express Checkout) */}
          <section className="bg-slate-900 p-12 rounded-[64px] shadow-[0_60px_100px_-20px_rgba(0,0,0,0.3)] space-y-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000">
              <i className="fas fa-microchip text-[12rem] text-emerald-500"></i>
            </div>
            
            <div className="relative z-10 text-center">
              <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">Fast Deployment Order</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Direct Dispatch & Cash On Arrival Protocol</p>
            </div>
            
            <form onSubmit={handleOrder} className="space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Consignee First</label>
                    <input 
                      type="text" required placeholder="Hicham" 
                      className="w-full bg-white/5 border border-white/10 focus:border-emerald-500 p-5 rounded-[24px] outline-none transition font-black text-sm text-white placeholder:text-white/10"
                      value={customer.firstName}
                      onChange={(e) => setCustomer(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Consignee Last</label>
                    <input 
                      type="text" required placeholder="Idali" 
                      className="w-full bg-white/5 border border-white/10 focus:border-emerald-500 p-5 rounded-[24px] outline-none transition font-black text-sm text-white placeholder:text-white/10"
                      value={customer.lastName}
                      onChange={(e) => setCustomer(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Deployment Phone (Secure Link)</label>
                <input 
                  type="tel" required placeholder="06 XX XX XX XX" 
                  className="w-full bg-white/5 border border-white/10 focus:border-emerald-500 p-5 rounded-[24px] outline-none transition font-black text-sm text-white placeholder:text-white/10"
                  value={customer.phone}
                  onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-4">Deployment City</label>
                <input 
                  type="text" required placeholder="Casablanca / Sector 1" 
                  className="w-full bg-white/5 border border-white/10 focus:border-emerald-500 p-5 rounded-[24px] outline-none transition font-black text-sm text-white placeholder:text-white/10"
                  value={customer.city}
                  onChange={(e) => setCustomer(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>

              <div className="pt-8 border-t border-white/5">
                <div className="flex justify-between items-center mb-10 px-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Net Commitment:</span>
                  <span className="text-5xl font-black text-emerald-400 tracking-tighter">{totalPrice.toFixed(2)} <span className="text-xs">{product.currency}</span></span>
                </div>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 text-white py-8 rounded-[32px] font-black text-sm uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                >
                  {isSubmitting ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-rocket text-sm"></i> EXECUTE ORDER PROTOCOL</>}
                </button>
              </div>
            </form>
            
            <div className="flex items-center justify-center gap-4 text-emerald-500/30 relative z-10 pt-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[9px] font-black uppercase tracking-[0.4em]">End-to-End Encryption Terminal</span>
            </div>
          </section>

          {/* Fast Ops Indicators */}
          <div className="grid grid-cols-3 gap-6">
             {[
               { i: "fa-truck-fast", t: "Fast Ops", d: "Next Cycle" },
               { i: "fa-shield-halved", t: "Grade A", d: "Validated" },
               { i: "fa-lock", t: "Secure", d: "Encrypted" }
             ].map((item, idx) => (
               <div key={idx} className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 flex flex-col items-center text-center gap-4 shadow-sm group hover:border-emerald-200 transition-colors">
                  <i className={`fas ${item.i} text-slate-900 text-xl group-hover:scale-110 transition-transform`}></i>
                  <div>
                     <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest leading-none">{item.t}</p>
                     <p className="text-[8px] font-bold uppercase text-slate-400 tracking-widest mt-2">{item.d}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Storefront;

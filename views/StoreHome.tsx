
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface StoreHomeProps {
  products: Product[];
}

const StoreHome: React.FC<StoreHomeProps> = ({ products }) => {
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const allActiveProducts = products.filter(p => p.status === 'Active');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = [
    { name: "Smartwatches", icon: "fa-stopwatch", img: "https://images.unsplash.com/photo-1544117518-2b462fca8a93?q=80&w=800&auto=format&fit=crop" },
    { name: "Earbuds", icon: "fa-headphones-simple", img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop" },
    { name: "Powerbanks", icon: "fa-battery-full", img: "https://images.unsplash.com/photo-1625842268584-8f3bf9ff16a0?q=80&w=800&auto=format&fit=crop" },
    { name: "Mobile Accessories", icon: "fa-usb", img: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=800&auto=format&fit=crop" }
  ];

  const bestSellers = allActiveProducts.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Premium Sticky Header */}
      <nav className={`h-20 fixed top-0 left-0 w-full z-[100] transition-all duration-500 px-8 md:px-16 flex items-center justify-between ${isScrolled ? 'bg-white/90 backdrop-blur-2xl shadow-xl border-b border-slate-100 py-4' : 'bg-transparent py-8'}`}>
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all shadow-lg ${isScrolled ? 'bg-emerald-600' : 'bg-slate-900'}`}>
              <i className="fas fa-bolt"></i>
            </div>
            <span className={`font-black text-2xl tracking-tighter uppercase italic leading-none transition-colors ${isScrolled ? 'text-slate-900' : 'text-white'}`}>Gwapa Tech<span className="text-emerald-500">.</span></span>
          </Link>

          <div className="hidden lg:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <div 
              className="relative group py-6 cursor-pointer hover:text-emerald-600 transition-colors"
              onMouseEnter={() => setActiveMegaMenu('categories')}
            >
              Categories <i className="fas fa-chevron-down text-[8px] ml-1"></i>
            </div>
            <span className="hover:text-emerald-600 cursor-pointer transition-colors">Best Sellers</span>
            <Link to="/login" className="hover:text-emerald-600 transition-colors">Staff Portal</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <button className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-400 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
             <i className="fas fa-search"></i>
           </button>
           <button className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-emerald-600 transition-all shadow-2xl">
             <i className="fas fa-shopping-bag"></i>
           </button>
        </div>

        {/* Mega Menu Overlay */}
        <AnimatePresence>
          {activeMegaMenu === 'categories' && (
            <>
              <Motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onMouseEnter={() => setActiveMegaMenu(null)}
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[90]"
              />
              <Motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onMouseLeave={() => setActiveMegaMenu(null)}
                className="absolute top-20 left-0 w-full bg-white border-b border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] p-12 z-[110]"
              >
                <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8">
                  {categories.map((cat, i) => (
                    <div key={i} className="group cursor-pointer space-y-4">
                      <div className="aspect-[16/10] bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 group-hover:border-emerald-500 transition-all shadow-sm group-hover:shadow-xl">
                        <img src={cat.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={cat.name} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                           <i className={`fas ${cat.icon} text-emerald-500 text-sm`}></i>
                           <h4 className="font-black text-sm uppercase tracking-widest text-slate-800">{cat.name}</h4>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 pl-7">Professional Grade Gear</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-1">
        {/* Cinematic Hero */}
        <section className="relative h-[90vh] flex items-center px-8 md:px-24 overflow-hidden bg-slate-900 group">
          <div className="absolute inset-0 z-0">
             <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2000&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-[3s]" alt="Hero" />
             <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />
          </div>
          
          <Motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
            className="relative z-10 max-w-4xl space-y-8"
          >
            <span className="inline-block px-5 py-2 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-md">
              Exclusive Tech Dispatch
            </span>
            <h1 className="text-6xl md:text-[8rem] font-black text-white leading-[0.85] tracking-tighter uppercase italic">
              Future <br /> <span className="text-emerald-500">Node.</span>
            </h1>
            <p className="text-slate-400 text-xl font-medium max-w-xl leading-relaxed">
              Precision engineered electronics for the high-frequency lifestyle. Global logistics supported by COD deployment.
            </p>
            <div className="flex items-center gap-6 pt-10">
               <button className="px-12 py-6 bg-emerald-600 text-white rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">Launch Catalog</button>
               <button className="px-10 py-6 bg-white/5 border border-white/10 text-white rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all">Protocol Specs</button>
            </div>
          </Motion.div>
        </section>

        {/* Category Navigation */}
        <section className="py-24 px-8 md:px-16 max-w-7xl mx-auto">
          <header className="mb-16">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">Infrastructure</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mt-2">Classified Operational Hubs</p>
          </header>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <Motion.div key={i} whileHover={{ y: -10 }} className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-6 group hover:shadow-2xl transition-all cursor-pointer">
                <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-3xl text-slate-300 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                  <i className={`fas ${cat.icon}`}></i>
                </div>
                <div>
                   <h4 className="font-black text-sm uppercase tracking-widest text-slate-800">{cat.name}</h4>
                   <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Access Grid</p>
                </div>
              </Motion.div>
            ))}
          </div>
        </section>

        {/* Best Sellers Grid */}
        <section className="py-24 px-8 md:px-16 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
               <div>
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic">Validated Units</h2>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] mt-2">Elite Selection best sellers</p>
               </div>
               <button className="text-[10px] font-black uppercase text-slate-400 hover:text-emerald-600 tracking-widest transition">Full Manifest <i className="fas fa-arrow-right ml-2"></i></button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {bestSellers.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="group space-y-6">
                   <div className="aspect-square bg-slate-50 rounded-[48px] overflow-hidden border border-slate-100 shadow-sm group-hover:shadow-3xl transition-all duration-700 relative">
                      <img src={p.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" alt={p.title} />
                      <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors" />
                      <div className="absolute bottom-6 left-6 right-6">
                         <div className="bg-white/90 backdrop-blur px-6 py-4 rounded-[28px] shadow-2xl flex justify-between items-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all">
                            <span className="text-[9px] font-black uppercase text-slate-900">Add to Node</span>
                            <i className="fas fa-plus text-[10px] text-emerald-600"></i>
                         </div>
                      </div>
                   </div>
                   <div className="px-4">
                      <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">{p.category}</div>
                      <h4 className="font-black text-lg text-slate-900 leading-tight uppercase italic">{p.title}</h4>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-2xl font-black text-slate-900">{p.price.toFixed(2)} <span className="text-xs text-slate-400">{p.currency}</span></span>
                        <div className="flex gap-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                        </div>
                      </div>
                   </div>
                </Link>
              ))}
              {bestSellers.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-20 bg-slate-50 rounded-[48px] border border-dashed border-slate-200">
                  <i className="fas fa-microchip text-4xl mb-4"></i>
                  <p className="font-black uppercase tracking-widest text-[10px]">No Artifacts Logged In Catalog</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Promo Banner */}
        <section className="mx-8 md:mx-16 my-24 py-32 px-12 bg-slate-950 rounded-[64px] text-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.15)_0%,_transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
           <div className="relative z-10 space-y-10">
              <h2 className="text-5xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">Limited Phase <br /> <span className="text-emerald-500">Reductions.</span></h2>
              <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto italic">Up to 40% performance credit applied to all flagship audio nodes.</p>
              <button className="px-16 py-7 bg-white text-slate-950 rounded-full font-black text-sm uppercase tracking-[0.4em] shadow-3xl hover:bg-emerald-500 hover:text-white transition-all">Direct Orders</button>
           </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-white py-32 px-12 md:px-24">
         <div className="max-w-7xl mx-auto space-y-24">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-20">
               <div className="lg:col-span-2 space-y-10">
                  <div className="font-black text-4xl tracking-tighter uppercase italic leading-none">Gwapa Tech<span className="text-emerald-500">.</span></div>
                  <p className="text-slate-500 text-xl font-medium leading-relaxed max-w-md">
                    Leading the frontier of mobile artifacts. High-fidelity gear for the modern infrastructure operator.
                  </p>
               </div>
               <div className="space-y-10">
                  <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Navigation</h5>
                  <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-slate-400">
                    <li>Best Sellers</li>
                    <li>Flash Protocol</li>
                    <li>Support Hub</li>
                  </ul>
               </div>
               <div className="space-y-10">
                  <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Corporate</h5>
                  <ul className="space-y-4 text-xs font-black uppercase tracking-widest text-slate-400">
                    <li><Link to="/login" className="hover:text-white transition">Staff Entry</Link></li>
                    <li>Privacy Protocol</li>
                  </ul>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default StoreHome;

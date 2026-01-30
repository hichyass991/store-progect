import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, Product, StoreSection } from '../types';
import { motion } from 'framer-motion';
import HeroSection from '../components/HeroSection';

// Use Motion alias with any to bypass broken framer-motion type definitions in the environment
const Motion = motion as any;

interface StoreHomeProps {
  stores: Store[];
  products: Product[];
}

const StoreHome: React.FC<StoreHomeProps> = ({ stores, products }) => {
  const { storeId } = useParams();
  const store = stores.find(s => s.id === storeId);
  const activeProducts = products.filter(p => p.status === 'Active');

  if (!store) return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 font-inter">
      <div className="text-center space-y-6">
        <h1 className="text-9xl font-black text-slate-100">404</h1>
        <p className="text-slate-400 font-bold uppercase tracking-widest">Store not found or expired.</p>
        <Link to="/" className="inline-block px-10 py-4 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-widest shadow-xl">Back Home</Link>
      </div>
    </div>
  );

  const renderSection = (section: StoreSection) => {
    switch (section.type) {
      case 'hero':
        return (
          <HeroSection
            key={section.id}
            id={section.id}
            title={section.content.title}
            subtitle={section.content.subtitle}
            cta={section.content.cta}
            media={section.content.media || []}
            autoplay={section.content.autoplay !== false}
            transition={section.content.transition || 'fade'}
          />
        );
      case 'grid':
        return (
          <section key={section.id} className="py-32 px-8 bg-white">
            <h2 className="text-4xl md:text-5xl font-black text-center mb-24 tracking-tighter text-slate-900">{section.content.title || 'Featured Collections'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
              {activeProducts.map(p => (
                <Motion.div 
                  key={p.id}
                  whileHover={{ y: -10 }}
                  className="group"
                >
                  <Link to={`/store/${p.id}`}>
                    <div className="aspect-square bg-slate-50 rounded-[48px] overflow-hidden mb-8 shadow-sm group-hover:shadow-2xl transition-all duration-700">
                      <img src={p.photo} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    </div>
                    <div className="px-4">
                      <h4 className="font-bold text-xl text-slate-800 mb-2">{p.title}</h4>
                      <p className="text-emerald-600 font-black text-2xl">{p.price} <span className="text-xs font-bold uppercase tracking-widest">{p.currency}</span></p>
                    </div>
                  </Link>
                </Motion.div>
              ))}
            </div>
          </section>
        );
      case 'banner':
        return (
          <section key={section.id} className="m-8 md:m-16 py-32 px-12 bg-emerald-600 rounded-[64px] text-white text-center shadow-3xl shadow-emerald-100">
            <h2 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-none">{section.content.title || 'Limited Offer'}</h2>
            <p className="text-emerald-100 text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">{section.content.subtitle || 'Exclusive deals on architectural pieces.'}</p>
            <button className="bg-white text-emerald-600 px-16 py-6 rounded-full font-black text-sm uppercase tracking-[0.3em] hover:bg-slate-50 hover:scale-110 transition-transform shadow-xl shadow-emerald-700/40">
              Claim Now
            </button>
          </section>
        );
      case 'testimonials':
        return (
          <section key={section.id} className="py-32 px-12 bg-slate-50">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
              {(section.content.items || []).map((t: any, idx: number) => (
                <Motion.div 
                  key={idx} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm space-y-8"
                >
                  <div className="text-emerald-500 text-4xl opacity-20"><i className="fas fa-quote-left"></i></div>
                  <p className="text-slate-600 text-xl font-medium leading-relaxed italic">"{t.text}"</p>
                  <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-[10px]">{t.name.substring(0, 1)}</div>
                    <div className="font-black text-[10px] uppercase tracking-widest text-slate-400">{t.name}</div>
                  </div>
                </Motion.div>
              ))}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter overflow-x-hidden">
      {/* Header */}
      <nav className="h-24 bg-white/80 backdrop-blur-2xl border-b border-slate-100 flex items-center justify-between px-8 md:px-16 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {store.logo ? (
            <img src={store.logo} alt={store.name} className="h-12 w-auto object-contain" />
          ) : (
            <span className="font-black text-3xl tracking-tighter text-emerald-600 uppercase italic leading-none">{store.name}.</span>
          )}
        </div>
        <div className="hidden md:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          <span className="hover:text-emerald-600 cursor-pointer transition">Shop All</span>
          <span className="hover:text-emerald-600 cursor-pointer transition">About Studio</span>
          <span className="hover:text-emerald-600 cursor-pointer transition">Client Hub</span>
        </div>
        <div className="flex items-center gap-4">
           {store.social.wa && (
             <a href={`https://wa.me/${store.social.wa}`} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
               <i className="fab fa-whatsapp text-lg"></i>
             </a>
           )}
        </div>
      </nav>

      <main className="flex-1">
        {store.sections && store.sections.length > 0 ? (
          store.sections.map(renderSection)
        ) : (
          <div className="py-40 text-center space-y-8 bg-white min-h-[80vh] flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 text-4xl mb-4"><i className="fas fa-hammer"></i></div>
            <div className="space-y-2">
              <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase italic">{store.name}</h1>
              <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Grand Opening Soon</p>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 py-32 px-12 md:px-24 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          <div className="space-y-10">
            <div className="font-black text-4xl tracking-tighter uppercase italic leading-none">{store.name}.</div>
            <p className="text-slate-500 text-lg max-w-md leading-relaxed font-light">
              Pioneering digital architecture through meticulously crafted storefronts and high-performance user experiences.
            </p>
            <div className="flex gap-10">
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Studio Contact</h5>
                <div className="flex gap-4">
                  {store.social.ig && <i className="fab fa-instagram text-xl hover:text-emerald-500 transition cursor-pointer"></i>}
                  {store.social.wa && <i className="fab fa-whatsapp text-xl hover:text-emerald-500 transition cursor-pointer"></i>}
                  {store.social.fb && <i className="fab fa-facebook-f text-xl hover:text-emerald-500 transition cursor-pointer"></i>}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-12">
            <div className="space-y-6">
              <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Collections</h5>
              <ul className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <li className="hover:text-white transition cursor-pointer">Archive</li>
                <li className="hover:text-white transition cursor-pointer">New Drops</li>
                <li className="hover:text-white transition cursor-pointer">Limited Pieces</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Information</h5>
              <ul className="space-y-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <li className="hover:text-white transition cursor-pointer">Returns</li>
                <li className="hover:text-white transition cursor-pointer">Sizing</li>
                <li className="hover:text-white transition cursor-pointer">Shipping</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">
            &copy; 2024 Gwapashop Enterprise &middot; Digital Standard
          </div>
          <div className="flex gap-8 text-[9px] font-black text-white/20 uppercase tracking-widest">
            <span>Privacy Policy</span>
            <span>Terms of Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StoreHome;
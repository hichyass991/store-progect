
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Store, Product, StoreSection } from '../types';

interface StoreHomeProps {
  stores: Store[];
  products: Product[];
}

const StoreHome: React.FC<StoreHomeProps> = ({ stores, products }) => {
  const { storeId } = useParams();
  const store = stores.find(s => s.id === storeId);
  const activeProducts = products.filter(p => p.status === 'Active');

  if (!store) return <div className="p-20 text-center font-bold text-slate-400">Store not found</div>;

  const renderSection = (section: StoreSection) => {
    switch (section.type) {
      case 'hero':
        return (
          <section key={section.id} className="relative h-[600px] flex items-center justify-center bg-slate-900 overflow-hidden">
            {section.content.image && <img src={section.content.image} className="absolute inset-0 w-full h-full object-cover opacity-50" />}
            <div className="relative z-10 text-center px-6 max-w-4xl">
              <h1 className="text-white text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-none">
                {section.content.title || 'Defining Modern Space.'}
              </h1>
              <p className="text-slate-200 text-xl mb-10 font-light max-w-2xl mx-auto">
                {section.content.subtitle || 'High-performance architectural components for digital stores.'}
              </p>
              <button className="bg-emerald-600 text-white px-12 py-5 rounded-full font-bold text-xs uppercase tracking-widest shadow-xl">
                {section.content.cta || 'Shop Now'}
              </button>
            </div>
          </section>
        );
      case 'grid':
        return (
          <section key={section.id} className="py-24 px-8 bg-white">
            <h2 className="text-3xl font-black text-center mb-16 tracking-tight">{section.content.title || 'Featured Collections'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
              {activeProducts.map(p => (
                <Link to={`/store/${p.id}`} key={p.id} className="group">
                  <div className="aspect-square bg-slate-100 rounded-[32px] overflow-hidden mb-6 shadow-sm group-hover:shadow-xl transition-all duration-500">
                    <img src={p.photo} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <h4 className="font-bold text-lg text-slate-800">{p.title}</h4>
                  <p className="text-emerald-600 font-black text-xl">{p.price} <span className="text-xs uppercase">{p.currency}</span></p>
                </Link>
              ))}
            </div>
          </section>
        );
      case 'banner':
        return (
          <section key={section.id} className="m-8 md:m-16 py-20 px-10 bg-emerald-600 rounded-[40px] text-white text-center">
            <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">{section.content.title || 'Limited Offer'}</h2>
            <p className="text-emerald-100 text-lg mb-8">{section.content.subtitle || 'Exclusive deals on architectural pieces.'}</p>
            <button className="bg-white text-emerald-600 px-10 py-4 rounded-full font-black text-xs uppercase">
              Claim Discount
            </button>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="h-20 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-8 md:px-16 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {store.logo ? (
            <img src={store.logo} alt={store.name} className="h-10 object-contain" />
          ) : (
            <span className="font-black text-2xl tracking-tighter text-emerald-600 uppercase">{store.name}.</span>
          )}
        </div>
        <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span className="hover:text-emerald-600 cursor-pointer transition">New Arrivals</span>
          <span className="hover:text-emerald-600 cursor-pointer transition">Collections</span>
          <span className="hover:text-emerald-600 cursor-pointer transition">Contact</span>
        </div>
      </nav>

      <main className="flex-1">
        {store.sections && store.sections.length > 0 ? (
          store.sections.map(renderSection)
        ) : (
          <div className="py-40 text-center space-y-4">
            <h1 className="text-4xl font-black text-slate-800">Welcome to {store.name}</h1>
            <p className="text-slate-400">Our store is currently being customized. Please check back later.</p>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 py-20 px-16 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <div className="font-black text-3xl mb-6 tracking-tighter uppercase">{store.name}.</div>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              Crafting premium digital experiences and delivering quality products directly to your doorstep.
            </p>
          </div>
          <div className="flex gap-12 justify-end">
            <div className="space-y-4">
              <h5 className="text-[10px] font-black uppercase tracking-widest text-white/30">Connect</h5>
              <div className="flex gap-4 text-xl">
                {store.social.ig && <i className="fab fa-instagram hover:text-emerald-500 cursor-pointer transition"></i>}
                {store.social.wa && <i className="fab fa-whatsapp hover:text-emerald-500 cursor-pointer transition"></i>}
                {store.social.fb && <i className="fab fa-facebook hover:text-emerald-500 cursor-pointer transition"></i>}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-20 pt-8 border-t border-white/5 text-[9px] font-bold text-white/10 uppercase tracking-[0.3em] text-center">
          &copy; 2024 Gwapashop Enterprise. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default StoreHome;

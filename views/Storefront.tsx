
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, Lead, LeadStatus, AbandonedCart } from '../types';

interface StorefrontProps {
  products: Product[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  setAbandonedCarts: React.Dispatch<React.SetStateAction<AbandonedCart[]>>;
}

const Storefront: React.FC<StorefrontProps> = ({ products, setLeads, setAbandonedCarts }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id === productId);

  const [mainImg, setMainImg] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [isOrdered, setIsOrdered] = useState(false);

  useEffect(() => {
    if (product) setMainImg(product.photo);
  }, [product]);

  // Track abandoned cart
  useEffect(() => {
    if (customer.name.length > 2 || customer.phone.length > 5) {
      const timer = setTimeout(() => {
        const id = 'abc_' + Math.random().toString(36).substr(2, 5);
        const cart: AbandonedCart = {
          id,
          name: customer.name,
          phone: customer.phone,
          product_id: productId!,
          timestamp: new Date().toLocaleString()
        };
        setAbandonedCarts(prev => {
          const existingIdx = prev.findIndex(c => c.phone === customer.phone);
          if (existingIdx > -1) {
            const copy = [...prev];
            copy[existingIdx] = cart;
            return copy;
          }
          return [cart, ...prev];
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [customer, productId, setAbandonedCarts]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
        <h1 className="text-8xl font-black text-slate-100">404</h1>
        <p className="text-slate-400 font-bold -mt-4 mb-8">Product Not Found</p>
        <button onClick={() => navigate('/')} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold">Return to Dashboard</button>
      </div>
    );
  }

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.phone) return alert("Please fill in your details.");

    const now = new Date().toLocaleString();
    const newLead: Lead = {
      id: 'lead_' + Math.random().toString(36).substr(2, 9),
      id_num: '#' + (Math.floor(Math.random() * 9000) + 1000),
      name: customer.name,
      phone: customer.phone,
      product_id: productId!,
      status: LeadStatus.NEW,
      createdAt: now,
      updatedAt: now
    };

    setLeads(prev => [newLead, ...prev]);
    setAbandonedCarts(prev => prev.filter(c => c.phone !== customer.phone));
    setIsOrdered(true);
  };

  if (isOrdered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-emerald-50">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mb-6 pulse-green">
          <i className="fas fa-check"></i>
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-2">Order Confirmed!</h2>
        <p className="text-slate-500 max-w-md mb-8">Thank you for your purchase. Our team will contact you shortly to verify your delivery details.</p>
        <button onClick={() => setIsOrdered(false)} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl">Done</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-inter">
      <div className="max-w-6xl mx-auto">
        <nav className="flex items-center justify-between mb-10 py-4 border-b">
          <div className="flex items-center gap-2 text-emerald-600 font-black text-2xl tracking-tighter">
            <i className="fas fa-shopping-bag"></i> GWAPASHOP.
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full shadow-sm border">
            Official Store
          </div>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-square bg-white rounded-[40px] overflow-hidden border border-slate-200 shadow-sm">
              <img src={mainImg} alt="" className="w-full h-full object-cover transition-all duration-700" />
            </div>
            <div className="grid grid-cols-5 gap-3">
              {product.allPhotos.map((src, i) => (
                <img 
                  key={i} src={src} alt="" 
                  onClick={() => setMainImg(src)}
                  className={`aspect-square rounded-2xl border-2 object-cover cursor-pointer transition ${mainImg === src ? 'border-emerald-500 scale-95' : 'border-transparent hover:border-slate-200'}`} 
                />
              ))}
            </div>
          </div>

          {/* Details & Form */}
          <div className="lg:col-span-5 flex flex-col space-y-8">
            <div>
              <span className="text-[10px] font-black text-emerald-600 tracking-[0.2em] uppercase bg-emerald-50 px-4 py-2 rounded-full inline-block mb-4">
                {product.category}
              </span>
              <h1 className="text-5xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-4">{product.title}</h1>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-emerald-600">{product.price.toFixed(2)}</span>
                <span className="text-lg font-bold text-slate-400">{product.currency}</span>
                {product.backupPrice && (
                  <span className="text-xl text-slate-300 line-through ml-2">{product.backupPrice.toFixed(2)}</span>
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[40px] border-2 border-emerald-500 shadow-2xl shadow-emerald-100 space-y-6">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Express Order</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pay Cash on Delivery</p>
              
              <form onSubmit={handleOrder} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Your Full Name</label>
                  <input 
                    type="text" required placeholder="Ex: John Doe" 
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 p-4 rounded-2xl outline-none transition font-medium"
                    value={customer.name}
                    onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Phone Number</label>
                  <input 
                    type="tel" required placeholder="06XXXXXXXX" 
                    className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-500 p-4 rounded-2xl outline-none transition font-bold"
                    value={customer.phone}
                    onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black text-xl shadow-2xl shadow-emerald-200 hover:scale-[1.02] active:scale-95 transition-all">
                  ORDER NOW
                </button>
              </form>
              <div className="flex items-center justify-center gap-4 text-emerald-600/50">
                <i className="fas fa-shipping-fast"></i>
                <span className="text-[10px] font-black uppercase tracking-widest">Free Express Shipping Today</span>
              </div>
            </div>

            <div className="prose prose-slate max-w-none">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-slate-100 flex items-center justify-center"><i className="fas fa-info text-[6px]"></i></div>
                Product Description
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Storefront;

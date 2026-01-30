
import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, User, UserRole, ProductStatus } from '../types';
import { motion } from 'framer-motion';

const Motion = motion as any;

interface ProductDetailViewProps {
  products: Product[];
  currentUser: User;
}

const ProductDetailView: React.FC<ProductDetailViewProps> = ({ products, currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-20">
        <h2 className="text-6xl font-black text-slate-100 mb-4">404</h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest">Artifact not found in ledger.</p>
        <button onClick={() => navigate('/products')} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition">Return to Catalog</button>
      </div>
    );
  }

  const purchased = product.purchasedStock || 0;
  const sold = product.soldStock || 0;
  const remaining = purchased - sold;
  const margin = product.price - product.costPrice;
  const roi = product.costPrice > 0 ? ((margin / product.costPrice) * 100).toFixed(0) : '0';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 pb-32">
      {/* Dynamic Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/products')}
            className="w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 transition flex items-center justify-center shadow-sm"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">{product.title}</h1>
              <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border ${
                product.status === ProductStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                product.status === ProductStatus.DRAFT ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-200'
              }`}>
                {product.status}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Blueprint ID: {product.sku} <span className="mx-2">|</span> Architecture: {product.category || 'Luxury'}</p>
          </div>
        </div>
        
        {currentUser.role === UserRole.ADMIN && (
          <div className="flex gap-3">
            <button 
              onClick={() => window.open(`#/store/${product.id}`, '_blank')}
              className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-emerald-500 transition flex items-center gap-2"
            >
              <i className="fas fa-external-link-alt"></i> Preview Storefront
            </button>
            <button 
              onClick={() => navigate(`/products/edit/${product.id}`)}
              className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all"
            >
              <i className="fas fa-edit mr-2"></i> Modify Blueprint
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Visuals & Narrative */}
        <div className="lg:col-span-7 space-y-10">
          {/* Main Visual Component */}
          <section className="bg-white p-4 rounded-[48px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
            <div className="aspect-[4/3] rounded-[40px] overflow-hidden bg-slate-50 relative group">
              <img src={product.photo} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
              {product.discountType !== 'none' && (
                <div className="absolute top-8 left-8 bg-indigo-600 text-white px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl">
                  {product.discountValue}{product.discountType === 'percentage' ? '%' : ' ' + product.currency} OFF Deployment
                </div>
              )}
            </div>
            
            {/* Gallery Strip */}
            {product.allPhotos && product.allPhotos.length > 0 && (
              <div className="grid grid-cols-5 gap-4 mt-4 p-2">
                {product.allPhotos.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-[24px] overflow-hidden border-4 border-white shadow-lg transition-all hover:scale-105 cursor-zoom-in">
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Detailed Narrative */}
          <section className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                <i className="fas fa-align-left text-sm"></i>
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight italic uppercase">Product Specification Narrative</h3>
            </div>
            <p className="text-slate-600 font-medium leading-relaxed text-lg italic bg-slate-50/50 p-8 rounded-[32px] border border-white">
              {product.description || 'No descriptive narrative available for this artifact.'}
            </p>
          </section>
        </div>

        {/* Right Column: Intelligence & Financials */}
        <div className="lg:col-span-5 space-y-10">
          {/* Financial Architecture */}
          <section className="bg-slate-900 p-10 rounded-[48px] text-white space-y-8 relative overflow-hidden group">
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Financial Unit Structure</h4>
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Unit MSRP</p>
                <div className="text-4xl font-black">{product.price.toLocaleString()} <span className="text-sm opacity-40">{product.currency}</span></div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Acquisition Cost</p>
                <div className="text-4xl font-black text-slate-400">{product.costPrice.toLocaleString()} <span className="text-sm opacity-20">{product.currency}</span></div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Net Margin Yield</p>
                <div className="text-3xl font-black text-emerald-400">+{margin.toLocaleString()} <span className="text-xs">{product.currency}</span></div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">ROI Score</p>
                <div className="text-3xl font-black text-indigo-300">{roi}%</div>
              </div>
            </div>
          </section>

          {/* Inventory Distribution */}
          <section className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-xl shadow-slate-200/40 space-y-8">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Stock Lifecycle Ledger</h4>
              <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${remaining < 10 ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-emerald-50 text-emerald-600'}`}>
                {remaining < 10 ? 'Critical Depletion' : 'Stable Inventory'}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Confirmed Sales Progress</span>
                <span className="font-black text-slate-800">{sold} / {purchased} Units</span>
              </div>
              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex p-1">
                <Motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(sold / (purchased || 1)) * 100}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="bg-indigo-600 h-full rounded-full shadow-lg shadow-indigo-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-slate-50 p-6 rounded-[32px] text-center border border-white">
                  <div className="text-2xl font-black text-slate-800">{remaining}</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ready for Fulfillment</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-[32px] text-center border border-white">
                  <div className="text-2xl font-black text-slate-800">{(sold / (purchased || 1) * 100).toFixed(1)}%</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sell-Through Rate</div>
                </div>
              </div>
            </div>
          </section>

          {/* Product Variant Matrix */}
          {product.variants && product.variants.length > 0 && (
            <section className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-xl shadow-slate-200/40 space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Variation Configuration Matrix</h4>
              <div className="space-y-3">
                {product.variants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-white group hover:border-indigo-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm border border-slate-100">
                        {v.value.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{v.name}: {v.value}</p>
                        <p className="text-[9px] font-bold text-slate-400 font-mono mt-1.5">SKU: {v.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">{v.price} {product.currency}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${v.stock < 5 ? 'text-red-500' : 'text-slate-400'}`}>{v.stock} in stock</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailView;

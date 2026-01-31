
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Product, ProductStatus, User, Category } from '../types';
import { csvService } from '../services/csvService';
import { supabaseService } from '../services/supabaseService';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface ProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  currentUser: User;
  categories: Category[];
}

const Products: React.FC<ProductsProps> = ({ products, setProducts, currentUser, categories }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'inventory' | 'analytics'>('inventory');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const isFiltered = search !== '' || filterStatus !== 'All' || filterCategory !== 'All';

  const resetFilters = () => {
    setSearch('');
    setFilterStatus('All');
    setFilterCategory('All');
  };

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                           p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, search, filterStatus, filterCategory]);

  const handleExport = () => {
    csvService.exportToCSV(products, 'gwapa_catalog_manifest');
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm('Delete this product artifact?')) {
      await supabaseService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 px-4">
        <div className="space-y-4">
          <h1 className="font-syne text-5xl font-black text-slate-800 tracking-tighter leading-none italic uppercase">
            Catalog <span className="text-slate-300">Hub.</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Inventory Management & Global Deployment</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleExport}
            className="bg-white border border-slate-100 text-slate-400 px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-emerald-500 hover:text-emerald-600 transition-all"
          >
            <i className="fas fa-download mr-2"></i> Export Manifest
          </button>
          <button 
            onClick={() => navigate('/products/new')}
            className="bg-slate-900 text-white px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all"
          >
            + Create Artifact
          </button>
        </div>
      </header>

      {/* Advanced Control Bar */}
      <div className="sq-card p-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="text" 
            placeholder="Search by Title or SKU..." 
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[24px] text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative">
            <select 
              className="bg-slate-50 border-none rounded-[20px] pl-6 pr-10 py-4 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer text-slate-500 min-w-[160px]"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[10px]"></i>
          </div>

          <div className="relative">
            <select 
              className="bg-slate-50 border-none rounded-[20px] pl-6 pr-10 py-4 text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer text-slate-500 min-w-[160px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value={ProductStatus.ACTIVE}>Live Production</option>
              <option value={ProductStatus.DRAFT}>Work in Progress</option>
              <option value={ProductStatus.ARCHIVED}>System Archive</option>
            </select>
            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[10px]"></i>
          </div>

          <AnimatePresence>
            {isFiltered && (
              <Motion.button 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={resetFilters}
                className="w-12 h-12 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100"
                title="Reset All Filters"
              >
                <i className="fas fa-undo-alt text-xs"></i>
              </Motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Artifact Matrix */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b text-slate-400 uppercase text-[9px] font-black tracking-[0.4em]">
              <tr>
                <th className="px-10 py-8">Identity Cluster</th>
                <th className="px-6 py-8">Blueprint SKU</th>
                <th className="px-6 py-8">Valuation</th>
                <th className="px-6 py-8">Inventory Status</th>
                <th className="px-6 py-8">Lifecycle</th>
                <th className="px-10 py-8 text-right">Deployment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => {
                const remaining = p.purchasedStock - p.soldStock;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-[20px] bg-slate-100 overflow-hidden border shadow-sm flex-shrink-0">
                          <img src={p.photo} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        </div>
                        <div>
                          <button 
                            onClick={() => setQuickViewProduct(p)}
                            className="font-syne font-black text-slate-800 text-lg leading-tight hover:text-emerald-600 transition-colors text-left"
                          >
                            {p.title}
                          </button>
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">{p.category || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 font-mono text-slate-400 font-bold text-xs uppercase">{p.sku}</td>
                    <td className="px-6 py-6">
                       <div className="text-sm font-black text-slate-800">{p.price.toFixed(2)} <span className="text-[9px] text-slate-300 uppercase">{p.currency}</span></div>
                    </td>
                    <td className="px-6 py-6">
                       <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${remaining < 5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                          <span className="font-bold text-slate-600 text-xs">{remaining} <span className="text-slate-300 uppercase text-[9px]">Units</span></span>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        p.status === ProductStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        p.status === ProductStatus.DRAFT ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate(`/products/edit/${p.id}`)}
                          className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center justify-center shadow-sm"
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button 
                          onClick={() => deleteProduct(p.id)}
                          className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center shadow-sm"
                        >
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-40 text-center text-slate-200 font-syne font-black uppercase tracking-[0.6em] text-xl italic opacity-20">
                    Database Query Empty
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick View Detailed Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <Motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setQuickViewProduct(null)} 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl" 
            />
            <Motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-white w-full max-w-5xl rounded-[64px] shadow-3xl overflow-hidden my-auto flex flex-col md:flex-row h-[85vh] md:h-auto max-h-[90vh]"
            >
              {/* Product Visual */}
              <div className="w-full md:w-5/12 bg-slate-50 relative group">
                <img 
                  src={quickViewProduct.photo} 
                  alt={quickViewProduct.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 text-white">
                  <div className="bg-emerald-500 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest mb-4 inline-block shadow-lg">Visual Artifact Verified</div>
                  <h3 className="font-syne text-4xl font-black italic tracking-tighter uppercase drop-shadow-xl">{quickViewProduct.title}</h3>
                </div>
              </div>

              {/* Product Data */}
              <div className="w-full md:w-7/12 p-14 flex flex-col space-y-10 overflow-y-auto no-scrollbar">
                <header className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Artifact Identifier</p>
                    <div className="flex items-center gap-4">
                       <span className="text-xl font-mono font-black text-slate-800">{quickViewProduct.sku}</span>
                       <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[9px] font-black uppercase border border-slate-100">{quickViewProduct.category}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setQuickViewProduct(null)}
                    className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center border border-slate-100 shadow-sm"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </header>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-8 bg-slate-50 rounded-[40px] border border-white shadow-inner space-y-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pricing Model (MSRP)</p>
                    <div className="text-3xl font-black text-slate-800">{quickViewProduct.price.toLocaleString()} <span className="text-[10px] text-slate-300">{quickViewProduct.currency}</span></div>
                  </div>
                  <div className="p-8 bg-emerald-50 rounded-[40px] border border-emerald-100/50 space-y-2">
                    <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Net Profit Margin</p>
                    <div className="text-3xl font-black text-emerald-600">+{(quickViewProduct.price - quickViewProduct.costPrice).toLocaleString()} <span className="text-[10px] opacity-40">{quickViewProduct.currency}</span></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100 pb-4 flex justify-between">
                    <span>Blueprint Narrative</span>
                    <i className="fas fa-feather-pointed opacity-20"></i>
                  </h4>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed italic pr-10">
                    {quickViewProduct.description || "No strategic narrative has been architected for this artifact yet."}
                  </p>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-50">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Inventory Lifecycle</span>
                    <span className={quickViewProduct.purchasedStock - quickViewProduct.soldStock < 10 ? 'text-red-500' : 'text-emerald-500'}>
                      {quickViewProduct.purchasedStock - quickViewProduct.soldStock} Units In Reserve
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5">
                    <Motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(quickViewProduct.soldStock / (quickViewProduct.purchasedStock || 1)) * 100}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className="bg-slate-900 h-full rounded-full shadow-lg"
                    />
                  </div>
                </div>

                <footer className="pt-10 flex gap-4 mt-auto">
                  <button 
                    onClick={() => { setQuickViewProduct(null); navigate(`/products/edit/${quickViewProduct.id}`); }}
                    className="flex-1 py-5 bg-slate-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-600 transition-all active:scale-95"
                  >
                    Modify Blueprint
                  </button>
                  <button 
                    onClick={() => { setQuickViewProduct(null); navigate(`/products/view/${quickViewProduct.id}`); }}
                    className="w-16 h-16 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-[24px] flex items-center justify-center transition shadow-sm"
                    title="Deep Analytics View"
                  >
                    <i className="fas fa-microchip"></i>
                  </button>
                </footer>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;

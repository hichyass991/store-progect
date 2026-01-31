
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
                           p.sku.toLowerCase().includes(search.toLowerCase()) ||
                           p.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, search, filterStatus, filterCategory]);

  const handleExport = () => {
    csvService.exportToCSV(products, 'gwapa_catalog_manifest');
  };

  const stats = useMemo(() => {
    if (filtered.length === 0) return { avgRoi: 0, totalSales: 0, avgConf: 0, avgDel: 0, capitalAtRisk: 0, totalProfit: 0 };
    
    const totals = filtered.reduce((acc, p) => {
      const cost = p.costPrice || 0;
      const price = p.price || 0;
      const sold = p.soldStock || 0;
      const margin = price - cost;
      const roi = cost > 0 ? (margin / cost) * 100 : 0;
      
      return {
        roiSum: acc.roiSum + roi,
        salesSum: acc.salesSum + sold,
        confSum: acc.confSum + (p.confirmationRate || 0),
        delSum: acc.delSum + (p.deliveryRate || 0),
        capital: acc.capital + ((p.purchasedStock - sold) * cost),
        profitSum: acc.profitSum + (sold * margin)
      };
    }, { roiSum: 0, salesSum: 0, confSum: 0, delSum: 0, capital: 0, profitSum: 0 });

    return {
      avgRoi: (totals.roiSum / filtered.length).toFixed(1),
      totalSales: totals.salesSum,
      avgConf: (totals.confSum / filtered.length).toFixed(1),
      avgDel: (totals.delSum / filtered.length).toFixed(1),
      capitalAtRisk: totals.capital.toLocaleString(),
      totalProfit: totals.profitSum.toLocaleString()
    };
  }, [filtered]);

  const deleteProduct = async (id: string) => {
    if (window.confirm('Delete this product artifact?')) {
      await supabaseService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Catalog Intelligence</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Inventory Management & Performance Analytics</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExport}
            className="bg-white border-2 border-slate-100 text-slate-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-emerald-500 transition flex items-center gap-2"
          >
            <i className="fas fa-download"></i> Export Manifest
          </button>
          
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
             <button 
                onClick={() => setViewMode('inventory')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'inventory' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
             >Inventory</button>
             <button 
                onClick={() => setViewMode('analytics')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'analytics' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
             >Analytics</button>
          </div>
          <button 
            onClick={() => navigate('/products/new')}
            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all"
          >
            + Create Artifact
          </button>
        </div>
      </div>

      {viewMode === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <i className="fas fa-chart-line text-4xl"></i>
            </div>
            <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Net Realized Profit</h5>
            <div className="text-3xl font-black text-emerald-400">{stats.totalProfit} <span className="text-xs">SAR</span></div>
            <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-slate-500 uppercase">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Lifetime Margin Yield
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
            <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Avg. Portfolio ROI</h5>
            <div className="text-3xl font-black text-slate-800">{stats.avgRoi}%</div>
            <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase">
              <span className="w-1 h-1 rounded-full bg-indigo-500"></span> Weighted Performance
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
            <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Avg Order Conversion</h5>
            <div className="text-3xl font-black text-indigo-600">{stats.avgConf}%</div>
            <div className="mt-4 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div className="bg-indigo-50 h-full" style={{ width: `${stats.avgConf}%` }}></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
            <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Inventory At Risk</h5>
            <div className="text-3xl font-black text-slate-800">{stats.capitalAtRisk} <span className="text-xs font-bold text-slate-300">SAR</span></div>
            <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-red-400 uppercase">
              <i className="fas fa-info-circle"></i> Tied Capital / Aging Stock
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter Bar */}
      <div className="bg-white p-5 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="relative md:col-span-5">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
            <input 
              type="text" 
              placeholder="Search by Title, SKU or specific keyword..." 
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-[20px] text-xs font-bold outline-none focus:border-emerald-500/30 focus:bg-white transition-all shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="md:col-span-3">
            <div className="relative group">
              <i className="fas fa-tags absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
              <select 
                className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-[20px] text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer text-slate-600 focus:border-emerald-500/30 focus:bg-white transition-all"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[10px]"></i>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="relative group">
              <i className="fas fa-filter absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
              <select 
                className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-transparent rounded-[20px] text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer text-slate-600 focus:border-emerald-500/30 focus:bg-white transition-all"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value={ProductStatus.ACTIVE}>Live Production</option>
                <option value={ProductStatus.DRAFT}>Work in Progress</option>
                <option value={ProductStatus.ARCHIVED}>System Archive</option>
              </select>
              <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-[10px]"></i>
            </div>
          </div>

          <div className="md:col-span-1 flex justify-center">
             <AnimatePresence>
                {isFiltered && (
                  <Motion.button 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={resetFilters}
                    className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                    title="Clear All Refinements"
                  >
                    <i className="fas fa-undo-alt text-xs"></i>
                  </Motion.button>
                )}
             </AnimatePresence>
          </div>
        </div>
        
        <div className="flex justify-between items-center px-2">
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing <span className="text-emerald-600">{filtered.length}</span> of <span className="text-slate-800">{products.length}</span> Artifacts
           </div>
           {isFiltered && (
             <div className="flex gap-2">
                {filterCategory !== 'All' && <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border border-emerald-100">{filterCategory}</span>}
                {filterStatus !== 'All' && <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border border-indigo-100">{filterStatus}</span>}
             </div>
           )}
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-400 uppercase text-[9px] font-black tracking-[0.3em]">
              <tr>
                <th className="px-8 py-6">Identity Cluster</th>
                {viewMode === 'inventory' ? (
                  <>
                    <th className="px-6 py-6">Pricing Blueprint</th>
                    <th className="px-6 py-6">Current Liquidity</th>
                    <th className="px-6 py-6">Marketing State</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-6">Stock Ledger (Sold/Acq)</th>
                    <th className="px-6 py-6">Funnel Health (Conf/Del)</th>
                    <th className="px-6 py-6">Yield / ROI</th>
                  </>
                )}
                <th className="px-6 py-6">Lifecycle</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => {
                const purchased = p.purchasedStock || 0;
                const sold = p.soldStock || 0;
                const remaining = purchased - sold;
                const confRate = p.confirmationRate || 0;
                const delRate = p.deliveryRate || 0;
                const cost = p.costPrice || 0;
                const price = p.price || 0;
                const margin = price - cost;
                const roi = cost > 0 ? ((margin / cost) * 100).toFixed(0) : '0';
                const health = (confRate * delRate) / 100;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[20px] bg-slate-100 flex-shrink-0 overflow-hidden border shadow-sm transition-transform group-hover:scale-110 duration-500">
                          {p.photo ? (
                            <img src={p.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <i className="fas fa-image"></i>
                            </div>
                          )}
                        </div>
                        <div>
                          <button 
                            onClick={() => setQuickViewProduct(p)}
                            className="font-black text-slate-800 text-sm leading-tight hover:text-emerald-600 transition-colors cursor-pointer text-left block"
                          >
                            {p.title}
                          </button>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{p.sku}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{p.category || 'Uncategorized'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {viewMode === 'inventory' ? (
                      <>
                        <td className="px-6 py-5">
                          <div className="space-y-0.5">
                             <div className="text-sm font-black text-slate-900">{price.toFixed(2)} <span className="text-[10px] uppercase font-bold text-slate-400">{p.currency}</span></div>
                             {cost > 0 && <div className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Cost: {cost.toFixed(0)}</div>}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${remaining < 5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                             <span className="font-black text-slate-700 text-xs">{remaining} <span className="text-slate-300">PCS</span></span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                           {p.discountType !== 'none' ? (
                             <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                                {p.discountValue}{p.discountType === 'percentage' ? '%' : ' ' + p.currency} OFF
                             </span>
                           ) : <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">No Active Offers</span>}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-5">
                          <div className="space-y-1.5 w-40">
                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                              <span>Lifecycle</span>
                              <span className="text-indigo-600">{sold}/{purchased} Sold</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                              <div 
                                className="bg-indigo-500 h-full transition-[width] duration-1000" 
                                style={{ width: `${Math.min(100, (sold / (purchased || 1)) * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-4">
                            <div className="text-center group-hover:scale-105 transition-transform">
                              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Conf.</div>
                              <div className={`text-xs font-black px-2 py-0.5 rounded-lg ${confRate > 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{confRate}%</div>
                            </div>
                            <div className="text-center group-hover:scale-105 transition-transform">
                              <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Deliv.</div>
                              <div className={`text-xs font-black px-2 py-0.5 rounded-lg ${delRate > 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{delRate}%</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                               <div className="text-[11px] font-black text-slate-800">ROI: <span className={parseInt(roi) > 50 ? 'text-emerald-600' : 'text-amber-600'}>{roi}%</span></div>
                               <div className={`w-1.5 h-1.5 rounded-full ${health > 60 ? 'bg-emerald-500' : health > 30 ? 'bg-amber-400' : 'bg-red-500'}`}></div>
                            </div>
                          </div>
                        </td>
                      </>
                    )}

                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border ${
                        p.status === ProductStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        p.status === ProductStatus.DRAFT ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate(`/products/view/${p.id}`)}
                          title="Detailed Intelligence"
                          className="w-10 h-10 rounded-xl bg-white text-indigo-600 shadow-sm border border-indigo-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          <i className="fas fa-microchip text-xs"></i>
                        </button>
                        <button 
                          onClick={() => window.open(`#/store/${p.id}`, '_blank')}
                          className="w-10 h-10 rounded-xl hover:bg-white text-slate-300 hover:text-emerald-600 transition-all flex items-center justify-center border border-transparent hover:border-emerald-100"
                        >
                          <i className="fas fa-external-link-alt text-xs"></i>
                        </button>
                        <button 
                          onClick={() => navigate(`/products/edit/${p.id}`)}
                          className="w-10 h-10 rounded-xl hover:bg-white text-slate-300 hover:text-blue-600 transition-all flex items-center justify-center border border-transparent hover:border-blue-100"
                        >
                          <i className="fas fa-edit text-xs"></i>
                        </button>
                        <button 
                          onClick={() => deleteProduct(p.id)}
                          className="w-10 h-10 rounded-xl hover:bg-white text-slate-300 hover:text-red-500 transition-all flex items-center justify-center border border-transparent hover:border-red-100"
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
                  <td colSpan={7} className="px-6 py-40 text-center text-slate-300 italic font-black text-xl uppercase tracking-[0.4em] opacity-20">
                    No Matching Entities in Database
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-between items-center px-4 py-2 bg-slate-100/50 rounded-2xl border border-slate-200">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
               <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Market Ready</span>
            </div>
         </div>
         <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
            Performance Ledger Sync Active
         </div>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <Motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setQuickViewProduct(null)} 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <Motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative bg-white w-full max-w-5xl rounded-[48px] shadow-3xl overflow-hidden my-auto flex flex-col md:flex-row h-[85vh] md:h-auto max-h-[90vh]"
            >
              {/* Image Section */}
              <div className="w-full md:w-1/2 bg-slate-50 relative group">
                <img 
                  src={quickViewProduct.photo} 
                  alt={quickViewProduct.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-10 left-10 text-white">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-emerald-600 px-4 py-2 rounded-full shadow-2xl mb-4 inline-block">Visual Verification</span>
                  <h3 className="text-4xl font-black tracking-tighter uppercase italic drop-shadow-lg">{quickViewProduct.title}</h3>
                </div>
              </div>

              {/* Data Section */}
              <div className="w-full md:w-1/2 p-12 flex flex-col space-y-8 overflow-y-auto no-scrollbar">
                <header className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Identifier: {quickViewProduct.sku}</p>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{quickViewProduct.category}</span>
                       <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                         quickViewProduct.status === ProductStatus.ACTIVE ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-slate-400 bg-slate-50 border-slate-100'
                       }`}>{quickViewProduct.status}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setQuickViewProduct(null)}
                    className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center border border-slate-100"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </header>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">MSRP / Price</p>
                    <div className="text-2xl font-black text-slate-800">{quickViewProduct.price.toLocaleString()} <span className="text-[10px] opacity-40">{quickViewProduct.currency}</span></div>
                  </div>
                  <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100">
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Unit Margin</p>
                    <div className="text-2xl font-black text-indigo-600">+{(quickViewProduct.price - quickViewProduct.costPrice).toLocaleString()} <span className="text-[10px] opacity-40">{quickViewProduct.currency}</span></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex justify-between">
                    <span>Artifact Narrative</span>
                    <i className="fas fa-feather-pointed"></i>
                  </h4>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                    {quickViewProduct.description || "The strategic narrative for this artifact is currently being finalized."}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Inventory Status</span>
                    <span className={quickViewProduct.purchasedStock - quickViewProduct.soldStock < 5 ? 'text-red-500' : 'text-emerald-600'}>
                      {quickViewProduct.purchasedStock - quickViewProduct.soldStock} Units In Stock
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <Motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(quickViewProduct.soldStock / (quickViewProduct.purchasedStock || 1)) * 100}%` }}
                      className="bg-indigo-600 h-full rounded-full"
                    />
                  </div>
                </div>

                <footer className="pt-8 flex gap-3 mt-auto">
                  <button 
                    onClick={() => { setQuickViewProduct(null); navigate(`/products/edit/${quickViewProduct.id}`); }}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
                  >
                    Modify Blueprint
                  </button>
                  <button 
                    onClick={() => { setQuickViewProduct(null); navigate(`/products/view/${quickViewProduct.id}`); }}
                    className="w-14 h-14 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-2xl flex items-center justify-center transition border border-slate-100 shadow-sm"
                    title="Deep Analytics"
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

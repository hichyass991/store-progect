import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, ProductStatus } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const Products: React.FC<ProductsProps> = ({ products, setProducts }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'inventory' | 'analytics'>('inventory');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                           p.sku.toLowerCase().includes(search.toLowerCase()) ||
                           p.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, filterStatus]);

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

  const deleteProduct = (id: string) => {
    if (window.confirm('Delete this product artifact?')) {
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
        <div className="flex gap-3">
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
              <div className="bg-indigo-500 h-full" style={{ width: `${stats.avgConf}%` }}></div>
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

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-2">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
          <input 
            type="text" 
            placeholder="Filter by SKU, Category, Narrative..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="bg-slate-50 border-none px-4 py-3 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Visibility States</option>
          <option value={ProductStatus.ACTIVE}>Live Production</option>
          <option value={ProductStatus.DRAFT}>Work in Progress</option>
          <option value={ProductStatus.ARCHIVED}>System Archive</option>
        </select>
        <div className="flex items-center justify-end px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          {filtered.length} Entities Indexed
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
                          <div className="font-black text-slate-800 text-sm leading-tight">{p.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{p.sku}</span>
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{p.category || 'Luxury'}</span>
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
                          onClick={() => setSelectedProduct(p)}
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
      
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col"
            >
              <header className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
                    <img src={selectedProduct.photo} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">{selectedProduct.title}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Performance Analytics Teardown</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 hover:text-red-500 transition shadow-sm border border-slate-100 bg-white"
                >
                  <i className="fas fa-times"></i>
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
                <section className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-600 p-8 rounded-[40px] text-white space-y-4 shadow-xl shadow-indigo-100">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Realized Profit</h4>
                    <div className="text-4xl font-black tracking-tighter">
                      {(selectedProduct.soldStock * (selectedProduct.price - selectedProduct.costPrice)).toLocaleString()}
                      <span className="text-base ml-1 opacity-60">SAR</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                       <span className="text-[9px] font-bold uppercase opacity-50">Unit Margin</span>
                       <span className="text-lg font-black">+{selectedProduct.price - selectedProduct.costPrice}</span>
                    </div>
                  </div>
                  <div className="bg-emerald-500 p-8 rounded-[40px] text-white space-y-4 shadow-xl shadow-emerald-100">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60">Campaign ROI</h4>
                    <div className="text-4xl font-black tracking-tighter">
                      {selectedProduct.costPrice > 0 ? (((selectedProduct.price - selectedProduct.costPrice) / selectedProduct.costPrice) * 100).toFixed(0) : 0}
                      <span className="text-base ml-1 opacity-60">%</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                       <span className="text-[9px] font-bold uppercase opacity-50">Yield Grade</span>
                       <span className="text-xs font-black uppercase px-2 py-0.5 bg-white/20 rounded-full">Optimal</span>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <i className="fas fa-cubes text-slate-400"></i> Stock Lifecycle Ledger
                  </h4>
                  <div className="bg-slate-50 p-8 rounded-[40px] border border-white space-y-8">
                     <div className="flex justify-between items-end">
                        <div className="space-y-1">
                           <div className="text-3xl font-black text-slate-800">{selectedProduct.purchasedStock}</div>
                           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Acquired</div>
                        </div>
                        <div className="space-y-1 text-right">
                           <div className="text-3xl font-black text-emerald-600">{selectedProduct.soldStock}</div>
                           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Confirmed Sales</div>
                        </div>
                     </div>
                     <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden flex">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(selectedProduct.soldStock / selectedProduct.purchasedStock) * 100}%` }}
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className="bg-emerald-500 h-full"
                        />
                     </div>
                     <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200/50">
                        <div className="text-center">
                           <div className="text-xs font-black text-slate-600">{selectedProduct.purchasedStock - selectedProduct.soldStock}</div>
                           <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Available</div>
                        </div>
                        <div className="text-center">
                           <div className="text-xs font-black text-slate-600">{(selectedProduct.soldStock / selectedProduct.purchasedStock * 100).toFixed(1)}%</div>
                           <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Sell-Through</div>
                        </div>
                        <div className="text-center">
                           <div className="text-xs font-black text-red-500">{(selectedProduct.purchasedStock - selectedProduct.soldStock) * selectedProduct.costPrice} SAR</div>
                           <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">At Risk</div>
                        </div>
                     </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <i className="fas fa-filter text-slate-400"></i> Funnel Conversion Health
                  </h4>
                  <div className="grid grid-cols-2 gap-8">
                     <div className="p-8 bg-white border-2 border-slate-50 rounded-[40px] text-center space-y-4">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600 text-xl font-black">
                           {selectedProduct.confirmationRate}%
                        </div>
                        <div className="space-y-1">
                           <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Confirmation</div>
                           <div className="text-[9px] font-bold text-slate-400">Lead to CRM conversion</div>
                        </div>
                     </div>
                     <div className="p-8 bg-white border-2 border-slate-50 rounded-[40px] text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 text-xl font-black">
                           {selectedProduct.deliveryRate}%
                        </div>
                        <div className="space-y-1">
                           <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Delivery Success</div>
                           <div className="text-[9px] font-bold text-slate-400">Shipped to Confirmed ratio</div>
                        </div>
                     </div>
                  </div>
                </section>

                <section className="p-8 bg-slate-900 rounded-[40px] relative overflow-hidden group">
                   <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
                   <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Behavioral Analysis</h4>
                   <p className="text-white/80 text-xs leading-relaxed font-medium">
                      This product is currently maintaining a <span className="text-emerald-400 font-black">{(selectedProduct.confirmationRate * selectedProduct.deliveryRate / 100).toFixed(0)}% Overall Channel Health</span> score. 
                      Inventory is depleting at a sustainable rate relative to acquisition cost. Recommendation: 
                      {selectedProduct.deliveryRate < 60 ? ' Focus on logistics optimization to recover margin bleed.' : ' Scaling marketing spend is advised for high-yield ROI growth.'}
                   </p>
                </section>
              </div>

              <footer className="p-8 border-t bg-slate-50/50 flex gap-4">
                 <button 
                  onClick={() => { setSelectedProduct(null); navigate(`/products/edit/${selectedProduct.id}`); }}
                  className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-800 rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:border-indigo-600 transition shadow-sm"
                 >
                    Modify Blueprint
                 </button>
                 <button 
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-5 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-600 transition"
                 >
                    Acknowledge Analysis
                 </button>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
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
    </div>
  );
};

export default Products;
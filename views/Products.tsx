
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, ProductStatus } from '../types';

interface ProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const Products: React.FC<ProductsProps> = ({ products, setProducts }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const filtered = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const deleteProduct = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800">Inventory</h2>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition flex items-center gap-2">
            <i className="fas fa-file-excel"></i> Export
          </button>
          <button 
            onClick={() => navigate('/products/new')}
            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-100 hover:opacity-90 transition"
          >
            + New Product
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Search SKU or Name..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-xl text-sm outline-none focus:border-emerald-500 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="bg-slate-50 border px-4 py-2 rounded-xl text-sm outline-none focus:border-emerald-500 transition"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value={ProductStatus.ACTIVE}>Active</option>
          <option value={ProductStatus.DRAFT}>Draft</option>
          <option value={ProductStatus.ARCHIVED}>Archived</option>
        </select>
        <div className="flex items-center justify-end px-4 text-xs font-bold text-slate-400 uppercase">
          {filtered.length} items found
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b text-slate-400 uppercase text-[10px] font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border">
                        {p.photo ? (
                          <img src={p.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <i className="fas fa-image"></i>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{p.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{p.id_num}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{p.sku}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${p.stock < 10 ? 'text-red-500' : 'text-slate-600'}`}>
                      {p.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-emerald-600">
                    {p.price.toFixed(2)} <span className="text-[10px]">{p.currency}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      p.status === ProductStatus.ACTIVE ? 'bg-emerald-50 text-emerald-700' : 
                      p.status === ProductStatus.DRAFT ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/store/${p.id}`)}
                        className="p-2 text-slate-400 hover:text-emerald-600 transition"
                      >
                        <i className="fas fa-external-link-alt"></i>
                      </button>
                      <button 
                        onClick={() => navigate(`/products/edit/${p.id}`)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => deleteProduct(p.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic font-medium">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Products;

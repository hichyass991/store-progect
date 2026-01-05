
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Product, ProductStatus } from '../types';
import { geminiService } from '../services/geminiService';

interface ProductFormViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductFormView: React.FC<ProductFormViewProps> = ({ products, setProducts }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    sku: '',
    price: 0,
    backupPrice: 0,
    stock: 0,
    description: '',
    photo: '',
    allPhotos: [],
    currency: 'SAR',
    stockStatus: 'In Stock',
    status: ProductStatus.DRAFT,
    category: 'Electronics'
  });

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const existing = products.find(p => p.id === id);
      if (existing) setFormData(existing);
    }
  }, [id, isEdit, products]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({
          ...prev,
          allPhotos: [...(prev.allPhotos || []), result].slice(0, 5),
          photo: prev.photo || result
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const generateAI = async () => {
    if (!formData.title) return alert("Enter a product title first.");
    setIsGenerating(true);
    const desc = await geminiService.generateDescription(formData.title, formData.category || 'General');
    setFormData(prev => ({ ...prev, description: desc }));
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toLocaleString();
    
    if (isEdit) {
      setProducts(prev => prev.map(p => p.id === id ? { 
        ...p, 
        ...formData as Product, 
        updatedAt: now 
      } : p));
    } else {
      const lastIdNum = products.length > 0 ? Math.max(...products.map(p => parseInt(p.id_num.replace('#', '')))) : 1000;
      const newProduct: Product = {
        id: 'prod_' + Math.random().toString(36).substr(2, 9),
        id_num: '#' + (lastIdNum + 1),
        createdAt: now,
        updatedAt: now,
        ...(formData as Product)
      };
      setProducts(prev => [newProduct, ...prev]);
    }
    navigate('/products');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl border shadow-sm p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-800">
            {isEdit ? `Edit Product ${formData.id_num}` : 'Create New Product'}
          </h2>
          <button onClick={() => navigate('/products')} className="text-slate-400 hover:text-slate-800 transition">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-camera"></i> Media (Up to 5)
            </h4>
            <div className="grid grid-cols-5 gap-3">
              {formData.allPhotos?.map((p, idx) => (
                <div key={idx} className="aspect-square rounded-xl border-2 border-slate-100 overflow-hidden relative group">
                  <img src={p} alt="" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      allPhotos: prev.allPhotos?.filter((_, i) => i !== idx),
                      photo: prev.photo === p ? (prev.allPhotos?.filter((_, i) => i !== idx)[0] || '') : prev.photo
                    }))}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
              {(formData.allPhotos?.length || 0) < 5 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/20 transition group">
                  <i className="fas fa-plus text-slate-300 group-hover:text-emerald-500"></i>
                  <input type="file" multiple className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Name</label>
              <input 
                type="text" required 
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU Code</label>
              <input 
                type="text" required
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:border-emerald-500 font-mono transition"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price (SAR)</label>
              <input 
                type="number" required
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition font-bold text-emerald-600"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Backup Price</label>
              <input 
                type="number"
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition text-slate-400 line-through"
                value={formData.backupPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, backupPrice: parseFloat(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</label>
              <input 
                type="number" required
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition"
                value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
              />
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
              <button 
                type="button" 
                onClick={generateAI}
                disabled={isGenerating}
                className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 transition disabled:opacity-50"
              >
                <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-magic'} mr-1`}></i>
                Magic Generate
              </button>
            </div>
            <textarea 
              rows={4}
              className="w-full bg-slate-50 border rounded-2xl px-4 py-3 outline-none focus:border-emerald-500 transition"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            ></textarea>
          </section>

          <section className="grid grid-cols-2 gap-6 pt-6 border-t">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Status</label>
              <select 
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as ProductStatus }))}
              >
                <option value={ProductStatus.DRAFT}>Draft</option>
                <option value={ProductStatus.ACTIVE}>Active</option>
                <option value={ProductStatus.ARCHIVED}>Archived</option>
              </select>
            </div>
            <div className="flex items-end gap-3">
              <button 
                type="button"
                onClick={() => navigate('/products')}
                className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-[2] bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 hover:opacity-90 transition"
              >
                {isEdit ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};

export default ProductFormView;

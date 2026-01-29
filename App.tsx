import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Leads from './views/Leads';
import Orders from './views/Orders';
import Abandoned from './views/Abandoned';
import Products from './views/Products';
import ProductFormView from './views/ProductFormView';
import Stores from './views/Stores';
import StoreDesigner from './views/StoreDesigner';
import Storefront from './views/Storefront';
import StoreHome from './views/StoreHome';
import Categories from './views/Categories';
import Discounts from './views/Discounts';
import { Product, Lead, AbandonedCart, Store, Category, Discount } from './types';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('gwapa_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('gwapa_leads');
    return saved ? JSON.parse(saved) : [];
  });

  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>(() => {
    const saved = localStorage.getItem('gwapa_abandoned');
    return saved ? JSON.parse(saved) : [];
  });

  const [stores, setStores] = useState<Store[]>(() => {
    const saved = localStorage.getItem('gwapa_stores');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('gwapa_categories');
    return saved ? JSON.parse(saved) : [
      { id: 'cat_1', name: 'Electronics', description: 'Modern gadgets and tech.', icon: 'fa-laptop', createdAt: new Date().toLocaleDateString() },
      { id: 'cat_2', name: 'Fashion', description: 'Apparel and accessories.', icon: 'fa-shirt', createdAt: new Date().toLocaleDateString() }
    ];
  });

  const [discounts, setDiscounts] = useState<Discount[]>(() => {
    const saved = localStorage.getItem('gwapa_discounts');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('gwapa_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('gwapa_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('gwapa_abandoned', JSON.stringify(abandonedCarts)); }, [abandonedCarts]);
  useEffect(() => { localStorage.setItem('gwapa_stores', JSON.stringify(stores)); }, [stores]);
  useEffect(() => { localStorage.setItem('gwapa_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('gwapa_discounts', JSON.stringify(discounts)); }, [discounts]);

  return (
    <HashRouter>
      <Routes>
        {/* Customer Facing Storefront */}
        <Route path="/store/:productId" element={<Storefront products={products} setLeads={setLeads} setAbandonedCarts={setAbandonedCarts} />} />
        <Route path="/s/:storeId" element={<StoreHome stores={stores} products={products} />} />
        
        {/* Admin Dashboard */}
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard products={products} leads={leads} />} />
          <Route path="/leads" element={<Leads leads={leads} setLeads={setLeads} products={products} />} />
          <Route path="/orders" element={<Orders leads={leads} products={products} />} />
          <Route path="/abandoned" element={<Abandoned abandonedCarts={abandonedCarts} products={products} />} />
          <Route path="/products" element={<Products products={products} setProducts={setProducts} />} />
          <Route path="/products/new" element={<ProductFormView products={products} setProducts={setProducts} />} />
          <Route path="/products/edit/:id" element={<ProductFormView products={products} setProducts={setProducts} />} />
          <Route path="/categories" element={<Categories categories={categories} setCategories={setCategories} />} />
          <Route path="/discounts" element={<Discounts discounts={discounts} setDiscounts={setDiscounts} products={products} />} />
          <Route path="/stores" element={<Stores stores={stores} setStores={setStores} />} />
          <Route path="/stores/design/:id" element={<StoreDesigner stores={stores} setStores={setStores} products={products} />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;

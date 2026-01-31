
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './views/Login';
import Dashboard from './views/Dashboard';
import Leads from './views/Leads';
import Orders from './views/Orders';
import Abandoned from './views/Abandoned';
import Products from './views/Products';
import ProductFormView from './views/ProductFormView';
import ProductDetailView from './views/ProductDetailView';
import Stores from './views/Stores';
import StoreDesigner from './views/StoreDesigner';
import Storefront from './views/Storefront';
import StoreHome from './views/StoreHome';
import Categories from './views/Categories';
import Discounts from './views/Discounts';
import Sheets from './views/Sheets';
import GoogleSetupGuide from './views/GoogleSetupGuide';
import Settings from './views/Settings';
import Users from './views/Users';
import Invoices from './views/Invoices';
import SupportDesk from './views/SupportDesk';
import AgentSupport from './views/AgentSupport';
import CallCenter from './views/CallCenter';
import LivreurTerminal from './views/LivreurTerminal';
import { Product, Lead, AbandonedCart, Store, Category, Discount, Sheet, GoogleConfig, User, UserRole, Payment, SupportRequest, SupportReply } from './types';
import { supabaseService } from './services/supabaseService';

const App: React.FC = () => {
  const getSafeLocalStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const DEFAULT_ADMIN: User = { 
    id: 'u_1', 
    name: 'Hicham Idali', 
    email: 'admin@gwapashop.pro', 
    password: 'admin123',
    role: UserRole.ADMIN, 
    avatar: 'https://ui-avatars.com/api/?name=Hicham+Idali&background=4f46e5&color=fff',
    isActive: true,
    isApproved: true,
    createdAt: new Date().toLocaleDateString()
  };

  const [products, setProducts] = useState<Product[]>(() => getSafeLocalStorage('gwapa_products', []));
  const [leads, setLeads] = useState<Lead[]>(() => getSafeLocalStorage('gwapa_leads', []));
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>(() => getSafeLocalStorage('gwapa_abandoned', []));
  const [stores, setStores] = useState<Store[]>(() => getSafeLocalStorage('gwapa_stores', []));
  const [sheets, setSheets] = useState<Sheet[]>(() => getSafeLocalStorage('gwapa_sheets', []));
  const [discounts, setDiscounts] = useState<Discount[]>(() => getSafeLocalStorage('gwapa_discounts', []));
  const [googleConfig, setGoogleConfig] = useState<GoogleConfig>(() => getSafeLocalStorage('gwapa_google_config', { clientId: '', clientSecret: '' }));
  const [payments, setPayments] = useState<Payment[]>(() => getSafeLocalStorage('gwapa_payments', []));
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>(() => getSafeLocalStorage('gwapa_support_requests', []));
  const [globalCurrency, setGlobalCurrency] = useState<string>(() => getSafeLocalStorage('gwapa_global_currency', 'SAR'));
  const [categories, setCategories] = useState<Category[]>(() => getSafeLocalStorage('gwapa_categories', []));
  const [users, setUsers] = useState<User[]>(() => getSafeLocalStorage('gwapa_users', [DEFAULT_ADMIN]));

  const [currentUser, setCurrentUser] = useState<User | null>(() => getSafeLocalStorage('gwapa_current_user', null));
  const [impersonator, setImpersonator] = useState<User | null>(() => getSafeLocalStorage('gwapa_impersonator', null));
  const [navOrder, setNavOrder] = useState<string[]>(() => getSafeLocalStorage('gwapa_nav_order', [
    '/dashboard', '/leads', '/call-center', '/logistics', '/invoices', '/stores', '/products', '/sheets', '/users', '/settings', '/support'
  ]));

  // --- SUPABASE HYDRATION EFFECT ---
  useEffect(() => {
    const hydrateFromCloud = async () => {
      try {
        const [cloudUsers, cloudLeads, cloudProducts, cloudCats, cloudDiscounts, cloudAbandoned, cloudSheets, cloudStores] = await Promise.all([
          supabaseService.getUsers(),
          supabaseService.getLeads(),
          supabaseService.getProducts(),
          supabaseService.getCategories(),
          supabaseService.getDiscounts(),
          supabaseService.getAbandonedCarts(),
          supabaseService.getSheets(),
          supabaseService.getStores()
        ]);

        if (cloudUsers.length) setUsers(cloudUsers);
        if (cloudLeads.length) setLeads(cloudLeads);
        if (cloudProducts.length) setProducts(cloudProducts);
        if (cloudCats.length) setCategories(cloudCats);
        if (cloudDiscounts.length) setDiscounts(cloudDiscounts);
        if (cloudAbandoned.length) setAbandonedCarts(cloudAbandoned);
        if (cloudSheets.length) setSheets(cloudSheets);
        if (cloudStores.length) setStores(cloudStores);
      } catch (err) {
        console.error("Hydration Error:", err);
      }
    };
    hydrateFromCloud();
  }, []);

  useEffect(() => { localStorage.setItem('gwapa_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('gwapa_leads', JSON.stringify(leads)); }, [leads]);
  useEffect(() => { localStorage.setItem('gwapa_abandoned', JSON.stringify(abandonedCarts)); }, [abandonedCarts]);
  useEffect(() => { localStorage.setItem('gwapa_stores', JSON.stringify(stores)); }, [stores]);
  useEffect(() => { localStorage.setItem('gwapa_sheets', JSON.stringify(sheets)); }, [sheets]);
  useEffect(() => { localStorage.setItem('gwapa_categories', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('gwapa_discounts', JSON.stringify(discounts)); }, [discounts]);
  useEffect(() => { localStorage.setItem('gwapa_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('gwapa_current_user', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('gwapa_impersonator', JSON.stringify(impersonator)); }, [impersonator]);
  useEffect(() => { localStorage.setItem('gwapa_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('gwapa_support_requests', JSON.stringify(supportRequests)); }, [supportRequests]);
  useEffect(() => { localStorage.setItem('gwapa_nav_order', JSON.stringify(navOrder)); }, [navOrder]);
  useEffect(() => { localStorage.setItem('gwapa_global_currency', JSON.stringify(globalCurrency)); }, [globalCurrency]);

  const handleLogout = () => {
    setCurrentUser(null);
    setImpersonator(null);
    localStorage.clear();
    window.location.reload();
  };

  const handleImpersonate = (targetUser: User) => {
    if (currentUser?.role === UserRole.ADMIN) {
      setImpersonator(currentUser);
      setCurrentUser(targetUser);
    }
  };

  const handleRestoreAdmin = () => {
    if (impersonator) {
      setCurrentUser(impersonator);
      setImpersonator(null);
    }
  };

  const handleRegister = async (userData: Omit<User, 'id' | 'avatar' | 'isActive' | 'isApproved' | 'createdAt'>) => {
    const newUser: User = {
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      ...userData,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random&color=fff`,
      isActive: true,
      isApproved: false,
      createdAt: new Date().toLocaleDateString(),
      role: userData.role || UserRole.ADMIN
    };
    await supabaseService.syncUser(newUser);
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard" replace /> : <Login users={users} setCurrentUser={setCurrentUser} onSendSupportRequest={() => {}} onRegister={handleRegister} />} />
        <Route path="/store/:productId" element={<Storefront products={products} setLeads={setLeads} setAbandonedCarts={setAbandonedCarts} sheets={sheets} setSheets={setSheets} />} />
        <Route path="/s/:storeId" element={<StoreHome stores={stores} products={products} />} />
        <Route element={currentUser ? <Layout currentUser={currentUser} impersonator={impersonator} onRestoreAdmin={handleRestoreAdmin} handleLogout={handleLogout} users={users} navOrder={navOrder} /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard products={products} leads={leads} currentUser={currentUser!} />} />
          <Route path="/call-center" element={<CallCenter leads={leads} setLeads={setLeads} products={products} currentUser={currentUser!} />} />
          <Route path="/logistics" element={<LivreurTerminal leads={leads} setLeads={setLeads} products={products} currentUser={currentUser!} />} />
          <Route path="/sheets" element={<Sheets sheets={sheets} setSheets={setSheets} products={products} leads={leads} currentUser={currentUser!} />} />
          <Route path="/sheets/guide" element={<GoogleSetupGuide />} />
          <Route path="/leads" element={<Leads leads={leads} setLeads={setLeads} products={products} sheets={sheets} setSheets={setSheets} currentUser={currentUser!} />} />
          <Route path="/orders" element={<Orders leads={leads} products={products} currentUser={currentUser!} />} />
          <Route path="/abandoned" element={<Abandoned abandonedCarts={abandonedCarts} products={products} currentUser={currentUser!} />} />
          <Route path="/invoices" element={<Invoices leads={leads} products={products} users={users} payments={payments} setPayments={setPayments} currentUser={currentUser!} />} />
          <Route path="/products" element={<Products products={products} setProducts={setProducts} currentUser={currentUser!} categories={categories} />} />
          <Route path="/products/new" element={<ProductFormView products={products} setProducts={setProducts} currentUser={currentUser!} defaultCurrency={globalCurrency} />} />
          <Route path="/products/edit/:id" element={<ProductFormView products={products} setProducts={setProducts} currentUser={currentUser!} defaultCurrency={globalCurrency} />} />
          <Route path="/products/view/:id" element={<ProductDetailView products={products} currentUser={currentUser!} />} />
          <Route path="/categories" element={<Categories categories={categories} setCategories={setCategories} currentUser={currentUser!} />} />
          <Route path="/discounts" element={<Discounts discounts={discounts} setDiscounts={setDiscounts} products={products} currentUser={currentUser!} />} />
          <Route path="/stores" element={<Stores stores={stores} setStores={setStores} currentUser={currentUser!} />} />
          <Route path="/stores/design/:id" element={<StoreDesigner stores={stores} setStores={setStores} products={products} currentUser={currentUser!} />} />
          <Route path="/settings" element={<Settings config={googleConfig} setConfig={setGoogleConfig} currentUser={currentUser!} navOrder={navOrder} setNavOrder={setNavOrder} currency={globalCurrency} setCurrency={setGlobalCurrency} />} />
          <Route path="/users" element={<Users users={users} setUsers={setUsers} currentUser={currentUser!} onImpersonate={handleImpersonate} />} />
          <Route path="/support" element={<AgentSupport supportRequests={supportRequests} onSendRequest={() => {}} currentUser={currentUser!} />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;

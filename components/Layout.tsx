
import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole } from '../types';

const Motion = motion as any;

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: UserRole[];
  children?: NavItem[];
}

interface LayoutProps {
  currentUser: User;
  impersonator: User | null;
  onRestoreAdmin: () => void;
  handleLogout: () => void;
  users: User[];
  navOrder: string[];
}

const Layout: React.FC<LayoutProps> = ({ currentUser, impersonator, onRestoreAdmin, handleLogout, users, navOrder }) => {
  const location = useLocation();
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_width');
      return saved ? parseInt(saved, 10) : 260;
    } catch (e) { return 260; }
  });
  
  const isCollapsed = sidebarWidth < 160;
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/leads', '/products']);

  useEffect(() => {
    localStorage.setItem('sidebar_width', sidebarWidth.toString());
  }, [sidebarWidth]);

  const toggleCollapse = () => setSidebarWidth(prev => prev < 160 ? 260 : 80);

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };

  /**
   * UPDATED PERMISSIONS: 
   * Manager is now strictly restricted to Personnel Management (Users) 
   * as per the "GHI USERS SAFI" (Only Users) requirement.
   */
  const ADMIN_ONLY = [UserRole.ADMIN];
  const ADMIN_TL = [UserRole.ADMIN, UserRole.LEADER];
  const ADMIN_MGR = [UserRole.ADMIN]; // Manager removed from global financials/sheets
  const ALL_STAFF = [UserRole.ADMIN, UserRole.AGENT, UserRole.LOGISTICS, UserRole.LIVREUR, UserRole.LEADER, UserRole.MANAGER];

  const navPool: Record<string, NavItem> = {
    '/dashboard': { path: '/dashboard', label: 'Dashboard', icon: 'fa-th-large', roles: [UserRole.ADMIN, UserRole.LEADER] },
    '/call-center': { path: '/call-center', label: 'Call Terminal', icon: 'fa-headset', roles: [UserRole.ADMIN, UserRole.AGENT, UserRole.LEADER] },
    '/logistics': { path: '/logistics', label: 'Livreur Hub', icon: 'fa-truck-loading', roles: [UserRole.ADMIN, UserRole.LIVREUR] },
    '/leads': { 
      path: '/leads', label: 'Pipeline', icon: 'fa-address-book', roles: [UserRole.ADMIN, UserRole.LEADER, UserRole.AGENT],
      children: [
        { path: '/orders', label: 'Confirmed', icon: 'fa-check-circle', roles: [UserRole.ADMIN, UserRole.LEADER] },
        { path: '/abandoned', label: 'Abandoned', icon: 'fa-shopping-cart', roles: [UserRole.ADMIN, UserRole.LEADER] },
      ]
    },
    '/invoices': { path: '/invoices', label: 'Financials', icon: 'fa-file-contract', roles: ADMIN_ONLY },
    '/products': { 
      path: '/products', label: 'Catalog', icon: 'fa-box', roles: [UserRole.ADMIN, UserRole.LEADER, UserRole.AGENT],
      children: [
        { path: '/categories', label: 'Taxonomy', icon: 'fa-tags', roles: [UserRole.ADMIN] },
        { path: '/discounts', label: 'Markdown', icon: 'fa-percent', roles: [UserRole.ADMIN] },
      ]
    },
    '/sheets': { path: '/sheets', label: 'Source (Sheets)', icon: 'fa-file-invoice', roles: ADMIN_ONLY },
    '/stores': { path: '/stores', label: 'Studio Stores', icon: 'fa-store', roles: ADMIN_ONLY },
    // Account Manager now only sees this
    '/users': { path: '/users', label: 'Personnel Ledger', icon: 'fa-users-cog', roles: [UserRole.ADMIN, UserRole.MANAGER] },
    '/support': { path: '/support', label: 'Support Desk', icon: 'fa-headset', roles: ALL_STAFF },
    '/settings': { path: '/settings', label: 'Platform Config', icon: 'fa-cog', roles: [UserRole.ADMIN] },
  };

  const visibleNav = useMemo(() => {
    return navOrder.map(path => navPool[path]).filter(item => item && item.roles.includes(currentUser.role));
  }, [navOrder, currentUser.role]);

  const renderNavLink = (item: NavItem, isChild = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.path);
    const isActive = location.pathname === item.path || (hasChildren && location.pathname.startsWith(item.path));

    return (
      <div key={item.path} className="w-full">
        <div className="flex items-center group relative">
          <NavLink
            to={item.path}
            className={({ isActive: linkActive }) => 
              `flex-1 flex items-center relative rounded-2xl transition-all py-3 ${
                linkActive ? 'bg-emerald-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'
              } ${isCollapsed ? 'justify-center h-12 w-12 mx-auto' : isChild ? 'pl-10' : 'px-4'}`
            }
          >
            <i className={`fas ${item.icon} ${isCollapsed ? 'text-lg' : 'w-5 text-center text-sm'}`}></i>
            {!isCollapsed && <span className="text-[11px] ml-4 font-black uppercase tracking-widest">{item.label}</span>}
          </NavLink>
        </div>
        {hasChildren && !isCollapsed && isExpanded && (
          <div className="mt-1 space-y-1 pl-4">
            {item.children!.filter(c => c.roles.includes(currentUser.role)).map(c => renderNavLink(c, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-inter">
      <Motion.aside animate={{ width: sidebarWidth }} className="bg-white border-r flex flex-col z-50 shadow-sm relative">
        <div className={`h-24 border-b flex items-center px-6 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="bg-emerald-600 w-10 h-10 rounded-xl text-white shadow-lg flex items-center justify-center"><i className="fas fa-shield-halved"></i></div>
          {!isCollapsed && <h1 className="font-black text-lg italic">Gwapa<span className="text-emerald-600">.</span>Pro</h1>}
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">{visibleNav.map(item => renderNavLink(item))}</nav>
        <div className="p-6 border-t bg-slate-50/50">
          <div className="flex items-center gap-4">
            <img src={currentUser.avatar} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" />
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-[11px] font-black text-slate-800 truncate uppercase">{currentUser.name.split(' ')[0]}</div>
                <div className="text-[8px] font-black text-emerald-500 uppercase">{currentUser.role.split('(')[0]}</div>
              </div>
            )}
          </div>
          {!isCollapsed && <button onClick={handleLogout} className="mt-4 w-full py-3 bg-white border rounded-xl text-[9px] font-black uppercase text-slate-400 hover:text-red-500 transition">Sign Out</button>}
        </div>
      </Motion.aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence>
          {impersonator && (
            <Motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }} className="bg-slate-900 text-white px-8 py-3 flex justify-between items-center z-50 shadow-2xl">
               <div className="flex items-center gap-4">
                  <span className="bg-amber-500 text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase">Stealth Mode</span>
                  <p className="text-[11px] font-medium italic">Viewing portal as <span className="font-black text-amber-400">{currentUser.name}</span>. Original Identity: {impersonator.name}</p>
               </div>
               <button onClick={onRestoreAdmin} className="bg-white text-slate-900 px-6 py-1.5 rounded-full text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition shadow-xl">
                 <i className="fas fa-undo-alt mr-2"></i> Restore Access
               </button>
            </Motion.div>
          )}
        </AnimatePresence>

        <header className="h-20 bg-white border-b px-8 flex justify-between items-center sticky top-0 z-40">
          <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] italic">{location.pathname.replace('/', '').replace('-', ' ') || 'Terminal'}</h2>
          <button onClick={toggleCollapse} className="w-10 h-10 rounded-xl text-slate-300 hover:bg-slate-50 transition border flex items-center justify-center shadow-sm"><i className="fas fa-bars-staggered"></i></button>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar"><Outlet /></div>
      </main>
    </div>
  );
};

export default Layout;

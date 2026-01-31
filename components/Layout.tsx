
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
      return saved ? parseInt(saved, 10) : 280;
    } catch (e) { return 280; }
  });
  
  const isCollapsed = sidebarWidth < 160;

  useEffect(() => {
    localStorage.setItem('sidebar_width', sidebarWidth.toString());
  }, [sidebarWidth]);

  const toggleCollapse = () => setSidebarWidth(prev => prev < 160 ? 280 : 90);

  const navPool: Record<string, NavItem> = {
    '/dashboard': { path: '/dashboard', label: 'Overview', icon: 'fa-compass', roles: [UserRole.ADMIN, UserRole.LEADER, UserRole.MANAGER] },
    '/call-center': { path: '/call-center', label: 'Call Terminal', icon: 'fa-headset', roles: [UserRole.ADMIN, UserRole.AGENT, UserRole.LEADER] },
    '/logistics': { path: '/logistics', label: 'Fleet Hub', icon: 'fa-truck-fast', roles: [UserRole.ADMIN, UserRole.LIVREUR] },
    '/leads': { path: '/leads', label: 'Pipeline', icon: 'fa-stream', roles: [UserRole.ADMIN, UserRole.LEADER, UserRole.AGENT] },
    '/invoices': { path: '/invoices', label: 'Financials', icon: 'fa-receipt', roles: [UserRole.ADMIN] },
    '/products': { path: '/products', label: 'Catalog', icon: 'fa-box-open', roles: [UserRole.ADMIN, UserRole.LEADER, UserRole.AGENT] },
    '/sheets': { path: '/sheets', label: 'Cloud Sync', icon: 'fa-database', roles: [UserRole.ADMIN] },
    '/stores': { path: '/stores', label: 'Studios', icon: 'fa-shop', roles: [UserRole.ADMIN] },
    '/users': { path: '/users', label: 'Personnel', icon: 'fa-users', roles: [UserRole.ADMIN, UserRole.MANAGER] },
    '/support': { path: '/support', label: 'Support', icon: 'fa-circle-info', roles: [UserRole.ADMIN, UserRole.AGENT, UserRole.LOGISTICS, UserRole.LIVREUR, UserRole.LEADER, UserRole.MANAGER] },
    '/settings': { path: '/settings', label: 'Config', icon: 'fa-sliders', roles: [UserRole.ADMIN] },
  };

  const visibleNav = useMemo(() => {
    return navOrder.map(path => navPool[path]).filter(item => item && item.roles.includes(currentUser.role));
  }, [navOrder, currentUser.role]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fbfcfd] font-inter">
      <Motion.aside 
        animate={{ width: sidebarWidth }} 
        className="bg-white border-r border-slate-100 flex flex-col z-50 relative"
      >
        <div className={`h-24 flex items-center px-8 ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
          <div className="bg-emerald-500 w-10 h-10 rounded-2xl text-white shadow-lg flex items-center justify-center">
            <i className="fas fa-terminal text-sm"></i>
          </div>
          {!isCollapsed && (
            <h1 className="font-syne font-black text-xl text-slate-800 tracking-tighter italic">
              Gwapa<span className="text-emerald-500">.</span>Pro
            </h1>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2 no-scrollbar">
          {visibleNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center rounded-3xl transition-all duration-300 py-4 px-6 group relative ${
                  isActive ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'
                } ${isCollapsed ? 'justify-center px-0 h-14 w-14 mx-auto' : ''}`
              }
            >
              <i className={`fas ${item.icon} ${isCollapsed ? 'text-lg' : 'w-6 text-center text-sm'}`}></i>
              {!isCollapsed && <span className="ml-4 text-[11px] font-black uppercase tracking-widest">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-8">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
            <div className="relative">
              <img src={currentUser.avatar} className="w-10 h-10 rounded-2xl border border-slate-100 shadow-sm" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tighter">{currentUser.name.split(' ')[0]}</div>
                <div className="text-[8px] font-black text-slate-400 uppercase">{currentUser.role.split('(')[0]}</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={handleLogout} className="mt-8 w-full py-4 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all">
              Sign Out
            </button>
          )}
        </div>
      </Motion.aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 bg-white border-b border-slate-100 px-10 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4">
             <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
             <h2 className="font-syne text-sm font-black text-slate-800 uppercase tracking-[0.4em] italic">
               {location.pathname.replace('/', '').replace('-', ' ') || 'Overview'}
             </h2>
          </div>
          <button onClick={toggleCollapse} className="w-12 h-12 rounded-3xl text-slate-300 hover:bg-slate-50 transition border border-slate-50 flex items-center justify-center">
            <i className={`fas ${isCollapsed ? 'fa-indent' : 'fa-outdent'}`}></i>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar page-transition p-4 md:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

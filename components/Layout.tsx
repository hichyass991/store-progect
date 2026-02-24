
import React, { useState, useMemo } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole } from '../types';

const Motion = motion as any;

interface SubItem {
  path: string;
  label: string;
  icon: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles: UserRole[];
  subItems?: SubItem[];
}

interface LayoutProps {
  currentUser: User;
  impersonator: User | null;
  onRestoreAdmin: () => void;
  handleLogout: () => void;
  users: User[];
  navOrder: string[];
}

const Layout: React.FC<LayoutProps> = ({ currentUser, impersonator, onRestoreAdmin, handleLogout, navOrder }) => {
  const location = useLocation();
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const isCollapsed = sidebarWidth < 160;

  const toggleCollapse = () => setSidebarWidth(prev => prev < 160 ? 280 : 90);

  const navPool: Record<string, NavItem> = {
    '/dashboard': { 
      path: '/dashboard', label: 'Dashboard', icon: 'fa-th-large', 
      roles: [UserRole.ADMIN, UserRole.AGENT] 
    },
    '/leads': { 
      path: '/leads', label: 'All Leads', icon: 'fa-address-book', 
      roles: [UserRole.ADMIN, UserRole.AGENT],
      subItems: [
        { path: '/orders', label: 'Confirmed Orders', icon: 'fa-check-circle' },
        { path: '/abandoned', label: 'Abandoned Carts', icon: 'fa-shopping-cart' }
      ]
    },
    '/call-center': {
      path: '/call-center', label: 'Call Terminal', icon: 'fa-headset',
      roles: [UserRole.ADMIN, UserRole.AGENT]
    },
    '/logistics': {
      path: '/logistics', label: 'Fleet Console', icon: 'fa-truck-fast',
      roles: [UserRole.ADMIN, UserRole.AGENT]
    },
    '/invoices': { 
      path: '/invoices', label: 'Financial Ledger', icon: 'fa-file-invoice-dollar', 
      roles: [UserRole.ADMIN] 
    },
    '/products': { 
      path: '/products', label: 'All Products', icon: 'fa-box-archive', 
      roles: [UserRole.ADMIN],
      subItems: [
        { path: '/products/new', label: 'New Product', icon: 'fa-plus-square' },
        { path: '/categories', label: 'Categories', icon: 'fa-tags' },
        { path: '/discounts', label: 'Discounts', icon: 'fa-percent' }
      ]
    },
    '/sheets': { 
      path: '/sheets', label: 'Source (Sheets)', icon: 'fa-file-lines', 
      roles: [UserRole.ADMIN] 
    },
    '/users': { 
      path: '/users', label: 'Staff Ledger', icon: 'fa-users-gear', 
      roles: [UserRole.ADMIN] 
    },
    '/settings': { 
      path: '/settings', label: 'Settings', icon: 'fa-cog', 
      roles: [UserRole.ADMIN] 
    },
    '/support': { 
      path: '/support', label: 'Support Desk', icon: 'fa-headset', 
      roles: [UserRole.ADMIN, UserRole.AGENT] 
    },
  };

  const visibleNav = useMemo(() => {
    return navOrder
      .map(path => navPool[path])
      .filter(item => item && item.roles.includes(currentUser.role));
  }, [navOrder, currentUser.role]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#fbfcfd] font-inter">
      <Motion.aside 
        animate={{ width: sidebarWidth }} 
        className="bg-white border-r border-slate-100 flex flex-col z-50 relative"
      >
        <div className={`h-24 flex items-center px-8 ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
          <div className="bg-[#5d5cf6] w-10 h-10 rounded-xl text-white shadow-lg flex items-center justify-center">
            <i className="fas fa-terminal text-sm"></i>
          </div>
          {!isCollapsed && (
            <h1 className="font-syne font-black text-xl text-slate-800 tracking-tighter italic">
              Gwapa<span className="text-[#5d5cf6]">.</span>Pro
            </h1>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-1 no-scrollbar">
          {visibleNav.map(item => {
            const isParentActive = location.pathname.startsWith(item.path);
            return (
              <div key={item.path} className="space-y-1">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center rounded-2xl transition-all duration-300 py-3.5 px-6 group relative ${
                      isActive ? 'bg-[#5d5cf6] text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    } ${isCollapsed ? 'justify-center px-0 h-12 w-12 mx-auto' : ''}`
                  }
                >
                  <i className={`fas ${item.icon} ${isCollapsed ? 'text-lg' : 'w-5 text-center text-[13px]'}`}></i>
                  {!isCollapsed && <span className="ml-4 text-[13px] font-bold tracking-tight">{item.label}</span>}
                  {!isCollapsed && item.subItems && (
                    <i className={`fas fa-chevron-right ml-auto text-[10px] opacity-40 transition-transform ${isParentActive ? 'rotate-90' : ''}`}></i>
                  )}
                </NavLink>

                {!isCollapsed && item.subItems && isParentActive && (
                  <div className="ml-6 pl-6 border-l border-slate-100 space-y-1 py-1">
                    {item.subItems.map(sub => (
                      <NavLink
                        key={sub.path}
                        to={sub.path}
                        className={({ isActive }) => 
                          `flex items-center py-2.5 px-4 rounded-xl text-[12px] font-semibold transition-all ${
                            isActive ? 'text-[#5d5cf6] bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                          }`
                        }
                      >
                        <i className={`fas ${sub.icon} w-5 text-center text-[11px] opacity-70`}></i>
                        <span className="ml-3">{sub.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-8 border-t border-slate-50">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
            <div className="relative">
              <img src={currentUser.avatar} className="w-10 h-10 rounded-xl border border-slate-100 shadow-sm" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-[12px] font-bold text-slate-800 truncate tracking-tight">{currentUser.name}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentUser.role === UserRole.ADMIN ? 'Admin' : 'Agent'}</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={handleLogout} className="mt-8 w-full py-3.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all">
              Sign Out
            </button>
          )}
        </div>
      </Motion.aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence>
          {impersonator && (
            <Motion.div 
              initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }} 
              className="bg-slate-900 text-white px-8 py-3 flex justify-between items-center z-[100] shadow-2xl"
            >
               <div className="flex items-center gap-4">
                  <span className="bg-emerald-500 text-slate-900 px-3 py-1 rounded-full text-[8px] font-black uppercase">Acting As User</span>
                  <p className="text-[11px] font-medium opacity-80 italic">Accessing portal of <span className="font-black text-emerald-400">{currentUser.name}</span></p>
               </div>
               <button onClick={onRestoreAdmin} className="bg-white text-slate-900 px-6 py-1.5 rounded-full text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition">
                 Restore Session
               </button>
            </Motion.div>
          )}
        </AnimatePresence>

        <header className="h-20 bg-white border-b border-slate-100 px-10 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4">
             <div className="w-1 h-5 bg-[#5d5cf6] rounded-full" />
             <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
               {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
             </h2>
          </div>
          <div className="flex items-center gap-4">
            <NavLink to="/" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 transition-colors">
              <i className="fas fa-external-link-alt mr-2"></i> View Store
            </NavLink>
            <button onClick={toggleCollapse} className="w-10 h-10 rounded-xl text-slate-300 hover:bg-slate-50 transition border border-slate-50 flex items-center justify-center">
              <i className={`fas ${isCollapsed ? 'fa-indent' : 'fa-outdent'}`}></i>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar page-transition p-4 md:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

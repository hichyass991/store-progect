
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  const navigate = useNavigate();
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_width');
      const parsed = saved ? parseInt(saved, 10) : 260;
      return isNaN(parsed) ? 260 : parsed;
    } catch (e) {
      return 260;
    }
  });
  
  const isCollapsed = sidebarWidth < 160;
  const [isResizing, setIsResizing] = useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/leads', '/products']);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    localStorage.setItem('sidebar_width', sidebarWidth.toString());
  }, [sidebarWidth]);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    let newWidth = e.clientX;
    if (newWidth < 160) {
      newWidth = newWidth < 120 ? 80 : 160;
    }
    if (newWidth > 450) newWidth = 450;
    setSidebarWidth(newWidth);
  };

  const stopResizing = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  };

  const toggleCollapse = () => {
    setSidebarWidth(prev => prev < 160 ? 260 : 80);
  };

  const toggleMenu = (path: string) => {
    setExpandedMenus(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    );
  };

  const STAFF_ROLES = [UserRole.ADMIN, UserRole.AGENT, UserRole.LOGISTICS, UserRole.LEADER, UserRole.MANAGER];
  const MGMT_AND_ACC = [UserRole.ADMIN, UserRole.MANAGER, UserRole.LEADER];

  const navPool: Record<string, NavItem> = {
    '/dashboard': { path: '/dashboard', label: 'Dashboard', icon: 'fa-th-large', roles: [...STAFF_ROLES, UserRole.CLIENT] },
    '/call-center': { path: '/call-center', label: 'Call Terminal', icon: 'fa-headset', roles: [UserRole.ADMIN, UserRole.AGENT, UserRole.LEADER] },
    '/logistics': { path: '/logistics', label: 'Livreur Hub', icon: 'fa-truck-loading', roles: [UserRole.ADMIN, UserRole.LIVREUR, UserRole.LOGISTICS] },
    '/leads': { 
      path: '/leads', 
      label: 'All Leads', 
      icon: 'fa-address-book', 
      roles: MGMT_AND_ACC,
      children: [
        { path: '/orders', label: 'Confirmed Orders', icon: 'fa-check-circle', roles: MGMT_AND_ACC },
        { path: '/abandoned', label: 'Abandoned Carts', icon: 'fa-shopping-cart', roles: MGMT_AND_ACC },
      ]
    },
    '/invoices': { path: '/invoices', label: 'Financial Ledger', icon: 'fa-file-contract', roles: [UserRole.ADMIN, UserRole.MANAGER] },
    '/stores': { path: '/stores', label: 'My Stores', icon: 'fa-store', roles: [UserRole.ADMIN, UserRole.MANAGER] },
    '/products': { 
      path: '/products', 
      label: 'All Products', 
      icon: 'fa-box', 
      roles: STAFF_ROLES,
      children: [
        { path: '/products/new', label: 'New Product', icon: 'fa-plus-square', roles: MGMT_AND_ACC },
        { path: '/categories', label: 'Categories', icon: 'fa-tags', roles: MGMT_AND_ACC },
        { path: '/discounts', label: 'Discounts', icon: 'fa-percent', roles: MGMT_AND_ACC },
      ]
    },
    '/sheets': { path: '/sheets', label: 'Source (Sheets)', icon: 'fa-file-invoice', roles: [UserRole.ADMIN] },
    '/users': { path: '/users', label: 'Staff Ledger', icon: 'fa-users-cog', roles: [UserRole.ADMIN] },
    '/support': { path: '/support', label: 'Support Desk', icon: 'fa-headset', roles: STAFF_ROLES },
    '/settings': { path: '/settings', label: 'Settings', icon: 'fa-cog', roles: [UserRole.ADMIN] },
  };

  const visibleNav = useMemo(() => {
    return navOrder
      .map(path => navPool[path])
      .filter(item => item && item.roles.includes(currentUser.role));
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
              `flex-1 flex items-center relative overflow-hidden rounded-xl transition-all duration-200 py-3 ${
                linkActive 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : isActive && hasChildren && !isCollapsed
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              } ${isCollapsed ? 'justify-center h-12 w-12 mx-auto' : isChild ? 'pl-10 pr-4' : 'px-4'}`
            }
          >
            <i className={`fas ${item.icon} transition-transform duration-200 group-hover:scale-110 ${isCollapsed ? 'text-lg' : 'w-5 text-center text-sm'}`}></i>
            {!isCollapsed && (
              <span className="text-[13px] ml-4 font-bold whitespace-nowrap">
                {item.label}
              </span>
            )}
          </NavLink>

          {hasChildren && !isCollapsed && (
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleMenu(item.path); }}
              className={`absolute right-2 p-2 text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${isActive ? 'text-indigo-600' : 'text-slate-300'}`}
            >
              <i className="fas fa-chevron-down"></i>
            </button>
          )}
        </div>

        {hasChildren && !isCollapsed && (
          <AnimatePresence initial={false}>
            {isExpanded && (
              <Motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden mt-1 space-y-1 relative"
              >
                <div className="absolute left-6 top-0 bottom-4 w-px bg-slate-100"></div>
                {item.children!.filter(child => child.roles.includes(currentUser.role)).map(child => renderNavLink(child, true))}
              </Motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-inter relative">
      <AnimatePresence>
        {!currentUser.isApproved && (
          <Motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-slate-900/40 backdrop-blur-xl pointer-events-auto"
          >
            <Motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-2xl border border-white p-12 rounded-[56px] shadow-[0_32px_64px_rgba(0,0,0,0.2)] max-w-xl w-full text-center space-y-10 relative overflow-hidden"
            >
              <header className="space-y-6">
                 <div className="w-24 h-24 bg-amber-500/10 rounded-[32px] border-2 border-amber-500/20 flex items-center justify-center text-amber-500 text-4xl mx-auto shadow-2xl relative">
                    <i className="fas fa-hourglass-half animate-pulse"></i>
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Security Clearance Pending</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">Hello <span className="text-indigo-600 underline">{currentUser.name}</span>. Your workspace is currently in <span className="text-slate-800">Review Mode</span>.</p>
                 </div>
              </header>
              <div className="space-y-8">
                 <div className="bg-slate-900/5 p-8 rounded-[32px] border border-slate-900/5 space-y-4">
                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">"Validation in progress. Please wait for Hicham or Amina to authorize your session."</p>
                 </div>
                 <button onClick={handleLogout} className="w-full py-5 bg-white border-2 border-slate-100 text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-all">Terminate Session</button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <Motion.aside 
        animate={{ width: sidebarWidth }}
        className="bg-white border-r border-slate-200 flex flex-col z-50 relative group select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      >
        <div onMouseDown={startResizing} className="absolute top-0 -right-1 w-2 h-full cursor-col-resize z-50 transition-colors duration-300 group-hover:bg-slate-100">
           <button onClick={(e) => { e.stopPropagation(); toggleCollapse(); }} className="absolute top-24 -right-3 bg-white border border-slate-200 rounded-full w-6 h-6 flex items-center justify-center text-[8px] text-slate-400 hover:text-indigo-600 shadow-md opacity-0 group-hover:opacity-100"><i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i></button>
        </div>
        <div className={`h-20 border-b border-slate-100 flex items-center px-6 overflow-hidden flex-shrink-0 ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}>
          <div className="bg-indigo-600 w-10 h-10 rounded-xl text-white shadow-lg flex items-center justify-center flex-shrink-0"><i className="fas fa-rocket text-sm"></i></div>
          {!isCollapsed && <h1 className="font-black text-lg text-slate-800 tracking-tighter whitespace-nowrap">Gwapashop<span className="text-indigo-600">.</span></h1>}
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar mt-4">{visibleNav.map(item => renderNavLink(item))}</nav>
        <div className={`p-4 border-t border-slate-100 relative ${isCollapsed ? 'flex justify-center' : 'bg-slate-50/50'}`}>
          <div onClick={() => setShowUserSwitcher(!showUserSwitcher)} className={`flex items-center cursor-pointer hover:bg-white/50 p-2 rounded-xl transition-colors ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 shadow-sm flex items-center justify-center text-indigo-600 flex-shrink-0 overflow-hidden"><img src={currentUser.avatar} alt="Avatar" /></div>
            {!isCollapsed && <div className="flex-1 min-w-0"><div className="text-[12px] font-black text-slate-800 truncate">{currentUser.name}</div><div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{currentUser.role.split('(')[0]}</div></div>}
          </div>
        </div>
      </Motion.aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-100 px-8 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{currentUser.role.split('(')[0]} / {location.pathname.split('/').pop() || 'Terminal'}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-xl text-slate-400 hover:bg-slate-50 transition-all flex items-center justify-center"><i className="far fa-bell"></i></button>
            <button onClick={handleLogout} className="w-10 h-10 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"><i className="fas fa-sign-out-alt"></i></button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-slate-50/30 no-scrollbar"><Outlet /></div>
      </main>
    </div>
  );
};

export default Layout;

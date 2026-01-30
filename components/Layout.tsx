
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

  const handleRestoreClick = () => {
    onRestoreAdmin();
    navigate('/dashboard');
  };

  // The definitive source for NavItem metadata
  const navPool: Record<string, NavItem> = {
    '/dashboard': { path: '/dashboard', label: 'Dashboard', icon: 'fa-th-large', roles: [UserRole.ADMIN, UserRole.AGENT] },
    '/leads': { 
      path: '/leads', 
      label: 'All Leads', 
      icon: 'fa-address-book', 
      roles: [UserRole.ADMIN, UserRole.AGENT],
      children: [
        { path: '/orders', label: 'Confirmed Orders', icon: 'fa-check-circle', roles: [UserRole.ADMIN, UserRole.AGENT] },
        { path: '/abandoned', label: 'Abandoned Carts', icon: 'fa-shopping-cart', roles: [UserRole.ADMIN, UserRole.AGENT] },
      ]
    },
    '/invoices': { path: '/invoices', label: 'Financial Ledger', icon: 'fa-file-contract', roles: [UserRole.ADMIN, UserRole.AGENT] },
    '/stores': { path: '/stores', label: 'My Stores', icon: 'fa-store', roles: [UserRole.ADMIN] },
    '/products': { 
      path: '/products', 
      label: 'All Products', 
      icon: 'fa-box', 
      roles: [UserRole.ADMIN, UserRole.AGENT],
      children: [
        { path: '/products/new', label: 'New Product', icon: 'fa-plus-square', roles: [UserRole.ADMIN] },
        { path: '/categories', label: 'Categories', icon: 'fa-tags', roles: [UserRole.ADMIN] },
        { path: '/discounts', label: 'Discounts', icon: 'fa-percent', roles: [UserRole.ADMIN] },
      ]
    },
    '/sheets': { path: '/sheets', label: 'Source (Sheets)', icon: 'fa-file-invoice', roles: [UserRole.ADMIN] },
    '/users': { path: '/users', label: 'Staff Management', icon: 'fa-users-cog', roles: [UserRole.ADMIN] },
    '/support': { path: '/support', label: 'Support Desk', icon: 'fa-headset', roles: [UserRole.ADMIN, UserRole.AGENT] },
    '/settings': { path: '/settings', label: 'Settings', icon: 'fa-cog', roles: [UserRole.ADMIN] },
  };

  // Generate the visible hierarchy based on current navOrder state
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
            onClick={(e) => {
              if (hasChildren && isCollapsed) {
                // Collapsed: Click just navigates
              } else if (hasChildren) {
                // Expanded: Clicking parent toggles menu if not active
                if (!expandedMenus.includes(item.path)) toggleMenu(item.path);
              }
            }}
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
      {/* Global Access Restriction Overlay */}
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
              <div className="absolute top-0 right-0 p-8 opacity-5">
                 <i className="fas fa-shield-alt text-9xl"></i>
              </div>
              
              <header className="space-y-6">
                 <div className="w-24 h-24 bg-amber-500/10 rounded-[32px] border-2 border-amber-500/20 flex items-center justify-center text-amber-500 text-4xl mx-auto shadow-2xl shadow-amber-500/20 relative">
                    <i className="fas fa-hourglass-half animate-pulse"></i>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] text-amber-500 border-2 border-amber-100">
                       <i className="fas fa-lock"></i>
                    </div>
                 </div>
                 <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic leading-none">Security Clearance Pending</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 leading-relaxed">
                       Hello <span className="text-indigo-600 underline">{currentUser.name}</span>. Your workspace is currently in <span className="text-slate-800">Review Mode</span>.
                    </p>
                 </div>
              </header>

              <div className="space-y-8">
                 <div className="bg-slate-900/5 p-8 rounded-[32px] border border-slate-900/5 space-y-4">
                    <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">
                       "To protect our architectural integrity, all new identities must be validated by Amina or Hicham before operational access is granted. Please stand by."
                    </p>
                    <div className="flex items-center justify-center gap-4 pt-2">
                       <div className="flex gap-1.5">
                          {[1,2,3].map(i => (
                            <Motion.div 
                              key={i}
                              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                              className="w-1.5 h-1.5 rounded-full bg-amber-500"
                            />
                          ))}
                       </div>
                       <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.3em]">Validation in progress</span>
                    </div>
                 </div>
                 
                 <div className="flex gap-4">
                    <button 
                      onClick={handleLogout}
                      className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-500 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:border-red-100 hover:text-red-500 transition-all shadow-sm"
                    >
                      Terminate Session
                    </button>
                 </div>
              </div>

              <footer className="pt-4 flex items-center justify-center gap-3 text-slate-300">
                 <i className="fas fa-fingerprint text-xs"></i>
                 <span className="text-[8px] font-black uppercase tracking-[0.4em]">Nexus Core Security v4.2</span>
              </footer>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <Motion.aside 
        ref={sidebarRef}
        animate={{ width: sidebarWidth }}
        transition={isResizing ? { type: 'just' } : { type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white border-r border-slate-200 flex flex-col z-50 relative group select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      >
        <div 
          onMouseDown={startResizing}
          className={`absolute top-0 -right-1 w-2 h-full cursor-col-resize z-50 transition-colors duration-300 ${isResizing ? 'bg-indigo-500/20' : 'group-hover:bg-slate-100'}`}
        >
          <button 
            onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
            className="absolute top-24 -right-3 bg-white border border-slate-200 rounded-full w-6 h-6 flex items-center justify-center text-[8px] text-slate-400 hover:text-indigo-600 shadow-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
          >
            <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>

        <div className={`h-20 border-b border-slate-100 flex items-center px-6 overflow-hidden flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'gap-3'}`}>
          <div className="bg-indigo-600 w-10 h-10 rounded-xl text-white shadow-lg shadow-indigo-100 flex items-center justify-center flex-shrink-0">
            <i className="fas fa-rocket text-sm"></i>
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <Motion.h1 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-black text-lg text-slate-800 tracking-tighter whitespace-nowrap"
              >
                Gwapashop<span className="text-indigo-600">.</span>
              </Motion.h1>
            )}
          </AnimatePresence>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar mt-4">
          {visibleNav.map(item => renderNavLink(item))}
        </nav>

        <div className={`p-4 border-t border-slate-100 transition-all duration-300 relative ${isCollapsed ? 'flex justify-center' : 'bg-slate-50/50'}`}>
          <div 
            onClick={() => setShowUserSwitcher(!showUserSwitcher)}
            className={`flex items-center cursor-pointer hover:bg-white/50 p-2 rounded-xl transition-colors ${isCollapsed ? 'justify-center' : 'gap-3'}`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 shadow-sm flex items-center justify-center text-indigo-600 flex-shrink-0 overflow-hidden">
               <img src={currentUser.avatar} alt="Avatar" />
            </div>
            {!isCollapsed && (
              <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                <div className="text-[12px] font-black text-slate-800 truncate leading-tight">{currentUser.name}</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">{currentUser.role}</div>
              </Motion.div>
            )}
          </div>

          <AnimatePresence>
            {showUserSwitcher && (
              <Motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-4 right-4 bg-white border border-slate-200 rounded-[28px] shadow-2xl mb-4 overflow-hidden z-[100]"
              >
                <div className="p-4 border-b bg-slate-50">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Identity Hub</p>
                </div>
                <div className="max-h-48 overflow-y-auto no-scrollbar">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-4 hover:bg-red-50 text-red-600 transition-colors"
                  >
                    <i className="fas fa-sign-out-alt w-8 h-8 flex items-center justify-center"></i>
                    <div className="text-left">
                      <div className="text-[11px] font-black uppercase">Terminate Session</div>
                    </div>
                  </button>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </Motion.aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Only show "Return to Admin" if an impersonator session is active */}
        {impersonator && (
          <div className="bg-indigo-600 text-white px-8 py-2.5 flex justify-between items-center shadow-lg relative z-50">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Impersonation Protocol Active: Previewing <span className="underline">{currentUser.name}</span>
                </span>
             </div>
             <button 
              onClick={handleRestoreClick}
              className="bg-white text-indigo-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest hover:scale-105 transition shadow-sm"
             >
               Return to Admin Control
             </button>
          </div>
        )}

        <header className="h-20 bg-white border-b border-slate-100 px-8 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full animate-pulse ${currentUser.role === UserRole.ADMIN ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              {currentUser.role} <span className="text-slate-300 mx-2">/</span> {location.pathname.split('/').pop()?.replace('-', ' ') || 'Overview'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Status</span>
               <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
               <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Online</span>
            </div>
            <div className="h-8 w-px bg-slate-100 mx-2"></div>
            <button className="w-10 h-10 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100 flex items-center justify-center">
              <i className="far fa-bell"></i>
            </button>
            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100 flex items-center justify-center"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/30 no-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

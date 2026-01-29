import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Use any to bypass potential type mismatches in ESM environment
const Motion = motion as any;

const Layout: React.FC = () => {
  const location = useLocation();
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar_width');
    return saved ? parseInt(saved) : 260;
  });
  
  // Collapse threshold logic: below 160px, we force icons-only mode (80px)
  const isCollapsed = sidebarWidth < 160;
  const [isResizing, setIsResizing] = useState(false);
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
    // Limits: 80px (collapsed) to 450px (expanded)
    // Snap logic: if between 80 and 160, jump to 80
    let newWidth = e.clientX;
    
    if (newWidth < 160) {
      if (newWidth < 120) {
        newWidth = 80; // Snap to collapsed
      } else {
        newWidth = 160; // Snap to minimum expanded
      }
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

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fa-th-large' },
    { path: '/leads', label: 'All Leads', icon: 'fa-address-book' },
    { path: '/orders', label: 'Confirmed Orders', icon: 'fa-check-circle' },
    { path: '/abandoned', label: 'Abandoned Carts', icon: 'fa-shopping-cart' },
    { path: '/stores', label: 'My Stores', icon: 'fa-store' },
    { path: '/products', label: 'All Products', icon: 'fa-box' },
    { path: '/products/new', label: 'New Product', icon: 'fa-plus-square' },
    { path: '/categories', label: 'Categories', icon: 'fa-tags' },
    { path: '/discounts', label: 'Discounts', icon: 'fa-percent' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-inter">
      {/* Resizable Sidebar */}
      <Motion.aside 
        ref={sidebarRef}
        animate={{ width: sidebarWidth }}
        transition={isResizing ? { type: 'just' } : { type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white border-r border-slate-200 flex flex-col z-50 relative group select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)]"
      >
        {/* Resize Handle Trigger Area */}
        <div 
          onMouseDown={startResizing}
          className={`absolute top-0 -right-1 w-2 h-full cursor-col-resize z-50 transition-colors duration-300 ${isResizing ? 'bg-indigo-500/20' : 'group-hover:bg-slate-100'}`}
        >
          {/* Quick Toggle Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
            className="absolute top-24 -right-3 bg-white border border-slate-200 rounded-full w-6 h-6 flex items-center justify-center text-[8px] text-slate-400 hover:text-indigo-600 shadow-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
          >
            <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
          </button>
        </div>

        {/* Brand Identity */}
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
        
        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar mt-4">
          {navItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              title={isCollapsed ? item.label : ''}
              className={({ isActive }) => 
                `group flex items-center relative overflow-hidden rounded-xl transition-all duration-200 py-3 ${
                  isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                } ${isCollapsed ? 'justify-center h-12 w-12 mx-auto' : 'px-4'}`
              }
            >
              <i className={`fas ${item.icon} transition-transform duration-200 group-hover:scale-110 ${isCollapsed ? 'text-lg' : 'w-5 text-center text-sm'}`}></i>
              
              {!isCollapsed && (
                <Motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[13px] ml-4 font-bold whitespace-nowrap transition-transform duration-200 group-hover:translate-x-1"
                >
                  {item.label}
                </Motion.span>
              )}

              {/* Active Indicator Bar */}
              {location.pathname === item.path && !isCollapsed && (
                <Motion.div 
                  layoutId="activeSideIndicator"
                  className="absolute right-0 top-3 bottom-3 w-1 bg-white/30 rounded-l-full"
                />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile Area */}
        <div className={`p-4 border-t border-slate-100 transition-all duration-300 ${isCollapsed ? 'flex justify-center' : 'bg-slate-50/50'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 border border-indigo-200 shadow-sm flex items-center justify-center text-indigo-600 flex-shrink-0 overflow-hidden">
               <img src="https://ui-avatars.com/api/?name=Hicham+Idali&background=4f46e5&color=fff" alt="Avatar" />
            </div>
            {!isCollapsed && (
              <Motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 min-w-0"
              >
                <div className="text-[12px] font-black text-slate-800 truncate leading-tight">Hicham Idali</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Administrator</div>
              </Motion.div>
            )}
          </div>
        </div>
      </Motion.aside>

      {/* Primary Content Container */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white border-b border-slate-100 px-8 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              System <span className="text-slate-300 mx-2">/</span> {location.pathname.split('/').pop()?.replace('-', ' ') || 'Overview'}
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
            <button className="w-10 h-10 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100 flex items-center justify-center">
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
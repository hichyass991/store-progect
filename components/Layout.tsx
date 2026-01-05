
import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';

const Layout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'fa-th-large' },
    { 
      label: 'Orders', 
      icon: 'fa-shopping-cart',
      subItems: [
        { path: '/leads', label: 'All Leads' },
        { path: '/orders', label: 'Confirmed Orders' },
        { path: '/abandoned', label: 'Abandoned Carts' }
      ]
    },
    { path: '/stores', label: 'My Stores', icon: 'fa-store', badge: 'New' },
    {
      label: 'Products',
      icon: 'fa-box',
      subItems: [
        { path: '/products', label: 'All Products' },
        { path: '/products/new', label: '+ New Product' }
      ]
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white flex flex-col z-50">
        <div className="p-6 border-b flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-lg">
            <i className="fas fa-shopping-bag"></i>
          </div>
          <h1 className="font-bold text-xl text-slate-800 tracking-tight">Gwapashop</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item, idx) => (
            <div key={idx}>
              {item.path ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                      isActive ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'
                    }`
                  }
                >
                  <span className="flex items-center gap-3">
                    <i className={`fas ${item.icon} w-5 text-center text-sm`}></i>
                    <span className="text-sm">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ) : (
                <div className="space-y-1">
                  <div className="px-4 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    <i className={`fas ${item.icon} w-5 text-center`}></i>
                    {item.label}
                  </div>
                  <div className="ml-4 pl-4 border-l border-slate-100 space-y-1">
                    {item.subItems?.map((sub, sIdx) => (
                      <NavLink
                        key={sIdx}
                        to={sub.path}
                        className={({ isActive }) => 
                          `block px-4 py-2 text-sm rounded-lg transition-all ${
                            isActive ? 'text-emerald-600 font-semibold bg-emerald-50/50' : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-50'
                          }`
                        }
                      >
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-40">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
            {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center font-bold text-xs text-slate-600">
              HI
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

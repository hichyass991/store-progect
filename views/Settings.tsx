
import React, { useState } from 'react';
import { GoogleConfig, User, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

const Motion = motion as any;

interface SettingsProps {
  config: GoogleConfig;
  setConfig: React.Dispatch<React.SetStateAction<GoogleConfig>>;
  currentUser: User;
  navOrder: string[];
  setNavOrder: React.Dispatch<React.SetStateAction<string[]>>;
  currency: string;
  setCurrency: (c: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, setConfig, currentUser, navOrder, setNavOrder, currency, setCurrency }) => {
  const navigate = useNavigate();
  const [localConfig, setLocalConfig] = useState<GoogleConfig>({ ...config });
  const [showSecret, setShowSecret] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Accordion state
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleSaveSync = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(localConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Only labels for TOP-LEVEL menu items (Folders or single pages)
  const navItemLabels: Record<string, { label: string, icon: string }> = {
    '/dashboard': { label: 'Dashboard (Main)', icon: 'fa-th-large' },
    '/leads': { label: 'All Leads (Folder)', icon: 'fa-address-book' },
    '/invoices': { label: 'Financial Ledger', icon: 'fa-file-contract' },
    '/stores': { label: 'My Stores', icon: 'fa-store' },
    '/products': { label: 'All Products (Folder)', icon: 'fa-box' },
    '/sheets': { label: 'Source (Sheets)', icon: 'fa-file-invoice' },
    '/users': { label: 'Staff Management', icon: 'fa-users-cog' },
    '/support': { label: 'Support Desk', icon: 'fa-headset' },
    '/settings': { label: 'Settings', icon: 'fa-cog' },
  };

  const currencies = [
    { code: 'SAR', name: 'Saudi Riyal' },
    { code: 'MAD', name: 'Moroccan Dirham' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'AED', name: 'UAE Dirham' },
    { code: 'GBP', name: 'British Pound' },
  ];

  if (currentUser.role !== UserRole.ADMIN) {
    return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">Restricted Access</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500 pb-32">
      <header>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">Platform Architecture</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Global Parameters & Navigational Control</p>
      </header>

      <div className="space-y-6">
        {/* Accordion Item: Localization */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <button 
            onClick={() => toggleSection('localization')}
            className="w-full p-10 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <i className="fas fa-globe-americas text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">Global Localization</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Active Currency: <span className="text-indigo-600 font-black">{currency}</span></p>
              </div>
            </div>
            <i className={`fas fa-chevron-down transition-transform duration-300 text-slate-300 ${expandedSection === 'localization' ? 'rotate-180' : ''}`}></i>
          </button>

          <AnimatePresence>
            {expandedSection === 'localization' && (
              <Motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-10 border-t space-y-8 bg-slate-50/20">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {currencies.map(c => (
                      <button
                        key={c.code}
                        onClick={() => setCurrency(c.code)}
                        className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center text-center gap-2 ${
                          currency === c.code 
                            ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-100 scale-105 z-10' 
                            : 'border-slate-100 bg-white hover:border-indigo-200'
                        }`}
                      >
                        <span className="text-xl font-black text-slate-800">{c.code}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">This setting becomes the default for all new artifacts in the catalog.</p>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Accordion Item: Google Sync */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <button 
            onClick={() => toggleSection('google')}
            className="w-full p-10 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                <i className="fab fa-google text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">Google API Cloud Bridge</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">External Spreadsheet Ledger Connectivity</p>
              </div>
            </div>
            <i className={`fas fa-chevron-down transition-transform duration-300 text-slate-300 ${expandedSection === 'google' ? 'rotate-180' : ''}`}></i>
          </button>

          <AnimatePresence>
            {expandedSection === 'google' && (
              <Motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-10 border-t space-y-8 bg-slate-50/20">
                  <form onSubmit={handleSaveSync} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Google Client ID</label>
                      <input 
                        type="text" 
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono text-xs text-slate-600"
                        value={localConfig.clientId}
                        onChange={(e) => setLocalConfig({ ...localConfig, clientId: e.target.value })}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Google Client Secret</label>
                      <div className="relative">
                        <input 
                          type={showSecret ? "text" : "password"} 
                          className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono text-xs text-slate-600"
                          value={localConfig.clientSecret}
                          onChange={(e) => setLocalConfig({ ...localConfig, clientSecret: e.target.value })}
                        />
                        <button 
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300"
                        >
                          <i className={`fas ${showSecret ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                        {isSaved ? 'Synchronized ✓' : 'Sync Credentials'}
                      </button>
                      <button type="button" onClick={() => navigate('/sheets/guide')} className="text-[9px] font-black uppercase text-indigo-600 hover:underline tracking-widest">Setup Guide</button>
                    </div>
                  </form>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Accordion Item: Navigation */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <button 
            onClick={() => toggleSection('navigation')}
            className="w-full p-10 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <i className="fas fa-list-ol text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none">Sidebar Architecture</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Dynamic Operational Menu Hierarchy</p>
              </div>
            </div>
            <i className={`fas fa-chevron-down transition-transform duration-300 text-slate-300 ${expandedSection === 'navigation' ? 'rotate-180' : ''}`}></i>
          </button>

          <AnimatePresence>
            {expandedSection === 'navigation' && (
              <Motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-10 border-t space-y-8 bg-slate-50/20">
                  <p className="text-xs text-slate-500 font-medium bg-white p-6 rounded-3xl border border-indigo-100 italic">
                    Drag and drop the items below to customize the flow of your operational dashboard folders and standalone menus.
                  </p>
                  <Reorder.Group axis="y" values={navOrder} onReorder={setNavOrder} className="space-y-3">
                    {navOrder.map(path => {
                      const item = navItemLabels[path];
                      if (!item) return null;
                      return (
                        <Reorder.Item 
                          key={path} 
                          value={path}
                          className="bg-white border-2 border-slate-100 p-5 rounded-3xl flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-indigo-200 transition-all group shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition shadow-sm border border-slate-100">
                              <i className={`fas ${item.icon}`}></i>
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-slate-600">{item.label}</span>
                          </div>
                          <i className="fas fa-bars text-slate-200 group-hover:text-indigo-300"></i>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                </div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[48px] text-white flex items-center gap-10">
        <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center text-3xl">
          <i className="fas fa-terminal"></i>
        </div>
        <div>
          <h4 className="text-xl font-black italic">Advanced Manifest</h4>
          <p className="text-xs text-slate-400 font-medium leading-relaxed mt-2">
            These global settings redefine how your workspace behaves. Reordering sections here will immediately reflect in your main sidebar navigation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;

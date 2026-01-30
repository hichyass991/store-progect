
import React from 'react';
import { AbandonedCart, Product, User, UserRole } from '../types';
import { csvService } from '../services/csvService';

interface AbandonedProps {
  abandonedCarts: AbandonedCart[];
  products: Product[];
  currentUser: User;
}

const Abandoned: React.FC<AbandonedProps> = ({ abandonedCarts, products, currentUser }) => {
  
  const handleExport = () => {
    const exportData = abandonedCarts.map(c => {
      const p = products.find(prod => prod.id === c.product_id);
      return {
        AbandonedAt: c.timestamp,
        Customer: c.name,
        Phone: c.phone,
        ProductInterested: p?.title || 'Unknown',
        SKU: p?.sku || '---'
      };
    });
    csvService.exportToCSV(exportData, 'gwapa_abandoned_recovery');
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-red-500 tracking-tight italic">Abandoned Recovery</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lead Recovery Opportunity Hub</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-red-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100 hover:scale-105 transition flex items-center gap-2"
        >
          <i className="fas fa-download"></i> Download Tracker
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-red-100 shadow-2xl shadow-red-100/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-red-50/50 border-b text-red-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-8 py-6">Identity</th>
                <th className="px-6 py-6">Contact Details</th>
                <th className="px-6 py-6">Target Artifact</th>
                <th className="px-8 py-6 text-right">Captured Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {abandonedCarts.map(c => {
                const p = products.find(prod => prod.id === c.product_id);
                return (
                  <tr key={c.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="px-8 py-5">
                       <div className="font-black text-slate-800">{c.name}</div>
                       <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Passive Interest</div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="font-bold text-slate-600">{c.phone}</div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 overflow-hidden border">
                             <img src={p?.photo} className="w-full h-full object-cover" />
                          </div>
                          <div className="text-xs font-black text-slate-600 truncate max-w-[200px]">{p?.title || '---'}</div>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-right font-mono text-[10px] text-slate-400">
                       {c.timestamp}
                    </td>
                  </tr>
                );
              })}
              {abandonedCarts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-widest text-lg opacity-20 italic">No carts currently in recovery phase</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-slate-900 p-8 rounded-[40px] text-white flex items-center gap-8">
         <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
            <i className="fas fa-phone-alt"></i>
         </div>
         <div className="flex-1">
            <h4 className="text-lg font-black tracking-tight italic">Recovery Protocol Active</h4>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
               Admins and Agents are encouraged to call these prospects within 15 minutes of capture. 
               Abandoned carts represent <span className="text-red-400 font-bold">high-intent</span> traffic that requires immediate engagement.
            </p>
         </div>
      </div>
    </div>
  );
};

export default Abandoned;

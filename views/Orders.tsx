
import React from 'react';
import { Lead, LeadStatus, Product, User, UserRole } from '../types';
import { csvService } from '../services/csvService';

interface OrdersProps {
  leads: Lead[];
  products: Product[];
  currentUser: User;
}

const Orders: React.FC<OrdersProps> = ({ leads, products, currentUser }) => {
  const confirmedLeads = leads.filter(l => l.status === LeadStatus.CONFIRMED);
  
  // Filter if Agent
  const orders = currentUser.role === UserRole.AGENT
    ? confirmedLeads.filter(l => l.assignedTo === currentUser.id)
    : confirmedLeads;

  const handleExport = () => {
    const exportData = orders.map(o => {
      const p = products.find(prod => prod.id === o.product_id);
      return {
        OrderID: o.id_num,
        Customer: o.name,
        Phone: o.phone,
        Email: o.email,
        Product: p?.title || 'Unknown',
        SKU: p?.sku || '---',
        Price: p?.price || 0,
        Currency: p?.currency || 'SAR',
        Timestamp: o.createdAt
      };
    });
    csvService.exportToCSV(exportData, 'gwapa_confirmed_orders');
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic">
             {currentUser.role === UserRole.ADMIN ? 'Global Confirmed Orders' : 'My Confirmed Orders'}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Validated Revenue Pipeline</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 transition flex items-center gap-2"
        >
          <i className="fas fa-download"></i> Export Ledger
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-50/50 border-b text-emerald-700 uppercase text-[10px] font-black tracking-[0.3em]">
              <tr>
                <th className="px-8 py-6">Order Reference</th>
                <th className="px-6 py-6">Customer Identity</th>
                <th className="px-6 py-6">Purchased Artifact</th>
                <th className="px-8 py-6 text-right">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(o => {
                const p = products.find(prod => prod.id === o.product_id);
                return (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-mono font-black text-slate-400">{o.id_num}</td>
                    <td className="px-6 py-5">
                       <div className="font-black text-slate-800">{o.name}</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase">{o.phone}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden border">
                            <img src={p?.photo} className="w-full h-full object-cover" />
                         </div>
                         <div className="text-xs font-black text-slate-600 truncate max-w-[200px]">{p?.title || '---'}</div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="px-4 py-1.5 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-full tracking-widest shadow-lg shadow-emerald-100">
                        Confirmed
                      </span>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-32 text-center">
                    <div className="text-slate-200 text-6xl mb-4"><i className="fas fa-receipt"></i></div>
                    <p className="text-slate-300 font-black uppercase tracking-[0.4em] italic">No confirmed orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;


import React, { useState } from 'react';
import { Lead, LeadStatus, Product, User, UserRole } from '../types';
import { csvService } from '../services/csvService';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface OrdersProps {
  leads: Lead[];
  products: Product[];
  currentUser: User;
}

const Orders: React.FC<OrdersProps> = ({ leads, products, currentUser }) => {
  const [selectedQR, setSelectedQR] = useState<Lead | null>(null);
  const confirmedLeads = leads.filter(l => l.status === LeadStatus.CONFIRMED);
  
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
    <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-32">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic leading-none">
             {currentUser.role === UserRole.ADMIN ? 'Order Inventory' : 'Confirmed Pipeline'}
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Validated Commercial Transactions</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-emerald-600 text-white px-10 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:scale-105 transition flex items-center gap-3"
        >
          <i className="fas fa-download"></i> Export Ledger
        </button>
      </div>

      <div className="bg-white rounded-[56px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b text-slate-400 uppercase text-[9px] font-black tracking-[0.4em]">
              <tr>
                <th className="px-10 py-8 text-center">QR Tracking</th>
                <th className="px-6 py-8">Identity Cluster</th>
                <th className="px-6 py-8">Artifact Specs</th>
                <th className="px-10 py-8 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map(o => {
                const p = products.find(prod => prod.id === o.product_id);
                return (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                       <div 
                         onClick={() => setSelectedQR(o)}
                         className="w-16 h-16 mx-auto bg-white p-2 rounded-2xl border-2 border-slate-100 cursor-zoom-in hover:border-indigo-400 transition-all shadow-sm group-hover:scale-110 flex items-center justify-center overflow-hidden"
                       >
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(o.id_num)}`} 
                            alt="QR" 
                            className="w-full h-full object-contain grayscale group-hover:grayscale-0"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=QR'; }}
                          />
                       </div>
                       <p className="text-center text-[9px] font-mono font-black text-slate-400 mt-2">{o.id_num}</p>
                    </td>
                    <td className="px-6 py-6">
                       <div className="font-black text-slate-800 text-base">{o.name}</div>
                       <div className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{o.phone}</div>
                       <div className="text-[9px] text-indigo-500 font-black mt-2 uppercase">{o.city}</div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-[20px] bg-slate-100 overflow-hidden border border-white shadow-sm">
                            <img src={p?.photo} className="w-full h-full object-cover" />
                         </div>
                         <div>
                            <div className="text-xs font-black text-slate-600 truncate max-w-[200px] uppercase tracking-tighter">{p?.title || '---'}</div>
                            <div className="text-[9px] font-mono text-slate-400 font-bold mt-1">{p?.sku || '---'}</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <span className="px-5 py-2 bg-emerald-500 text-white text-[9px] font-black uppercase rounded-full tracking-[0.2em] shadow-xl shadow-emerald-100 italic">
                        Confirmed
                      </span>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-40 text-center opacity-20">
                    <div className="text-6xl mb-6"><i className="fas fa-receipt"></i></div>
                    <p className="text-2xl font-black uppercase tracking-[0.4em] italic text-slate-800">No Orders in Verification Stage</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Zoom Modal */}
      <AnimatePresence>
        {selectedQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedQR(null)} className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl" />
            <Motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white p-12 rounded-[64px] shadow-3xl text-center space-y-10 max-w-lg w-full"
            >
              <div className="space-y-4">
                 <h3 className="text-3xl font-black italic tracking-tighter text-slate-800 uppercase leading-none">Order Validation Label</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Customer: {selectedQR.name}</p>
              </div>
              
              <div className="bg-slate-50 p-10 rounded-[48px] border-4 border-slate-100 flex flex-col items-center">
                 <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedQR.id_num)}`} 
                    alt="Master QR" 
                    className="w-64 h-64 object-contain shadow-2xl rounded-3xl"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x300?text=QR+Generation+Error'; }}
                 />
                 <div className="mt-8 text-4xl font-mono font-black text-slate-800 tracking-[0.2em] italic">
                   {selectedQR.id_num}
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl">Print Label</button>
                 <button onClick={() => setSelectedQR(null)} className="flex-1 bg-white border-2 border-slate-100 text-slate-400 py-5 rounded-[28px] font-black text-xs uppercase tracking-widest">Close</button>
              </div>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;

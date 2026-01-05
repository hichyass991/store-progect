
import React from 'react';
import { Lead, LeadStatus, Product } from '../types';

interface OrdersProps {
  leads: Lead[];
  products: Product[];
}

const Orders: React.FC<OrdersProps> = ({ leads, products }) => {
  const orders = leads.filter(l => l.status === LeadStatus.CONFIRMED);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800">Confirmed Orders</h2>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-emerald-50 border-b text-emerald-700 uppercase text-[10px] font-bold tracking-widest">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer Name</th>
              <th className="px-6 py-4">Product Purchased</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(o => {
              const p = products.find(prod => prod.id === o.product_id);
              return (
                <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-slate-400">{o.id_num}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">{o.name}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-medium text-slate-600">{p?.title || '---'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-3 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-full tracking-widest">
                      Confirmed
                    </span>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-slate-300 font-bold italic">No orders confirmed yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;

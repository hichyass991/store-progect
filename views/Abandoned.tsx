
import React from 'react';
import { AbandonedCart, Product } from '../types';

interface AbandonedProps {
  abandonedCarts: AbandonedCart[];
  products: Product[];
}

const Abandoned: React.FC<AbandonedProps> = ({ abandonedCarts, products }) => {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-red-500">Global Tracker (Abandoned)</h2>
      </div>

      <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-red-50 border-b text-red-400 uppercase text-[10px] font-bold tracking-widest">
            <tr>
              <th className="px-6 py-4">Identity</th>
              <th className="px-6 py-4">Contact Details</th>
              <th className="px-6 py-4">Interest</th>
              <th className="px-6 py-4 text-right">Captured Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {abandonedCarts.map(c => {
              const p = products.find(prod => prod.id === c.product_id);
              return (
                <tr key={c.id} className="hover:bg-red-50/20 transition-colors">
                  <td className="px-6 py-4 font-black text-red-400 uppercase text-[10px]">Abandoned</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{p?.title || 'Unknown'}</td>
                  <td className="px-6 py-4 text-right text-xs text-slate-400 font-medium">{c.timestamp}</td>
                </tr>
              );
            })}
            {abandonedCarts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center text-slate-300 font-bold italic">Clean list. No abandoned carts tracked yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Abandoned;

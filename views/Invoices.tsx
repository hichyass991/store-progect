
import React, { useState, useMemo } from 'react';
import { Lead, LeadStatus, Product, User, UserRole, Payment } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface InvoicesProps {
  leads: Lead[];
  products: Product[];
  users: User[];
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  currentUser: User;
}

const Invoices: React.FC<InvoicesProps> = ({ leads, products, users, payments, setPayments, currentUser }) => {
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState<string | null>(null);
  const [selectedUserForPayout, setSelectedUserForPayout] = useState<User | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState('Bank Transfer');
  const [payoutNote, setPayoutNote] = useState('');

  // Financial Analysis Engine
  const userFinancials = useMemo(() => {
    return users.map(user => {
      const confirmedLeads = leads.filter(l => l.assignedTo === user.id && l.status === LeadStatus.CONFIRMED);
      
      const totalProfit = confirmedLeads.reduce((acc, lead) => {
        const product = products.find(p => p.id === lead.product_id);
        if (!product) return acc;
        const margin = product.price - product.costPrice;
        return acc + margin;
      }, 0);

      const totalPaid = payments
        .filter(p => p.userId === user.id)
        .reduce((acc, p) => acc + p.amount, 0);

      const balance = totalProfit - totalPaid;

      return {
        user,
        totalProfit,
        totalPaid,
        balance,
        confirmedLeads,
        recentPayments: payments
          .filter(p => p.userId === user.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
      };
    });
  }, [leads, products, users, payments]);

  const globalStats = useMemo(() => {
    const totalYield = userFinancials.reduce((acc, f) => acc + f.totalProfit, 0);
    const totalDisbursed = userFinancials.reduce((acc, f) => acc + f.totalPaid, 0);
    const totalOutstanding = totalYield - totalDisbursed;
    return { totalYield, totalDisbursed, totalOutstanding };
  }, [userFinancials]);

  const handleProcessPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPayout || payoutAmount <= 0) return;

    const newPayment: Payment = {
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      userId: selectedUserForPayout.id,
      amount: payoutAmount,
      timestamp: new Date().toLocaleString(),
      method: payoutMethod,
      note: payoutNote
    };

    setPayments(prev => [...prev, newPayment]);
    setShowPayoutModal(false);
    setSelectedUserForPayout(null);
    setPayoutAmount(0);
    setPayoutNote('');
  };

  const visibleFinancials = currentUser.role === UserRole.ADMIN 
    ? userFinancials 
    : userFinancials.filter(f => f.user.id === currentUser.id);

  const detailedUser = useMemo(() => {
    if (!showDetailsModal) return null;
    return userFinancials.find(f => f.user.id === showDetailsModal);
  }, [showDetailsModal, userFinancials]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">Financial Ledger</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Personnel Yield & Disbursement Tracking</p>
        </div>
        
        {currentUser.role === UserRole.ADMIN && (
          <div className="grid grid-cols-3 gap-4 bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm">
            <div className="px-6 py-2 text-center border-r border-slate-100">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Yield</p>
              <p className="text-sm font-black text-slate-800">{globalStats.totalYield.toLocaleString()} <span className="text-[9px]">SAR</span></p>
            </div>
            <div className="px-6 py-2 text-center border-r border-slate-100">
              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Disbursed</p>
              <p className="text-sm font-black text-emerald-600">{globalStats.totalDisbursed.toLocaleString()} <span className="text-[9px]">SAR</span></p>
            </div>
            <div className="px-6 py-2 text-center">
              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Outstanding</p>
              <p className="text-sm font-black text-indigo-600">{globalStats.totalOutstanding.toLocaleString()} <span className="text-[9px]">SAR</span></p>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visibleFinancials.map(fin => (
          <Motion.div 
            key={fin.user.id}
            whileHover={{ y: -5 }}
            className="bg-white rounded-[48px] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden flex flex-col h-full"
          >
            <div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={fin.user.avatar} className="w-12 h-12 rounded-2xl shadow-lg border-2 border-white" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${fin.balance > 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-800 tracking-tight">{fin.user.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{fin.user.role}</p>
                  </div>
               </div>
               <div className="flex gap-2">
                 <button 
                  onClick={() => setShowDetailsModal(fin.user.id)}
                  className="w-10 h-10 bg-white border border-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:text-indigo-600 hover:border-indigo-200 transition shadow-sm"
                  title="Breakdown Details"
                 >
                   <i className="fas fa-list-ul text-[10px]"></i>
                 </button>
                 {currentUser.role === UserRole.ADMIN && fin.balance > 0 && (
                   <button 
                    onClick={() => { setSelectedUserForPayout(fin.user); setPayoutAmount(fin.balance); setShowPayoutModal(true); }}
                    className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:scale-110 transition shadow-lg"
                    title="Send Payout"
                   >
                     <i className="fas fa-hand-holding-usd text-[10px]"></i>
                   </button>
                 )}
               </div>
            </div>

            <div className="p-8 space-y-8 flex-1">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-6 rounded-3xl space-y-2 border border-slate-100">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Yield</p>
                     <p className="text-xl font-black text-slate-800">{fin.totalProfit.toLocaleString()} <span className="text-[10px]">SAR</span></p>
                  </div>
                  <div className="bg-emerald-50 p-6 rounded-3xl space-y-2 border border-emerald-100">
                     <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Processed</p>
                     <p className="text-xl font-black text-emerald-600">{fin.totalPaid.toLocaleString()} <span className="text-[10px]">SAR</span></p>
                  </div>
               </div>

               <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
                  <p className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-4">Current Retained Balance</p>
                  <div className="flex items-baseline gap-2 relative z-10">
                    <span className="text-4xl font-black tracking-tighter">{fin.balance.toLocaleString()}</span>
                    <span className="text-xs font-bold text-slate-400">SAR</span>
                  </div>
               </div>

               <div className="space-y-4 pt-4">
                  <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                    <span>Recent History</span>
                    <i className="fas fa-history"></i>
                  </h5>
                  <div className="space-y-3">
                     {fin.recentPayments.map(p => (
                       <div key={p.id} className="flex justify-between items-center p-4 rounded-2xl border border-slate-50 bg-slate-50/30 group/item">
                          <div>
                            <p className="text-[10px] font-black text-slate-800">{p.amount} SAR</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">{p.method}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.timestamp}</p>
                             {p.note && <p className="text-[7px] font-bold text-indigo-400 uppercase mt-1 italic line-clamp-1">{p.note}</p>}
                          </div>
                       </div>
                     ))}
                     {fin.recentPayments.length === 0 && (
                       <div className="py-10 text-center space-y-2 opacity-30">
                          <i className="fas fa-receipt text-2xl"></i>
                          <p className="text-[9px] font-bold uppercase tracking-widest">No disbursements yet</p>
                       </div>
                     )}
                  </div>
               </div>
            </div>
          </Motion.div>
        ))}
      </div>

      {/* Disbursement Modal */}
      <AnimatePresence>
        {showPayoutModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPayoutModal(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
            <Motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg rounded-[48px] shadow-3xl overflow-hidden my-auto">
              <header className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic">Process Disbursement</h3>
                <button onClick={() => setShowPayoutModal(false)} className="w-10 h-10 rounded-full bg-white text-slate-400 hover:text-red-500 transition shadow-sm border border-slate-100 flex items-center justify-center"><i className="fas fa-times"></i></button>
              </header>
              <form onSubmit={handleProcessPayout} className="p-10 space-y-8">
                <div className="bg-indigo-50 p-6 rounded-3xl flex items-center gap-4 border border-indigo-100">
                   <img src={selectedUserForPayout?.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-sm" />
                   <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Recipient</p>
                      <p className="text-lg font-black text-indigo-900">{selectedUserForPayout?.name}</p>
                   </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Disbursement Amount (SAR)</label>
                  <input 
                    type="number" required
                    className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-800 text-3xl"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(parseFloat(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Channel</label>
                    <select 
                      className="w-full bg-slate-50 border-none rounded-3xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-slate-600 appearance-none cursor-pointer"
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                    >
                      <option>Bank Transfer</option>
                      <option>Cash Payout</option>
                      <option>PayPal</option>
                      <option>USDT / Crypto</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Timestamp</label>
                    <div className="w-full bg-slate-100 border-none rounded-3xl px-6 py-4 text-[10px] font-bold text-slate-400 flex items-center">
                       {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Internal Reference / Note</label>
                  <textarea 
                    className="w-full bg-slate-50 border-none rounded-3xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-xs"
                    placeholder="Reference # or reason..."
                    rows={2}
                    value={payoutNote}
                    onChange={(e) => setPayoutNote(e.target.value)}
                  />
                </div>

                <footer className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setShowPayoutModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400">Cancel</button>
                  <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">Execute Transfer</button>
                </footer>
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Yield Breakdown Modal */}
      <AnimatePresence>
        {detailedUser && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetailsModal(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
            <Motion.div initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} className="relative bg-white w-full max-w-4xl h-[90vh] rounded-[48px] shadow-3xl overflow-hidden flex flex-col">
              <header className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-6">
                   <img src={detailedUser.user.avatar} className="w-16 h-16 rounded-[24px] shadow-lg border-4 border-white" />
                   <div>
                      <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic leading-none">{detailedUser.user.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Yield Source Breakdown & Performance Ledger</p>
                   </div>
                </div>
                <button onClick={() => setShowDetailsModal(null)} className="w-12 h-12 rounded-full bg-white text-slate-400 hover:text-red-500 transition shadow-sm border border-slate-100 flex items-center justify-center"><i className="fas fa-times"></i></button>
              </header>
              
              <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                 <div className="grid grid-cols-3 gap-6">
                    <div className="p-8 bg-indigo-600 rounded-[40px] text-white">
                       <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Total Accumulated</p>
                       <p className="text-3xl font-black">{detailedUser.totalProfit.toLocaleString()} <span className="text-sm">SAR</span></p>
                    </div>
                    <div className="p-8 bg-emerald-500 rounded-[40px] text-white">
                       <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Confirmed Orders</p>
                       <p className="text-3xl font-black">{detailedUser.confirmedLeads.length}</p>
                    </div>
                    <div className="p-8 bg-slate-100 rounded-[40px] text-slate-800 border border-slate-200">
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Average per Order</p>
                       <p className="text-3xl font-black">
                         {detailedUser.confirmedLeads.length > 0 ? (detailedUser.totalProfit / detailedUser.confirmedLeads.length).toFixed(0) : 0} 
                         <span className="text-sm ml-1 text-slate-400">SAR</span>
                       </p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <i className="fas fa-list-check text-indigo-500"></i> Confirmed Lead Ledger
                    </h4>
                    <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden">
                       <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b">
                             <tr>
                                <th className="px-8 py-5">Order ID</th>
                                <th className="px-6 py-5">Product SKU</th>
                                <th className="px-6 py-5">Customer</th>
                                <th className="px-6 py-5 text-right">Yield</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {detailedUser.confirmedLeads.map(lead => {
                               const product = products.find(p => p.id === lead.product_id);
                               const yieldVal = product ? (product.price - product.costPrice) : 0;
                               return (
                                 <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-4 font-mono text-slate-400 text-xs font-black">{lead.id_num}</td>
                                    <td className="px-6 py-4">
                                       <div className="text-[11px] font-black text-slate-800">{product?.title || 'Unknown'}</div>
                                       <div className="text-[9px] font-bold text-slate-400">{product?.sku || '---'}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="text-[11px] font-black text-slate-800">{lead.name}</div>
                                       <div className="text-[9px] font-bold text-slate-400">{lead.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <span className="text-[11px] font-black text-emerald-600">+{yieldVal} SAR</span>
                                    </td>
                                 </tr>
                               );
                             })}
                             {detailedUser.confirmedLeads.length === 0 && (
                               <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-300 font-black uppercase italic tracking-widest opacity-20">No revenue events registered</td></tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>

              <footer className="p-10 border-t bg-slate-50/50 flex justify-end">
                 <button onClick={() => setShowDetailsModal(null)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Acknowledge Ledger</button>
              </footer>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Invoices;

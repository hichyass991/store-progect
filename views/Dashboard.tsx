
import React from 'react';
import { Product, Lead, LeadStatus, User, UserRole } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  products: Product[];
  leads: Lead[];
  currentUser: User;
}

const Dashboard: React.FC<DashboardProps> = ({ products, leads, currentUser }) => {
  // Filter leads if the user is an agent
  const relevantLeads = currentUser.role === UserRole.AGENT
    ? leads.filter(l => l.assignedTo === currentUser.id)
    : leads;

  const totalLeads = relevantLeads.length;
  const confirmedLeads = relevantLeads.filter(l => l.status === LeadStatus.CONFIRMED).length;
  const totalProducts = products.length;
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

  const statusData = [
    { name: 'Confirmed', value: confirmedLeads },
    { name: 'Other', value: totalLeads - confirmedLeads },
  ];

  const COLORS = ['#059669', '#cbd5e1'];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {currentUser.role === UserRole.ADMIN ? 'Global Performance' : 'My Performance'}
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time Operational Metrics</p>
        </div>
        {currentUser.role === UserRole.AGENT && (
           <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Agent Mode</span>
           </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border shadow-sm group hover:shadow-xl transition-all duration-300">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Leads</p>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{totalLeads}</h3>
        </div>
        <div className="bg-white p-6 rounded-[32px] border shadow-sm group hover:shadow-xl transition-all duration-300">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmed Orders</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-2">{confirmedLeads}</h3>
        </div>
        <div className="bg-white p-6 rounded-[32px] border shadow-sm group hover:shadow-xl transition-all duration-300">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Products</p>
          <h3 className="text-3xl font-black text-slate-800 mt-2">{totalProducts}</h3>
        </div>
        <div className="bg-white p-6 rounded-[32px] border shadow-sm group hover:shadow-xl transition-all duration-300">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inventory Value</p>
          <h3 className="text-3xl font-black text-emerald-600 mt-2">
            {totalValue.toLocaleString()} <span className="text-sm">SAR</span>
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border shadow-sm min-h-[400px]">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-8">Lead Conversion</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
              <span className="text-xs font-bold text-slate-600">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-300"></div>
              <span className="text-xs font-bold text-slate-600">Others</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border shadow-sm min-h-[400px]">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-8">Stock Level Analytics</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={products.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="sku" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="stock" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

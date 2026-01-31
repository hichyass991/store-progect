
import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabaseService } from '../services/supabaseService';

const Motion = motion as any;

interface UsersProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  onImpersonate: (user: User) => void;
}

const Users: React.FC<UsersProps> = ({ users, setUsers, currentUser, onImpersonate }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: UserRole.AGENT, isActive: true, isApproved: true, avatar: ''
  });

  // Access control check: Only Admin and Manager can reach this view
  if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.MANAGER) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl shadow-sm border border-red-100">
           <i className="fas fa-shield-slash"></i>
        </div>
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Access Restricted</h2>
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Administrative Clearance Level Required</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Return to Safety</button>
      </div>
    );
  }

  // If Manager, they can only see the users they are allowed to impersonate (lower ranks)
  const filteredUsers = useMemo(() => {
    let base = users;
    if (currentUser.role === UserRole.MANAGER) {
      // Managers only see staff they manage
      base = users.filter(u => u.role === UserRole.AGENT || u.role === UserRole.LIVREUR || u.role === UserRole.MANAGER);
    }
    
    return roleFilter === 'all' ? base : base.filter(u => u.role === roleFilter);
  }, [users, roleFilter, currentUser.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const avatarUrl = formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random&color=fff`;
    let userToSync: User;
    if (editingUser) {
      userToSync = { ...editingUser, ...formData, avatar: avatarUrl };
      await supabaseService.syncUser(userToSync);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? userToSync : u));
    } else {
      userToSync = {
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        name: formData.name, email: formData.email, 
        password: formData.password || 'gwapa' + Math.floor(Math.random() * 1000),
        role: formData.role, isActive: formData.isActive, isApproved: formData.isApproved,
        avatar: avatarUrl, createdAt: new Date().toLocaleDateString()
      };
      await supabaseService.syncUser(userToSync);
      setUsers(prev => [...prev, userToSync]);
    }
    setShowModal(false);
    setEditingUser(null);
  };

  const canImpersonateUser = (target: User) => {
    if (target.id === currentUser.id) return false;
    
    // Admin can impersonate anyone
    if (currentUser.role === UserRole.ADMIN) return true;
    
    // Account Manager can only impersonate Sales Agents and Delivery Drivers
    if (currentUser.role === UserRole.MANAGER) {
      return target.role === UserRole.AGENT || target.role === UserRole.LIVREUR;
    }
    
    return false;
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-slate-800 tracking-tighter italic leading-none">Personnel Ledger</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
            {currentUser.role === UserRole.ADMIN ? 'Global Staff Management' : 'Staff Supervision & Impersonation'}
          </p>
        </div>
        <div className="flex gap-3">
          <select 
            className="bg-white border rounded-2xl px-6 py-4 text-[10px] font-black uppercase outline-none shadow-sm cursor-pointer"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
          >
            <option value="all">Visible Ranks</option>
            {Object.values(UserRole)
              .filter(r => currentUser.role === UserRole.ADMIN || r === UserRole.AGENT || r === UserRole.LIVREUR)
              .map(r => <option key={r} value={r}>{r.split('(')[0]}</option>)
            }
          </select>
          {currentUser.role === UserRole.ADMIN && (
            <button onClick={() => { setEditingUser(null); setFormData({name:'', email:'', password:'', role:UserRole.AGENT, isActive:true, isApproved:true, avatar:''}); setShowModal(true); }} className="bg-indigo-600 text-white px-10 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
              + Recruit Personnel
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {filteredUsers.map(u => (
          <Motion.div layout key={u.id} className="bg-white p-10 rounded-[56px] border-2 border-slate-50 shadow-2xl relative group overflow-hidden transition-all hover:border-indigo-100">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-8">
                 <img src={u.avatar} className="w-24 h-24 rounded-[36px] border-4 border-white shadow-2xl" />
                 {!u.isActive && <div className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white"><i className="fas fa-lock"></i></div>}
              </div>
              <div className="mb-6">
                <h4 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{u.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-3 truncate w-full max-w-[200px]">{u.email}</p>
              </div>
              <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest mb-8 ${
                u.role === UserRole.ADMIN ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 
                u.role === UserRole.MANAGER ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                'bg-slate-50 text-slate-500 border border-slate-100'
              }`}>
                {u.role.split('(')[0]}
              </div>
              <div className="w-full space-y-3">
                 {canImpersonateUser(u) ? (
                    <button 
                      onClick={() => { onImpersonate(u); navigate('/dashboard'); }} 
                      className="w-full py-4 bg-slate-900 text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-user-secret"></i> 
                      Login As {u.name.split(' ')[0]}
                    </button>
                 ) : u.id !== currentUser.id && (
                   <div className="py-3 text-[9px] font-black uppercase text-slate-300 italic">Access restricted to Admin</div>
                 )}
                 {currentUser.role === UserRole.ADMIN && (
                    <button onClick={() => { setEditingUser(u); setFormData({...u, password: u.password || ''}); setShowModal(true); }} className="w-full py-3 bg-white border-2 border-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase hover:text-indigo-600 transition">Edit Security</button>
                 )}
              </div>
            </div>
          </Motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" />
            <Motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-xl rounded-[56px] shadow-3xl overflow-hidden my-auto p-12 space-y-8">
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">{editingUser ? 'Update Personnel' : 'Recruit Staff'}</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Identity</label>
                     <input type="text" required placeholder="Identity Name" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black outline-none focus:ring-2 focus:ring-indigo-100" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Auth Email</label>
                     <input type="email" required placeholder="name@gwapashop.pro" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black outline-none focus:ring-2 focus:ring-indigo-100" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Platform Role</label>
                     <select className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-black outline-none cursor-pointer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Security Key</label>
                     <input type="text" placeholder="Enter password..." className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-mono outline-none focus:ring-2 focus:ring-indigo-100" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                  <div className="flex items-center gap-6 pt-2">
                     <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-slate-100 text-indigo-600 focus:ring-indigo-500" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                        <span className="text-[10px] font-black uppercase text-slate-500">Active Account</span>
                     </label>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all">Commit Changes</button>
                </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;

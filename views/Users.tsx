
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
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.AGENT,
    isActive: true,
    isApproved: true,
    avatar: ''
  });

  if (currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Access Restricted</h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest mt-4">Security clearance [ADMIN_LEVEL] required to view personnel ledger.</p>
      </div>
    );
  }

  const roleConfigs: Record<UserRole, { color: string, icon: string, bg: string }> = {
    [UserRole.ADMIN]: { color: 'text-indigo-600', icon: 'fa-shield-alt', bg: 'bg-indigo-50' },
    [UserRole.AGENT]: { color: 'text-emerald-600', icon: 'fa-headset', bg: 'bg-emerald-50' },
    [UserRole.LOGISTICS]: { color: 'text-blue-600', icon: 'fa-truck-loading', bg: 'bg-blue-50' },
    [UserRole.LIVREUR]: { color: 'text-amber-600', icon: 'fa-motorcycle', bg: 'bg-amber-50' },
    [UserRole.LEADER]: { color: 'text-purple-600', icon: 'fa-crown', bg: 'bg-purple-50' },
    [UserRole.MANAGER]: { color: 'text-rose-600', icon: 'fa-user-tie', bg: 'bg-rose-50' },
    [UserRole.CLIENT]: { color: 'text-slate-600', icon: 'fa-user', bg: 'bg-slate-50' },
  };

  const filteredUsers = useMemo(() => {
    return roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);
  }, [users, roleFilter]);

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const toggleAccountStatus = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    if (userId === currentUser.id) { alert("Security protocol prevents self-revocation."); return; }

    setIsSyncing(userId);
    const updated = { ...target, isActive: !target.isActive };
    await supabaseService.syncUser(updated);
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    setTimeout(() => setIsSyncing(null), 500);
  };

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
        name: formData.name,
        email: formData.email,
        password: formData.password || 'gwapa' + Math.floor(Math.random() * 1000),
        role: formData.role,
        isActive: formData.isActive,
        isApproved: formData.isApproved,
        avatar: avatarUrl,
        createdAt: new Date().toLocaleDateString()
      };
      await supabaseService.syncUser(userToSync);
      setUsers(prev => [...prev, userToSync]);
    }
    setEditingUser(null);
    setShowModal(false);
    setFormData({ name: '', email: '', password: '', role: UserRole.AGENT, isActive: true, isApproved: true, avatar: '' });
  };

  const deleteUser = async (id: string) => {
    if (id === currentUser.id) { alert("Deletion of primary admin prohibited."); return; }
    if (window.confirm('Wach taya9 baghi t-supprimer had l-personnel?')) {
      await supabaseService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-slate-800 tracking-tighter italic leading-none">Personnel Ledger</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Corporate Governance Hub</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-white p-1.5 rounded-[24px] border border-slate-200 flex overflow-x-auto no-scrollbar shadow-sm">
             <button onClick={() => setRoleFilter('all')} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition ${roleFilter === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>All Staff</button>
             {Object.values(UserRole).map(role => (
               <button 
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition ${roleFilter === role ? roleConfigs[role].bg + ' ' + roleConfigs[role].color + ' shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {role.split('(')[0]}
               </button>
             ))}
          </div>
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-10 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-105 transition-all">
            + Recruit Personnel
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {filteredUsers.map(u => (
          <Motion.div 
            layout
            key={u.id}
            className={`bg-white p-10 rounded-[56px] border-2 shadow-2xl shadow-slate-200/40 relative group overflow-hidden transition-all ${!u.isActive ? 'border-red-100 opacity-80' : 'border-slate-50 hover:border-indigo-100'}`}
          >
            <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => { setEditingUser(u); setFormData({ ...u, password: u.password || '' }); setShowModal(true); }} className="w-10 h-10 rounded-2xl bg-white text-slate-400 hover:text-indigo-600 flex items-center justify-center border shadow-sm transition"><i className="fas fa-edit text-xs"></i></button>
               <button onClick={() => deleteUser(u.id)} className="w-10 h-10 rounded-2xl bg-white text-slate-400 hover:text-red-500 flex items-center justify-center border shadow-sm transition"><i className="fas fa-trash-alt text-xs"></i></button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="relative mb-8">
                <div className={`absolute -inset-2 rounded-[40px] blur-lg opacity-20 ${roleConfigs[u.role].bg.replace('bg-', 'bg-')}`} />
                <img src={u.avatar} className={`relative w-24 h-24 rounded-[36px] border-4 border-white shadow-2xl transition-all ${!u.isActive ? 'grayscale scale-90' : ''}`} />
                <div className={`absolute -bottom-3 -right-3 w-10 h-10 rounded-full border-4 border-white flex items-center justify-center text-xs shadow-xl ${roleConfigs[u.role].bg} ${roleConfigs[u.role].color}`}>
                  <i className={`fas ${roleConfigs[u.role].icon}`}></i>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{u.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">{u.email}</p>
              </div>

              <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest mb-8 inline-block ${roleConfigs[u.role].bg} ${roleConfigs[u.role].color} border border-transparent group-hover:border-current transition-colors`}>
                {u.role}
              </div>

              <div className="w-full space-y-4">
                 <div className="flex justify-between items-center bg-slate-50 p-4 rounded-[24px] border border-slate-100">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Protocol</span>
                    <button onClick={() => toggleAccountStatus(u.id)} className={`w-10 h-5 rounded-full relative transition-all ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${u.isActive ? 'right-1' : 'left-1'}`} />
                    </button>
                 </div>
                 
                 <div className="bg-slate-900 p-5 rounded-[24px] space-y-3">
                    <div className="flex justify-between items-center px-1">
                       <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Master Access Key</span>
                       <button onClick={() => togglePasswordVisibility(u.id)} className="text-[8px] font-black text-indigo-400 uppercase hover:underline">{visiblePasswords[u.id] ? 'Hide' : 'Show'}</button>
                    </div>
                    <div className="bg-white/5 px-4 py-2.5 rounded-xl flex items-center justify-center">
                       <span className="text-xs font-mono text-slate-300 font-bold tracking-widest">{visiblePasswords[u.id] ? u.password : '••••••••'}</span>
                    </div>
                 </div>

                 <button onClick={() => { onImpersonate(u); navigate('/dashboard'); }} className="w-full py-4 bg-white border-2 border-slate-100 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] hover:border-indigo-600 transition shadow-sm">Authorize Impersonation</button>
              </div>
            </div>
          </Motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-md" />
            <Motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-xl rounded-[56px] shadow-3xl overflow-hidden my-auto">
              <header className="p-12 border-b flex justify-between items-center bg-slate-50/50">
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">{editingUser ? 'Edit Personnel' : 'Recruit Staff'}</h3>
                <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-full bg-white text-slate-400 hover:text-red-500 transition shadow-sm border border-slate-100 flex items-center justify-center"><i className="fas fa-times"></i></button>
              </header>
              <form onSubmit={handleSubmit} className="p-12 space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Identity Name</label>
                  <input type="text" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-black text-slate-800" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Authorized Email Address</label>
                  <input type="email" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-black text-slate-800" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Organizational Role</label>
                    <select className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-black text-slate-600 appearance-none cursor-pointer" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}>
                      {Object.values(UserRole).map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Security Key</label>
                    <input type="text" placeholder="Auto-generated" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-mono font-black" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>
                </div>
                <footer className="pt-10 flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Discard</button>
                  <button type="submit" className="flex-[2] bg-indigo-600 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] transition-all active:scale-95">Commit Identity</button>
                </footer>
              </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;

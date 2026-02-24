
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

  // Hooks must be called before any conditional returns
  const filteredUsers = useMemo(() => {
    return roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);
  }, [users, roleFilter]);

  const canManagePersonnel = currentUser.role === UserRole.ADMIN;

  if (!canManagePersonnel) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-20 space-y-8">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl shadow-sm border border-red-100">
           <i className="fas fa-shield-slash"></i>
        </div>
        <h2 className="font-syne text-4xl font-black text-slate-800 uppercase italic">Access Denied</h2>
        <button onClick={() => navigate('/dashboard')} className="bg-slate-900 text-white px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-widest">Return Home</button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const avatarUrl = formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=f1f5f9&color=64748b`;
    
    let userToSync: User;
    if (editingUser) {
      userToSync = { ...editingUser, ...formData, avatar: avatarUrl };
      await supabaseService.syncUser(userToSync);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? userToSync : u));
    } else {
      userToSync = {
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        name: formData.name, email: formData.email, 
        password: formData.password || 'pass123',
        role: formData.role, isActive: formData.isActive, isApproved: formData.isApproved,
        avatar: avatarUrl, createdAt: new Date().toLocaleDateString()
      };
      await supabaseService.syncUser(userToSync);
      setUsers(prev => [...prev, userToSync]);
    }
    setShowModal(false);
    setEditingUser(null);
  };

  const deleteUser = async (id: string) => {
    if (id === currentUser.id) return alert("Cannot delete your own account.");
    if (window.confirm('Delete this user?')) {
      await supabaseService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-32">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 px-4">
        <div>
          <h1 className="font-syne text-5xl font-black text-slate-800 italic uppercase">Personnel.</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Team Management Terminal</p>
        </div>
        <div className="flex gap-4">
          <select 
            className="bg-white border border-slate-100 rounded-full px-8 py-4 text-[10px] font-black uppercase outline-none shadow-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
          >
            <option value="all">All Roles</option>
            <option value={UserRole.ADMIN}>Administrators</option>
            <option value={UserRole.AGENT}>Agents/Users</option>
          </select>
          <button onClick={() => { setEditingUser(null); setFormData({name:'', email:'', password:'', role:UserRole.AGENT, isActive:true, isApproved:true, avatar:''}); setShowModal(true); }} className="bg-slate-900 text-white px-10 py-4 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
            + New User
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {filteredUsers.map(u => (
          <Motion.div layout key={u.id} className="sq-card p-10 flex flex-col items-center text-center relative group">
            <img src={u.avatar} className="w-24 h-24 rounded-[40px] border-4 border-slate-50 mb-6 group-hover:scale-105 transition-all" />
            <div className="mb-6">
              <h4 className="font-syne text-2xl font-black text-slate-800 italic uppercase">{u.name}</h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">{u.email}</p>
            </div>
            <div className={`px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.2em] mb-10 ${u.role === UserRole.ADMIN ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
              {u.role === UserRole.ADMIN ? 'Administrator' : 'Agent'}
            </div>
            <div className="w-full space-y-3 pt-4 border-t border-slate-50">
               {u.id !== currentUser.id && (
                  <button onClick={() => { onImpersonate(u); navigate('/dashboard'); }} className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">
                    Enter Portal
                  </button>
               )}
               <div className="flex gap-2">
                  <button onClick={() => { setEditingUser(u); setFormData({...u, password: u.password || ''}); setShowModal(true); }} className="flex-1 py-3 bg-white border border-slate-100 text-slate-400 rounded-full text-[8px] font-black uppercase hover:text-indigo-600 hover:border-indigo-300">Edit</button>
                  <button onClick={() => deleteUser(u.id)} className="w-10 h-10 bg-white border border-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:text-red-500 hover:border-red-300"><i className="fas fa-trash-alt text-[10px]"></i></button>
               </div>
            </div>
          </Motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl" />
            <Motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-md rounded-[64px] shadow-3xl p-16 space-y-12">
                <h3 className="font-syne text-4xl font-black text-slate-800 italic uppercase text-center">{editingUser ? 'Update User' : 'Add User'}</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <input type="text" required placeholder="Full Name" className="w-full bg-slate-50 border-none rounded-full px-8 py-5 font-black outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input type="email" required placeholder="Email Address" className="w-full bg-slate-50 border-none rounded-full px-8 py-5 font-black outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  <select className="w-full bg-slate-50 border-none rounded-full px-8 py-5 font-black outline-none appearance-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    <option value={UserRole.ADMIN}>Administrator</option>
                    <option value={UserRole.AGENT}>Agent/User</option>
                  </select>
                  <input type="password" placeholder="Access Password" className="w-full bg-slate-50 border-none rounded-full px-8 py-5 font-black outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl">Sync Identity</button>
                </form>
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users;

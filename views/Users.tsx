
import React, { useState } from 'react';
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
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.ADMIN,
    isActive: true,
    isApproved: true,
    avatar: ''
  });

  if (currentUser.role !== UserRole.ADMIN) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-black text-slate-800">Access Denied</h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest mt-4">This section is restricted to Administrators.</p>
      </div>
    );
  }

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const toggleAccountStatus = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    
    if (userId === currentUser.id) {
        alert("Safety Protocol: Administrative lock prevented on own account.");
        return;
    }

    setIsSyncing(userId);
    const updated = { ...target, isActive: !target.isActive };
    
    // Cloud Sync first
    await supabaseService.syncUser(updated);
    
    // Update local state
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    setTimeout(() => setIsSyncing(null), 500);
  };

  const approveUser = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    
    setIsSyncing(userId);
    const updated = { ...target, isApproved: true };
    await supabaseService.syncUser(updated);
    setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    setTimeout(() => setIsSyncing(null), 500);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: UserRole.ADMIN, isActive: true, isApproved: true, avatar: '' });
    setEditingUser(null);
    setShowModal(false);
  };

  const openAdd = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: UserRole.ADMIN, isActive: true, isApproved: true, avatar: '' });
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setFormData({ name: u.name, email: u.email, password: u.password || '', role: u.role, isActive: u.isActive, isApproved: u.isApproved, avatar: u.avatar });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const avatarUrl = formData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random&color=fff`;
    
    let userToSync: User;
    if (editingUser) {
      userToSync = { ...editingUser, ...formData, role: UserRole.ADMIN, avatar: avatarUrl };
      await supabaseService.syncUser(userToSync);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? userToSync : u));
    } else {
      userToSync = {
        id: 'u_' + Math.random().toString(36).substr(2, 9),
        name: formData.name,
        email: formData.email,
        password: formData.password || 'gwapa' + Math.floor(Math.random() * 1000),
        role: UserRole.ADMIN,
        isActive: formData.isActive,
        isApproved: formData.isApproved,
        avatar: avatarUrl,
        createdAt: new Date().toLocaleDateString()
      };
      await supabaseService.syncUser(userToSync);
      setUsers(prev => [...prev, userToSync]);
    }
    
    resetForm();
  };

  const deleteUser = async (id: string) => {
    if (id === currentUser.id) {
      alert("You cannot terminate your own administrative access.");
      return;
    }
    if (window.confirm('Revoke access for this staff member?')) {
      await supabaseService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const enterPlatform = (u: User) => {
    if (!u.isActive) {
        alert("Authorization Failed: Selected account is currently suspended.");
        return;
    }
    if (!u.isApproved) {
        alert("Authorization Failed: Selected account is awaiting administrative approval.");
        return;
    }
    if (u.id === currentUser.id) {
        navigate('/dashboard');
        return;
    }
    onImpersonate(u);
    navigate('/dashboard');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter italic">Staff Management</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Personnel Ledger & Identity Control</p>
        </div>
        <button onClick={openAdd} className="bg-slate-900 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all">
          + Recruit Staff
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map(u => (
          <Motion.div 
            key={u.id}
            whileHover={{ y: -5 }}
            className={`bg-white p-10 rounded-[48px] border-2 shadow-xl shadow-slate-200/40 relative group overflow-hidden transition-all ${!u.isActive ? 'border-red-100 opacity-80' : !u.isApproved ? 'border-amber-100' : 'border-slate-100 hover:border-indigo-100'}`}
          >
            {isSyncing === u.id && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                   <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-[8px] font-black uppercase text-indigo-600 mt-4 tracking-widest">Persisting in Cloud...</span>
                </div>
            )}

            {!u.isActive ? (
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            ) : !u.isApproved ? (
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 animate-pulse"></div>
            ) : null}

            <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => openEdit(u)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center border shadow-sm transition"><i className="fas fa-edit text-xs"></i></button>
               <button onClick={() => deleteUser(u.id)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:text-red-500 flex items-center justify-center border shadow-sm transition"><i className="fas fa-trash-alt text-xs"></i></button>
            </div>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <img src={u.avatar} className={`w-24 h-24 rounded-[32px] border-4 border-white shadow-2xl transition-all ${!u.isActive || !u.isApproved ? 'grayscale scale-90 opacity-60' : ''}`} />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-[10px] bg-indigo-600 text-white">
                  <i className="fas fa-shield-alt"></i>
                </div>
              </div>
              
              <div>
                <h4 className="text-xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
                  {u.name}
                  {!u.isActive && <i className="fas fa-user-lock text-red-500 text-xs" title="Suspended"></i>}
                  {!u.isApproved && <i className="fas fa-clock text-amber-500 text-xs" title="Pending Approval"></i>}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{u.email}</p>
              </div>

              {/* Status Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Login</span>
                    <button 
                        onClick={() => toggleAccountStatus(u.id)}
                        className={`w-8 h-4 rounded-full relative transition-all ${u.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${u.isActive ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                </div>
                {!u.isApproved && (
                    <button 
                        onClick={() => approveUser(u.id)}
                        className="bg-amber-500 text-white px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.1em] hover:bg-emerald-600 transition-all shadow-md shadow-amber-200 hover:shadow-emerald-200"
                    >
                        Approve Access
                    </button>
                )}
                {u.isApproved && (
                   <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest">
                       Authorized Admin
                   </span>
                )}
              </div>

              {/* Security Credentials Section */}
              <div className="w-full bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-2">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Security Access Key</span>
                    <button 
                      onClick={() => togglePasswordVisibility(u.id)}
                      className="text-[9px] font-black text-indigo-500 uppercase hover:underline"
                    >
                      {visiblePasswords[u.id] ? 'Hide' : 'Reveal'}
                    </button>
                 </div>
                 <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-100 flex items-center gap-3">
                    <i className="fas fa-key text-[10px] text-slate-300"></i>
                    <span className={`text-[11px] font-mono font-black ${visiblePasswords[u.id] ? 'text-indigo-600' : 'text-slate-300'}`}>
                      {visiblePasswords[u.id] ? u.password : '••••••••••••'}
                    </span>
                 </div>
              </div>

              <div className="w-full">
                 <button 
                  onClick={() => enterPlatform(u)}
                  disabled={(!u.isActive || !u.isApproved) && u.id !== currentUser.id}
                  className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all ${(!u.isActive || !u.isApproved) ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-emerald-600'}`}
                 >
                   {currentUser.id === u.id ? 'Access Dashboard' : !u.isActive ? 'Account Restricted' : !u.isApproved ? 'Awaiting Approval' : 'Switch to Session'}
                 </button>
              </div>

              <div className="pt-6 border-t border-slate-50 w-full flex justify-between items-center">
                 <div className="text-left">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Access Role</p>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-indigo-600">Administrator</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Joined On</p>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{u.createdAt}</p>
                 </div>
              </div>
            </div>
          </Motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-y-auto no-scrollbar">
            <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetForm} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
            <Motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg rounded-[48px] shadow-3xl overflow-hidden my-auto">
              <header className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic">{editingUser ? 'Update Administrator' : 'Recruit New Administrator'}</h3>
                <button onClick={resetForm} className="w-10 h-10 rounded-full bg-white text-slate-400 hover:text-red-500 transition shadow-sm border border-slate-100 flex items-center justify-center"><i className="fas fa-times"></i></button>
              </header>
              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                  <input type="text" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-bold" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                  <input type="email" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-bold" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Security Access Key (Password)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required 
                      placeholder="Enter personnel password..."
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-mono font-black text-indigo-600" 
                      value={formData.password} 
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    />
                    <i className="fas fa-lock absolute right-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Initial Approval Status</label>
                    <select className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-indigo-500/10 transition font-black text-slate-600 cursor-pointer appearance-none" value={formData.isApproved ? 'approved' : 'pending'} onChange={(e) => setFormData({ ...formData, isApproved: e.target.value === 'approved' })}>
                      <option value="approved">Pre-Approved Administrator</option>
                      <option value="pending">Awaiting Operational Approval</option>
                    </select>
                  </div>
                </div>
                <footer className="pt-6 flex gap-3">
                  <button type="button" onClick={resetForm} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400">Abort</button>
                  <button type="submit" className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Confirm Identity</button>
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

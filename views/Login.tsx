
import React, { useState } from 'react';
import { User, SupportRequest, UserRole } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Motion = motion as any;

interface LoginProps {
  users: User[];
  setCurrentUser: (user: User) => void;
  onSendSupportRequest: (req: Omit<SupportRequest, 'id' | 'timestamp' | 'status'>) => void;
  onRegister: (userData: Omit<User, 'id' | 'avatar' | 'isActive' | 'isApproved' | 'createdAt'>) => void;
}

const Login: React.FC<LoginProps> = ({ users, setCurrentUser, onSendSupportRequest, onRegister }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suspendedUser, setSuspendedUser] = useState<User | null>(null);
  
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [supportSent, setSupportSent] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (user) {
        if (!user.isActive) {
          setSuspendedUser(user);
          setIsLoading(false);
        } else {
          // Allow both approved and unapproved users to enter. 
          // Restriction is handled globally in Layout.tsx
          setCurrentUser(user);
        }
      } else {
        setError('Invalid credentials. Please verify your identity.');
        setIsLoading(false);
      }
    }, 800);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password.length < 6) {
        setError('Security access key must be at least 6 characters.');
        setIsLoading(false);
        return;
    }

    setTimeout(() => {
        // Register the user (App.tsx sets isApproved to false)
        onRegister({
            name,
            email,
            password,
            role: UserRole.AGENT 
        });
        setIsLoading(false);
        
        // After registration, find the newly created user and log them in
        // In a real app, this would be the response from the server.
        const newUser: User = {
          id: 'temp_' + Math.random().toString(36).substr(2, 5),
          name,
          email,
          role: UserRole.AGENT,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
          isActive: true,
          isApproved: false,
          createdAt: new Date().toLocaleDateString()
        };
        setCurrentUser(newUser);
    }, 1000);
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendedUser) return;

    onSendSupportRequest({
      userId: suspendedUser.id,
      userName: suspendedUser.name,
      userEmail: suspendedUser.email,
      subject: supportForm.subject,
      message: supportForm.message
    });

    setSupportSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-inter text-slate-200">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
      </div>

      <AnimatePresence mode="wait">
        {!suspendedUser ? (
          <Motion.div 
            key={isRegisterMode ? "register-form" : "login-form"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: isRegisterMode ? 50 : -50 }}
            className="w-full max-w-md z-10"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[48px] shadow-2xl space-y-8">
              <header className="text-center space-y-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl shadow-indigo-500/20 mx-auto mb-6">
                  <i className={`fas ${isRegisterMode ? 'fa-user-plus' : 'fa-shield-halved'}`}></i>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tighter italic">Gwapashop<span className="text-indigo-500">.</span></h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    {isRegisterMode ? 'Initialize New Identity' : 'Operational Security Protocol'}
                </p>
              </header>

              <form onSubmit={isRegisterMode ? handleRegisterSubmit : handleLogin} className="space-y-6">
                <div className="space-y-4">
                  {isRegisterMode && (
                    <div className="relative group animate-in slide-in-from-top-2 duration-300">
                        <i className="fas fa-user-circle absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400"></i>
                        <input 
                        type="text" 
                        required
                        placeholder="Full Legal Name"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 outline-none text-white font-bold text-sm focus:border-indigo-500 focus:bg-white/10 transition-all"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                  )}

                  <div className="relative group">
                    <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400"></i>
                    <input 
                      type="email" 
                      required
                      placeholder="Personnel Email"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 outline-none text-white font-bold text-sm focus:border-indigo-500 focus:bg-white/10 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="relative group">
                    <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-indigo-400"></i>
                    <input 
                      type="password" 
                      required
                      placeholder="Security Access Key"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 outline-none text-white font-bold text-sm focus:border-indigo-500 focus:bg-white/10 transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <Motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-[10px] font-black text-red-400 uppercase tracking-widest text-center"
                  >
                    {error}
                  </Motion.p>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : isRegisterMode ? 'Deploy Identity' : 'Authorize Access'}
                </button>
              </form>

              <div className="text-center pt-2">
                 <button 
                    onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }}
                    className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                 >
                    {isRegisterMode ? 'Already have credentials? Login' : 'Need authorization? Join the Force'}
                 </button>
              </div>

              <footer className="pt-4 border-t border-white/5">
                <div className="flex justify-between items-center text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Standard Protocol v4.2</span>
                  <span>Nexus Secure</span>
                </div>
              </footer>
            </div>
          </Motion.div>
        ) : (
          <Motion.div 
            key="suspended-ui"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg z-10"
          >
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-12 rounded-[56px] shadow-3xl space-y-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <i className="fas fa-ban text-8xl -rotate-12"></i>
               </div>
               
               <header className="text-center space-y-4">
                  <div className="w-20 h-20 bg-red-500/20 rounded-[28px] border-2 border-red-500/30 flex items-center justify-center text-red-500 text-3xl mx-auto mb-6">
                    <i className="fas fa-user-lock"></i>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">Account Suspended</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Access to the Gwapashop infrastructure for <span className="text-white underline">{suspendedUser.name}</span> has been restricted.
                  </p>
               </header>

               {supportSent ? (
                 <Motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[32px] text-center space-y-4"
                 >
                    <i className="fas fa-check-circle text-emerald-400 text-4xl"></i>
                    <div>
                       <h4 className="text-lg font-black text-emerald-400 tracking-tight">Transmission Successful</h4>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Our security team will review your request shortly.</p>
                    </div>
                    <button 
                      onClick={() => { setSuspendedUser(null); setSupportSent(false); }}
                      className="text-[10px] font-black uppercase text-white/40 hover:text-white transition pt-4"
                    >
                      Return to Login
                    </button>
                 </Motion.div>
               ) : (
                 <div className="space-y-8">
                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">Contact Support Unit</h3>
                       <form onSubmit={handleSendSupport} className="space-y-4">
                          <input 
                            type="text" required
                            placeholder="Subject (e.g. Access Restoration)"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none text-white font-bold text-sm focus:border-indigo-500 focus:bg-white/10 transition-all"
                            value={supportForm.subject}
                            onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                          />
                          <textarea 
                            required
                            placeholder="Describe your query..."
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-4 outline-none text-white font-medium text-sm focus:border-indigo-500 focus:bg-white/10 transition-all resize-none"
                            value={supportForm.message}
                            onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                          />
                          <button 
                            type="submit"
                            className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-slate-100 transition-all active:scale-95"
                          >
                            Send Transmission
                          </button>
                       </form>
                    </div>
                    
                    <button 
                      onClick={() => setSuspendedUser(null)}
                      className="w-full text-[9px] font-black uppercase text-slate-500 hover:text-slate-300 transition tracking-[0.2em]"
                    >
                      Return to Terminal Login
                    </button>
                 </div>
               )}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;

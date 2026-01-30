
import React, { useState, useEffect } from 'react';
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
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suspendedUser, setSuspendedUser] = useState<User | null>(null);
  
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [supportSent, setSupportSent] = useState(false);

  // Parallax / Scroll effect logic
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          setCurrentUser(user);
        }
      } else {
        setError('Invalid credentials. Access Denied.');
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
        onRegister({ name, email, password, role: UserRole.AGENT });
        setIsLoading(false);
        const newUser: User = {
          id: 'temp_' + Math.random().toString(36).substr(2, 5),
          name, email, role: UserRole.AGENT,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
          isActive: true, isApproved: false,
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

  const FeatureCard = ({ icon, title, desc }: { icon: string, title: string, desc: string }) => (
    <Motion.div 
      whileHover={{ y: -10 }}
      className="bg-white/5 border border-white/10 p-10 rounded-[48px] backdrop-blur-sm group hover:border-emerald-500/50 transition-all"
    >
      <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 text-2xl mb-8 group-hover:scale-110 transition-transform">
        <i className={`fas ${icon}`}></i>
      </div>
      <h4 className="text-xl font-black text-white mb-4 tracking-tight uppercase italic">{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed font-medium">{desc}</p>
    </Motion.div>
  );

  return (
    <div className="min-h-screen bg-slate-950 font-inter text-slate-200 overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,_rgba(16,185,129,0.08)_0%,_transparent_50%)]"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,_rgba(99,102,241,0.08)_0%,_transparent_50%)]"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      </div>

      {/* Header */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 px-8 py-6 ${scrollY > 50 ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 py-4' : ''}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <i className="fas fa-rocket text-sm"></i>
            </div>
            <span className="text-2xl font-black tracking-tighter text-white uppercase italic">Gwapashop<span className="text-emerald-500">.</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            <a href="#features" className="hover:text-emerald-400 transition">Infrastructure</a>
            <a href="#solutions" className="hover:text-emerald-400 transition">Global Solutions</a>
            <a href="#enterprise" className="hover:text-emerald-400 transition">Enterprise</a>
          </div>

          <button 
            onClick={() => { setIsRegisterMode(false); setIsAuthOpen(true); }}
            className="px-8 py-3 bg-white text-slate-950 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
          >
            Authorize Access
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-60 pb-40 px-8 flex flex-col items-center justify-center text-center z-10 overflow-hidden">
        <Motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl space-y-10"
        >
          <div className="inline-block px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Next-Generation Commerce Protocol</span>
          </div>
          <h1 className="text-6xl md:text-[8rem] font-black text-white leading-[0.85] tracking-tighter uppercase italic">
            The Future <br /> of <span className="text-emerald-500">Scale.</span>
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed opacity-80">
            Enterprise-grade infrastructure for serious merchants. Meticulously designed for high-performance order management, multi-store architecture, and real-time cloud sync.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-10">
            <button 
              onClick={() => { setIsRegisterMode(true); setIsAuthOpen(true); }}
              className="group relative px-12 py-6 bg-emerald-600 text-white rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20 overflow-hidden transition-transform hover:scale-105"
            >
              <span className="relative z-10">Join the Force</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            <button 
              onClick={() => { setIsRegisterMode(false); setIsAuthOpen(true); }}
              className="px-12 py-6 bg-white/5 border border-white/10 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all"
            >
              Partner Portal
            </button>
          </div>
        </Motion.div>

        {/* Global Performance Bar */}
        <Motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-40 w-full max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-12 border-y border-white/5 py-12"
        >
          {[
            { label: 'Real-time Syncs', val: '2.4M+' },
            { label: 'Active Storefronts', val: '1,840' },
            { label: 'Global Uptime', val: '99.99%' },
            { label: 'Cloud Infrastructure', val: 'Tier-4' }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-black text-white tracking-tighter italic">{stat.val}</div>
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{stat.label}</div>
            </div>
          ))}
        </Motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-40 px-8 relative z-10 max-w-7xl mx-auto">
        <header className="mb-24 text-center space-y-4">
           <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Engineered for Performance.</h2>
           <p className="text-slate-500 uppercase text-[10px] font-black tracking-[0.4em]">Core Infrastructure Components</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon="fa-layer-group" 
            title="Multi-Store Studio" 
            desc="Design and deploy unlimited niche storefronts from a single command center. Custom section builders with raw asset optimization."
          />
          <FeatureCard 
            icon="fa-cloud-arrow-up" 
            title="Supabase Cloud" 
            desc="Instant synchronization with enterprise databases. Every lead, every detail, secured in real-time with high-fidelity architecture."
          />
          <FeatureCard 
            icon="fa-brain" 
            title="Nexus Intelligence" 
            desc="AI-powered product narrative generation and deep strategic business analysis using the Gemini 3.0 reasoning engine."
          />
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-20 border-t border-white/5 bg-slate-950/50 relative z-10 text-center">
         <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">
            &copy; 2024 Gwapashop Enterprise &middot; Distributed Authority Protocol
         </div>
      </footer>

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {isAuthOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-hidden">
            <Motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isLoading && setIsAuthOpen(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
            />
            
            <Motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white/5 border border-white/10 rounded-[56px] shadow-3xl p-12 overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px]"></div>

              <AnimatePresence mode="wait">
                {!suspendedUser ? (
                  <Motion.div 
                    key={isRegisterMode ? "register" : "login"}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >
                    <header className="text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-xl shadow-emerald-500/20 mx-auto mb-6">
                        <i className={`fas ${isRegisterMode ? 'fa-user-plus' : 'fa-shield-halved'}`}></i>
                      </div>
                      <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
                        {isRegisterMode ? 'Deploy Identity' : 'Authorize Access'}
                      </h2>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                        {isRegisterMode ? 'New Personnel Registration' : 'Standard Security Protocol'}
                      </p>
                    </header>

                    <form onSubmit={isRegisterMode ? handleRegisterSubmit : handleLogin} className="space-y-6">
                      <div className="space-y-4">
                        {isRegisterMode && (
                          <div className="relative group">
                            <i className="fas fa-user-circle absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400"></i>
                            <input 
                              type="text" required placeholder="Full Name"
                              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 outline-none text-white font-bold text-sm focus:border-emerald-500 transition-all"
                              value={name} onChange={(e) => setName(e.target.value)}
                            />
                          </div>
                        )}
                        <div className="relative group">
                          <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400"></i>
                          <input 
                            type="email" required placeholder="Authorized Email"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 outline-none text-white font-bold text-sm focus:border-emerald-500 transition-all"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="relative group">
                          <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400"></i>
                          <input 
                            type="password" required placeholder="Access Key"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 outline-none text-white font-bold text-sm focus:border-emerald-500 transition-all"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      {error && <p className="text-[9px] font-black text-red-400 uppercase tracking-widest text-center">{error}</p>}

                      <button 
                        type="submit" disabled={isLoading}
                        className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-emerald-500 transition-all disabled:opacity-50"
                      >
                        {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : isRegisterMode ? 'Initialize' : 'Authorize'}
                      </button>
                    </form>

                    <div className="text-center pt-2">
                       <button 
                          onClick={() => { setIsRegisterMode(!isRegisterMode); setError(''); }}
                          className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                       >
                          {isRegisterMode ? 'Already registered? Login' : 'Need clearance? Join the Fleet'}
                       </button>
                    </div>
                  </Motion.div>
                ) : (
                  <Motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="space-y-10"
                  >
                    <header className="text-center space-y-4">
                      <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-500 text-3xl mx-auto">
                        <i className="fas fa-ban"></i>
                      </div>
                      <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Access Restricted</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity Hub Suspension Active</p>
                    </header>

                    {supportSent ? (
                      <div className="text-center space-y-6">
                        <i className="fas fa-check-circle text-emerald-400 text-5xl"></i>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed uppercase">Transmission received. Our security team will validate your request within the next cycle.</p>
                        <button onClick={() => setIsAuthOpen(false)} className="px-10 py-4 bg-white/5 border border-white/10 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest">Close Portal</button>
                      </div>
                    ) : (
                      <form onSubmit={handleSendSupport} className="space-y-4">
                        <input 
                          type="text" required placeholder="Subject"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-3 text-white text-xs outline-none focus:border-emerald-500 transition"
                          value={supportForm.subject} onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                        />
                        <textarea 
                          required placeholder="Reason for Access Restoration..."
                          rows={4} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-xs outline-none focus:border-emerald-500 transition resize-none"
                          value={supportForm.message} onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                        />
                        <button type="submit" className="w-full bg-white text-slate-950 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Send Transmission</button>
                        <button type="button" onClick={() => setSuspendedUser(null)} className="w-full text-slate-500 font-black uppercase text-[9px] hover:text-white transition">Return to Login</button>
                      </form>
                    )}
                  </Motion.div>
                )}
              </AnimatePresence>

              {/* Close Button */}
              {!isLoading && (
                <button 
                  onClick={() => setIsAuthOpen(false)}
                  className="absolute top-8 right-8 text-slate-600 hover:text-white transition"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </Motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Login;

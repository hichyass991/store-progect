
import React from 'react';
import { useNavigate } from 'react-router-dom';

const GoogleSetupGuide: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      title: "1. Google Cloud Project",
      content: "Dkhol l-Google Cloud Console (console.cloud.google.com). Kriyé Project jdid smito 'Gwapashop Sync'.",
      action: "Ouvrir Cloud Console",
      link: "https://console.cloud.google.com/",
      img: "https://placehold.co/600x300/e2e8f0/64748b?text=Step+1:+Create+Project"
    },
    {
      title: "2. Activer l-API",
      content: "F'l-menu 'APIs & Services' > 'Library'. Srchi 3la 'Google Sheets API' o dir 'Enable'. Men b3d, dir l-nefs l-khidma l-'Google Drive API'.",
      img: "https://placehold.co/600x300/e2e8f0/64748b?text=Step+2:+Enable+Sheets+API"
    },
    {
      title: "3. OAuth Consent Screen",
      content: "Mchi l-'OAuth consent screen'. Khtar 'External'. 3mmr l-App Name (Gwapashop) o l-Email dyalk. F'l-marhala dyal 'Scopes', khass t-zid had l-permission: '.../auth/spreadsheets'.",
      img: "https://placehold.co/600x300/e2e8f0/64748b?text=Step+3:+OAuth+Consent"
    },
    {
      title: "4. Kriyé Credentials",
      content: "Mchi l-'Credentials' > 'Create Credentials' > 'OAuth client ID'. Khtar 'Web application'.",
      img: "https://placehold.co/600x300/e2e8f0/64748b?text=Step+4:+Create+Credentials"
    }
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-center border-b pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">Guide d'intégration Google Sheets</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 italic">Connectez votre catalogue au Cloud Google</p>
        </div>
        <button onClick={() => navigate('/sheets')} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition border shadow-sm">
          <i className="fas fa-times"></i>
        </button>
      </header>

      <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-2xl">
        <div className="flex gap-4">
          <i className="fas fa-info-circle text-amber-500 text-xl"></i>
          <div>
            <h4 className="font-black text-amber-800 text-sm uppercase tracking-widest">Wajib Qira'atuhu</h4>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">Had l-intégration ghadi t-khlik t-sync l-orders dyalk nichan l'wahed l-sheet. Khssk t-tab3 had l-khoutowat b'diqqa bach l-khidma t-khdm lik.</p>
          </div>
        </div>
      </div>

      <div className="space-y-16">
        {steps.map((step, idx) => (
          <div key={idx} className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">{idx + 1}</span>
              <h3 className="text-2xl font-black text-slate-800">{step.title}</h3>
            </div>
            <p className="text-slate-600 font-medium leading-loose pl-14">{step.content}</p>
            <div className="pl-14">
               <img src={step.img} alt={step.title} className="rounded-3xl border-4 border-slate-50 shadow-xl w-full" />
            </div>
            {step.link && (
              <div className="pl-14">
                <a href={step.link} target="_blank" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 transition">{step.action}</a>
              </div>
            )}
          </div>
        ))}

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">5</span>
            <h3 className="text-2xl font-black text-slate-800">Authorized Redirect URI</h3>
          </div>
          <div className="pl-14 space-y-4">
            <p className="text-slate-600 font-medium">F'had l-marhala, khssk t-copier had l-link o t-hotto f'blasst <strong>'Authorized redirect URIs'</strong> f'Google Console:</p>
            <div className="bg-slate-900 p-6 rounded-2xl flex justify-between items-center group">
              <code className="text-emerald-400 font-mono text-sm truncate">https://gwapashop.pro/api/auth/google/callback</code>
              <button 
                onClick={() => {navigator.clipboard.writeText("https://gwapashop.pro/api/auth/google/callback"); alert("Copied!")}}
                className="text-white/40 group-hover:text-white transition"
              >
                <i className="far fa-copy text-lg"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-12 border-t">
          <div className="flex items-center gap-4">
            <span className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">6</span>
            <h3 className="text-2xl font-black text-slate-800">Configuration Finale</h3>
          </div>
          <div className="pl-14 space-y-6">
            <p className="text-slate-600 font-medium">Daba khoud l-<strong>'Client ID'</strong> o l-<strong>'Client Secret'</strong> li 3tak Google o hothom f'blasst l-Paramètres (Settings):</p>
            <button 
              onClick={() => navigate('/settings')}
              className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition"
            >
              Aller aux Paramètres
            </button>
          </div>
        </div>
      </div>

      <footer className="pt-20 text-center">
        <button 
          onClick={() => navigate('/sheets')}
          className="bg-slate-900 text-white px-20 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-slate-200 hover:scale-105 transition"
        >
          Safi, fhamt l-khalas
        </button>
      </footer>
    </div>
  );
};

export default GoogleSetupGuide;

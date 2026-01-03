
import React, { useState, useEffect } from 'react';
import { userService } from '../services/supabase';
import { User } from '../types';
import { Loader2, AlertCircle, ShieldCheck, Cpu, Fingerprint } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await userService.ensureMasterUser();
      const user = await userService.login(email, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('ACESSO NEGADO: CREDENCIAIS INVÁLIDAS');
      }
    } catch (err: any) {
      setError(`ERRO DE SISTEMA: ${err.message || 'FALHA NA REDE'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-emerald-500/30">
      
      {/* BACKGROUND FUTURISTA COM ORBES EM MOVIMENTO */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-600/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* GRID LINES (Efeito de HUD) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="w-full max-w-[380px] relative z-10">
        {/* CARD DE LOGIN HOLOGRÁFICO */}
        <div className="bg-slate-950/40 backdrop-blur-3xl border border-white/10 p-8 lg:p-10 rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] space-y-8 relative overflow-hidden group">
          
          {/* DETALHE DE CANTO TECNOLÓGICO */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-transparent opacity-50 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-[2px] h-10 bg-emerald-500/50"></div>
          <div className="absolute top-0 right-0 w-10 h-[2px] bg-emerald-500/50"></div>

          <div className="flex flex-col items-center text-center animate-fade-in">
            <div className="mb-4 p-3 rounded-full bg-emerald-500/5 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
               <Cpu size={28} className="text-emerald-500" />
            </div>

            <h1 className="text-3xl font-black italic tracking-tighter flex items-baseline drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              <span className="text-white">BIOMETANO</span>
              <span className="text-[#f97316] ml-2 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">Caieiras</span>
            </h1>
            
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center gap-3">
                 <div className="h-[1px] w-5 bg-emerald-500/30"></div>
                 <span className="text-[9px] font-black uppercase tracking-[0.5em] text-emerald-400">
                   SISTEMA CENTRAL GUT
                 </span>
                 <div className="h-[1px] w-5 bg-emerald-500/30"></div>
              </div>
              <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-slate-500 mt-2">
                PLATAFORMA DE GESTÃO PREDITIVA
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-3 text-[8px] font-black uppercase tracking-widest animate-pulse">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5 group">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2 group-focus-within:text-emerald-500 transition-colors">
                <ShieldCheck size={12} /> TERMINAL DE IDENTIFICAÇÃO
              </label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 px-5 text-white text-sm font-bold outline-none focus:bg-white/10 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-600 shadow-inner" 
                placeholder="Email corporativo"
              />
            </div>

            <div className="space-y-1.5 group">
              <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2 group-focus-within:text-orange-500 transition-colors">
                <Fingerprint size={12} /> CHAVE DE SEGURANÇA
              </label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl py-3.5 px-5 text-white text-sm font-bold outline-none focus:bg-white/10 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-600 shadow-inner" 
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 bg-[size:200%_auto] hover:bg-right text-white rounded-xl font-black uppercase text-[10px] tracking-[0.25em] transition-all shadow-xl shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-6"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'INICIAR PROTOCOLO'}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
           <div className="flex items-center justify-center gap-3 opacity-30">
              <div className="h-[1px] w-6 bg-slate-700"></div>
              <p className="text-[9px] text-white font-black uppercase tracking-[0.4em]">
                ACCESSO RESTRITO • BIOMETANO CAIEIRAS
              </p>
              <div className="h-[1px] w-6 bg-slate-700"></div>
           </div>
           <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.3em] opacity-30">
             © 2026 Desenvolvido por 6580005
           </p>
        </div>
      </div>
    </div>
  );
};
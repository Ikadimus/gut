
import React, { useState } from 'react';
import { userService } from '../services/supabase';
import { User } from '../types';
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatErrorMessage = (err: any): string => {
    if (!err) return "Erro desconhecido";
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Garante que o usuário master exista
      await userService.ensureMasterUser();
      
      const user = await userService.login(email, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Credenciais inválidas. Verifique e-mail e senha.');
      }
    } catch (err: any) {
      console.error("Erro de Autenticação Detalhado:", err);
      const msg = formatErrorMessage(err);
      
      if (msg.includes("relation \"users\" does not exist")) {
        setError('Infraestrutura ausente: A tabela "users" não foi encontrada. Execute o script SQL no seu painel Supabase.');
      } else if (msg.includes("failed to fetch")) {
        setError('Falha de Rede: Não foi possível conectar ao servidor. Verifique sua conexão ou se a URL do Supabase está correta.');
      } else {
        setError(`Erro: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center border border-green-500/20 shadow-lg shadow-green-500/10 mb-6">
            <ShieldCheck size={40} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter">
            BIOMETANO <span className="text-orange-500">Caieiras</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mt-2">Security Access Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-2xl space-y-6 ring-1 ring-white/5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3 text-xs font-bold animate-shake">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Corporate Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-green-500 transition-all" 
                placeholder="nome@essencisbiometano.com.br"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-green-500 transition-all" 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-green-900/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Autenticar Sistema'}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-600 font-bold uppercase mt-8 tracking-widest">
          Authorized Personnel Only • IP Logged
        </p>
      </div>
    </div>
  );
};

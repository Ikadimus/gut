
import React from 'react';
import { User, GUTIssue } from '../types';
import { Wrench, Zap, Droplets, FlaskConical, Radio, ClipboardCheck, Activity, HardDrive, Construction, AlertCircle } from 'lucide-react';

interface SectorPortalProps {
  sectorId: string;
  issues: GUTIssue[];
  currentUser: User;
  onNavigate?: (target: string) => void;
}

interface SectorConfig {
  name: string;
  icon: any;
  color: string;
}

const SECTOR_CONFIGS: Record<string, SectorConfig> = {
  'mecanica': { name: 'Mecânica Operacional', icon: Wrench, color: 'blue' },
  'eletrica': { name: 'Elétrica e Potência', icon: Zap, color: 'yellow' },
  'instrumentacao': { name: 'Instrumentação e Controle', icon: Radio, color: 'purple' },
  'operacao': { name: 'Operação de Processos', icon: ClipboardCheck, color: 'emerald' },
  'quimica': { name: 'Processos Químicos', icon: FlaskConical, color: 'pink' },
  'lubrificacao': { name: 'Tribologia e Lubrificação', icon: Droplets, color: 'cyan' },
  'preditiva': { name: 'Engenharia Preditiva', icon: Activity, color: 'orange' }
};

export const SectorPortal: React.FC<SectorPortalProps> = ({ sectorId, currentUser }) => {
  const config = SECTOR_CONFIGS[sectorId] || { name: 'Setor Operacional', icon: HardDrive, color: 'slate' };
  const Icon = config.icon;

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
           <div className={`p-4 bg-${config.color}-500/10 rounded-3xl border border-${config.color}-500/20 text-${config.color}-500 shadow-xl`}>
              <Icon size={28} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                Painel Setorial: {config.name}
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Módulo em Desenvolvimento</p>
           </div>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
           <div className="text-right">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Usuário Logado</p>
              <p className="text-xs font-black text-white uppercase">{currentUser.name}</p>
           </div>
           <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-white text-xs uppercase">
              {currentUser.name.charAt(0)}
           </div>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-16 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>
         
         <div className="relative z-10 space-y-6">
            <div className="w-24 h-24 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center mx-auto text-orange-500 animate-pulse">
               <Construction size={48} />
            </div>
            
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Módulo em Manutenção ou Construção</h3>
               <p className="text-sm text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                  As ferramentas específicas para o setor de <span className={`text-${config.color}-500 font-bold uppercase`}>{config.name}</span> estão sendo migradas para a nova infraestrutura BIOHUB.
               </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
               <div className="px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700 flex items-center gap-2">
                  <AlertCircle size={14} className="text-orange-500" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Previsão: Q3 2026</span>
               </div>
            </div>
         </div>

         {/* Detalhes de Background */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full"></div>
      </div>
    </div>
  );
};

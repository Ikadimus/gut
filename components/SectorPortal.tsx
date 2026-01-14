
import React from 'react';
import { User, GUTIssue, Status } from '../types';
import { Wrench, Zap, Droplets, FlaskConical, Radio, ClipboardCheck, Activity, HardDrive, Construction, AlertCircle, Info, Plus } from 'lucide-react';
import { GUTTable } from './GUTTable';

interface SectorPortalProps {
  sectorId: string;
  issues: GUTIssue[];
  currentUser: User;
  onNavigate?: (target: string) => void;
  onStatusChange: (id: string, newStatus: Status) => void;
  onEdit: (id: string) => void;
  onDetails: (id: string) => void;
}

interface SectorConfig {
  name: string;
  id: string;
  icon: any;
  color: string;
  tags: string[];
}

const SECTOR_CONFIGS: Record<string, SectorConfig> = {
  'mecanica-lub': { 
    name: 'Mecânica e Lubrificação', 
    id: 'Mecanica e lub',
    icon: Wrench, 
    color: 'blue',
    tags: ['Mecânica', 'Lubrificação', 'Vibração']
  },
  'eletrica-instr': { 
    name: 'Elétrica e Instrumentação', 
    id: 'eletrica e instrumentação',
    icon: Zap, 
    color: 'yellow',
    tags: ['Elétrica', 'Painéis', 'Instrumentação', 'PLC']
  },
  'operacao': { 
    name: 'Operação', 
    id: 'operação',
    icon: ClipboardCheck, 
    color: 'emerald',
    tags: ['Processo', 'Parâmetros', 'Turno']
  },
  'quimica': { 
    name: 'Química', 
    id: 'quimica',
    icon: FlaskConical, 
    color: 'pink',
    tags: ['Análise Lab', 'Aditivos', 'H2S Removal']
  }
};

export const SectorPortal: React.FC<SectorPortalProps> = ({ 
  sectorId, 
  issues, 
  currentUser, 
  onStatusChange, 
  onEdit, 
  onDetails 
}) => {
  const config = SECTOR_CONFIGS[sectorId];

  if (!config) return (
    <div className="py-20 text-center">
      <p className="text-slate-500 font-black uppercase text-xs">Setor não configurado.</p>
    </div>
  );

  const filteredIssues = issues.filter(issue => issue.sector === config.id);
  const Icon = config.icon;

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
           <div className={`p-4 bg-${config.color}-500/10 rounded-3xl border border-${config.color}-500/20 text-${config.color}-500 shadow-xl`}>
              <Icon size={28} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                Painel Setorial: {config.name}
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Ocorrências atribuídas à sua especialidade</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className={`bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-xl border-l-4 border-l-${config.color}-500`}>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pendências do Setor</p>
            <h4 className="text-3xl font-black text-white">{filteredIssues.filter(i => i.status !== Status.RESOLVED).length}</h4>
         </div>
         <div className={`bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-xl border-l-4 border-l-red-500`}>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Alertas Críticos</p>
            <h4 className="text-3xl font-black text-white">{filteredIssues.filter(i => i.score >= 81 && i.status !== Status.RESOLVED).length}</h4>
         </div>
         <div className={`bg-slate-900/40 p-6 rounded-3xl border border-slate-800 shadow-xl border-l-4 border-l-green-500`}>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Resolvidos (Total)</p>
            <h4 className="text-3xl font-black text-white">{filteredIssues.filter(i => i.status === Status.RESOLVED).length}</h4>
         </div>
      </div>

      <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
         <Info size={16} className={`text-${config.color}-500`} />
         <p className="text-[10px] text-slate-400 font-medium">
            Você está visualizando apenas os problemas registrados para <strong>{config.name}</strong>. Para ver a planta completa, acesse a aba "Matriz GUT".
         </p>
      </div>

      <GUTTable 
        issues={filteredIssues} 
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDetails={onDetails}
      />
    </div>
  );
};

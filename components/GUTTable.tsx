
import React from 'react';
import { GUTIssue, Status } from '../types';
import { CheckCircle2, ListFilter, Eye, Edit2, Info, Plus, AlertCircle, Zap, Cpu, Briefcase } from 'lucide-react';

interface GUTTableProps {
  issues: GUTIssue[];
  onStatusChange: (id: string, newStatus: Status) => void;
  onEdit?: (id: string) => void;
  onDetails?: (id: string) => void;
  onAdd?: () => void;
}

export const GUTTable: React.FC<GUTTableProps> = ({ issues, onStatusChange, onEdit, onDetails, onAdd }) => {
  const sortedIssues = [...issues].sort((a, b) => b.score - a.score);

  const getScoreBadge = (score: number) => {
    if (score >= 81) return 'bg-red-500/10 text-red-500 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]';
    if (score >= 36) return 'bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]';
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.OPEN: return 'text-red-400 bg-red-950/40 border-red-900/50';
      case Status.IN_PROGRESS: return 'text-blue-400 bg-blue-950/40 border-blue-900/50';
      case Status.RESOLVED: return 'text-emerald-400 bg-emerald-950/40 border-emerald-900/50';
      default: return 'text-slate-400 bg-slate-900/60 border-slate-800';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-orange-500/10 rounded-3xl border border-orange-500/20 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.15)] animate-pulse">
              <ListFilter size={28} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
                Matriz de Priorização GUT
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Gestão de Riscos e Impacto Operacional</p>
           </div>
        </div>

        {onAdd && (
          <button 
            onClick={onAdd}
            className="bg-orange-600 hover:bg-orange-500 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(249,115,22,0.2)] hover:shadow-[0_0_40px_rgba(249,115,22,0.35)] flex items-center gap-3 transition-all active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            Novo Evento
          </button>
        )}
      </div>

      <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-500 uppercase text-[9px] font-black tracking-[0.3em] border-b border-white/5">
                <th className="px-8 py-6">Score</th>
                <th className="px-8 py-6">Evento Crítico / Ativo / Setor</th>
                <th className="px-8 py-6 text-center">G</th>
                <th className="px-8 py-6 text-center">U</th>
                <th className="px-8 py-6 text-center">T</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-center">Protocolos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sortedIssues.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                       <Zap size={32} />
                       <p className="text-[10px] font-black uppercase tracking-widest italic">Nenhuma ocorrência interceptada pelo sistema.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-white/[0.03] transition-all group border-b border-transparent hover:border-white/5">
                    <td className="px-8 py-6">
                      <div className={`w-14 h-14 flex flex-col items-center justify-center rounded-2xl border-2 font-black italic text-xl ${getScoreBadge(issue.score)}`}>
                        {issue.score.toString().padStart(2, '0')}
                        <span className="text-[7px] font-black uppercase tracking-widest -mt-1 opacity-60">PTS</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="max-w-md">
                        <h4 className="font-black text-slate-100 uppercase text-xs tracking-tight group-hover:text-white transition-colors">
                          {issue.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1">
                             <AlertCircle size={10} className="text-orange-500" /> {issue.area}
                           </span>
                           {issue.sector && (
                              <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1 bg-emerald-900/10 px-2 py-0.5 rounded border border-emerald-900/30">
                                <Briefcase size={10}/> {issue.sector}
                              </span>
                           )}
                           {issue.equipmentName && (
                              <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest flex items-center gap-1 bg-blue-900/10 px-2 py-0.5 rounded border border-blue-900/30">
                                <Cpu size={10}/> {issue.equipmentName}
                              </span>
                           )}
                           {issue.aiSuggestion && (
                              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[8px] font-black uppercase rounded border border-purple-500/20 flex items-center gap-1">
                                <CheckCircle2 size={8} /> IA Core Sync
                              </span>
                           )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center text-sm font-black text-slate-400 font-mono group-hover:text-blue-400 transition-colors">{issue.gravity}</td>
                    <td className="px-8 py-6 text-center text-sm font-black text-slate-400 font-mono group-hover:text-orange-400 transition-colors">{issue.urgency}</td>
                    <td className="px-8 py-6 text-center text-sm font-black text-slate-400 font-mono group-hover:text-red-400 transition-colors">{issue.tendency}</td>
                    <td className="px-8 py-6">
                      <select
                        value={issue.status}
                        onChange={(e) => onStatusChange(issue.id, e.target.value as Status)}
                        className={`text-[9px] font-black uppercase rounded-xl px-4 py-2 outline-none border transition-all cursor-pointer shadow-inner ${getStatusColor(issue.status)}`}
                      >
                        {Object.values(Status).map(s => (
                          <option key={s} value={s} className="bg-slate-900 text-white">{s.toUpperCase()}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => onDetails?.(issue.id)}
                          className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all shadow-lg active:scale-90"
                          title="Detalhes Profundos"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => onEdit?.(issue.id)}
                          className="p-3 bg-white/5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 rounded-xl border border-white/5 hover:border-emerald-500/20 transition-all shadow-lg active:scale-90"
                          title="Editar Registro"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-slate-950/60 px-8 py-4 border-t border-white/5 flex justify-between items-center relative z-10">
           <div className="flex gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Crítico</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Alerta</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nominal</span>
              </div>
           </div>
           <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
             SISTEMA DE FILTRAGEM ATIVO • {issues.length} REGISTROS
           </span>
        </div>
      </div>
    </div>
  );
};

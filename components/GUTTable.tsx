import React from 'react';
import { GUTIssue, Status } from '../types';
import { CheckCircle2, Filter, Eye, Edit2 } from 'lucide-react';

interface GUTTableProps {
  issues: GUTIssue[];
  onStatusChange: (id: string, newStatus: Status) => void;
  onEdit?: (id: string) => void;
  onDetails?: (id: string) => void;
}

export const GUTTable: React.FC<GUTTableProps> = ({ issues, onStatusChange, onEdit, onDetails }) => {
  const sortedIssues = [...issues].sort((a, b) => b.score - a.score);

  const getScoreBadge = (score: number) => {
    if (score >= 81) return 'bg-red-900/40 text-red-200 border-red-800 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    if (score >= 36) return 'bg-orange-900/40 text-orange-200 border-orange-800 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    return 'bg-green-900/40 text-green-200 border-green-800 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.OPEN: return 'text-red-400 bg-red-900/30 border border-red-900/50';
      case Status.IN_PROGRESS: return 'text-blue-400 bg-blue-900/30 border border-blue-900/50';
      case Status.RESOLVED: return 'text-green-400 bg-green-900/30 border border-green-900/50';
      default: return 'text-slate-400 bg-slate-800 border border-slate-700';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
        <h3 className="font-semibold text-slate-100 flex items-center gap-2 uppercase text-xs tracking-widest">
            <Filter size={16} className="text-green-500" /> Matriz de Priorização
        </h3>
        <span className="text-[10px] bg-slate-900 px-2 py-1 rounded border border-slate-700 text-slate-500 font-bold uppercase tracking-tighter">
            {issues.length} registros ativos
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="px-6 py-4 border-b border-slate-800">Score</th>
              <th className="px-6 py-4 border-b border-slate-800">Problema / Área</th>
              <th className="px-6 py-4 text-center border-b border-slate-800">G</th>
              <th className="px-6 py-4 text-center border-b border-slate-800">U</th>
              <th className="px-6 py-4 text-center border-b border-slate-800">T</th>
              <th className="px-6 py-4 border-b border-slate-800">Status</th>
              <th className="px-6 py-4 text-center border-b border-slate-800">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sortedIssues.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 uppercase text-xs font-bold tracking-widest italic opacity-50">
                        Nenhuma ocorrência registrada.
                    </td>
                </tr>
            ) : (
                sortedIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-md text-xs font-black border ${getScoreBadge(issue.score)}`}>
                        {issue.score.toString().padStart(2, '0')}
                    </span>
                    </td>
                    <td className="px-6 py-4">
                    <div className="font-bold text-slate-200 group-hover:text-white transition-colors uppercase text-xs tracking-tight">{issue.title}</div>
                    <div className="text-[10px] text-slate-500 mt-1 uppercase font-medium">{issue.area}</div>
                    {issue.aiSuggestion && (
                        <div className="mt-2 flex items-center gap-1 text-[9px] text-purple-300 bg-purple-900/30 w-fit px-2 py-0.5 rounded border border-purple-800/50 font-bold uppercase tracking-tighter">
                            <CheckCircle2 size={10} /> IA Sync
                        </div>
                    )}
                    </td>
                    <td className="px-6 py-4 text-center font-black text-slate-400">{issue.gravity}</td>
                    <td className="px-6 py-4 text-center font-black text-slate-400">{issue.urgency}</td>
                    <td className="px-6 py-4 text-center font-black text-slate-400">{issue.tendency}</td>
                    <td className="px-6 py-4">
                        <select
                            value={issue.status}
                            onChange={(e) => onStatusChange(issue.id, e.target.value as Status)}
                            className={`text-[10px] font-black uppercase rounded px-2 py-1 outline-none border transition-all cursor-pointer ${getStatusColor(issue.status)}`}
                        >
                            {Object.values(Status).map(s => (
                                <option key={s} value={s} className="bg-slate-800 text-slate-200">{s.toUpperCase()}</option>
                            ))}
                        </select>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDetails?.(issue.id); }}
                                className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/30 rounded-md transition-all border border-transparent hover:border-blue-900/50"
                                title="Visualizar Detalhes"
                            >
                                <Eye size={16} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit?.(issue.id); }}
                                className="p-2 text-slate-500 hover:text-green-400 hover:bg-green-900/30 rounded-md transition-all border border-transparent hover:border-green-900/50"
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
    </div>
  );
};
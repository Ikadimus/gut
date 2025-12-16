import React from 'react';
import { GUTIssue, Status } from '../types';
import { CheckCircle2, Filter } from 'lucide-react';

interface GUTTableProps {
  issues: GUTIssue[];
  onStatusChange: (id: string, newStatus: Status) => void;
  onDelete: (id: string) => void;
}

export const GUTTable: React.FC<GUTTableProps> = ({ issues, onStatusChange, onDelete }) => {
  // Sort issues by score descending
  const sortedIssues = [...issues].sort((a, b) => b.score - a.score);

  const getScoreBadge = (score: number) => {
    if (score >= 81) return 'bg-red-900/40 text-red-200 border-red-800';
    if (score >= 36) return 'bg-orange-900/40 text-orange-200 border-orange-800';
    return 'bg-green-900/40 text-green-200 border-green-800';
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
        <h3 className="font-semibold text-slate-100 flex items-center gap-2">
            <Filter size={18} /> Matriz de Priorização
        </h3>
        <span className="text-xs text-slate-400">{issues.length} registros</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Problema / Área</th>
              <th className="px-6 py-4 text-center">G</th>
              <th className="px-6 py-4 text-center">U</th>
              <th className="px-6 py-4 text-center">T</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sortedIssues.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        Nenhuma ocorrência registrada. Clique em "Nova Ocorrência".
                    </td>
                </tr>
            ) : (
                sortedIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreBadge(issue.score)}`}>
                        {issue.score}
                    </span>
                    </td>
                    <td className="px-6 py-4">
                    <div className="font-medium text-slate-200">{issue.title}</div>
                    <div className="text-xs text-slate-400 mt-1">{issue.area}</div>
                    {issue.aiSuggestion && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-purple-300 bg-purple-900/30 w-fit px-1.5 py-0.5 rounded border border-purple-800/50">
                            <CheckCircle2 size={10} /> IA Analisada
                        </div>
                    )}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-400">{issue.gravity}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-400">{issue.urgency}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-400">{issue.tendency}</td>
                    <td className="px-6 py-4">
                        <select
                            value={issue.status}
                            onChange={(e) => onStatusChange(issue.id, e.target.value as Status)}
                            className={`text-xs font-medium rounded-full px-2 py-1 outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-slate-800 focus:ring-slate-500 cursor-pointer ${getStatusColor(issue.status)}`}
                        >
                            {Object.values(Status).map(s => (
                                <option key={s} value={s} className="bg-slate-800 text-slate-200">{s}</option>
                            ))}
                        </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => onDelete(issue.id)}
                            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                        >
                            Excluir
                        </button>
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
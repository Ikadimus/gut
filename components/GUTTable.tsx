import React from 'react';
import { GUTIssue, Status } from '../types';
import { AlertCircle, CheckCircle2, ChevronRight, Filter } from 'lucide-react';

interface GUTTableProps {
  issues: GUTIssue[];
  onStatusChange: (id: string, newStatus: Status) => void;
  onDelete: (id: string) => void;
}

export const GUTTable: React.FC<GUTTableProps> = ({ issues, onStatusChange, onDelete }) => {
  // Sort issues by score descending
  const sortedIssues = [...issues].sort((a, b) => b.score - a.score);

  const getScoreBadge = (score: number) => {
    if (score >= 81) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 36) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.OPEN: return 'text-red-600 bg-red-50';
      case Status.IN_PROGRESS: return 'text-blue-600 bg-blue-50';
      case Status.RESOLVED: return 'text-green-600 bg-green-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Filter size={18} /> Matriz de Priorização
        </h3>
        <span className="text-xs text-slate-500">{issues.length} registros</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-semibold">
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
          <tbody className="divide-y divide-slate-100">
            {sortedIssues.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        Nenhuma ocorrência registrada. Clique em "Nova Ocorrência".
                    </td>
                </tr>
            ) : (
                sortedIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreBadge(issue.score)}`}>
                        {issue.score}
                    </span>
                    </td>
                    <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{issue.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{issue.area}</div>
                    {issue.aiSuggestion && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 w-fit px-1.5 py-0.5 rounded">
                            <CheckCircle2 size={10} /> IA Analisada
                        </div>
                    )}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-600">{issue.gravity}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-600">{issue.urgency}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-600">{issue.tendency}</td>
                    <td className="px-6 py-4">
                        <select
                            value={issue.status}
                            onChange={(e) => onStatusChange(issue.id, e.target.value as Status)}
                            className={`text-xs font-medium rounded-full px-2 py-1 border-0 focus:ring-1 focus:ring-offset-1 focus:ring-slate-300 cursor-pointer ${getStatusColor(issue.status)}`}
                        >
                            {Object.values(Status).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => onDelete(issue.id)}
                            className="text-xs text-slate-400 hover:text-red-600 transition-colors"
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

import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Activity } from 'lucide-react';
import { GUTIssue, Status } from '../types';

interface StatsCardsProps {
  issues: GUTIssue[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ issues }) => {
  const totalOpen = issues.filter(i => i.status === Status.OPEN).length;
  const critical = issues.filter(i => i.score >= 81).length; // High priority threshold
  const avgScore = issues.length > 0 
    ? Math.round(issues.reduce((acc, curr) => acc + curr.score, 0) / issues.length) 
    : 0;
  const resolved = issues.filter(i => i.status === Status.RESOLVED).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center">
        <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
          <Clock size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Chamados Abertos</p>
          <h3 className="text-2xl font-bold text-slate-800">{totalOpen}</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center">
        <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Críticos (GUT &gt; 80)</p>
          <h3 className="text-2xl font-bold text-slate-800">{critical}</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center">
        <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
          <Activity size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">GUT Médio</p>
          <h3 className="text-2xl font-bold text-slate-800">{avgScore}</h3>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex items-center">
        <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
          <CheckCircle size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Resolvidos</p>
          <h3 className="text-2xl font-bold text-slate-800">{resolved}</h3>
        </div>
      </div>
    </div>
  );
};

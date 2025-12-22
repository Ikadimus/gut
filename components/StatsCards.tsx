import React from 'react';
import { AlertTriangle, CheckCircle, Clock, Target, Zap } from 'lucide-react';
import { GUTIssue, Status } from '../types';

interface StatsCardsProps {
  issues: GUTIssue[];
}

export const StatsCards: React.FC<StatsCardsProps> = ({ issues }) => {
  const totalOpen = issues.filter(i => i.status === Status.OPEN).length;
  const critical = issues.filter(i => i.score >= 81).length;
  const resolved = issues.filter(i => i.status === Status.RESOLVED).length;

  // Cálculo da Área que precisa de mais ATENÇÃO (Maior Score Acumulado)
  const areaAttention = issues.reduce((acc, curr) => {
    acc[curr.area] = (acc[curr.area] || 0) + curr.score;
    return acc;
  }, {} as Record<string, number>);

  const topAttentionArea = Object.entries(areaAttention).sort((a, b) => (b[1] as number) - (a[1] as number))[0];

  // Cálculo da Área com mais FALHAS (Maior Contagem)
  const areaCount = issues.reduce((acc, curr) => {
    acc[curr.area] = (acc[curr.area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topFailureArea = Object.entries(areaCount).sort((a, b) => (b[1] as number) - (a[1] as number))[0];

  return (
    <div className="space-y-4 mb-8">
      {/* Linha 1: Indicadores Básicos de Volume */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center shadow-lg transition-all hover:border-slate-700">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 mr-4 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Ocorrências Abertas</p>
            <h3 className="text-2xl font-black text-slate-100">{totalOpen}</h3>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center shadow-lg transition-all hover:border-slate-700">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400 mr-4 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Críticos (Score &gt; 80)</p>
            <h3 className="text-2xl font-black text-slate-100">{critical}</h3>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center shadow-lg transition-all hover:border-slate-700">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-400 mr-4 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Resolvidos / Mitigados</p>
            <h3 className="text-2xl font-black text-slate-100">{resolved}</h3>
          </div>
        </div>
      </div>

      {/* Linha 2: Indicadores de Atenção de Engenharia (Com mais espaço) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-orange-950/20 p-6 rounded-2xl border border-orange-900/30 flex items-center shadow-2xl transition-all hover:bg-orange-950/30">
          <div className="p-4 rounded-xl bg-orange-500/10 text-orange-400 mr-5 border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
            <Target size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.3em] mb-1">Ponto Crítico de Concentração de Risco</p>
            <h3 className="text-lg font-black text-slate-100 uppercase leading-tight">
              {topAttentionArea ? topAttentionArea[0] : 'Nenhum dado registrado'}
            </h3>
            <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase italic tracking-tighter">Setor com maior somatória de impacto GUT</p>
          </div>
        </div>

        <div className="bg-purple-950/20 p-6 rounded-2xl border border-purple-900/30 flex items-center shadow-2xl transition-all hover:bg-purple-950/30">
          <div className="p-4 rounded-xl bg-purple-500/10 text-purple-400 mr-5 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <Zap size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-purple-500 font-black uppercase tracking-[0.3em] mb-1">Setor Instável (Maior Recorrência)</p>
            <h3 className="text-lg font-black text-slate-100 uppercase leading-tight">
              {topFailureArea ? topFailureArea[0] : 'Nenhum dado registrado'}
            </h3>
            <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase italic tracking-tighter">Área com maior volume de falhas técnicas</p>
          </div>
        </div>
      </div>
    </div>
  );
};
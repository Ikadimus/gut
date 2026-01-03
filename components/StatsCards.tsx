
import React, { useState } from 'react';
import { AlertTriangle, Clock, Zap, ShieldCheck, Thermometer, Gauge, ChevronDown, ChevronUp, AlertCircle, Eye, ArrowRight, Target, Activity, CheckCircle2 } from 'lucide-react';
import { GUTIssue, Status, ThermographyRecord } from '../types';

interface StatsCardsProps {
  issues: GUTIssue[];
  thermography?: ThermographyRecord[];
  onViewGUTDetail: (id: string) => void;
  onViewThermo: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ 
  issues, 
  thermography = [], 
  onViewGUTDetail,
  onViewThermo
}) => {
  const [showActiveRisks, setShowActiveRisks] = useState(false);

  // Stats GUT
  const totalOpen = issues.filter(i => i.status === Status.OPEN || i.status === Status.IN_PROGRESS).length;
  const criticalGUTCount = issues.filter(i => i.score >= 81).length;
  const resolvedCount = issues.filter(i => i.status === Status.RESOLVED || i.status === Status.MITIGATED).length;
  
  // Stats Termografia
  const criticalThermoRecords = thermography.filter(r => r.currentTemp >= r.maxTemp);
  const criticalThermoCount = criticalThermoRecords.length;
  
  // Total de Riscos Unificados
  const totalCriticalRisks = criticalGUTCount + criticalThermoCount;

  // Lógica de Concentração de Risco GUT
  const areaImpact = issues.reduce((acc, issue) => {
    acc[issue.area] = (acc[issue.area] || 0) + issue.score;
    return acc;
  }, {} as Record<string, number>);

  const areaRecurrence = issues.reduce((acc, issue) => {
    acc[issue.area] = (acc[issue.area] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const criticalArea = Object.entries(areaImpact).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const instableArea = Object.entries(areaRecurrence).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Lógica de Concentração de Risco Térmico
  const equipmentStress = thermography.reduce((acc, record) => {
    const stress = record.currentTemp / record.maxTemp;
    if (!acc.name || stress > acc.val) {
      acc = { name: record.equipmentName, val: stress, area: record.area };
    }
    return acc;
  }, { name: '', val: 0, area: '' });

  const equipmentRecurrence = thermography.reduce((acc, record) => {
    acc[record.equipmentName] = (acc[record.equipmentName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stressedEquipment = equipmentStress.name || 'N/A';
  const frequentEquipment = Object.entries(equipmentRecurrence).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const hasRisks = totalCriticalRisks > 0;

  return (
    <div className="space-y-6 mb-8">
      {/* Linha 1: Status Geral (Counters) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center shadow-lg group hover:border-blue-500/30 transition-all">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 mr-4 border border-blue-500/20">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Ocorrências Abertas</p>
            <h3 className="text-2xl font-black text-slate-100">{totalOpen}</h3>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center shadow-lg group hover:border-red-500/30 transition-all">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400 mr-4 border border-red-500/20">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Críticos (Unificados)</p>
            <h3 className="text-2xl font-black text-slate-100">{totalCriticalRisks}</h3>
          </div>
        </div>

        <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 flex items-center shadow-lg group hover:border-green-500/30 transition-all">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-400 mr-4 border border-green-500/20">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Resolvidos / Mitigados</p>
            <h3 className="text-2xl font-black text-slate-100">{resolvedCount}</h3>
          </div>
        </div>
      </div>

      {/* Linha 2 e 3 de Concentração de Risco mantidas... */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-950/40 border border-orange-950/30 p-6 rounded-3xl flex items-center gap-6 shadow-xl relative overflow-hidden group">
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 shadow-lg relative z-10">
            <Target size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] text-orange-500 font-black uppercase tracking-[0.2em] mb-1">Ponto Crítico de Concentração de Risco</p>
            <h4 className="text-xl font-black text-white uppercase tracking-tight">{criticalArea}</h4>
            <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Setor com maior somatória de impacto GUT</p>
          </div>
        </div>

        <div className="bg-slate-950/40 border border-purple-950/30 p-6 rounded-3xl flex items-center gap-6 shadow-xl relative overflow-hidden group">
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 shadow-lg relative z-10">
            <Zap size={28} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] text-purple-500 font-black uppercase tracking-[0.2em] mb-1">Setor Instável (Maior Recorrência)</p>
            <h4 className="text-xl font-black text-white uppercase tracking-tight">{instableArea}</h4>
            <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Área com maior volume de falhas técnicas</p>
          </div>
        </div>
      </div>

      {/* Linha Final: Saúde do Processo com Dropdown Unificado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 relative overflow-visible shadow-xl">
           <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-green-500 shadow-inner">
                  <Gauge size={32} />
              </div>
              <div className="flex-1">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Status de Saúde do Processo</p>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-lg font-black uppercase tracking-tight ${hasRisks ? 'text-red-500' : 'text-green-500'}`}>
                      {!hasRisks ? 'Operação Nominal' : `${totalCriticalRisks} Riscos Ativos`}
                    </h4>
                    {hasRisks && (
                      <button 
                        onClick={() => setShowActiveRisks(!showActiveRisks)}
                        className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full border border-red-500/30 hover:bg-red-500/30 transition-all"
                      >
                        {showActiveRisks ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} Detalhes
                      </button>
                    )}
                  </div>
              </div>
           </div>

           {showActiveRisks && hasRisks && (
             <div className="absolute top-full left-0 right-0 mt-2 z-[60] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 animate-slide-up max-h-80 overflow-y-auto custom-scrollbar ring-1 ring-white/10">
                <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Inventário Unificado de Riscos</h5>
                <div className="space-y-2">
                   {/* Riscos GUT */}
                   {issues.filter(i => i.score >= 81).map(issue => (
                     <div key={issue.id} className="group/item flex items-center justify-between bg-red-950/20 p-2.5 rounded-xl border border-red-900/30 hover:bg-red-900/40 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <AlertCircle size={14} className="text-red-500 shrink-0" />
                           <div className="flex flex-col overflow-hidden">
                              <span className="text-[10px] font-black text-slate-200 truncate uppercase tracking-tight">{issue.title}</span>
                              <span className="text-[8px] text-slate-500 font-bold uppercase">{issue.area} (Matriz GUT)</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-black text-red-400 bg-red-900/40 px-2 py-0.5 rounded border border-red-800/30">SCORE {issue.score}</span>
                          <button onClick={() => onViewGUTDetail(issue.id)} className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all"><Eye size={12} /></button>
                        </div>
                     </div>
                   ))}
                   
                   {/* Riscos Termografia */}
                   {thermography.filter(r => r.currentTemp >= r.maxTemp).map(record => (
                     <div key={`thermo-${record.id}`} className="group/item flex items-center justify-between bg-orange-950/20 p-2.5 rounded-xl border border-orange-900/30 hover:bg-orange-900/40 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <Thermometer size={14} className="text-orange-500 shrink-0" />
                           <div className="flex flex-col overflow-hidden">
                              <span className="text-[10px] font-black text-slate-200 truncate uppercase tracking-tight">{record.equipmentName}</span>
                              <span className="text-[8px] text-slate-500 font-bold uppercase">{record.area} (Termografia)</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-black text-orange-400 bg-orange-900/40 px-2 py-0.5 rounded border border-orange-800/30">{record.currentTemp}°C / {record.maxTemp}°C</span>
                          <button onClick={() => onViewThermo()} className="p-1.5 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-all"><Eye size={12} /></button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}
        </div>

        <div className="bg-slate-900/40 p-6 rounded-3xl border border-slate-800 flex items-center gap-6 shadow-xl">
           <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-blue-500 shadow-inner">
              <ShieldCheck size={32} />
           </div>
           <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Confiança de Disponibilidade</p>
              <h4 className="text-lg font-black text-slate-100 uppercase tracking-tight">
                {Math.max(0, 98 - (totalCriticalRisks * 5))}% Estimado
              </h4>
              <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">Algoritmo de Projeção em Tempo Real</p>
           </div>
        </div>
      </div>
    </div>
  );
};

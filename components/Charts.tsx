import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts';
import { GUTIssue } from '../types';
import { ShieldAlert, TrendingUp, BarChart3 } from 'lucide-react';

interface ChartsProps {
  issues: GUTIssue[];
  areas: string[];
}

const COLORS = {
  primary: '#10b981', // Emerald
  secondary: '#3b82f6', // Blue
  accent: '#a855f7', // Purple
  warning: '#f59e0b', // Amber
  danger: '#ef4444', // Red
};

export const Charts: React.FC<ChartsProps> = ({ issues, areas }) => {
  const relevantAreas = areas.length > 0 ? areas : Array.from(new Set(issues.map(i => i.area)));

  // Processamento por Área
  const areaAnalysis = relevantAreas.map(area => {
    const areaIssues = issues.filter(i => i.area === area);
    const count = areaIssues.length;
    const totalScore = areaIssues.reduce((acc, curr) => acc + curr.score, 0);
    return {
      subject: area,
      occurrences: count,
      impact: totalScore,
    };
  }).sort((a, b) => b.impact - a.impact);

  // Top 5 Riscos Individuais
  const topRiskData = [...issues]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(i => ({
      name: i.title,
      score: i.score,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl z-50 ring-1 ring-white/10">
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500 mb-3 max-w-[250px] break-words">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-6 mb-1">
              <span className="text-xs text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                {p.name}
              </span>
              <span className="text-xs font-black text-white">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 mb-12 animate-fade-in">
      
      {/* SEÇÃO SUPERIOR: OPERACIONAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Radar: Frequência de Falhas */}
        <div className="bg-slate-900/40 backdrop-blur-sm p-8 rounded-[2rem] shadow-xl border border-slate-800/60 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                  <TrendingUp size={16} className="text-green-500" />
                  Scanner de Incidências
              </h3>
              <span className="text-[9px] font-mono text-slate-600 bg-slate-950 px-2 py-1 rounded">FREQ_DIST</span>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={areaAnalysis}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }}
                />
                <Radar
                  name="Ocorrências"
                  dataKey="occurrences"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fill={COLORS.primary}
                  fillOpacity={0.15}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-4">Volume de Falhas por Subsistema</p>
        </div>

        {/* Bar: Top 5 Riscos Individuais */}
        <div className="bg-slate-900/40 backdrop-blur-sm p-8 rounded-[2rem] shadow-xl border border-slate-800/60">
            <div className="w-full flex justify-between items-center mb-8">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                    <ShieldAlert size={16} className="text-red-500" />
                    Vetor de Riscos Críticos
                </h3>
                <span className="text-[9px] font-mono text-slate-600 bg-slate-950 px-2 py-1 rounded">INDIVIDUAL_SCORE</span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRiskData} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <XAxis type="number" hide domain={[0, 125]} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={140} 
                    tick={{fontSize: 9, fill: '#64748b', fontWeight: 800}}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip cursor={{fill: 'rgba(51, 65, 85, 0.2)'}} content={<CustomTooltip />} />
                  <Bar 
                    dataKey="score" 
                    name="Score GUT"
                    radius={[0, 6, 6, 0]} 
                    barSize={14}
                  >
                    {topRiskData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.score > 80 ? COLORS.danger : entry.score > 40 ? COLORS.warning : COLORS.secondary} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-4 text-center">Eventos mais graves registrados</p>
        </div>
      </div>

      {/* SEÇÃO INFERIOR: ESTRATÉGICA (O NOVO GRÁFICO) */}
      <div className="bg-slate-900/40 backdrop-blur-sm p-10 rounded-[2.5rem] shadow-2xl border border-slate-800/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
              <div>
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-[0.4em] flex items-center gap-3">
                      <BarChart3 size={20} className="text-orange-500" />
                      Foco de Engenharia: Impacto Acumulado
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Onde o risco total está concentrado na usina</p>
              </div>
              <div className="flex items-center gap-6 bg-slate-950/50 px-6 py-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Crítico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Atenção</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Normal</span>
                  </div>
              </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaAnalysis} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="subject" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} 
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fill: '#475569', fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar 
                    dataKey="impact" 
                    name="Score Acumulado" 
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                >
                  {areaAnalysis.map((entry, index) => (
                    <Cell 
                      key={`cell-impact-${index}`} 
                      fill={entry.impact > 250 ? COLORS.danger : entry.impact > 100 ? COLORS.warning : COLORS.primary} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};
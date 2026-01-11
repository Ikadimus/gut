
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { GUTIssue, SystemSettings, ThermographyRecord, Status } from '../types';
import { ShieldAlert, TrendingUp, BarChart3, Thermometer, Activity, Zap } from 'lucide-react';

interface ChartsProps {
  issues: GUTIssue[];
  thermography?: ThermographyRecord[];
  areas: string[];
  settings: SystemSettings;
}

export const Charts: React.FC<ChartsProps> = ({ issues, thermography = [], areas, settings }) => {
  // Filtramos apenas as issues que não estão resolvidas ou mitigadas para os gráficos de risco
  const activeIssues = issues.filter(i => i.status === Status.OPEN || i.status === Status.IN_PROGRESS);

  const relevantAreas = areas.length > 0 ? areas : Array.from(new Set([...activeIssues.map(i => i.area), ...thermography.map(t => t.area)]));

  // Dados GUT - Apenas ocorrências ATIVAS
  const gutData = relevantAreas.map(area => {
    const areaIssues = activeIssues.filter(i => i.area === area);
    return {
      name: area,
      impact: areaIssues.reduce((acc, curr) => acc + curr.score, 0),
      count: areaIssues.length
    };
  }).sort((a, b) => b.impact - a.impact);

  // Dados Termografia
  const thermoData = relevantAreas.map(area => {
    const areaRecords = thermography.filter(t => t.area === area);
    if (areaRecords.length === 0) return null;
    const avgCurrent = areaRecords.reduce((acc, curr) => acc + curr.currentTemp, 0) / areaRecords.length;
    const avgMax = areaRecords.reduce((acc, curr) => acc + curr.maxTemp, 0) / areaRecords.length;
    return {
      name: area,
      current: Math.round(avgCurrent),
      limit: Math.round(avgMax)
    };
  }).filter(Boolean);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl ring-1 ring-white/10">
          <p className="text-[10px] uppercase font-black text-slate-500 mb-3">{label}</p>
          {payload.map((p: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-6 mb-1">
              <span className="text-xs text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color || p.fill }}></span>
                {p.name}
              </span>
              <span className="text-xs font-black text-white">{p.value}{p.unit || ''}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Radar GUT - Agora focado apenas no que está pendente */}
        <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <Activity size={16} className="text-blue-500" /> Scanner de Riscos Ativos (GUT)
              </h3>
              <Zap size={14} className="text-blue-500/30" />
           </div>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={gutData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} />
                  <Radar name="Impacto GUT Pendente" dataKey="impact" stroke={settings.accentColor} fill={settings.accentColor} fillOpacity={0.2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
             </ResponsiveContainer>
           </div>
           <p className="text-[8px] text-slate-600 font-black uppercase text-center mt-4 tracking-widest">Apenas registros em Aberto ou Análise</p>
        </div>

        {/* Linha de Tendência Térmica */}
        <div className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800 shadow-xl">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <Thermometer size={16} className="text-orange-500" /> Integridade de Ativos (Termo)
              </h3>
              <TrendingUp size={14} className="text-orange-500/30" />
           </div>
           <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={thermoData}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="current" name="Temp. Média" stroke="#f97316" fillOpacity={1} fill="url(#colorTemp)" unit="°C" />
                  <Line type="monotone" dataKey="limit" name="Limite Projeto" stroke="#ef4444" strokeDasharray="5 5" unit="°C" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
           <p className="text-[8px] text-slate-600 font-black uppercase text-center mt-4 tracking-widest">Médias térmicas atuais versus limites de projeto</p>
        </div>
      </div>

      {/* Impacto Acumulado Bar Chart - Agora apenas para pendências */}
      <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
              <div>
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-[0.4em] flex items-center gap-3">
                  <BarChart3 size={20} className="text-green-500" /> Gargalo de Riscos Pendentes
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Soma do Score GUT apenas para ocorrências não resolvidas</p>
              </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gutData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="impact" name="Impacto Pendente" radius={[8, 8, 0, 0]} barSize={45}>
                  {gutData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.impact >= settings.criticalThreshold ? settings.colorCritical : entry.impact >= settings.warningThreshold ? settings.colorWarning : settings.colorNormal} 
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

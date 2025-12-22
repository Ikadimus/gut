import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts';
import { GUTIssue, PlantArea } from '../types';

interface ChartsProps {
  issues: GUTIssue[];
}

const COLORS = {
  primary: '#10b981', // Emerald 500
  secondary: '#3b82f6', // Blue 500
  accent: '#a855f7', // Purple 500
  warning: '#f59e0b', // Amber 500
  danger: '#ef4444', // Red 500
};

export const Charts: React.FC<ChartsProps> = ({ issues }) => {
  // Processamento para o Radar Chart (Ocorrências por Área)
  // Inclui todas as áreas para manter a simetria do radar
  const areaData = Object.values(PlantArea).map(area => {
    const count = issues.filter(i => i.area === area).length;
    return {
      subject: area.split(' ')[0], // Nome curto para o HUD
      fullMark: Math.max(...Object.values(PlantArea).map(a => issues.filter(i => i.area === a).length), 5),
      A: count,
    };
  });

  // Data para Top Riscos (Barras)
  const topRiskData = [...issues]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(i => ({
      name: i.title.length > 15 ? i.title.substring(0, 15) + '...' : i.title,
      score: i.score,
      rawTitle: i.title
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-lg shadow-2xl">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{label}</p>
          <p className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Valor: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Radar Chart Futurista */}
      <div className="bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                Scanner de Incidências
            </h3>
            <span className="text-[10px] text-slate-600 font-mono">MAP_RADAR_V1.0</span>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={areaData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
              <Radar
                name="Ocorrências"
                dataKey="A"
                stroke={COLORS.primary}
                strokeWidth={2}
                fill={COLORS.primary}
                fillOpacity={0.3}
                animationBegin={200}
                animationDuration={1500}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 font-medium italic">Distribuição vetorial de falhas por subsistema</p>
      </div>

      {/* Bar Chart estilizado */}
      <div className="bg-slate-900/40 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-800">
        <div className="w-full flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                Vetor de Riscos Críticos
            </h3>
            <span className="text-[10px] text-slate-600 font-mono">SCORE_GUT_MONITOR</span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topRiskData} layout="vertical" margin={{ left: 0, right: 30 }}>
              <XAxis type="number" hide domain={[0, 125]} />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100} 
                tick={{fontSize: 10, fill: '#64748b', fontWeight: 700}}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{fill: 'rgba(51, 65, 85, 0.3)'}} 
                content={<CustomTooltip />}
              />
              <Bar 
                dataKey="score" 
                radius={[0, 10, 10, 0]} 
                barSize={12}
                animationBegin={500}
                animationDuration={1800}
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
        <div className="flex justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                <span className="w-2 h-2 bg-blue-500 rounded-sm"></span> Baixo
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                <span className="w-2 h-2 bg-amber-500 rounded-sm"></span> Médio
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                <span className="w-2 h-2 bg-red-500 rounded-sm"></span> Crítico
            </div>
        </div>
      </div>
    </div>
  );
};
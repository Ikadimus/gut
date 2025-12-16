import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { GUTIssue, PlantArea } from '../types';

interface ChartsProps {
  issues: GUTIssue[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const Charts: React.FC<ChartsProps> = ({ issues }) => {
  // Data for Area distribution
  const areaData = Object.values(PlantArea).map(area => ({
    name: area.split(' ')[0], // Short name
    value: issues.filter(i => i.area === area).length
  })).filter(d => d.value > 0);

  // Data for Severity (Top 5 Issues)
  const topRiskData = [...issues]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(i => ({
      name: i.title.substring(0, 15) + '...',
      score: i.score
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Ocorrências por Área</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={areaData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {areaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{ color: '#cbd5e1' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Top 5 Riscos Críticos (Score GUT)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topRiskData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" />
              <XAxis type="number" domain={[0, 125]} hide />
              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <Tooltip 
                cursor={{fill: '#334155', opacity: 0.4}} 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
              />
              <Bar dataKey="score" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
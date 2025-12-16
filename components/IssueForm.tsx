import React, { useState } from 'react';
import { GUTIssue, Status } from '../types';
import { GUT_SCALES } from '../constants';
import { analyzeIssueWithAI } from '../services/geminiService';
import { Bot, Save, Loader2, Sparkles } from 'lucide-react';

interface IssueFormProps {
  onSave: (issue: Omit<GUTIssue, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  areas: string[];
}

export const IssueForm: React.FC<IssueFormProps> = ({ onSave, onCancel, areas }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState<string>(areas[0] || '');
  const [gravity, setGravity] = useState<number>(1);
  const [urgency, setUrgency] = useState<number>(1);
  const [tendency, setTendency] = useState<number>(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);

  const handleAISuggestion = async () => {
    if (!title || !description) {
      alert("Por favor, preencha o título e a descrição para a IA analisar.");
      return;
    }
    setAiLoading(true);
    setAiReasoning(null);
    const result = await analyzeIssueWithAI(title, description, area);
    setAiLoading(false);

    if (result) {
      setGravity(result.gravity);
      setUrgency(result.urgency);
      setTendency(result.tendency);
      setAiReasoning(result.reasoning);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      area,
      gravity,
      urgency,
      tendency,
      score: gravity * urgency * tendency,
      status: Status.OPEN,
      aiSuggestion: aiReasoning || undefined
    });
  };

  const currentScore = gravity * urgency * tendency;
  let scoreColor = 'bg-green-100 text-green-800';
  if (currentScore > 60) scoreColor = 'bg-amber-100 text-amber-800';
  if (currentScore > 90) scoreColor = 'bg-red-100 text-red-800';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Novo Registro de Ocorrência</h2>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">Cancelar</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Área da Planta</label>
              <select 
                value={area} 
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
              >
                {areas.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Título do Problema</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                placeholder="Ex: Alta temperatura no Compressor A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Detalhada</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border-slate-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                placeholder="Descreva os sintomas, leituras de sensores e observações visuais..."
              />
            </div>

             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                        <Bot size={18} className="text-purple-600"/> Assistente IA
                    </h4>
                    <button
                        type="button"
                        onClick={handleAISuggestion}
                        disabled={aiLoading}
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                    >
                        {aiLoading ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                        {aiLoading ? 'Analisando...' : 'Sugerir GUT'}
                    </button>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                    A IA pode analisar o título e a descrição para sugerir pontuações baseadas em padrões de usinas de biometano.
                </p>
                {aiReasoning && (
                    <div className="bg-purple-50 text-purple-900 text-sm p-3 rounded mt-2 border border-purple-100">
                        <strong>Análise:</strong> {aiReasoning}
                    </div>
                )}
            </div>
          </div>

          <div className="space-y-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
             <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Matriz GUT</h3>
             
             <div>
                <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                    <span>Gravidade (G)</span>
                    <span className="font-bold text-slate-900">{gravity}</span>
                </label>
                <input 
                    type="range" min="1" max="5" step="1"
                    value={gravity} onChange={(e) => setGravity(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <p className="text-xs text-slate-500 mt-1">{GUT_SCALES.gravity.find(s => s.value === gravity)?.label}</p>
             </div>

             <div>
                <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                    <span>Urgência (U)</span>
                    <span className="font-bold text-slate-900">{urgency}</span>
                </label>
                <input 
                    type="range" min="1" max="5" step="1"
                    value={urgency} onChange={(e) => setUrgency(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <p className="text-xs text-slate-500 mt-1">{GUT_SCALES.urgency.find(s => s.value === urgency)?.label}</p>
             </div>

             <div>
                <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                    <span>Tendência (T)</span>
                    <span className="font-bold text-slate-900">{tendency}</span>
                </label>
                <input 
                    type="range" min="1" max="5" step="1"
                    value={tendency} onChange={(e) => setTendency(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <p className="text-xs text-slate-500 mt-1">{GUT_SCALES.tendency.find(s => s.value === tendency)?.label}</p>
             </div>

             <div className="pt-4 mt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-700">Pontuação GUT Total:</span>
                    <span className={`text-3xl font-black px-4 py-2 rounded-lg ${scoreColor}`}>
                        {currentScore}
                    </span>
                </div>
                <p className="text-xs text-right text-slate-400 mt-1">G x U x T</p>
             </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
            >
                Cancelar
            </button>
            <button
                type="submit"
                className="px-4 py-2 text-white bg-green-700 rounded-lg hover:bg-green-800 font-medium flex items-center gap-2"
            >
                <Save size={18} /> Salvar Ocorrência
            </button>
        </div>
      </form>
    </div>
  );
};

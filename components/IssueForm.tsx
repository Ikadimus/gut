
import React, { useState, useEffect } from 'react';
import { GUTIssue, Status } from '../types';
import { GUT_SCALES } from '../constants';
import { analyzeIssueWithAI } from '../services/geminiService';
import { Bot, Save, Loader2, Sparkles, Trash2, X, AlertCircle } from 'lucide-react';

interface IssueFormProps {
  onSave: (issue: Omit<GUTIssue, 'id' | 'createdAt'>, id?: string) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  areas: string[];
  initialData?: GUTIssue | null;
}

export const IssueForm: React.FC<IssueFormProps> = ({ onSave, onCancel, onDelete, areas, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [immediateAction, setImmediateAction] = useState(initialData?.immediateAction || '');
  const [area, setArea] = useState<string>(initialData?.area || areas[0] || '');
  const [gravity, setGravity] = useState<number>(initialData?.gravity || 1);
  const [urgency, setUrgency] = useState<number>(initialData?.urgency || 1);
  const [tendency, setTendency] = useState<number>(initialData?.tendency || 1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(initialData?.aiSuggestion || null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setImmediateAction(initialData.immediateAction || '');
      setArea(initialData.area);
      setGravity(initialData.gravity);
      setUrgency(initialData.urgency);
      setTendency(initialData.tendency);
      setAiReasoning(initialData.aiSuggestion || null);
    }
  }, [initialData]);

  const handleAISuggestion = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Preencha Título e Descrição para análise.");
      return;
    }
    
    setAiLoading(true);
    setAiError(null);
    setAiReasoning(null);

    try {
      const result = await analyzeIssueWithAI(title, description, area);
      if (result) {
        setGravity(result.gravity);
        setUrgency(result.urgency);
        setTendency(result.tendency);
        setAiReasoning(result.reasoning);
      }
    } catch (error: any) {
      console.error("Catch no Componente:", error);
      // Exibe o erro técnico para ajudar no diagnóstico em produção
      setAiError(error.message || "Erro de conexão com o servidor de IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      immediateAction,
      area,
      gravity,
      urgency,
      tendency,
      score: gravity * urgency * tendency,
      status: initialData?.status || Status.OPEN,
      aiSuggestion: aiReasoning || undefined
    }, initialData?.id);
  };

  const executeDelete = () => {
    if (!initialData?.id || !onDelete) return;
    if (window.confirm("Remover este registro permanentemente?")) {
      onDelete(initialData.id);
    }
  };

  const currentScore = gravity * urgency * tendency;
  let scoreColor = 'bg-green-900/40 text-green-200 border-green-800';
  if (currentScore >= 36) scoreColor = 'bg-amber-900/40 text-amber-200 border-amber-800';
  if (currentScore >= 81) scoreColor = 'bg-red-900/40 text-red-200 border-red-800 shadow-[0_0_15px_rgba(239,68,68,0.2)]';

  return (
    <div className="bg-slate-800 rounded-xl shadow-2xl p-8 max-w-4xl mx-auto border border-slate-700 animate-fade-in ring-1 ring-white/5">
      <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
        <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            {initialData ? 'Ajuste de Registro' : 'Inclusão de Ocorrência'}
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Biometano Caieiras | Sistema de Priorização GUT</p>
        </div>
        <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Subsistema da Planta</label>
              <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full rounded-lg bg-slate-900 border-slate-700 text-slate-100 p-3 border outline-none font-medium">
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Evento / Anomalia</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg bg-slate-900 border-slate-700 text-slate-100 p-3 border outline-none font-bold" placeholder="Ex: Vazamento no compressor de biometano" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Detalhamento Técnico</label>
              <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg bg-slate-900 border-slate-700 text-slate-100 p-3 border outline-none" placeholder="Descreva as condições operacionais observadas..." />
            </div>

            <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Bot size={14} className="text-purple-400"/> IA Analytical Core
                    </h4>
                    <button
                        type="button"
                        onClick={handleAISuggestion}
                        disabled={aiLoading}
                        className="text-[9px] bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-full flex items-center gap-2 transition-all disabled:opacity-50 font-black uppercase tracking-widest shadow-lg"
                    >
                        {aiLoading ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                        {aiLoading ? 'Calculando...' : 'Sugerir GUT'}
                    </button>
                </div>
                {aiError && (
                    <div className="bg-red-900/20 text-red-400 text-[9px] p-3 rounded-lg border border-red-800/30 flex items-center gap-2 mb-3 font-mono">
                        <AlertCircle size={12} /> ERR: {aiError}
                    </div>
                )}
                {aiReasoning && (
                    <div className="bg-purple-900/10 text-purple-200 text-[10px] p-4 rounded-lg border border-purple-800/20 animate-fade-in leading-relaxed italic">
                        {aiReasoning}
                    </div>
                )}
            </div>
          </div>

          <div className="space-y-8 bg-slate-900/30 p-8 rounded-xl border border-slate-700/50 shadow-inner flex flex-col justify-between">
             <div className="space-y-8">
                <h3 className="font-black text-slate-500 text-center text-[10px] uppercase tracking-[0.3em] mb-8">Parâmetros da Matriz</h3>
                
                {['gravity', 'urgency', 'tendency'].map((type) => (
                  <div key={type} className="space-y-2">
                    <label className="flex justify-between text-[11px] font-black text-slate-300 uppercase tracking-widest">
                        <span>{type === 'gravity' ? 'Gravidade' : type === 'urgency' ? 'Urgência' : 'Tendência'} ({(type[0]).toUpperCase()})</span>
                        <span className="text-white text-lg">{type === 'gravity' ? gravity : type === 'urgency' ? urgency : tendency}</span>
                    </label>
                    <input 
                        type="range" min="1" max="5" step="1"
                        value={type === 'gravity' ? gravity : type === 'urgency' ? urgency : tendency} 
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if(type === 'gravity') setGravity(val);
                          else if(type === 'urgency') setUrgency(val);
                          else setTendency(val);
                        }}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                  </div>
                ))}
             </div>

             <div className="pt-8 border-t border-slate-800 text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 block">Classificação GUT</span>
                <span className={`text-6xl font-black px-10 py-4 rounded-2xl border-2 italic transition-all duration-500 ${scoreColor}`}>
                    {currentScore}
                </span>
             </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-8 border-t border-slate-700">
            {initialData && (
              <button type="button" onClick={executeDelete} className="px-6 py-3 text-red-100 bg-red-900/40 border border-red-500/50 rounded-lg hover:bg-red-600 font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-3 transition-all">
                <Trash2 size={18} /> Remover
              </button>
            )}
            <div className="flex gap-4 ml-auto">
              <button type="button" onClick={onCancel} className="px-8 py-3 text-slate-400 bg-slate-700/30 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-white font-black uppercase text-[11px] tracking-[0.2em]">Cancelar</button>
              <button type="submit" className="px-12 py-3 text-white bg-green-600 rounded-lg hover:bg-green-500 font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-3 shadow-2xl transition-all">
                  <Save size={20} /> Salvar Registro
              </button>
            </div>
        </div>
      </form>
    </div>
  );
};

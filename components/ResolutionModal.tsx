
import React, { useState } from 'react';
import { GUTIssue, Status } from '../types';
import { X, CheckCircle2, ShieldCheck, Sparkles, Loader2, Bot, Save, AlertCircle } from 'lucide-react';
import { evaluateResolutionWithAI } from '../services/geminiService';

interface ResolutionModalProps {
  issue: GUTIssue;
  targetStatus: Status;
  onConfirm: (resolution: string, aiEvaluation?: string) => void;
  onCancel: () => void;
}

export const ResolutionModal: React.FC<ResolutionModalProps> = ({ issue, targetStatus, onConfirm, onCancel }) => {
  const [resolution, setResolution] = useState(issue.resolution || '');
  const [aiEvaluation, setAiEvaluation] = useState(issue.aiResolutionEvaluation || '');
  const [loading, setLoading] = useState(false);

  const handleAIReview = async () => {
    if (!resolution.trim()) {
      alert("Descreva a solução antes de solicitar a avaliação da IA.");
      return;
    }
    setLoading(true);
    try {
      const evaluation = await evaluateResolutionWithAI(issue.title, issue.description, resolution);
      setAiEvaluation(evaluation);
    } catch (err) {
      alert("Erro ao consultar IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up ring-1 ring-white/10">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
                 <CheckCircle2 size={24} />
              </div>
              <div>
                 <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Concluir Ocorrência</h3>
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">Definição de Status para: {targetStatus.toUpperCase()}</p>
              </div>
           </div>
           <button onClick={onCancel} className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all">
              <X size={20} />
           </button>
        </div>

        <div className="p-8 space-y-6">
           <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 shadow-inner">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <AlertCircle size={14} className="text-orange-500" /> Evento Original
              </h4>
              <p className="text-xs font-black text-white uppercase mb-1">{issue.title}</p>
              <p className="text-[11px] text-slate-400 line-clamp-2">{issue.description}</p>
           </div>

           <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Relatório Final da Solução / Mitigação</label>
              <textarea 
                required
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="Descreva detalhadamente o que foi feito para resolver a falha, ajustes de parâmetros, trocas de peças, etc..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-5 text-xs text-white outline-none focus:border-emerald-500/50 transition-all resize-none h-32 leading-relaxed"
              />
           </div>

           <div className="bg-slate-950/40 p-5 rounded-[1.5rem] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-slate-200 uppercase tracking-widest">IA Compliance Check</h4>
                    <p className="text-[8px] text-slate-500 font-bold uppercase">Validação técnica da solução aplicada</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={handleAIReview}
                  disabled={loading || !resolution.trim()} 
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-purple-900/20"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="inline mr-2" />}
                  Avaliar Solução
                </button>
              </div>
              {aiEvaluation && (
                <div className="animate-fade-in border-t border-slate-800 pt-4">
                  <div className="bg-purple-950/20 border border-purple-900/30 p-4 rounded-xl flex items-start gap-3">
                    <ShieldCheck size={18} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black text-purple-400 uppercase mb-1">Parecer da IA:</p>
                      <p className="text-[11px] font-medium text-slate-200 leading-relaxed italic">"{aiEvaluation}"</p>
                    </div>
                  </div>
                </div>
              )}
           </div>
        </div>

        <div className="p-8 bg-slate-950/40 border-t border-white/5 flex justify-end gap-3">
           <button onClick={onCancel} className="px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition-all">Descartar</button>
           <button 
              onClick={() => onConfirm(resolution, aiEvaluation)}
              disabled={!resolution.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
           >
              <Save size={16} /> Gravar Encerramento
           </button>
        </div>
      </div>
    </div>
  );
};


import React from 'react';
import { GUTIssue, Status } from '../types';
import { X, Calendar, MapPin, Activity, AlertCircle, Bot, Zap, Info, ExternalLink, FileText, Sparkles } from 'lucide-react';
import { GUT_SCALES } from '../constants';

interface DetailsModalProps {
  issue: GUTIssue;
  onClose: () => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({ issue, onClose }) => {
  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.OPEN: return 'text-red-400 bg-red-900/30 border-red-800';
      case Status.IN_PROGRESS: return 'text-blue-400 bg-blue-900/30 border-blue-800';
      case Status.RESOLVED: return 'text-green-400 bg-green-900/30 border-green-800';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  const getFullLabel = (type: 'gravity' | 'urgency' | 'tendency', value: number) => {
    const scale = GUT_SCALES[type].find(s => s.value === value);
    return scale ? scale.label : value;
  };

  const getPriorityInfo = (score: number) => {
    if (score >= 100) return { label: 'EMERGÊNCIA CRÍTICA', color: 'text-red-500', bg: 'bg-red-950/50 border-red-900/50' };
    if (score >= 60) return { label: 'ALTA PRIORIDADE', color: 'text-orange-500', bg: 'bg-orange-950/50 border-orange-900/50' };
    if (score >= 20) return { label: 'PRIORIDADE MÉDIA', color: 'text-amber-500', bg: 'bg-amber-950/50 border-amber-900/50' };
    return { label: 'BAIXA PRIORIDADE', color: 'text-green-500', bg: 'bg-green-950/50 border-green-900/50' };
  };

  const priority = getPriorityInfo(issue.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up ring-1 ring-white/10 my-8">
        
        <div className="relative p-8 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all">
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-widest mb-4">
            <Activity size={14} className="animate-pulse" /> Registro Técnico de Risco
          </div>
          
          <h2 className="text-3xl font-black text-white pr-12 tracking-tight leading-tight mb-5 uppercase">{issue.title}</h2>
          
          <div className="flex flex-wrap gap-4">
             <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getStatusColor(issue.status)}`}>
                {issue.status}
             </span>
             <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <MapPin size={14} className="text-green-500" /> {issue.area}
             </div>
             <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <Calendar size={14} className="text-blue-500" /> {new Date(issue.createdAt).toLocaleDateString('pt-BR')}
             </div>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-900/40">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Gravidade', val: issue.gravity, type: 'gravity' },
              { label: 'Urgência', val: issue.urgency, type: 'urgency' },
              { label: 'Tendência', val: issue.tendency, type: 'tendency' }
            ].map(g => (
              <div key={g.type} className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                <span className="text-[9px] uppercase text-slate-500 font-black tracking-widest block mb-2">{g.label}</span>
                <p className="text-slate-200 text-sm font-bold leading-tight">{getFullLabel(g.type as any, g.val)}</p>
              </div>
            ))}
          </div>

          <div className={`p-6 rounded-2xl border-2 ${priority.bg} transition-all flex items-center justify-between`}>
             <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pontuação Final</span>
                <h3 className={`text-xl font-black uppercase tracking-widest ${priority.color}`}>{priority.label}</h3>
             </div>
             <div className={`text-6xl font-black italic ${priority.color}`}>
               {issue.score}
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bloco do Problema */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <AlertCircle size={14} className="text-blue-400" /> Relato do Evento
                </h4>
                <div className="text-slate-300 text-xs leading-relaxed bg-slate-950 p-5 rounded-2xl border border-slate-800 font-medium whitespace-pre-wrap">
                  {issue.description}
                </div>
              </div>

              {issue.aiSuggestion && (
                <div className="bg-purple-900/10 p-5 rounded-2xl border border-purple-800/20">
                  <h4 className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Bot size={14} /> Parecer Técnico IA (O Problema)
                  </h4>
                  <p className="text-purple-200/90 text-[11px] font-medium leading-relaxed italic">
                    "{issue.aiSuggestion}"
                  </p>
                </div>
              )}
            </div>

            {/* Bloco da Ação */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={14} className="text-amber-400" /> Conduta Recomendada
                </h4>
                <div className="text-amber-100/90 text-xs leading-relaxed bg-amber-950/20 p-5 rounded-2xl border border-amber-900/30 font-bold italic">
                  {issue.immediateAction || "Nenhuma ação imediata registrada."}
                </div>
              </div>

              {issue.aiActionSuggestion && (
                <div className="bg-emerald-900/10 p-5 rounded-2xl border border-emerald-800/20">
                  <h4 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Sparkles size={14} /> Refinamento IA (A Resposta)
                  </h4>
                  <p className="text-emerald-100/90 text-[11px] font-bold leading-relaxed italic">
                    "{issue.aiActionSuggestion}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {issue.attachmentUrl && (
            <div className="space-y-3">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-green-400" /> Evidência do Drive
              </h4>
              <a href={issue.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-slate-800 hover:bg-slate-700 p-5 rounded-2xl border border-slate-700 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-green-500/10 rounded-xl border border-green-500/20 text-green-500">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-200 font-black truncate max-w-[300px] uppercase tracking-tighter">{issue.attachmentName || 'Visualizar Anexo'}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Sincronizado via Cloud Storage</p>
                  </div>
                </div>
                <ExternalLink size={18} className="text-slate-500 group-hover:text-white transition-colors" />
              </a>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-10 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 border border-slate-700">
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};

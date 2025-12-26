
import React from 'react';
import { GUTIssue, Status } from '../types';
import { X, Calendar, MapPin, Activity, AlertCircle, Bot, Zap, Info, ExternalLink, FileText } from 'lucide-react';
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
    return GUT_SCALES[type].find(s => s.value === value)?.label || value;
  };

  const getPriorityInfo = (score: number) => {
    if (score >= 100) return { 
      label: 'EMERGÊNCIA CRÍTICA', 
      desc: 'Ação imediata obrigatória. Risco de parada total do sistema de purificação ou danos severos aos equipamentos.', 
      color: 'text-red-500',
      bg: 'bg-red-950/50 border-red-900/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
    };
    if (score >= 60) return { 
      label: 'ALTA PRIORIDADE', 
      desc: 'Intervenção técnica necessária no curto prazo para evitar o agravamento do processo de refino de biometano.', 
      color: 'text-orange-500',
      bg: 'bg-orange-950/50 border-orange-900/50'
    };
    if (score >= 20) return { 
      label: 'PRIORIDADE MÉDIA', 
      desc: 'Deve ser planejado e executado na próxima janela de manutenção programada.', 
      color: 'text-amber-500',
      bg: 'bg-amber-950/50 border-amber-900/50'
    };
    return { 
      label: 'BAIXA PRIORIDADE', 
      desc: 'Monitorar a evolução. A correção pode ser realizada de forma rotineira sem pressa imediata.', 
      color: 'text-green-500',
      bg: 'bg-green-950/50 border-green-900/50'
    };
  };

  const priority = getPriorityInfo(issue.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slide-up ring-1 ring-white/10">
        
        {/* Top Header */}
        <div className="relative p-6 border-b border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase tracking-[0.2em] mb-3">
            <Activity size={14} className="animate-pulse" /> Detalhes da Ocorrência
          </div>
          
          <h2 className="text-3xl font-black text-white pr-10 tracking-tight leading-none mb-4 uppercase">{issue.title}</h2>
          
          <div className="flex flex-wrap gap-4">
             <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getStatusColor(issue.status)}`}>
                {issue.status}
             </span>
             <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
                <MapPin size={12} className="text-green-500" /> {issue.area}
             </div>
             <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-tighter">
                <Calendar size={12} className="text-blue-500" /> {new Date(issue.createdAt).toLocaleDateString('pt-BR')}
             </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-900/50">
          
          {/* GUT Values Detailed */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <span className="text-[9px] uppercase text-slate-500 font-black tracking-widest block mb-1">Gravidade</span>
              <p className="text-slate-200 text-sm font-bold">{getFullLabel('gravity', issue.gravity)}</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <span className="text-[9px] uppercase text-slate-500 font-black tracking-widest block mb-1">Urgência</span>
              <p className="text-slate-200 text-sm font-bold">{getFullLabel('urgency', issue.urgency)}</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
              <span className="text-[9px] uppercase text-slate-500 font-black tracking-widest block mb-1">Tendência</span>
              <p className="text-slate-200 text-sm font-bold">{getFullLabel('tendency', issue.tendency)}</p>
            </div>
          </div>

          {/* Final Score Section */}
          <div className={`p-5 rounded-xl border ${priority.bg} transition-all`}>
             <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pontuação Final (GUT)</span>
                    <h3 className={`text-lg font-black uppercase tracking-wide ${priority.color}`}>{priority.label}</h3>
                </div>
                <div className={`text-5xl font-black italic drop-shadow-lg ${priority.color}`}>
                  {issue.score}
                </div>
             </div>
             <div className="mt-4 pt-3 border-t border-white/5 flex items-start gap-2.5">
                <Info size={14} className={`mt-0.5 shrink-0 ${priority.color}`} />
                <p className="text-slate-300 text-sm leading-snug font-medium italic">
                    {priority.desc}
                </p>
             </div>
          </div>

          {/* Issue Description */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <AlertCircle size={14} className="text-blue-400" /> Descrição do Problema
            </h4>
            <div className="text-slate-300 text-sm leading-relaxed bg-slate-950/80 p-4 rounded-xl border border-slate-800 font-medium whitespace-pre-wrap">
              {issue.description}
            </div>
          </div>

          {/* Immediate Action */}
          {issue.immediateAction && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-amber-400" /> Ação Imediata Recomendada
              </h4>
              <div className="text-amber-100/90 text-sm leading-relaxed bg-amber-950/20 p-4 rounded-xl border border-amber-900/30 font-bold italic">
                {issue.immediateAction}
              </div>
            </div>
          )}

          {/* Anexo Google Drive */}
          {issue.attachmentUrl && (
            <div className="space-y-2">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-green-400" /> Documentação de Evidência
              </h4>
              <a 
                href={issue.attachmentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-slate-800 hover:bg-slate-700 p-4 rounded-xl border border-slate-700 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20 text-green-500">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-200 font-bold truncate max-w-[250px]">{issue.attachmentName || 'Visualizar Anexo'}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Google Drive Asset</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-slate-500 group-hover:text-white transition-colors" />
              </a>
            </div>
          )}

          {/* AI Analysis */}
          {issue.aiSuggestion && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Bot size={14} className="text-purple-400" /> Parecer Técnico IA
              </h4>
              <div className="bg-purple-950/30 p-4 rounded-xl border border-purple-900/20">
                <p className="text-purple-200/90 text-xs font-medium leading-relaxed italic">
                  "{issue.aiSuggestion}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 border border-slate-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

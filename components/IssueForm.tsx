
import React, { useState, useEffect, useRef } from 'react';
import { GUTIssue, Status } from '../types';
import { analyzeIssueWithAI } from '../services/geminiService';
import { storageService } from '../services/supabase';
import { GUT_SCALES } from '../constants';
import { Bot, Save, Loader2, Sparkles, Trash2, X, Paperclip, FileText, Zap, Info } from 'lucide-react';

interface IssueFormProps {
  onSave: (issue: Omit<GUTIssue, 'id' | 'createdAt'>, id?: string) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  areas: string[];
  initialData?: GUTIssue | null;
  onConnectAI?: () => void;
  isAIConnected?: boolean;
}

export const IssueForm: React.FC<IssueFormProps> = ({ 
  onSave, 
  onCancel, 
  onDelete, 
  areas, 
  initialData,
  onConnectAI,
  isAIConnected
}) => {
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
  const [aiActionComment, setAiActionComment] = useState<string | null>(initialData?.aiActionSuggestion || null);

  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(initialData?.attachmentUrl);
  const [attachmentName, setAttachmentName] = useState<string | undefined>(initialData?.attachmentName);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setAiActionComment(initialData.aiActionSuggestion || null);
      setAttachmentUrl(initialData.attachmentUrl);
      setAttachmentName(initialData.attachmentName);
    }
  }, [initialData]);

  const getLabelForValue = (type: 'gravity' | 'urgency' | 'tendency', val: number) => {
    const scale = GUT_SCALES[type].find(s => s.value === val);
    if (!scale) return "";
    return scale.label.split(' - ')[1] || scale.label;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const result = await storageService.uploadFile(file, 'gut');
      setAttachmentUrl(result.url);
      setAttachmentName(result.name);
    } catch (err: any) {
      alert("Erro ao salvar arquivo no Supabase: " + (err.message || "Erro desconhecido"));
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async () => {
    if (!attachmentUrl) return;
    
    if (confirm("Deseja realmente excluir este anexo permanentemente do servidor?")) {
      try {
        setUploading(true);
        await storageService.deleteFile(attachmentUrl);
        // CRÍTICO: Usar string vazia ou null para forçar a limpeza no banco de dados
        setAttachmentUrl('');
        setAttachmentName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        alert("Erro ao remover arquivo: " + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAISuggestion = async () => {
    if (!isAIConnected && onConnectAI) {
      onConnectAI();
      return;
    }
    if (!title.trim() || !description.trim()) {
      alert("Preencha Título e Descrição para análise.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await analyzeIssueWithAI(title, description, area, immediateAction);
      if (result) {
        setGravity(result.gravity);
        setUrgency(result.urgency);
        setTendency(result.tendency);
        setAiReasoning(result.reasoning);
        setAiActionComment(result.actionComment);
      }
    } catch (error: any) {
      setAiError(error.message || "Erro na conexão IA.");
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
      aiSuggestion: aiReasoning || undefined,
      aiActionSuggestion: aiActionComment || undefined,
      attachmentUrl: attachmentUrl || '',
      attachmentName: attachmentName || ''
    }, initialData?.id);
  };

  const currentScore = gravity * urgency * tendency;
  let scoreColor = 'bg-green-900/20 text-green-400 border-green-800/40';
  if (currentScore >= 36) scoreColor = 'bg-amber-900/20 text-amber-400 border-amber-800/40';
  if (currentScore >= 81) scoreColor = 'bg-red-900/20 text-red-400 border-red-800/40 shadow-[0_0_25px_rgba(239,68,68,0.15)]';

  const explanations = {
    gravity: "Avalie o dano físico, ambiental ou financeiro que este evento pode causar.",
    urgency: "Considere se a ação deve ser imediata ou se há tempo para planejamento.",
    tendency: "Se nada for feito hoje, como o problema estará amanhã?"
  };

  return (
    <div className="bg-slate-800 rounded-2xl shadow-2xl p-5 lg:p-7 max-w-4xl mx-auto border border-slate-700 animate-fade-in ring-1 ring-white/5 overflow-hidden">
      <div className="flex justify-between items-center mb-5 border-b border-slate-700 pb-4">
        <div>
            <h2 className="text-lg lg:text-xl font-black text-white tracking-tight uppercase">
            {initialData ? 'Ajustar Registro' : 'Protocolo de Entrada GUT'}
            </h2>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Planta de Purificação | Monitoramento Operacional</p>
        </div>
        <button type="button" onClick={onCancel} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
          
          <div className="lg:col-span-3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subsistema de Origem</label>
                <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full rounded-lg bg-slate-950 border-slate-700 text-slate-100 p-2.5 border outline-none font-bold text-xs focus:border-green-500/50 transition-all">
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Evento Crítico</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg bg-slate-950 border-slate-700 text-slate-100 p-2.5 border outline-none font-bold text-xs focus:border-green-500/50 transition-all" placeholder="Título resumido da falha" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-3">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Relato Técnico Detalhado</label>
                  <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg bg-slate-950 border-slate-700 text-slate-100 p-2.5 border outline-none text-[11px] leading-relaxed" placeholder="Descreva os sintomas, pressões e parâmetros observados..." />
                </div>
                
                {aiReasoning && (
                  <div className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl flex gap-3 animate-fade-in">
                    <Bot size={16} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">Análise Técnica (IA Core):</p>
                      <p className="text-[10px] text-slate-300 italic leading-snug">{aiReasoning}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <Zap size={11} className="text-amber-400" /> Ação Imediata Recomendada (Operador)
                  </label>
                  <textarea rows={3} value={immediateAction} onChange={(e) => setImmediateAction(e.target.value)} className="w-full rounded-lg bg-slate-950 border-slate-700 text-slate-100 p-2.5 border outline-none text-[11px] leading-relaxed" placeholder="Qual a primeira providência para conter o risco?" />
                </div>

                {aiActionComment && (
                  <div className="bg-purple-900/10 border border-purple-800/30 p-3 rounded-xl flex gap-3 animate-fade-in shadow-inner">
                    <Sparkles size={16} className="text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">Refinamento da IA sobre a Ação:</p>
                      <p className="text-[10px] text-purple-100 font-medium leading-snug italic">"{aiActionComment}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
               <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-700/50">
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Paperclip size={11} /> Documentação Operacional / Evidência
                  </label>
                  {attachmentUrl ? (
                    <div className="flex items-center justify-between bg-green-900/10 border border-green-800/30 p-2 rounded-lg">
                       <div className="flex items-center gap-2 overflow-hidden">
                         <FileText size={12} className="text-green-500 shrink-0" />
                         <span className="text-[9px] text-green-100 truncate font-bold">{attachmentName}</span>
                       </div>
                       <button type="button" onClick={removeAttachment} className="p-1 text-red-400 hover:bg-red-900/30 rounded transition-colors"><Trash2 size={12} /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full py-2 border border-dashed border-slate-700 rounded-lg flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-all text-[8px] font-black uppercase tracking-widest">
                       {uploading ? <Loader2 size={12} className="animate-spin text-blue-500" /> : <Paperclip size={12} />}
                       {uploading ? 'Salvando...' : 'Anexar Documento'}
                       <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </button>
                  )}
               </div>

               <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Bot size={13} className="text-purple-400"/> IA Core Engine
                        </h4>
                        <p className="text-[8px] text-slate-600 font-bold uppercase mt-0.5">Sincronize GUT e parecer técnico</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleAISuggestion} 
                        disabled={aiLoading} 
                        className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg border border-purple-400/50 font-black uppercase text-[9px] tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      >
                          {aiLoading ? <Loader2 size={11} className="animate-spin mr-1 inline"/> : <Sparkles size={11} className="mr-1 inline"/>}
                          Avaliar
                      </button>
                  </div>
                  {aiError && <p className="text-red-400 text-[8px] mt-1.5 font-black uppercase italic">{aiError}</p>}
               </div>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-3.5 h-full">
             <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-700/50 space-y-5 shadow-inner">
                <h3 className="font-black text-slate-500 text-center text-[8px] uppercase tracking-[0.2em] mb-3 border-b border-slate-800 pb-1.5">Matriz de Campo</h3>
                
                {[
                  { id: 'gravity', label: 'Gravidade', val: gravity, set: setGravity },
                  { id: 'urgency', label: 'Urgência', val: urgency, set: setUrgency },
                  { id: 'tendency', label: 'Tendência', val: tendency, set: setTendency }
                ].map((item) => (
                  <div key={item.id} className="space-y-1.5 group">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                        {item.label}
                        <Info size={9} className="text-slate-600 group-hover:text-green-500 transition-colors cursor-help" title={explanations[item.id as keyof typeof explanations]} />
                      </span>
                      <span className="text-green-500 font-black text-sm">{item.val}</span>
                    </div>
                    <input 
                      type="range" min="1" max="5" step="1"
                      value={item.val} 
                      onChange={(e) => item.set(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tight italic leading-tight text-center bg-slate-950/40 p-1 rounded-md border border-slate-800/50">
                      {getLabelForValue(item.id as any, item.val)}
                    </p>
                  </div>
                ))}
             </div>

             <div className={`flex-1 min-h-[110px] rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-700 ${scoreColor} p-3 text-center`} title="Multiplicação de G x U x T">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 opacity-60">GUT TOTAL</span>
                <span className="text-5xl font-black italic tracking-tighter drop-shadow-md">
                    {currentScore}
                </span>
                <div className="mt-2 text-[8px] font-black uppercase tracking-widest opacity-80 px-2 py-0.5 bg-black/20 rounded-full">
                    Impacto {currentScore >= 81 ? 'Extremo' : currentScore >= 36 ? 'Moderado' : 'Leve'}
                </div>
             </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-700/60">
            <div>
              {initialData && onDelete && (
                <button type="button" onClick={() => {
                   if(confirm("Confirma a exclusão permanente deste registro?")) {
                      onDelete(initialData.id);
                   }
                }} className="px-5 py-2.5 text-red-400 bg-red-950/10 border border-red-900/40 rounded-lg hover:bg-red-900/30 font-black uppercase text-[9px] tracking-widest flex items-center gap-2 transition-all shadow-lg active:scale-95">
                  <Trash2 size={14} /> Excluir Registro
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
              <button type="button" onClick={onCancel} className="px-6 py-2.5 text-slate-400 bg-slate-700/30 border border-slate-600/50 rounded-lg hover:bg-slate-700/50 font-black uppercase text-[9px] tracking-widest transition-all">Cancelar</button>
              <button type="submit" disabled={uploading} className="px-10 py-2.5 text-white bg-green-600 rounded-lg hover:bg-green-500 font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2.5 shadow-xl shadow-green-900/20 disabled:opacity-50 transition-all active:scale-95">
                  <Save size={16} /> Salvar Evento
              </button>
            </div>
        </div>
      </form>
    </div>
  );
};

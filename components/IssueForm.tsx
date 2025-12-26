
import React, { useState, useEffect, useRef } from 'react';
import { GUTIssue, Status } from '../types';
import { analyzeIssueWithAI } from '../services/geminiService';
import { uploadFileToDrive } from '../services/googleDriveService';
import { Bot, Save, Loader2, Sparkles, Trash2, X, AlertCircle, Key, Paperclip, FileText, CheckCircle2, Zap } from 'lucide-react';

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
  
  // Estados da IA
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(initialData?.aiSuggestion || null);

  // Estados de Anexo
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
      setAttachmentUrl(initialData.attachmentUrl);
      setAttachmentName(initialData.attachmentName);
    }
  }, [initialData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadFileToDrive(file);
      setAttachmentUrl(result.url);
      setAttachmentName(result.name);
    } catch (err: any) {
      alert(err.message || "Erro ao anexar arquivo.");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl(undefined);
    setAttachmentName(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAISuggestion = async () => {
    if (!isAIConnected && onConnectAI) {
      onConnectAI();
      return;
    }

    if (!title.trim() || !description.trim()) {
      alert("Preencha Título e Descrição para que a IA possa analisar o risco.");
      return;
    }
    
    setAiLoading(true);
    setAiError(null);

    try {
      const result = await analyzeIssueWithAI(title, description, area);
      if (result) {
        setGravity(result.gravity);
        setUrgency(result.urgency);
        setTendency(result.tendency);
        setAiReasoning(result.reasoning);
      }
    } catch (error: any) {
      if (error.message?.includes("API_KEY_NOT_FOUND") || error.message?.includes("AUTH")) {
        setAiError("IA Desconectada. Clique em 'Vincular Chave' para ativar.");
      } else {
        setAiError(error.message || "Falha técnica na conexão com a IA.");
      }
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
      attachmentUrl,
      attachmentName
    }, initialData?.id);
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
            {initialData ? 'Ajustar Ocorrência' : 'Nova Entrada GUT'}
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Planta de Biometano | Módulo Analítico</p>
        </div>
        <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Subsistema</label>
              <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full rounded-lg bg-slate-900 border-slate-700 text-slate-100 p-3 border outline-none font-medium">
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Evento Crítico</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg bg-slate-900 border-slate-700 text-slate-100 p-3 border outline-none font-bold" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Relato Técnico</label>
              <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg bg-slate-900 border-slate-700 text-slate-100 p-3 border outline-none text-sm" placeholder="Descreva os sintomas operacionais observados..." />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <Zap size={14} className="text-amber-400" /> Ação Imediata Recomendada
              </label>
              <textarea rows={2} value={immediateAction} onChange={(e) => setImmediateAction(e.target.value)} className="w-full rounded-lg bg-slate-900 border-slate-700 text-slate-100 p-3 border outline-none text-sm" placeholder="O que deve ser feito agora para conter o risco?" />
            </div>

            {/* Seção de Anexos */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
               <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                 <Paperclip size={14} /> Evidências (Google Drive)
               </label>
               
               {attachmentUrl ? (
                 <div className="flex items-center justify-between bg-green-900/20 border border-green-800/30 p-3 rounded-lg">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText size={18} className="text-green-500 shrink-0" />
                      <span className="text-xs text-green-100 truncate font-medium">{attachmentName}</span>
                    </div>
                    <button type="button" onClick={removeAttachment} className="p-1.5 text-red-400 hover:bg-red-900/30 rounded transition-colors">
                      <Trash2 size={16} />
                    </button>
                 </div>
               ) : (
                 <div className="relative group">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange} 
                      disabled={uploading}
                      className="hidden" 
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full py-3 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 group-hover:border-slate-500 group-hover:text-slate-300 transition-all active:scale-[0.98]"
                    >
                      {uploading ? <Loader2 size={24} className="animate-spin text-blue-500" /> : <Paperclip size={24} />}
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        {uploading ? 'Fazendo Upload...' : 'Selecionar Documento'}
                      </span>
                    </button>
                 </div>
               )}
            </div>

            <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Bot size={14} className="text-purple-400"/> IA Core
                    </h4>
                    {!isAIConnected ? (
                      <button
                          type="button"
                          onClick={onConnectAI}
                          className="text-[9px] bg-slate-700 hover:bg-purple-600 text-white px-4 py-1.5 rounded-full flex items-center gap-2 transition-all font-black uppercase tracking-widest"
                      >
                          <Key size={12}/> Vincular Chave
                      </button>
                    ) : (
                      <button
                          type="button"
                          onClick={handleAISuggestion}
                          disabled={aiLoading}
                          className="text-[9px] bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-full flex items-center gap-2 transition-all disabled:opacity-50 font-black uppercase tracking-widest shadow-lg"
                      >
                          {aiLoading ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                          {aiLoading ? 'Processando' : 'Avaliar com IA'}
                      </button>
                    )}
                </div>
                {aiError && (
                    <div className="bg-red-900/20 text-red-400 text-[10px] p-3 rounded-lg border border-red-800/30 flex items-center gap-2 mb-3">
                        <AlertCircle size={14} /> {aiError}
                    </div>
                )}
                {aiReasoning && (
                    <div className="bg-purple-900/10 text-purple-200 text-[11px] p-4 rounded-lg border border-purple-800/20 leading-relaxed italic">
                        {aiReasoning}
                    </div>
                )}
            </div>
          </div>

          <div className="space-y-8 bg-slate-900/30 p-8 rounded-xl border border-slate-700/50 shadow-inner flex flex-col justify-between">
             <div className="space-y-8">
                <h3 className="font-black text-slate-500 text-center text-[10px] uppercase tracking-[0.3em] mb-8">Escala de Risco</h3>
                
                {['gravity', 'urgency', 'tendency'].map((type) => (
                  <div key={type} className="space-y-2">
                    <label className="flex justify-between text-[11px] font-black text-slate-300 uppercase tracking-widest">
                        <span>{type === 'gravity' ? 'Gravidade' : type === 'urgency' ? 'Urgência' : 'Tendência'}</span>
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
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4 block">Resultado GUT</span>
                <span className={`text-6xl font-black px-10 py-4 rounded-2xl border-2 italic transition-all duration-500 ${scoreColor}`}>
                    {currentScore}
                </span>
             </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-4 pt-8 border-t border-slate-700">
            {initialData && onDelete && (
              <button 
                type="button" 
                onClick={() => onDelete(initialData.id)} 
                className="px-6 py-3 text-red-400 bg-red-950/20 border border-red-900/50 rounded-lg hover:bg-red-900/40 font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-2 transition-all mr-auto"
              >
                <Trash2 size={18} /> Excluir Registro
              </button>
            )}
            <button type="button" onClick={onCancel} className="px-8 py-3 text-slate-400 bg-slate-700/30 border border-slate-600 rounded-lg hover:bg-slate-700 font-black uppercase text-[11px] tracking-[0.2em]">Cancelar</button>
            <button type="submit" disabled={uploading} className="px-12 py-3 text-white bg-green-600 rounded-lg hover:bg-green-500 font-black uppercase text-[11px] tracking-[0.2em] flex items-center gap-3 shadow-2xl transition-all active:scale-95 disabled:opacity-50">
                <Save size={20} /> Salvar Registro
            </button>
        </div>
      </form>
    </div>
  );
};

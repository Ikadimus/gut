
import React, { useState, useEffect, useRef } from 'react';
import { VibrationRecord, UserRole, Equipment } from '../types';
import { vibrationService, storageService, equipmentService } from '../services/supabase';
import { analyzeVibrationWithAI } from '../services/geminiService';
import { Waves, Plus, Trash2, Camera, Cpu, Loader2, Save, X, Paperclip, Activity, Sparkles, Bot, ShieldCheck, Info, ExternalLink, Clock, Zap, Gauge, FileText, Edit2, Eye, History, ShieldAlert } from 'lucide-react';

interface VibrationManagerProps {
  areas: string[];
  userRole: UserRole;
  onViewEquipmentProfile?: (name: string) => void;
}

export const VibrationManager: React.FC<VibrationManagerProps> = ({ areas, userRole, onViewEquipmentProfile }) => {
  const [records, setRecords] = useState<VibrationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<VibrationRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const [availableEquipments, setAvailableEquipments] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Form states
  const [equipmentName, setEquipmentName] = useState('');
  const [area, setArea] = useState(areas[0] || '');
  const [overallVelocity, setOverallVelocity] = useState(2.8);
  const [acceleration, setAcceleration] = useState(0.5);
  const [peakFrequency, setPeakFrequency] = useState(60);
  const [lastInspection, setLastInspection] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [riskLevel, setRiskLevel] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDev = userRole === UserRole.DEVELOPER;
  const isEditor = userRole === UserRole.EDITOR || userRole === UserRole.ADMIN || isDev;

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    if (area) {
      equipmentService.getAllByArea(area).then(setAvailableEquipments);
    }
  }, [area]);

  useEffect(() => {
    const eq = availableEquipments.find(e => e.name === equipmentName);
    setSelectedEquipment(eq || null);
  }, [equipmentName, availableEquipments]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await vibrationService.getAll();
      setRecords(data);
    } finally { setLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const result = await storageService.uploadFile(file, 'vibration');
      setAttachmentUrl(result.url);
      setAttachmentName(result.name);
    } catch (err: any) { alert(err.message); } finally { setUploading(false); }
  };

  const removeAttachment = async () => {
    if (!attachmentUrl) return;
    if (confirm("Remover anexo permanentemente?")) {
      try {
        setUploading(true);
        await storageService.deleteFile(attachmentUrl);
        setAttachmentUrl('');
        setAttachmentName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) { alert(err.message); } finally { setUploading(false); }
    }
  };

  const handleAIAnalysis = async () => {
    if (!equipmentName) { alert("Selecione o ativo."); return; }
    setAiLoading(true);
    try {
      const result = await analyzeVibrationWithAI(equipmentName, area, overallVelocity, acceleration, peakFrequency, notes);
      if (result) {
        setAiAnalysis(result.analysis);
        setAiRecommendation(result.recommendation);
        setRiskLevel(result.riskLevel);
      }
    } finally { setAiLoading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const recordData = {
        equipmentName, area, overallVelocity, acceleration, peakFrequency, lastInspection, notes, attachmentUrl, attachmentName, aiAnalysis, aiRecommendation, riskLevel
      };
      
      if (editingId) {
        await vibrationService.update(editingId, recordData);
      } else {
        await vibrationService.create(recordData);
      }
      
      fetchRecords();
      setShowForm(false);
      resetForm();
    } finally { setLoading(false); }
  };

  const handleEdit = (record: VibrationRecord) => {
    setEditingId(record.id);
    setEquipmentName(record.equipmentName);
    setArea(record.area);
    setOverallVelocity(record.overallVelocity);
    setAcceleration(record.acceleration);
    setPeakFrequency(record.peakFrequency || 0);
    setLastInspection(record.lastInspection || new Date().toISOString().split('T')[0]);
    setNotes(record.notes || '');
    setAttachmentUrl(record.attachmentUrl || '');
    setAttachmentName(record.attachmentName || '');
    setAiAnalysis(record.aiAnalysis || '');
    setAiRecommendation(record.aiRecommendation || '');
    setRiskLevel(record.riskLevel || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja remover este laudo permanentemente?")) {
      try {
        await vibrationService.delete(id);
        fetchRecords();
      } catch (err: any) {
        alert("Erro ao excluir laudo: " + err.message);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setEquipmentName(''); setAiAnalysis(''); setAiRecommendation(''); setRiskLevel(''); setNotes(''); setAttachmentUrl(''); setAttachmentName('');
    setOverallVelocity(2.8); setAcceleration(0.5); setPeakFrequency(60);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Crítico': return 'text-red-500 border-red-500/20 bg-red-500/10';
      case 'Perigoso': return 'text-orange-500 border-orange-500/20 bg-orange-500/10';
      case 'Alerta': return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10';
      default: return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-cyan-500/10 rounded-3xl border border-cyan-500/20 text-cyan-500 shadow-xl">
              <Waves size={28} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Análise de Vibração</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Sinais Dinâmicos e Integridade Mecânica</p>
           </div>
        </div>
        {!showForm && isEditor && (
          <button onClick={() => {resetForm(); setShowForm(true);}} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-cyan-900/20 flex items-center gap-2 transition-all active:scale-95">
            <Plus size={16} /> Novo Laudo Vibracional
          </button>
        )}
      </div>

      {showForm ? (
        <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] p-8 lg:p-10 animate-slide-up ring-1 ring-white/5 shadow-2xl">
          <div className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6">
             <h3 className="text-xl font-black text-white uppercase tracking-tight italic">
               {editingId ? 'Editar Laudo Dinâmico' : 'Emissão de Laudo Dinâmico'}
             </h3>
             <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
          </div>
          
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-3 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Subsistema</label>
                  <select value={area} onChange={e => {setArea(e.target.value); setEquipmentName('');}} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none">
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ativo em Análise</label>
                  <select required value={equipmentName} onChange={e => setEquipmentName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none">
                    <option value="">Selecione...</option>
                    {availableEquipments.map(eq => <option key={eq.id} value={eq.name}>{eq.name}</option>)}
                  </select>
                </div>
              </div>

              {selectedEquipment && (
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex items-center gap-6 animate-fade-in shadow-inner">
                   <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                      {selectedEquipment.imageUrl ? (
                        <img src={selectedEquipment.imageUrl} className="w-full h-full object-cover opacity-60" alt={selectedEquipment.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700"><Cpu size={32} /></div>
                      )}
                   </div>
                   <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                         <h4 className="text-xs font-black text-white uppercase tracking-widest">Identidade Mecânica</h4>
                         {onViewEquipmentProfile && (
                           <button type="button" onClick={() => onViewEquipmentProfile(selectedEquipment.name)} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">
                             <History size={12} /> Histórico Ativo
                           </button>
                         )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-600 uppercase">TAG</p>
                            <p className="text-xs font-black text-slate-200">{selectedEquipment.tag}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-600 uppercase">Rotação Nominal</p>
                            <p className="text-xs font-black text-cyan-400">{selectedEquipment.maxRotation || 'N/A'} RPM</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Notas de Inspeção (Ruído, Folga, Temperatura local)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Descreva observações de campo..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white outline-none resize-none" />
              </div>
              
              <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Diagnóstico por Espectro (IA)</h4>
                      <p className="text-[8px] text-slate-500 font-bold uppercase">Análise baseada em severidade vibracional</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleAIAnalysis} disabled={aiLoading || !equipmentName} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-cyan-900/20">
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="inline mr-2" />}
                    Analisar Assinatura
                  </button>
                </div>
                {aiAnalysis && (
                  <div className="space-y-4 animate-fade-in border-t border-slate-800 pt-4">
                    <p className="text-[11px] text-slate-300 italic leading-relaxed bg-black/20 p-4 rounded-xl">"{aiAnalysis}"</p>
                    <div className="bg-cyan-950/30 border border-cyan-900/40 p-4 rounded-xl flex items-start gap-3">
                      <ShieldCheck size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-cyan-400 uppercase mb-1">Diretriz Preditiva:</p>
                        <p className="text-[11px] font-bold text-slate-200">{aiRecommendation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
               <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 space-y-8">
                  <h4 className="text-[9px] font-black text-slate-500 uppercase text-center tracking-widest">Parâmetros Digitais</h4>
                  <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-400">
                          <span className="flex items-center gap-1"><Activity size={12} className="text-cyan-400" /> Velocidade (mm/s)</span>
                          <span className="text-cyan-500 font-mono">{overallVelocity}</span>
                        </div>
                        <input type="range" min="0" max="25" step="0.1" value={overallVelocity} onChange={e => setOverallVelocity(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-400">
                          <span className="flex items-center gap-1"><Zap size={12} className="text-purple-400" /> Aceleração (g)</span>
                          <span className="text-purple-500 font-mono">{acceleration}</span>
                        </div>
                        <input type="range" min="0" max="5" step="0.05" value={acceleration} onChange={e => setAcceleration(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Frequência Pico (Hz)</label>
                         <input type="number" value={peakFrequency} onChange={e => setPeakFrequency(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none" />
                      </div>
                  </div>
                  <div className="pt-4 border-t border-slate-800">
                    {attachmentUrl ? (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={16} className="text-cyan-500 shrink-0" />
                          <span className="text-[9px] font-black text-slate-300 truncate uppercase tracking-widest">{attachmentName}</span>
                        </div>
                        <button type="button" onClick={removeAttachment} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-slate-800 rounded-2xl py-6 flex flex-col items-center gap-2 text-slate-600 hover:border-cyan-500/50 hover:text-cyan-400 transition-all group">
                          <Camera size={24} className="group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-black uppercase tracking-widest">Anexar Espectro/Foto</span>
                          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                      </button>
                    )}
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-cyan-900/30 transition-all active:scale-95 disabled:opacity-50">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : editingId ? 'Atualizar Laudo' : 'Salvar Laudo Vibracional'}
                  </button>
               </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {records.length === 0 ? (
             <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-800 rounded-[3rem]">
                <p className="text-slate-600 font-black uppercase text-xs tracking-[0.3em] italic">Aguardando Captura de Sinais Vibracionais.</p>
             </div>
           ) : (
             records.map(record => (
               <div key={record.id} className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden group hover:border-cyan-500/30 transition-all shadow-xl hover:shadow-cyan-500/5">
                  <div className="p-8 space-y-6">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-2xl border ${getRiskColor(record.riskLevel || '')}`}>
                              <Waves size={20} />
                           </div>
                           <div>
                              <h4 className="text-sm font-black text-white uppercase tracking-tight">{record.equipmentName}</h4>
                              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{record.area}</p>
                           </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setShowDetails(record)} className="p-2 text-slate-600 hover:text-white transition-all" title="Ver Detalhes"><Eye size={16} /></button>
                          {isEditor && (
                            <>
                              <button onClick={() => handleEdit(record)} className="p-2 text-slate-600 hover:text-cyan-400 transition-all" title="Editar Laudo"><Edit2 size={16} /></button>
                              <button onClick={() => handleDelete(record.id)} className="p-2 text-slate-600 hover:text-red-500 transition-all" title="Excluir Laudo"><Trash2 size={16}/></button>
                            </>
                          )}
                        </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                           <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Velocidade RMS</p>
                           <p className="text-xl font-black text-white italic">{record.overallVelocity}<span className="text-[9px] ml-1 uppercase opacity-50">mm/s</span></p>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                           <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Freq. Pico</p>
                           <p className="text-xl font-black text-cyan-500 italic">{record.peakFrequency || 'N/A'}<span className="text-[9px] ml-1 uppercase opacity-50">Hz</span></p>
                        </div>
                     </div>

                     <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest pt-4 border-t border-slate-800/50">
                        <span className="text-slate-600">{new Date(record.lastInspection).toLocaleDateString()}</span>
                        <span className={`px-3 py-1 rounded-lg border ${getRiskColor(record.riskLevel || '')}`}>
                           {record.riskLevel || 'Monitoramento'}
                        </span>
                     </div>
                  </div>
               </div>
             ))
           )}
        </div>
      )}

      {/* Vibration Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col lg:flex-row max-h-[90vh]">
              <div className="lg:w-1/3 bg-slate-950 p-8 flex flex-col border-r border-slate-800">
                 <div className="mb-6">
                    <div className="flex justify-between items-start">
                       <div>
                          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">{showDetails.equipmentName}</h3>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{showDetails.area}</p>
                       </div>
                       {onViewEquipmentProfile && (
                         <button onClick={() => { onViewEquipmentProfile(showDetails.equipmentName); setShowDetails(null); }} className="text-blue-500 hover:text-white transition-all"><History size={18}/></button>
                       )}
                    </div>
                 </div>

                 {showDetails.attachmentUrl ? (
                   <div className="relative rounded-3xl overflow-hidden border border-slate-800 mb-6 aspect-square group">
                      <img src={showDetails.attachmentUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Vibração" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                         <Activity size={12} className="text-cyan-500" /> Registro de Espectro
                      </div>
                   </div>
                 ) : (
                   <div className="bg-slate-900 rounded-3xl aspect-square flex flex-col items-center justify-center border border-slate-800 border-dashed text-slate-700 mb-6">
                      <Activity size={40} className="mb-2" />
                      <span className="text-[9px] font-black uppercase">Espectro não anexado</span>
                   </div>
                 )}

                 <div className="mt-auto space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase">Aceleração</span>
                       <span className="text-sm font-black text-purple-400">{showDetails.acceleration} g</span>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase">Freq. Pico</span>
                       <span className="text-sm font-black text-white">{showDetails.peakFrequency} Hz</span>
                    </div>
                 </div>
              </div>

              <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar flex flex-col">
                 <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                       <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          <Waves size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Análise Dinâmica</p>
                          <h4 className="text-lg font-black text-white uppercase tracking-tight mt-1">Laudo de Vibração Industrial</h4>
                       </div>
                    </div>
                    <button onClick={() => setShowDetails(null)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 transition-all"><X size={20}/></button>
                 </div>

                 <div className="space-y-8">
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <Clock size={16} className="text-blue-400" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inspeção realizada em:</span>
                       </div>
                       <span className="text-xs font-black text-slate-100">
                          {new Date(showDetails.lastInspection).toLocaleDateString('pt-BR', { dateStyle: 'long' })}
                       </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-between">
                          <div>
                             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Velocidade Global</p>
                             <p className="text-2xl font-black text-white italic">{showDetails.overallVelocity} mm/s</p>
                          </div>
                          <Gauge size={32} className="text-cyan-500/20" />
                       </div>
                       <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-between">
                          <div>
                             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Nível de Risco</p>
                             <p className={`text-xl font-black uppercase ${getRiskColor(showDetails.riskLevel || '').split(' ')[0]}`}>{showDetails.riskLevel || 'Normal'}</p>
                          </div>
                          <ShieldAlert size={32} className="opacity-20" />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Bot size={14} className="text-cyan-400" /> Diagnóstico do Espectro (IA)
                       </h5>
                       <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl">
                          <p className="text-xs text-slate-300 leading-relaxed italic">"{showDetails.aiAnalysis || 'Diagnóstico automático pendente.'}"</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <ShieldCheck size={14} className="text-green-400" /> Conduta Preditiva
                       </h5>
                       <div className="bg-green-950/20 border border-green-900/40 p-6 rounded-3xl">
                          <p className="text-xs text-slate-100 font-bold leading-relaxed">{showDetails.aiRecommendation || 'Aguardando avaliação técnica.'}</p>
                       </div>
                    </div>

                    {showDetails.notes && (
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Info size={14} className="text-blue-400" /> Observações Operacionais
                        </h5>
                        <div className="bg-blue-950/10 border border-blue-900/30 p-6 rounded-3xl">
                            <p className="text-xs text-blue-100 italic leading-relaxed">{showDetails.notes}</p>
                        </div>
                      </div>
                    )}
                 </div>

                 <div className="mt-auto pt-10 flex justify-end gap-3">
                    <button onClick={() => setShowDetails(null)} className="bg-slate-800 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-slate-700 transition-all">Fechar Laudo</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

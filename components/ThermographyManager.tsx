
import React, { useState, useEffect, useRef } from 'react';
import { ThermographyRecord, UserRole, Equipment } from '../types';
import { thermographyService, storageService, equipmentService } from '../services/supabase';
import { analyzeThermographyWithAI } from '../services/geminiService';
import { Thermometer, Plus, Trash2, Camera, MapPin, Gauge, Loader2, Save, X, Paperclip, FileText, TrendingUp, AlertTriangle, Sparkles, Bot, ShieldCheck, Cpu, Eye, Info, ExternalLink, CloudSun, Activity } from 'lucide-react';

interface ThermographyManagerProps {
  areas: string[];
  userRole: UserRole;
}

export const ThermographyManager: React.FC<ThermographyManagerProps> = ({ areas, userRole }) => {
  const [records, setRecords] = useState<ThermographyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState<ThermographyRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Equipments list based on area
  const [availableEquipments, setAvailableEquipments] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  // Form states
  const [equipmentName, setEquipmentName] = useState('');
  const [area, setArea] = useState(areas[0] || '');
  const [currentTemp, setCurrentTemp] = useState(40);
  const [maxTemp, setMaxTemp] = useState(85);
  const [minTemp, setMinTemp] = useState(25); 
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

  // Efeito para carregar o DNA do Ativo quando selecionado
  useEffect(() => {
    if (equipmentName) {
      const eq = availableEquipments.find(e => e.name === equipmentName);
      if (eq) {
        setSelectedEquipment(eq);
        if (eq.maxTemp) setMaxTemp(eq.maxTemp);
        if (eq.minTemp) setMinTemp(eq.minTemp);
      }
    } else {
      setSelectedEquipment(null);
    }
  }, [equipmentName]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await thermographyService.getAll();
      setRecords(data);
    } finally { setLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const result = await storageService.uploadFile(file, 'thermography');
      setAttachmentUrl(result.url);
      setAttachmentName(result.name);
    } finally { setUploading(false); }
  };

  const handleAIAnalysis = async () => {
    if (!equipmentName) { alert("Selecione o equipamento."); return; }
    setAiLoading(true);
    try {
      const result = await analyzeThermographyWithAI(equipmentName, area, currentTemp, maxTemp, minTemp, notes);
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
      await thermographyService.create({ 
        equipmentName, 
        area, 
        currentTemp, 
        maxTemp, 
        minTemp, 
        lastInspection, 
        notes, 
        attachmentUrl, 
        attachmentName, 
        aiAnalysis, 
        aiRecommendation, 
        riskLevel 
      });
      fetchRecords(); 
      setShowForm(false); 
      resetForm();
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setEquipmentName(''); 
    setAiAnalysis(''); 
    setAiRecommendation(''); 
    setRiskLevel(''); 
    setNotes(''); 
    setAttachmentUrl(''); 
    setAttachmentName('');
    setSelectedEquipment(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight uppercase">
            <Thermometer className="text-orange-500" /> Monitoramento Termográfico
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Gestão de Ativos em Tempo Real</p>
        </div>
        {!showForm && isEditor && (
          <button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-orange-900/20 flex items-center gap-2 transition-all active:scale-95">
            <Plus size={16} /> Novo Laudo Térmico
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-slate-900/90 border border-slate-700 rounded-[2.5rem] p-8 lg:p-10 animate-slide-up ring-1 ring-white/5 shadow-2xl">
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
             <h3 className="text-xl font-black text-white uppercase tracking-tight">Emissão de Laudo Técnico</h3>
             <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
          </div>
          
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-3 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Subsistema Operacional</label>
                  <select value={area} onChange={e => {setArea(e.target.value); setEquipmentName('');}} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 outline-none focus:border-orange-500/50 transition-all">
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ativo Crítico</label>
                  <select required value={equipmentName} onChange={e => setEquipmentName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 outline-none focus:border-orange-500/50 transition-all">
                    <option value="">Selecione o ativo...</option>
                    {availableEquipments.map(eq => <option key={eq.id} value={eq.name}>{eq.name}</option>)}
                  </select>
                </div>
              </div>

              {selectedEquipment && (
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 flex items-center gap-6 animate-fade-in shadow-inner">
                   <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                      {selectedEquipment.imageUrl ? (
                        <img src={selectedEquipment.imageUrl} className="w-full h-full object-cover" alt={selectedEquipment.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700"><Cpu size={32} /></div>
                      )}
                   </div>
                   <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                         <h4 className="text-xs font-black text-white uppercase tracking-widest">DNA do Ativo Carregado</h4>
                         <span className="px-2 py-0.5 bg-green-900/20 text-green-500 text-[8px] font-black uppercase rounded border border-green-800/30">Sync OK</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-600 uppercase">Rotação Máxima</p>
                            <p className="text-xs font-black text-blue-400">{selectedEquipment.maxRotation || 'N/A'} RPM</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-600 uppercase">Range Operação</p>
                            <p className="text-xs font-black text-slate-300">{selectedEquipment.minTemp}°C a {selectedEquipment.maxTemp}°C</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Observações de Campo (Sintomas Técnicos)</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  rows={3} 
                  placeholder="Relate ruídos, vibrações ou anomalias observadas. Se o ativo estiver em rotação máxima, descreva..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-100 outline-none focus:border-orange-500/50 transition-all resize-none"
                />
              </div>
              
              <div className="bg-slate-950/40 border border-slate-800 rounded-[1.5rem] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <Bot size={20} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-200 uppercase tracking-widest">IA Diagnostic Engine</h4>
                      <p className="text-[8px] text-slate-500 font-bold uppercase">Análise Preditiva com Base no DNA do Ativo</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleAIAnalysis} disabled={aiLoading || !equipmentName} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-purple-900/20">
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="inline mr-2" />}
                    {aiLoading ? 'Processando...' : 'Avaliar Termografia'}
                  </button>
                </div>
                {aiAnalysis && (
                  <div className="space-y-4 animate-fade-in border-t border-slate-800 pt-4">
                    <p className="text-[11px] text-slate-300 italic leading-relaxed bg-black/20 p-4 rounded-xl">"{aiAnalysis}"</p>
                    <div className="bg-purple-950/30 border border-purple-900/40 p-4 rounded-xl flex items-start gap-3">
                      <ShieldCheck size={18} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-purple-400 uppercase mb-1">Recomendação de Engenharia:</p>
                        <p className="text-[11px] font-bold text-slate-200">{aiRecommendation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1 flex flex-col gap-6">
               <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 space-y-8 shadow-inner">
                  <h4 className="text-[9px] font-black text-slate-500 uppercase text-center tracking-widest">Parâmetros Atuais</h4>
                  
                  <div className="space-y-7">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-400">
                          <span className="flex items-center gap-1"><CloudSun size={12} className="text-blue-400" /> Temp. Ambiente</span>
                          <span className="text-blue-500 font-mono text-base">{minTemp}°C</span>
                        </div>
                        <input type="range" min="0" max="60" value={minTemp} onChange={e => setMinTemp(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-400">
                          <span className="flex items-center gap-1"><Gauge size={12} className="text-orange-400" /> Temp. Atual</span>
                          <span className="text-orange-500 font-mono text-base">{currentTemp}°C</span>
                        </div>
                        <input type="range" min="0" max="150" value={currentTemp} onChange={e => setCurrentTemp(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-slate-400">
                          <span className="flex items-center gap-1"><AlertTriangle size={12} className="text-red-400" /> Limite Ativo</span>
                          <span className="text-red-500 font-mono text-base">{maxTemp}°C</span>
                        </div>
                        <input type="range" min="30" max="180" value={maxTemp} onChange={e => setMaxTemp(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500" />
                      </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full border-2 border-dashed border-slate-800 rounded-2xl py-6 flex flex-col items-center gap-2 text-slate-600 hover:border-orange-500/50 hover:text-orange-400 transition-all group">
                        {uploading ? <Loader2 size={24} className="animate-spin text-orange-500" /> : <Camera size={24} className="group-hover:scale-110 transition-transform" />}
                        <span className="text-[9px] font-black uppercase tracking-widest">{attachmentName || 'Capturar Imagem Térmica'}</span>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    </button>
                  </div>

                  <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-orange-900/30 transition-all active:scale-95">Salvar Laudo</button>
               </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-orange-500" size={48} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-900/40 border border-slate-800 border-dashed rounded-[2rem]">
                <p className="text-slate-600 font-black uppercase text-xs tracking-widest italic">Nenhum laudo térmico registrado.</p>
            </div>
          ) : (
            records.map(record => {
              const stress = record.currentTemp / record.maxTemp;
              const isCritical = record.currentTemp >= record.maxTemp;
              const isWarning = stress >= 0.8 && !isCritical;
              
              return (
                <div key={record.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden group hover:border-orange-500/30 transition-all shadow-xl hover:shadow-orange-500/5">
                  <div className="p-7 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                         <div className={`p-3 rounded-2xl border ${isCritical ? 'bg-red-500/10 border-red-500/20 text-red-500' : isWarning ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-green-500/10 border-green-500/20 text-green-500'}`}>
                           <Cpu size={20} />
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-slate-100 uppercase truncate max-w-[140px]">{record.equipmentName}</h4>
                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{record.area}</p>
                         </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setShowDetails(record)} className="p-2 text-slate-600 hover:text-white transition-all"><Eye size={16} /></button>
                        {isDev && (
                          <button onClick={() => { if(confirm("Remover laudo?")) thermographyService.delete(record.id).then(fetchRecords); }} className="p-2 text-slate-600 hover:text-red-400 transition-all"><Trash2 size={16} /></button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-end justify-between">
                       <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Temperatura de Operação</p>
                          <div className="flex items-baseline gap-1">
                             <span className={`text-3xl font-black italic tracking-tighter ${isCritical ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-slate-100'}`}>
                               {record.currentTemp}
                             </span>
                             <span className="text-xs font-black text-slate-600 uppercase">°C</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Limite do Ativo</p>
                          <p className="text-sm font-black text-slate-400 font-mono">{record.maxTemp}°C</p>
                       </div>
                    </div>

                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                       <div 
                         className={`h-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : 'bg-green-500'}`} 
                         style={{ width: `${Math.min(100, (record.currentTemp / record.maxTemp) * 100)}%` }}
                       ></div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                       <span className="text-slate-600">{new Date(record.lastInspection).toLocaleDateString()}</span>
                       <span className={`px-2.5 py-1 rounded-lg border ${isCritical ? 'bg-red-950/20 border-red-900/50 text-red-500' : isWarning ? 'bg-orange-950/20 border-orange-900/50 text-orange-500' : 'bg-green-950/20 border-green-900/50 text-green-500'}`}>
                          {record.riskLevel || (isCritical ? 'Crítico' : 'Normal')}
                       </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL DE DETALHES DA TERMOGRAFIA - SEM ALTERAÇÕES NESTA VERSÃO */}
      {showDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col lg:flex-row max-h-[90vh]">
              
              <div className="lg:w-1/3 bg-slate-950 p-8 flex flex-col border-r border-slate-800">
                 <div className="mb-6">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">{showDetails.equipmentName}</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{showDetails.area}</p>
                 </div>

                 {showDetails.attachmentUrl ? (
                   <div className="relative rounded-3xl overflow-hidden border border-slate-800 mb-6 aspect-square group">
                      <img src={showDetails.attachmentUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Termografia" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                         <Camera size={12} className="text-orange-500" /> Registro Térmico Original
                      </div>
                   </div>
                 ) : (
                   <div className="bg-slate-900 rounded-3xl aspect-square flex flex-col items-center justify-center border border-slate-800 border-dashed text-slate-700 mb-6">
                      <Camera size={40} className="mb-2" />
                      <span className="text-[9px] font-black uppercase">Imagem não disponível</span>
                   </div>
                 )}

                 <div className="mt-auto space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase">Temp. Ambiente</span>
                       <span className="text-sm font-black text-blue-400">{showDetails.minTemp}°C</span>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase">Delta T</span>
                       <span className="text-sm font-black text-white">{showDetails.currentTemp - showDetails.minTemp}°C</span>
                    </div>
                 </div>
              </div>

              <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar flex flex-col">
                 <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                       <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          <Thermometer size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Status de Integridade</p>
                          <h4 className="text-lg font-black text-white uppercase tracking-tight mt-1">Laudo Técnico Preditivo</h4>
                       </div>
                    </div>
                    <button onClick={() => setShowDetails(null)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 transition-all"><X size={20}/></button>
                 </div>

                 <div className="space-y-8">
                    <div className="space-y-3">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Bot size={14} className="text-purple-400" /> Parecer Digital (IA Core)
                       </h5>
                       <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl">
                          <p className="text-xs text-slate-300 leading-relaxed italic">"{showDetails.aiAnalysis || 'Análise automática indisponível.'}"</p>
                       </div>
                    </div>

                    <div className="space-y-3">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                          <ShieldCheck size={14} className="text-green-400" /> Ações Sugeridas
                       </h5>
                       <div className="bg-green-950/20 border border-green-900/40 p-6 rounded-3xl">
                          <p className="text-xs text-slate-100 font-bold leading-relaxed">{showDetails.aiRecommendation || 'Verificar manualmente.'}</p>
                       </div>
                    </div>

                    {showDetails.notes && (
                      <div className="space-y-3">
                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Info size={14} className="text-blue-400" /> Observações do Operador
                        </h5>
                        <div className="bg-blue-950/10 border border-blue-900/30 p-6 rounded-3xl">
                            <p className="text-xs text-blue-100 italic leading-relaxed">{showDetails.notes}</p>
                        </div>
                      </div>
                    )}
                 </div>

                 <div className="mt-auto pt-10 flex justify-end">
                    <button onClick={() => setShowDetails(null)} className="ml-auto bg-slate-800 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-slate-700 transition-all">Fechar Laudo</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

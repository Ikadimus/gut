
import React, { useState, useEffect, useRef } from 'react';
import { Equipment, ThermographyRecord, VibrationRecord, GUTIssue, UserRole } from '../types';
import { equipmentService, thermographyService, vibrationService, issueService, storageService } from '../services/supabase';
import { DetailsModal } from './DetailsModal';
import { Cpu, ShieldCheck, History, Droplets, Wrench, Calendar, Thermometer, AlertTriangle, Activity, X, Info, ExternalLink, Camera, Loader2, Save, ArrowLeft, Tag, Waves, Bot, Clock, Gauge, ShieldAlert } from 'lucide-react';

interface EquipmentProfileProps {
  equipmentName: string;
  onClose: () => void;
  userRole: UserRole;
}

export const EquipmentProfile: React.FC<EquipmentProfileProps> = ({ equipmentName, onClose, userRole }) => {
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [thermoHistory, setThermoHistory] = useState<ThermographyRecord[]>([]);
  const [vibrationHistory, setVibrationHistory] = useState<VibrationRecord[]>([]);
  const [gutHistory, setGutHistory] = useState<GUTIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // States for Details View
  const [selectedGUT, setSelectedGUT] = useState<GUTIssue | null>(null);
  const [selectedThermo, setSelectedThermo] = useState<ThermographyRecord | null>(null);
  const [selectedVib, setSelectedVib] = useState<VibrationRecord | null>(null);

  // Edit fields
  const [tag, setTag] = useState('');
  const [name, setName] = useState('');
  const [lastLub, setLastLub] = useState('');
  const [lastMaint, setLastMaint] = useState('');
  const [techDesc, setTechDesc] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [minRot, setMinRot] = useState(0);
  const [maxRot, setMaxRot] = useState(3600);
  const [minTemp, setMinTemp] = useState(20);
  const [maxTemp, setMaxTemp] = useState(85);
  const [installDate, setInstallDate] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditor = userRole !== UserRole.VIEWER;

  useEffect(() => {
    fetchData();
  }, [equipmentName]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eq, thermo, vib, gut] = await Promise.all([
        equipmentService.getByName(equipmentName),
        thermographyService.getByEquipment(equipmentName),
        vibrationService.getByEquipment(equipmentName),
        issueService.getByEquipment(equipmentName)
      ]);
      setEquipment(eq);
      setThermoHistory(thermo);
      setVibrationHistory(vib);
      setGutHistory(gut);
      
      if (eq) {
        setTag(eq.tag || '');
        setName(eq.name);
        setLastLub(eq.lastLubrication || '');
        setLastMaint(eq.lastMaintenance || '');
        setTechDesc(eq.technicalDescription || '');
        setImageUrl(eq.imageUrl || '');
        setMinRot(eq.minRotation || 0);
        setMaxRot(eq.maxRotation || 3600);
        setMinTemp(eq.minTemp || 20);
        setMaxTemp(eq.maxTemp || 85);
        setInstallDate(eq.installationDate || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const result = await storageService.uploadFile(file, 'assets');
      setImageUrl(result.url);
    } catch (err: any) {
      alert("Erro ao carregar nova foto: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateAsset = async () => {
    if (!equipment) return;
    try {
      setLoading(true);
      await equipmentService.update(equipment.id, {
        tag: tag.trim(),
        name: name.trim(),
        lastLubrication: lastLub,
        lastMaintenance: lastMaint,
        technicalDescription: techDesc,
        imageUrl: imageUrl,
        minRotation: minRot,
        maxRotation: maxRot,
        minTemp: minTemp,
        maxTemp: maxTemp,
        installationDate: installDate
      });
      await fetchData();
      setEditing(false);
    } catch (err: any) {
      alert("Erro crítico ao atualizar ativo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Crítico': return 'text-red-500 border-red-500/20 bg-red-500/10';
      case 'Perigoso': return 'text-orange-500 border-orange-500/20 bg-orange-500/10';
      case 'Alerta': return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10';
      default: return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
    }
  };

  if (loading && !equipment) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
       <Loader2 size={48} className="text-orange-500 animate-spin mb-4" />
       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Acessando DNA do Ativo: {equipmentName}</p>
    </div>
  );

  if (!equipment) return (
    <div className="py-20 text-center">
       <p className="text-slate-500 font-black uppercase text-xs">Ativo não localizado no sistema.</p>
       <button onClick={onClose} className="mt-4 text-blue-500 font-black uppercase text-[10px] tracking-widest">Voltar para Ativos</button>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-12">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-6">
             <button onClick={onClose} className="p-4 bg-slate-900 hover:bg-slate-800 rounded-2xl text-slate-500 transition-all group">
                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
             </button>
             <div>
                <div className="flex items-center gap-3">
                   <span className="px-3 py-1 bg-orange-600/10 text-orange-500 border border-orange-500/30 rounded-lg text-sm font-black uppercase tracking-widest">
                      {equipment.tag}
                   </span>
                   <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">{equipment.name}</h2>
                </div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">{equipment.areaName} • Perfil de Ativo Preditivo</p>
             </div>
          </div>
          {isEditor && (
            <button onClick={() => setEditing(!editing)} className={`px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${editing ? 'bg-red-900/30 text-red-500 border border-red-900/50' : 'bg-blue-600 text-white shadow-xl shadow-blue-900/20'}`}>
              {editing ? <X size={16}/> : <Wrench size={16}/>}
              {editing ? 'Cancelar Edição' : 'Atualizar Ativo'}
            </button>
          )}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl sticky top-8">
                <div className={`aspect-video bg-slate-950 relative group ${editing ? 'cursor-pointer' : ''}`} onClick={() => editing && fileInputRef.current?.click()}>
                   {imageUrl ? (
                     <img src={imageUrl} className={`w-full h-full object-cover transition-all ${editing ? 'opacity-40 hover:opacity-20' : 'opacity-60 group-hover:opacity-100'}`} alt={equipment.name} />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-800"><Cpu size={64}/></div>
                   )}
                   
                   {editing && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        {uploading ? <Loader2 size={32} className="animate-spin text-blue-500" /> : <Camera size={32} className="text-blue-500" />}
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest text-center px-4">Alterar Foto do Ativo</span>
                     </div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
                   {!editing && (
                     <div className="absolute bottom-6 left-6">
                       <span className="px-3 py-1 bg-green-500 text-white text-[9px] font-black uppercase rounded-lg tracking-widest shadow-lg">Ativo Online</span>
                     </div>
                   )}
                   <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                </div>
                
                <div className="p-8 space-y-8">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                         <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Rotação Max</p>
                         {editing ? (
                            <input type="number" value={maxRot} onChange={e => setMaxRot(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-xs text-blue-400 p-1 rounded font-black outline-none" />
                         ) : (
                            <p className="text-xl font-black text-blue-400">{equipment.maxRotation || '0'} <span className="text-[10px] uppercase">RPM</span></p>
                         )}
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                         <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Temp. Max</p>
                         {editing ? (
                            <input type="number" value={maxTemp} onChange={e => setMaxTemp(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 text-xs text-red-400 p-1 rounded font-black outline-none" />
                         ) : (
                            <p className="text-xl font-black text-red-400">{equipment.maxTemp || '0'} <span className="text-[10px] uppercase">°C</span></p>
                         )}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Identificação Técnica (TAG)</label>
                        <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-800">
                           <Tag size={18} className="text-blue-500 shrink-0" />
                           {editing ? (
                             <input type="text" value={tag} onChange={e => setTag(e.target.value)} className="bg-slate-900 border border-slate-700 text-[10px] text-white p-2 rounded outline-none flex-1 ml-4 uppercase font-black" />
                           ) : (
                             <span className="text-xs font-black text-slate-100">{equipment.tag}</span>
                           )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Última Manutenção</label>
                        <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-800">
                           <Wrench size={18} className="text-orange-500 shrink-0" />
                           {editing ? (
                             <input type="date" value={lastMaint} onChange={e => setLastMaint(e.target.value)} className="bg-slate-900 border border-slate-700 text-[10px] text-white p-2 rounded outline-none flex-1 ml-4" />
                           ) : (
                             <span className="text-xs font-black text-slate-100">{lastMaint ? new Date(lastMaint).toLocaleDateString() : 'N/A'}</span>
                           )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Última Lubrificação</label>
                        <div className="flex items-center justify-between p-4 bg-slate-950/40 rounded-2xl border border-slate-800">
                           <Droplets size={18} className="text-blue-500 shrink-0" />
                           {editing ? (
                             <input type="date" value={lastLub} onChange={e => setLastLub(e.target.value)} className="bg-slate-900 border border-slate-700 text-[10px] text-white p-2 rounded outline-none flex-1 ml-4" />
                           ) : (
                             <span className="text-xs font-black text-slate-100">{lastLub ? new Date(lastLub).toLocaleDateString() : 'N/A'}</span>
                           )}
                        </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                         <Info size={14} className="text-slate-600" /> Descrição Técnica
                      </h4>
                      {editing ? (
                        <textarea value={techDesc} onChange={e => setTechDesc(e.target.value)} rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white outline-none resize-none" placeholder="Detalhes de componentes, modelo, marca..." />
                      ) : (
                        <p className="text-xs text-slate-400 leading-relaxed italic">{techDesc || 'Nenhuma descrição técnica cadastrada para este ativo.'}</p>
                      )}
                   </div>

                   {editing && (
                     <button onClick={handleUpdateAsset} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Salvar Alterações
                     </button>
                   )}
                </div>
             </div>
          </div>

          <div className="lg:col-span-8 space-y-10">
             {/* HISTÓRICO DE TERMOGRAFIA */}
             <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-600/10 text-orange-500 rounded-xl border border-orange-500/20">
                         <Thermometer size={20} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-white uppercase tracking-tight">Histórico de Termografia</h3>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Leituras e Tendências Térmicas</p>
                      </div>
                   </div>
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">{thermoHistory.length} Registros</span>
                </div>

                <div className="space-y-4">
                   {thermoHistory.length === 0 ? (
                     <p className="text-slate-700 text-center py-16 uppercase text-[10px] font-black tracking-widest italic border-2 border-dashed border-slate-800 rounded-[2rem]">Sem histórico térmico disponível.</p>
                   ) : (
                     thermoHistory.map(record => {
                       const isCritical = record.currentTemp >= record.maxTemp;
                       return (
                         <div key={record.id} className="bg-slate-950/60 border border-slate-800 p-6 rounded-3xl flex items-center justify-between group hover:border-orange-500/30 transition-all">
                            <div className="flex items-center gap-6">
                               <div className={`p-4 rounded-2xl ${isCritical ? 'bg-red-500/10 text-red-500' : 'bg-slate-900 text-slate-500'}`}>
                                  <Thermometer size={20} />
                               </div>
                               <div>
                                  <p className="text-xs font-black text-white uppercase">{new Date(record.lastInspection).toLocaleDateString('pt-BR', { dateStyle: 'long' })}</p>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Sincronizado em: {new Date(record.createdAt).toLocaleString('pt-BR')}</p>
                               </div>
                            </div>
                            <div className="text-right flex items-center gap-10">
                               <div>
                                  <p className="text-[9px] font-black text-slate-600 uppercase">Temperatura</p>
                                  <p className={`text-xl font-black italic ${isCritical ? 'text-red-500' : 'text-slate-100'}`}>{record.currentTemp}°C</p>
                               </div>
                               <div>
                                  <button onClick={() => setSelectedThermo(record)} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"><ExternalLink size={18}/></button>
                               </div>
                            </div>
                         </div>
                       );
                     })
                   )}
                </div>
             </div>

             {/* HISTÓRICO DE VIBRAÇÃO */}
             <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-cyan-600/10 text-cyan-500 rounded-xl border border-cyan-500/20">
                         <Waves size={20} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-white uppercase tracking-tight">Histórico de Vibração</h3>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Sinais Dinâmicos e Severidade Mecânica</p>
                      </div>
                   </div>
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">{vibrationHistory.length} Registros</span>
                </div>

                <div className="space-y-4">
                   {vibrationHistory.length === 0 ? (
                     <p className="text-slate-700 text-center py-16 uppercase text-[10px] font-black tracking-widest italic border-2 border-dashed border-slate-800 rounded-[2rem]">Sem histórico vibracional disponível.</p>
                   ) : (
                     vibrationHistory.map(record => (
                       <div key={record.id} className="bg-slate-950/60 border border-slate-800 p-6 rounded-3xl flex items-center justify-between group hover:border-cyan-500/30 transition-all">
                          <div className="flex items-center gap-6">
                             <div className={`p-4 rounded-2xl bg-slate-900 text-cyan-500`}>
                                <Waves size={20} />
                             </div>
                             <div>
                                <p className="text-xs font-black text-white uppercase">{new Date(record.lastInspection).toLocaleDateString('pt-BR', { dateStyle: 'long' })}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{record.riskLevel || 'Análise Normal'}</p>
                             </div>
                          </div>
                          <div className="text-right flex items-center gap-10">
                             <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase">Velocidade RMS</p>
                                <p className="text-xl font-black italic text-slate-100">{record.overallVelocity} <span className="text-[10px] uppercase ml-1 opacity-50 font-sans">mm/s</span></p>
                             </div>
                             <div>
                                <button onClick={() => setSelectedVib(record)} className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"><ExternalLink size={18}/></button>
                             </div>
                          </div>
                       </div>
                     ))
                   )}
                </div>
             </div>

             {/* HISTÓRICO DE OCORRÊNCIAS GUT */}
             <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-600/10 text-red-500 rounded-xl border border-red-500/20">
                         <AlertTriangle size={20} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-white uppercase tracking-tight">Registro de Ocorrências</h3>
                         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Eventos de Manutenção e Matriz GUT</p>
                      </div>
                   </div>
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">{gutHistory.length} Eventos</span>
                </div>

                <div className="space-y-4">
                   {gutHistory.length === 0 ? (
                     <p className="text-slate-700 text-center py-16 uppercase text-[10px] font-black tracking-widest italic border-2 border-dashed border-slate-800 rounded-[2rem]">Sem eventos críticos registrados.</p>
                   ) : (
                     gutHistory.map(issue => (
                       <div key={issue.id} className="bg-slate-950/60 border border-slate-800 p-6 rounded-3xl group hover:border-red-500/30 transition-all">
                          <div className="flex justify-between items-start mb-4">
                             <div>
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">{new Date(issue.createdAt).toLocaleDateString()}</p>
                                <h4 className="text-sm font-black text-white uppercase tracking-tight">{issue.title}</h4>
                             </div>
                             <div className="px-3 py-1 bg-red-900/20 text-red-500 border border-red-900/50 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                Score {issue.score}
                             </div>
                          </div>
                          <p className="text-xs text-slate-500 italic leading-relaxed line-clamp-2">"{issue.description}"</p>
                          <div className="mt-4 pt-4 border-t border-slate-900 flex justify-between items-center">
                             <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${issue.status === 'Resolvido' ? 'bg-green-900/20 text-green-500' : 'bg-blue-900/20 text-blue-500'}`}>{issue.status}</span>
                             <button onClick={() => setSelectedGUT(issue)} className="text-[9px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1">Ver Detalhes <ExternalLink size={10}/></button>
                          </div>
                       </div>
                     ))
                   )}
                </div>
             </div>
          </div>
       </div>

       {/* MODAL GUT DETAILS */}
       {selectedGUT && <DetailsModal issue={selectedGUT} onClose={() => setSelectedGUT(null)} />}

       {/* MODAL THERMO DETAILS */}
       {selectedThermo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col lg:flex-row max-h-[90vh]">
              <div className="lg:w-1/3 bg-slate-950 p-8 flex flex-col border-r border-slate-800">
                 <div className="mb-6">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">{selectedThermo.equipmentName}</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{selectedThermo.area}</p>
                 </div>
                 {selectedThermo.attachmentUrl ? (
                   <div className="relative rounded-3xl overflow-hidden border border-slate-800 mb-6 aspect-square">
                      <img src={selectedThermo.attachmentUrl} className="w-full h-full object-cover" alt="Termografia" />
                   </div>
                 ) : (
                   <div className="bg-slate-900 rounded-3xl aspect-square flex flex-col items-center justify-center border border-slate-800 border-dashed text-slate-700 mb-6"><Camera size={40}/></div>
                 )}
                 <div className="mt-auto space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Temp. Ambiente</span>
                       <span className="text-sm font-black text-blue-400">{selectedThermo.minTemp}°C</span>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Delta T</span>
                       <span className="text-sm font-black text-white">{selectedThermo.currentTemp - selectedThermo.minTemp}°C</span>
                    </div>
                 </div>
              </div>
              <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar flex flex-col">
                 <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                       <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20"><Thermometer size={24} /></div>
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Status de Integridade</p>
                          <h4 className="text-lg font-black text-white uppercase tracking-tight mt-1">Laudo Técnico Preditivo</h4>
                       </div>
                    </div>
                    <button onClick={() => setSelectedThermo(null)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 transition-all"><X size={20}/></button>
                 </div>
                 <div className="space-y-8">
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                       <div className="flex items-center gap-3"><Clock size={16} className="text-blue-400" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data do Laudo:</span></div>
                       <span className="text-xs font-black text-slate-100">{new Date(selectedThermo.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="space-y-3">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Bot size={14} className="text-purple-400" /> Parecer Digital (IA Core)</h5>
                       <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl"><p className="text-xs text-slate-300 italic leading-relaxed">"{selectedThermo.aiAnalysis || 'Análise indisponível.'}"</p></div>
                    </div>
                    <div className="space-y-3">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} className="text-green-400" /> Ações Sugeridas</h5>
                       <div className="bg-green-950/20 border border-green-900/40 p-6 rounded-3xl"><p className="text-xs text-slate-100 font-bold leading-relaxed">{selectedThermo.aiRecommendation || 'Verificar manualmente.'}</p></div>
                    </div>
                 </div>
                 <div className="mt-auto pt-10 flex justify-end"><button onClick={() => setSelectedThermo(null)} className="bg-slate-800 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-slate-700 transition-all">Fechar Laudo</button></div>
              </div>
           </div>
        </div>
       )}

       {/* MODAL VIB DETAILS */}
       {selectedVib && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md animate-fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col lg:flex-row max-h-[90vh]">
              <div className="lg:w-1/3 bg-slate-950 p-8 flex flex-col border-r border-slate-800">
                 <div className="mb-6">
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">{selectedVib.equipmentName}</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{selectedVib.area}</p>
                 </div>
                 {selectedVib.attachmentUrl ? (
                   <div className="relative rounded-3xl overflow-hidden border border-slate-800 mb-6 aspect-square">
                      <img src={selectedVib.attachmentUrl} className="w-full h-full object-cover" alt="Vibração" />
                   </div>
                 ) : (
                   <div className="bg-slate-900 rounded-3xl aspect-square flex flex-col items-center justify-center border border-slate-800 border-dashed text-slate-700 mb-6"><Activity size={40}/></div>
                 )}
                 <div className="mt-auto space-y-4">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Aceleração</span>
                       <span className="text-sm font-black text-purple-400">{selectedVib.acceleration} g</span>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Freq. Pico</span>
                       <span className="text-sm font-black text-white">{selectedVib.peakFrequency} Hz</span>
                    </div>
                 </div>
              </div>
              <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar flex flex-col">
                 <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                       <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"><Waves size={24} /></div>
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Análise Dinâmica</p>
                          <h4 className="text-lg font-black text-white uppercase tracking-tight mt-1">Laudo de Vibração Industrial</h4>
                       </div>
                    </div>
                    <button onClick={() => setSelectedVib(null)} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-400 transition-all"><X size={20}/></button>
                 </div>
                 <div className="space-y-8">
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                       <div className="flex items-center gap-3"><Clock size={16} className="text-blue-400" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inspeção em:</span></div>
                       <span className="text-xs font-black text-slate-100">{new Date(selectedVib.lastInspection).toLocaleDateString()}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-between">
                          <div><p className="text-[8px] font-black text-slate-500 uppercase mb-1">Velocidade Global</p><p className="text-2xl font-black text-white italic">{selectedVib.overallVelocity} mm/s</p></div>
                          <Gauge size={32} className="text-cyan-500/20" />
                       </div>
                       <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex items-center justify-between">
                          <div><p className="text-[8px] font-black text-slate-500 uppercase mb-1">Nível de Risco</p><p className={`text-xl font-black uppercase ${getRiskColor(selectedVib.riskLevel || '').split(' ')[0]}`}>{selectedVib.riskLevel || 'Normal'}</p></div>
                          <ShieldAlert size={32} className="opacity-20" />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Bot size={14} className="text-cyan-400" /> Diagnóstico (IA)</h5>
                       <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl"><p className="text-xs text-slate-300 italic leading-relaxed">"{selectedVib.aiAnalysis || 'Pendente.'}"</p></div>
                    </div>
                    <div className="space-y-3">
                       <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14} className="text-green-400" /> Conduta Preditiva</h5>
                       <div className="bg-green-950/20 border border-green-900/40 p-6 rounded-3xl"><p className="text-xs text-slate-100 font-bold leading-relaxed">{selectedVib.aiRecommendation || 'Aguardando avaliação.'}</p></div>
                    </div>
                 </div>
                 <div className="mt-auto pt-10 flex justify-end"><button onClick={() => setSelectedVib(null)} className="bg-slate-800 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-slate-700 transition-all">Fechar Laudo</button></div>
              </div>
           </div>
        </div>
       )}
    </div>
  );
};

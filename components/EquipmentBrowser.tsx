
import React, { useState, useEffect, useRef } from 'react';
import { Equipment, ThermographyRecord, UserRole } from '../types';
import { equipmentService, thermographyService, storageService } from '../services/supabase';
import { Search, Filter, Cpu, Droplets, Wrench, ChevronRight, Loader2, Thermometer, ShieldCheck, Activity, AlertTriangle, Plus, X, Camera, Save, Tag, Calendar, FileText } from 'lucide-react';

interface EquipmentBrowserProps {
  areas: string[];
  onSelectEquipment: (name: string) => void;
  userRole?: UserRole;
}

export const EquipmentBrowser: React.FC<EquipmentBrowserProps> = ({ areas, onSelectEquipment, userRole }) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [thermography, setThermography] = useState<ThermographyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('all');
  
  // Create Asset State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEqTag, setNewEqTag] = useState('');
  const [newEqName, setNewEqName] = useState('');
  const [newEqArea, setNewEqArea] = useState('');
  const [newEqMinRot, setNewEqMinRot] = useState(0);
  const [newEqMaxRot, setNewEqMaxRot] = useState(3600);
  const [newEqMinTemp, setNewEqMinTemp] = useState(20);
  const [newEqMaxTemp, setNewEqMaxTemp] = useState(85);
  const [newEqTechDesc, setNewEqTechDesc] = useState('');
  const [newEqInstallDate, setNewEqInstallDate] = useState('');
  const [newEqImageUrl, setNewEqImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditor = userRole !== UserRole.VIEWER;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!newEqArea && areas.length > 0) {
      setNewEqArea(areas[0]);
    }
  }, [areas]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eqs, thermos] = await Promise.all([
        equipmentService.getAll(),
        thermographyService.getAll()
      ]);
      setEquipments(eqs);
      setThermography(thermos);
    } catch (err) {
      console.error(err);
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
      setNewEqImageUrl(result.url);
    } catch (err) {
      alert("Erro ao carregar imagem.");
    } finally {
      setUploading(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentArea = newEqArea || areas[0];
    if (!newEqName.trim() || !newEqTag.trim() || !currentArea) {
      alert("Preencha TAG, Nome e Área para prosseguir.");
      return;
    }

    try {
      setLoading(true);
      await equipmentService.add({
        tag: newEqTag.trim(),
        name: newEqName.trim(),
        areaName: currentArea,
        imageUrl: newEqImageUrl,
        minRotation: newEqMinRot,
        maxRotation: newEqMaxRot,
        minTemp: newEqMinTemp,
        maxTemp: newEqMaxTemp,
        technicalDescription: newEqTechDesc,
        installationDate: newEqInstallDate
      });
      setShowAddModal(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
      alert("Erro ao criar ativo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewEqTag('');
    setNewEqName('');
    setNewEqImageUrl('');
    setNewEqArea(areas[0] || '');
    setNewEqMinRot(0);
    setNewEqMaxRot(3600);
    setNewEqMinTemp(20);
    setNewEqMaxTemp(85);
    setNewEqTechDesc('');
    setNewEqInstallDate('');
  };

  const filteredEquipments = equipments.filter(eq => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = eq.name.toLowerCase().includes(searchLow) || eq.tag.toLowerCase().includes(searchLow);
    const matchesArea = selectedArea === 'all' || eq.areaName === selectedArea;
    return matchesSearch && matchesArea;
  });

  const getEquipmentHealth = (name: string) => {
    const lastRecord = thermography.find(t => t.equipmentName === name);
    if (!lastRecord) return 'unknown';
    if (lastRecord.currentTemp >= lastRecord.maxTemp) return 'critical';
    if (lastRecord.currentTemp >= lastRecord.maxTemp * 0.8) return 'warning';
    return 'good';
  };

  if (loading && equipments.length === 0) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <Loader2 size={40} className="text-emerald-500 animate-spin" />
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Mapeando Ativos da Planta...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 bg-slate-900/40 p-6 rounded-3xl border border-slate-800">
        <div className="w-full lg:flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Buscar TAG ou Componente</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Ex: C-202 ou Compressor..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Subsistema Operacional</label>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <select 
                value={selectedArea}
                onChange={e => setSelectedArea(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
              >
                <option value="all">Todos os Setores</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden xl:flex flex-col items-end gap-1 mr-4">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Total Identificado</span>
              <span className="text-2xl font-black text-emerald-500 italic">{filteredEquipments.length} Ativos</span>
           </div>
           {isEditor && (
             <button 
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
             >
               <Plus size={16} /> Novo Ativo
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEquipments.map(eq => {
          const health = getEquipmentHealth(eq.name);
          const lastMaint = eq.lastMaintenance ? new Date(eq.lastMaintenance).toLocaleDateString() : 'Não inf.';
          
          return (
            <div 
              key={eq.id} 
              onClick={() => onSelectEquipment(eq.name)}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden group hover:border-emerald-500/30 transition-all cursor-pointer shadow-xl hover:shadow-emerald-500/5 flex flex-col"
            >
              <div className="aspect-[4/3] bg-slate-950 relative overflow-hidden">
                {eq.imageUrl ? (
                  <img src={eq.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" alt={eq.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800"><Cpu size={48} /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <div className="bg-black/60 backdrop-blur px-3 py-1 rounded-lg border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                    {eq.tag}
                  </div>
                  {health === 'critical' && <div className="bg-red-500 text-white p-2 rounded-xl shadow-lg animate-pulse"><AlertTriangle size={16}/></div>}
                  {health === 'warning' && <div className="bg-orange-500 text-white p-2 rounded-xl shadow-lg"><Activity size={16}/></div>}
                  {health === 'good' && <div className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg"><ShieldCheck size={16}/></div>}
                </div>
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div>
                   <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors truncate">{eq.name}</h3>
                   <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">{eq.areaName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-800/50">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-600 uppercase flex items-center gap-1"><Wrench size={10} /> Manutenção</p>
                    <p className="text-[10px] font-bold text-slate-300">{lastMaint}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-600 uppercase flex items-center gap-1"><Droplets size={10} /> Lubrificação</p>
                    <p className="text-[10px] font-bold text-slate-300">{eq.lastLubrication ? new Date(eq.lastLubrication).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <Thermometer size={14} className={health === 'critical' ? 'text-red-500' : 'text-emerald-500'} />
                      <span className="text-[10px] font-black text-slate-400 uppercase">Ver DNA do Ativo</span>
                   </div>
                   <ChevronRight size={18} className="text-slate-700 group-hover:text-emerald-500 transition-all translate-x-0 group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredEquipments.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem]">
             <p className="text-slate-600 font-black uppercase text-xs tracking-[0.2em] italic">Nenhum equipamento localizado com estes filtros.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[150] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in overflow-y-auto">
           <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide-up my-10 ring-1 ring-white/10">
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-600/10 text-emerald-500 rounded-3xl border border-emerald-500/20">
                       <Cpu size={32} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Inclusão de Novo Ativo</h3>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Cadastro Detalhado de Equipamento e DNA Técnico</p>
                    </div>
                 </div>
                 <button type="button" onClick={() => setShowAddModal(false)} className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all">
                    <X size={24} />
                 </button>
              </div>

              <form onSubmit={handleCreateAsset} className="p-10 space-y-10">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div className="flex items-center gap-8">
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-32 h-32 rounded-3xl bg-slate-950 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-700 hover:text-emerald-500 hover:border-emerald-500/50 transition-all overflow-hidden group shrink-0"
                          >
                             {newEqImageUrl ? (
                               <img src={newEqImageUrl} className="w-full h-full object-cover" alt="Preview" />
                             ) : (
                               <>
                                 {uploading ? <Loader2 size={24} className="animate-spin text-emerald-500" /> : <Camera size={24} />}
                                 <span className="text-[8px] font-black uppercase mt-2">Add Foto</span>
                               </>
                             )}
                             <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                          </button>
                          
                          <div className="flex-1 space-y-4">
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Identificação (TAG)</label>
                                <div className="relative">
                                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                                  <input 
                                    type="text" required value={newEqTag} onChange={e => setNewEqTag(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-10 pr-3 text-sm text-white outline-none focus:border-emerald-500/50 uppercase font-black" 
                                    placeholder="Ex: P-101"
                                  />
                                </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome do Ativo</label>
                                <input 
                                  type="text" required value={newEqName} onChange={e => setNewEqName(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-sm text-white outline-none focus:border-emerald-500/50" 
                                  placeholder="Ex: Bomba de Recalque"
                                />
                             </div>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Subsistema</label>
                             <select 
                               value={newEqArea} onChange={e => setNewEqArea(e.target.value)}
                               className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
                             >
                                {areas.map(a => <option key={a} value={a}>{a}</option>)}
                             </select>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Data Instalação</label>
                             <div className="relative">
                               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                               <input type="date" value={newEqInstallDate} onChange={e => setNewEqInstallDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-10 pr-4 text-sm text-white outline-none focus:border-emerald-500/50" />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Descritivo de Projeto</label>
                          <textarea value={newEqTechDesc} onChange={e => setNewEqTechDesc(e.target.value)} rows={3} placeholder="Marca, modelo e detalhes adicionais..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all resize-none" />
                       </div>
                    </div>

                    <div className="bg-slate-950/40 p-10 rounded-[2.5rem] border border-white/5 space-y-8 shadow-inner flex flex-col">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase text-center tracking-[0.3em] mb-4">DNA do Ativo (Ranges)</h4>
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1"><Activity size={12} /> Rotação Min</label>
                             <input type="number" value={newEqMinRot} onChange={e => setNewEqMinRot(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-white outline-none font-mono" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1"><Activity size={12} /> Rotação Max</label>
                             <input type="number" value={newEqMaxRot} onChange={e => setNewEqMaxRot(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-white outline-none font-mono" />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1"><Thermometer size={12} /> Temp Min °C</label>
                             <input type="number" value={newEqMinTemp} onChange={e => setNewEqMinTemp(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-white outline-none font-mono" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1"><Thermometer size={12} /> Temp Max °C</label>
                             <input type="number" value={newEqMaxTemp} onChange={e => setNewEqMaxTemp(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-white outline-none font-mono" />
                          </div>
                       </div>
                       <div className="mt-auto pt-6">
                         <button 
                           type="submit" disabled={loading || !newEqName || !newEqTag}
                           className="w-full bg-emerald-600 hover:bg-emerald-500 py-5 rounded-2xl text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                         >
                           {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                           Finalizar Cadastro de Ativo
                         </button>
                       </div>
                    </div>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

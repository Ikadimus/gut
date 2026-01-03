
import React, { useState, useEffect, useRef } from 'react';
import { Equipment, ThermographyRecord, UserRole } from '../types';
import { equipmentService, thermographyService, storageService } from '../services/supabase';
import { Search, Filter, Cpu, Droplets, Wrench, ChevronRight, Loader2, Thermometer, ShieldCheck, Activity, AlertTriangle, Plus, X, Camera, Save, Tag } from 'lucide-react';

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
  const [newEqArea, setNewEqArea] = useState(areas[0] || '');
  const [newEqImageUrl, setNewEqImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditor = userRole !== UserRole.VIEWER;

  useEffect(() => {
    fetchData();
  }, []);

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
    if (!newEqName || !newEqTag) return;
    try {
      setLoading(true);
      await equipmentService.add({
        tag: newEqTag,
        name: newEqName,
        areaName: newEqArea,
        imageUrl: newEqImageUrl,
        minRotation: 0,
        maxRotation: 3600,
        minTemp: 20,
        maxTemp: 85
      });
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert("Erro ao criar ativo.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewEqTag('');
    setNewEqName('');
    setNewEqImageUrl('');
    setNewEqArea(areas[0] || '');
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

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Novo Ativo Operacional</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Cadastro de Equipamento e Foto</p>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={handleCreateAsset} className="p-8 space-y-6">
                 <div className="flex items-center gap-6">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 rounded-3xl bg-slate-950 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-700 hover:text-emerald-500 hover:border-emerald-500/50 transition-all overflow-hidden group relative"
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
                              type="text" 
                              required
                              value={newEqTag}
                              onChange={e => setNewEqTag(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-emerald-500/50 uppercase font-black" 
                              placeholder="Ex: P-101"
                            />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome do Ativo</label>
                          <input 
                            type="text" 
                            required
                            value={newEqName}
                            onChange={e => setNewEqName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500/50" 
                            placeholder="Ex: Bomba de Recalque"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Subsistema</label>
                          <select 
                            value={newEqArea}
                            onChange={e => setNewEqArea(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                          >
                             {areas.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-6 py-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={loading || !newEqName || !newEqTag}
                      className="flex-1 px-6 py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-900/20 transition-all disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Salvar Ativo'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

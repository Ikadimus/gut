
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, Settings as SettingsIcon, Loader2, Gauge, Palette, ShieldAlert, Cpu, HardDrive, CheckCircle2, AlertTriangle, Camera, Activity, Thermometer, Edit, Search, Layers, Wrench, Settings2, LayoutGrid, Database, Tag } from 'lucide-react';
import { areaService, settingsService, equipmentService, storageService } from '../services/supabase';
import { SystemSettings, User, UserRole, Equipment } from '../types';

interface AreaManagerProps {
  areas: string[];
  onUpdateAreas: (newAreas: string[]) => void;
  onCancel: () => void;
  initialSettings: SystemSettings;
  onUpdateSettings: (s: SystemSettings) => void;
  currentUser: User;
}

export const AreaManager: React.FC<AreaManagerProps> = ({ areas, onUpdateAreas, onCancel, initialSettings, onUpdateSettings, currentUser }) => {
  const [newArea, setNewArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState<SystemSettings>(initialSettings);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Equipments states
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [editingEqId, setEditingEqId] = useState<string | null>(null);
  const [newEqTag, setNewEqTag] = useState('');
  const [newEqName, setNewEqName] = useState('');
  const [newEqArea, setNewEqArea] = useState(areas[0] || '');
  const [newEqMinRot, setNewEqMinRot] = useState(0);
  const [newEqMaxRot, setNewEqMaxRot] = useState(3600);
  const [newEqMinTemp, setNewEqMinTemp] = useState(20);
  const [newEqMaxTemp, setNewEqMaxTemp] = useState(85);
  const [newEqImageUrl, setNewEqImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      const data = await equipmentService.getAll();
      setEquipments(data);
    } catch (err) { console.error(err); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const result = await storageService.uploadFile(file, 'assets');
      setNewEqImageUrl(result.url);
    } catch (err) {
      alert("Erro no upload da imagem do ativo.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddArea = async () => {
    if (newArea.trim()) {
      try {
        setLoading(true);
        await areaService.add(newArea.trim());
        onUpdateAreas([...areas, newArea.trim()]);
        setNewArea('');
      } catch (err) { alert("Erro ao adicionar área."); }
      finally { setLoading(false); }
    }
  };

  const handleSaveEquipment = async () => {
    if (newEqName.trim() && newEqTag.trim() && newEqArea) {
      try {
        setLoading(true);
        const eqData = {
          tag: newEqTag.trim(),
          name: newEqName.trim(),
          areaName: newEqArea,
          imageUrl: newEqImageUrl,
          minRotation: newEqMinRot,
          maxRotation: newEqMaxRot,
          minTemp: newEqMinTemp,
          maxTemp: newEqMaxTemp
        };

        if (editingEqId) {
          await equipmentService.update(editingEqId, eqData);
          setEditingEqId(null);
        } else {
          await equipmentService.add(eqData);
        }
        
        resetEquipmentForm();
        fetchEquipments();
      } catch (err) { alert("Erro ao salvar equipamento."); }
      finally { setLoading(false); }
    }
  };

  const resetEquipmentForm = () => {
    setEditingEqId(null);
    setNewEqTag('');
    setNewEqName('');
    setNewEqImageUrl('');
    setNewEqMinRot(0);
    setNewEqMaxRot(3600);
    setNewEqMinTemp(20);
    setNewEqMaxTemp(85);
  };

  const handleEditEquipment = (eq: Equipment) => {
    setEditingEqId(eq.id);
    setNewEqTag(eq.tag || '');
    setNewEqName(eq.name);
    setNewEqArea(eq.areaName);
    setNewEqImageUrl(eq.imageUrl || '');
    setNewEqMinRot(eq.minRotation || 0);
    setNewEqMaxRot(eq.maxRotation || 3600);
    setNewEqMinTemp(eq.minTemp || 20);
    setNewEqMaxTemp(eq.maxTemp || 85);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveEquipment = async (id: string) => {
    if (confirm("Deseja remover este equipamento permanentemente do inventário?")) {
      await equipmentService.remove(id);
      fetchEquipments();
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await settingsService.update(localSettings);
      onUpdateSettings(localSettings);
      alert("Algoritmos de risco recalibrados com sucesso!");
    } catch (err) { alert("Erro ao salvar."); }
    finally { setLoading(false); }
  };

  const filteredEquipments = equipments.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.areaName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto animate-fade-in pb-24">
        {/* HEADER DA PÁGINA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2.5 bg-green-500/10 rounded-xl border border-green-500/20 text-green-500">
                    <Settings2 size={24} />
                 </div>
                 <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Engenharia de Configuração</h2>
              </div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] ml-1">Painel de Controle de Parâmetros e Ativos Críticos</p>
            </div>
            <button onClick={onCancel} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-800 transition-all active:scale-95">
              Voltar ao Início
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* SEGMENTO 1: SUBSISTEMAS (AZUL) */}
            <div className="lg:col-span-4 space-y-6">
               <div className="bg-slate-900/40 border-l-4 border-l-blue-600 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 text-blue-500/5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                     <Layers size={140} />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-8">
                     <div className="p-3 bg-blue-600/10 text-blue-500 rounded-2xl border border-blue-500/20">
                        <Layers size={20} />
                     </div>
                     <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Subsistemas</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Gestão de Áreas Operacionais</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Adicionar Nova Área</label>
                        <div className="flex gap-2">
                           <input 
                             type="text" 
                             value={newArea} 
                             onChange={e => setNewArea(e.target.value)} 
                             placeholder="Ex: Utilidades..." 
                             className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-blue-500/50 transition-all" 
                           />
                           <button onClick={handleAddArea} disabled={loading} className="bg-blue-600 text-white p-4 rounded-2xl hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/20">
                             <Plus size={20} />
                           </button>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Áreas Ativas ({areas.length})</label>
                        <div className="max-h-[320px] overflow-y-auto bg-slate-950 border border-slate-800 rounded-[1.5rem] divide-y divide-slate-900 custom-scrollbar">
                           {areas.map((a, i) => (
                             <div key={i} className="p-4 flex justify-between items-center group hover:bg-slate-900/50 transition-all">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a}</span>
                                <button onClick={async () => { if(confirm("Deseja remover esta área?")) { await areaService.remove(a); onUpdateAreas(areas.filter(x => x !== a)); } }} className="text-slate-700 hover:text-red-500 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                   <Trash2 size={14} />
                                </button>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               {/* SEGMENTO 3: PARÂMETROS (ESMERALDA) */}
               <div className="bg-slate-900/40 border-l-4 border-l-emerald-600 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 text-emerald-500/5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                     <Gauge size={140} />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-8">
                     <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
                        <Gauge size={20} />
                     </div>
                     <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Algoritmo GUT</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Calibração de Riscos Operacionais</p>
                     </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                     <div className="space-y-3">
                        <div className="flex justify-between items-center">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Limite Alerta (Warning)</label>
                           <span className="text-sm font-black text-orange-500">{localSettings.warningThreshold} pts</span>
                        </div>
                        <input type="range" min="50" max="500" value={localSettings.warningThreshold} onChange={e => setLocalSettings({...localSettings, warningThreshold: Number(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-orange-500" />
                     </div>

                     <div className="space-y-3">
                        <div className="flex justify-between items-center">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Limite Crítico (Critical)</label>
                           <span className="text-sm font-black text-red-500">{localSettings.criticalThreshold} pts</span>
                        </div>
                        <input type="range" min="100" max="1000" value={localSettings.criticalThreshold} onChange={e => setLocalSettings({...localSettings, criticalThreshold: Number(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-red-500" />
                     </div>

                     <div className="pt-6 border-t border-slate-800">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-4">Paleta de Prioridade</label>
                        <div className="grid grid-cols-3 gap-3">
                           {[
                             { label: 'Crítico', val: localSettings.colorCritical, key: 'colorCritical' },
                             { label: 'Aviso', val: localSettings.colorWarning, key: 'colorWarning' },
                             { label: 'Normal', val: localSettings.colorNormal, key: 'colorNormal' },
                           ].map(c => (
                             <div key={c.key} className="bg-slate-950 p-2 rounded-xl border border-slate-800 flex flex-col items-center">
                                <input type="color" value={c.val} onChange={e => setLocalSettings({...localSettings, [c.key]: e.target.value})} className="h-8 w-full bg-transparent border-none cursor-pointer" />
                                <span className="text-[7px] font-black text-slate-600 mt-1 uppercase">{c.label}</span>
                             </div>
                           ))}
                        </div>
                     </div>

                     <button onClick={handleSaveSettings} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition-all mt-4">
                        {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Salvar Calibração'}
                     </button>
                  </div>
               </div>
            </div>

            {/* SEGMENTO 2: DNA DO ATIVO (LARANJA) */}
            <div className="lg:col-span-8 space-y-8">
               <div className="bg-slate-900/40 border-l-4 border-l-orange-600 border border-slate-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 text-orange-500/5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                     <Cpu size={240} />
                  </div>
                  
                  <div className="flex items-center justify-between mb-10 border-b border-slate-800 pb-8">
                     <div className="flex items-center gap-4">
                        <div className="p-4 bg-orange-600/10 text-orange-500 rounded-[2rem] border border-orange-500/20">
                           <Cpu size={28} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-white uppercase tracking-tight">{editingEqId ? 'Atualizar DNA do Ativo' : 'Cadastro Técnico de Ativo'}</h3>
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Identificação e Parâmetros de Projeto</p>
                        </div>
                     </div>
                     {editingEqId && (
                       <button onClick={resetEquipmentForm} className="bg-red-900/20 text-red-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-900/40">Cancelar</button>
                     )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <div className="flex items-center gap-6">
                           <button onClick={() => fileInputRef.current?.click()} className="w-28 h-28 rounded-3xl bg-slate-950 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-700 hover:text-orange-500 hover:border-orange-500/50 transition-all overflow-hidden relative group">
                              {newEqImageUrl ? (
                                <img src={newEqImageUrl} className="w-full h-full object-cover" alt="Preview" />
                              ) : (
                                <>
                                  {uploadingImage ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
                                  <span className="text-[8px] font-black uppercase mt-2">Upload Foto</span>
                                </>
                              )}
                              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                           </button>
                           <div className="flex-1 space-y-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Identificação (TAG)</label>
                                 <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                                    <input type="text" value={newEqTag} onChange={e => setNewEqTag(e.target.value)} placeholder="Ex: P-101" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3.5 pl-10 pr-4 text-sm text-white outline-none focus:border-orange-500/50 transition-all shadow-inner uppercase font-black" />
                                 </div>
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome do Ativo</label>
                                 <input type="text" value={newEqName} onChange={e => setNewEqName(e.target.value)} placeholder="Ex: Bomba de Recalque" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-orange-500/50 transition-all shadow-inner" />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Alocação</label>
                                 <select value={newEqArea} onChange={e => setNewEqArea(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-white outline-none focus:border-orange-500/50 transition-all cursor-pointer">
                                   {areas.map(a => <option key={a} value={a}>{a}</option>)}
                                 </select>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-950/40 p-8 rounded-[2rem] border border-slate-800 space-y-6 shadow-inner">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1"><Activity size={12} /> Rotação Min</label>
                              <input type="number" value={newEqMinRot} onChange={e => setNewEqMinRot(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none font-mono" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1"><Activity size={12} /> Rotação Max</label>
                              <input type="number" value={newEqMaxRot} onChange={e => setNewEqMaxRot(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none font-mono" />
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1"><Thermometer size={12} /> Temp Min °C</label>
                              <input type="number" value={newEqMinTemp} onChange={e => setNewEqMinTemp(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none font-mono" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-600 uppercase flex items-center gap-1"><Thermometer size={12} /> Temp Max °C</label>
                              <input type="number" value={newEqMaxTemp} onChange={e => setNewEqMaxTemp(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none font-mono" />
                           </div>
                        </div>
                        <button onClick={handleSaveEquipment} disabled={loading || !newEqName || !newEqTag} className="w-full bg-orange-600 hover:bg-orange-500 py-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-900/20 active:scale-95 transition-all">
                           {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (editingEqId ? 'Confirmar Atualização' : 'Salvar no Inventário')}
                        </button>
                     </div>
                  </div>
               </div>

               {/* TABELA DE ATIVOS CADASTRADOS (INVENTÁRIO) */}
               <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-slate-950 border border-slate-800 text-slate-500 rounded-2xl">
                           <Database size={20} />
                        </div>
                        <div>
                           <h3 className="text-sm font-black text-white uppercase tracking-widest">Inventário Digital</h3>
                           <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">LEDGER DE ATIVOS: {equipments.length} ITENS</p>
                        </div>
                     </div>
                     <div className="w-full md:w-64 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                        <input 
                           type="text" 
                           value={searchTerm}
                           onChange={e => setSearchTerm(e.target.value)}
                           placeholder="Filtrar TAG ou Setor..." 
                           className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-[10px] text-white outline-none focus:border-orange-500/50 transition-all font-black uppercase tracking-widest"
                        />
                     </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-inner">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead className="bg-slate-900/50 border-b border-slate-800 text-slate-500 uppercase text-[9px] font-black tracking-widest">
                              <tr>
                                 <th className="px-6 py-5">TAG / Nome</th>
                                 <th className="px-6 py-5">Subestação</th>
                                 <th className="px-6 py-5">Parâmetros Projeto</th>
                                 <th className="px-6 py-5 text-center">Ações</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-800/50">
                              {filteredEquipments.map(eq => (
                                 <tr key={eq.id} className="hover:bg-slate-900/30 transition-all group">
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                                             {eq.imageUrl ? <img src={eq.imageUrl} className="w-full h-full object-cover" alt={eq.name} /> : <Cpu size={16} className="text-slate-700" />}
                                          </div>
                                          <div className="min-w-0">
                                             <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-orange-500 uppercase">{eq.tag}</span>
                                                <span className="text-[11px] font-black text-white uppercase truncate tracking-tight">{eq.name}</span>
                                             </div>
                                             <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">Asset ID: {eq.id.slice(0, 8)}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{eq.areaName}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-2">
                                             <Activity size={10} className="text-blue-500" />
                                             <span className="text-[9px] font-bold text-slate-300 font-mono">{eq.minRotation}-{eq.maxRotation} RPM</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                             <Thermometer size={10} className="text-red-500" />
                                             <span className="text-[9px] font-bold text-slate-300 font-mono">{eq.minTemp}-{eq.maxTemp}°C</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex justify-center gap-2">
                                          <button onClick={() => handleEditEquipment(eq)} className="p-2.5 bg-blue-900/10 text-blue-500 rounded-xl hover:bg-blue-900/30 transition-all border border-blue-900/20" title="Editar Ativo">
                                             <Edit size={14} />
                                          </button>
                                          <button onClick={() => handleRemoveEquipment(eq.id)} className="p-2.5 bg-red-900/10 text-red-500 rounded-xl hover:bg-red-900/30 transition-all border border-red-900/20" title="Excluir Ativo">
                                             <Trash2 size={14} />
                                          </button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}

                              {filteredEquipments.length === 0 && (
                                 <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest italic opacity-50">
                                       Nenhum registro localizado no inventário técnico.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </div>
        </div>
    </div>
  );
};

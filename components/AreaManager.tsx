
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, X, Settings as SettingsIcon, Loader2, Gauge, Palette, ShieldAlert, Cpu, HardDrive, CheckCircle2, AlertTriangle, Camera, Activity, Thermometer, Edit, Search, Layers, Wrench, Settings2, LayoutGrid, Database, Tag, Calendar, FileText, Settings2 as ConfigIcon } from 'lucide-react';
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
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [eqTag, setEqTag] = useState('');
  const [eqName, setEqName] = useState('');
  const [eqArea, setEqArea] = useState('');
  const [eqMinRot, setEqMinRot] = useState(0);
  const [eqMaxRot, setEqMaxRot] = useState(3600);
  const [eqMinTemp, setEqMinTemp] = useState(20);
  const [eqMaxTemp, setEqMaxTemp] = useState(85);
  const [eqImageUrl, setEqImageUrl] = useState('');
  const [eqTechDesc, setEqTechDesc] = useState('');
  const [eqInstallDate, setEqInstallDate] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEquipments();
  }, []);

  useEffect(() => {
    if (!eqArea && areas.length > 0) {
      setEqArea(areas[0]);
    }
  }, [areas]);

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
      setEqImageUrl(result.url);
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

  const handleSaveEquipment = async (id?: string) => {
    const currentArea = eqArea || areas[0];
    if (!eqName.trim() || !eqTag.trim() || !currentArea) {
      alert("Preencha TAG, Nome e Área para prosseguir.");
      return;
    }

    try {
      setLoading(true);
      const eqData = {
        tag: eqTag.trim(),
        name: eqName.trim(),
        areaName: currentArea,
        imageUrl: eqImageUrl,
        minRotation: eqMinRot,
        maxRotation: eqMaxRot,
        minTemp: eqMinTemp,
        maxTemp: eqMaxTemp,
        technicalDescription: eqTechDesc,
        installationDate: eqInstallDate
      };

      if (id) {
        await equipmentService.update(id, eqData);
        setShowEditModal(false);
      } else {
        await equipmentService.add(eqData);
      }
      
      resetEquipmentForm();
      await fetchEquipments();
    } catch (err: any) { 
      alert(`Erro ao salvar equipamento: ${err.message}`); 
    } finally { 
      setLoading(false); 
    }
  };

  const resetEquipmentForm = () => {
    setEditingEq(null);
    setEqTag('');
    setEqName('');
    setEqArea(areas[0] || '');
    setEqImageUrl('');
    setEqMinRot(0);
    setEqMaxRot(3600);
    setEqMinTemp(20);
    setEqMaxTemp(85);
    setEqTechDesc('');
    setEqInstallDate('');
  };

  const handleOpenEditModal = (eq: Equipment) => {
    setEditingEq(eq);
    setEqTag(eq.tag || '');
    setEqName(eq.name);
    setEqArea(eq.areaName);
    setEqImageUrl(eq.imageUrl || '');
    setEqMinRot(eq.minRotation || 0);
    setEqMaxRot(eq.maxRotation || 3600);
    setEqMinTemp(eq.minTemp || 20);
    setEqMaxTemp(eq.maxTemp || 85);
    setEqTechDesc(eq.technicalDescription || '');
    setEqInstallDate(eq.installationDate || '');
    setShowEditModal(true);
  };

  const handleRemoveEquipment = async (id: string) => {
    if (confirm("Deseja remover este equipamento permanentemente do inventário?")) {
      try {
        await equipmentService.remove(id);
        fetchEquipments();
      } catch (err: any) {
        alert("Erro ao remover: " + err.message);
      }
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

  const EquipmentFormFields = ({ isModal = false, targetId }: { isModal?: boolean, targetId?: string }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
           <button 
             type="button"
             onClick={() => isModal ? modalFileInputRef.current?.click() : fileInputRef.current?.click()} 
             className="w-24 h-24 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-700 hover:text-orange-500 hover:border-orange-500/50 transition-all overflow-hidden relative group shrink-0"
           >
              {eqImageUrl ? (
                <img src={eqImageUrl} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <>
                  {uploadingImage ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                  <span className="text-[7px] font-black uppercase mt-1.5">Foto Ativo</span>
                </>
              )}
              <input type="file" ref={isModal ? modalFileInputRef : fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
           </button>
           <div className="flex-1 space-y-2">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Identificação (TAG)</label>
                 <div className="relative">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" size={12} />
                    <input type="text" value={eqTag} onChange={e => setEqTag(e.target.value)} placeholder="Ex: P-101" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs text-white outline-none focus:border-orange-500/50 transition-all uppercase font-black" />
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nome do Ativo</label>
                 <input type="text" value={eqName} onChange={e => setEqName(e.target.value)} placeholder="Ex: Bomba de Recalque" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-orange-500/50 transition-all" />
              </div>
           </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
             <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Alocação</label>
             <select value={eqArea} onChange={e => setEqArea(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white outline-none focus:border-orange-500/50 transition-all cursor-pointer">
               {areas.map(a => <option key={a} value={a}>{a}</option>)}
             </select>
          </div>
          <div className="space-y-1">
             <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Instalação</label>
             <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" size={12} />
                <input type="date" value={eqInstallDate} onChange={e => setEqInstallDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs text-white outline-none focus:border-orange-500/50 transition-all" />
             </div>
          </div>
        </div>
        <div className="space-y-1">
           <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Descrição Técnica</label>
           <textarea value={eqTechDesc} onChange={e => setEqTechDesc(e.target.value)} rows={2} placeholder="Modelo, marca e especificações..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-[10px] text-white outline-none focus:border-orange-500/50 transition-all resize-none" />
        </div>
      </div>

      <div className="bg-slate-950/40 p-5 rounded-[1.5rem] border border-slate-800 space-y-4 shadow-inner flex flex-col">
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-600 uppercase flex items-center gap-1"><Activity size={10} /> Rotação Min</label>
              <input type="number" value={eqMinRot} onChange={e => setEqMinRot(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-white outline-none font-mono" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-600 uppercase flex items-center gap-1"><Activity size={10} /> Rotação Max</label>
              <input type="number" value={eqMaxRot} onChange={e => setEqMaxRot(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-white outline-none font-mono" />
           </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-600 uppercase flex items-center gap-1"><Thermometer size={10} /> Temp Min °C</label>
              <input type="number" value={eqMinTemp} onChange={e => setEqMinTemp(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-white outline-none font-mono" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[8px] font-black text-slate-600 uppercase flex items-center gap-1"><Thermometer size={10} /> Temp Max °C</label>
              <input type="number" value={eqMaxTemp} onChange={e => setEqMaxTemp(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-white outline-none font-mono" />
           </div>
        </div>
        <div className="mt-auto pt-2">
          <button 
            type="button"
            onClick={() => handleSaveEquipment(targetId)} 
            disabled={loading || !eqName || !eqTag} 
            className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-xl text-white text-[9px] font-black uppercase tracking-widest shadow-xl shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
             {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
             {isModal ? 'Confirmar Atualização' : 'Salvar no Inventário'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                 <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20 text-green-500">
                    <Settings2 size={20} />
                 </div>
                 <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Engenharia de Configuração</h2>
              </div>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">Painel de Controle de Parâmetros e Ativos Críticos</p>
            </div>
            <button onClick={onCancel} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-800 transition-all active:scale-95">
              Voltar ao Início
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-5">
               <div className="bg-slate-900/40 border-l-4 border-l-blue-600 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 text-blue-500/5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                     <Layers size={100} />
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2.5 bg-blue-600/10 text-blue-500 rounded-xl border border-blue-500/20">
                        <Layers size={18} />
                     </div>
                     <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Subsistemas</h3>
                        <p className="text-[8px] text-slate-500 font-bold uppercase">Gestão de Áreas Operacionais</p>
                     </div>
                  </div>
                  <div className="space-y-5">
                     <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Adicionar Nova Área</label>
                        <div className="flex gap-2">
                           <input type="text" value={newArea} onChange={e => setNewArea(e.target.value)} placeholder="Ex: Utilidades..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-blue-500/50 transition-all" />
                           <button onClick={handleAddArea} disabled={loading} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-900/20">
                             <Plus size={16} />
                           </button>
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Áreas Ativas ({areas.length})</label>
                        <div className="max-h-[180px] overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-900 custom-scrollbar">
                           {areas.map((a, i) => (
                             <div key={i} className="p-3 flex justify-between items-center group hover:bg-slate-900/50 transition-all">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{a}</span>
                                <button onClick={async () => { if(confirm("Deseja remover esta área?")) { await areaService.remove(a); onUpdateAreas(areas.filter(x => x !== a)); } }} className="text-slate-700 hover:text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                   <Trash2 size={12} />
                                </button>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-slate-900/40 border-l-4 border-l-emerald-600 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute -top-4 -right-4 text-emerald-500/5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                     <Gauge size={100} />
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2.5 bg-emerald-600/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                        <Gauge size={18} />
                     </div>
                     <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Algoritmo GUT</h3>
                        <p className="text-[8px] text-slate-500 font-bold uppercase">Calibração de Riscos Operacionais</p>
                     </div>
                  </div>
                  <div className="space-y-5 relative z-10">
                     <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Limite Alerta (Warning)</label>
                           <span className="text-xs font-black text-orange-500">{localSettings.warningThreshold} pts</span>
                        </div>
                        <input type="range" min="50" max="500" value={localSettings.warningThreshold} onChange={e => setLocalSettings({...localSettings, warningThreshold: Number(e.target.value)})} className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-orange-500" />
                     </div>
                     <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                           <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Limite Crítico (Critical)</label>
                           <span className="text-xs font-black text-red-500">{localSettings.criticalThreshold} pts</span>
                        </div>
                        <input type="range" min="100" max="1000" value={localSettings.criticalThreshold} onChange={e => setLocalSettings({...localSettings, criticalThreshold: Number(e.target.value)})} className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-red-500" />
                     </div>
                     <button onClick={handleSaveSettings} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl text-white text-[9px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition-all mt-3">
                        {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Salvar Calibração'}
                     </button>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
               <div className="bg-slate-900/40 border-l-4 border-l-orange-600 border border-slate-800 rounded-2xl p-8 shadow-xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 text-orange-500/5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                     <Cpu size={180} />
                  </div>
                  <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-600/10 text-orange-500 rounded-2xl border border-orange-500/20">
                           <Cpu size={24} />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-white uppercase tracking-tight">Cadastro Técnico de Ativo</h3>
                           <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Alocação e Parâmetros de Projeto</p>
                        </div>
                     </div>
                  </div>
                  <EquipmentFormFields />
               </div>

               <div className="bg-slate-900/40 border border-slate-800 rounded-[1.5rem] p-8 shadow-xl space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-950 border border-slate-800 text-slate-500 rounded-xl">
                           <Database size={18} />
                        </div>
                        <div>
                           <h3 className="text-xs font-black text-white uppercase tracking-widest">Inventário Digital</h3>
                           <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">LEDGER DE ATIVOS: {equipments.length} ITENS</p>
                        </div>
                     </div>
                     <div className="w-full md:w-56 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={12} />
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filtrar TAG ou Setor..." className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-8 pr-3 text-[9px] text-white outline-none focus:border-orange-500/50 transition-all font-black uppercase tracking-widest" />
                     </div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead className="bg-slate-900/50 border-b border-slate-800 text-slate-500 uppercase text-[8px] font-black tracking-widest">
                              <tr>
                                 <th className="px-5 py-4">TAG / Nome</th>
                                 <th className="px-5 py-4">Subestação</th>
                                 <th className="px-5 py-4">Parâmetros Projeto</th>
                                 <th className="px-5 py-4 text-center">Ações</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-800/50">
                              {filteredEquipments.map(eq => (
                                 <tr key={eq.id} className="hover:bg-white/[0.03] transition-all group">
                                    <td className="px-5 py-3">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                                             {eq.imageUrl ? <img src={eq.imageUrl} className="w-full h-full object-cover" alt={eq.name} /> : <Cpu size={14} className="text-slate-700" />}
                                          </div>
                                          <div className="min-w-0">
                                             <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-orange-500 uppercase">{eq.tag}</span>
                                                <span className="text-[10px] font-black text-white uppercase truncate tracking-tight">{eq.name}</span>
                                             </div>
                                             <p className="text-[7px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">ID: {eq.id.slice(0, 8)}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-5 py-3">
                                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{eq.areaName}</span>
                                    </td>
                                    <td className="px-5 py-3">
                                       <div className="flex flex-col gap-0.5">
                                          <div className="flex items-center gap-1.5">
                                             <Activity size={9} className="text-blue-500" />
                                             <span className="text-[8px] font-bold text-slate-300 font-mono">{eq.minRotation}-{eq.maxRotation} RPM</span>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                             <Thermometer size={9} className="text-red-500" />
                                             <span className="text-[8px] font-bold text-slate-300 font-mono">{eq.minTemp}-{eq.maxTemp}°C</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-5 py-3">
                                       <div className="flex justify-center gap-1.5">
                                          <button onClick={() => handleOpenEditModal(eq)} className="p-2 bg-blue-900/10 text-blue-500 rounded-lg hover:bg-blue-900/30 transition-all border border-blue-900/20" title="Editar Ativo">
                                             <Edit size={12} />
                                          </button>
                                          <button onClick={() => handleRemoveEquipment(eq.id)} className="p-2 bg-red-900/10 text-red-500 rounded-lg hover:bg-red-900/30 transition-all border border-red-900/20" title="Excluir Ativo">
                                             <Trash2 size={12} />
                                          </button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                              {filteredEquipments.length === 0 && (
                                 <tr>
                                    <td colSpan={4} className="px-5 py-10 text-center text-slate-600 text-[9px] font-black uppercase tracking-widest italic opacity-50">
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

        {showEditModal && (
          <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-5 animate-fade-in overflow-y-auto">
             <div className="bg-slate-900 border border-white/10 w-full max-w-3xl rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden animate-slide-up ring-1 ring-white/10 my-8">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                   <div className="flex items-center gap-4">
                      <div className="p-3.5 bg-orange-600/10 text-orange-500 rounded-2xl border border-orange-500/20">
                         <Wrench size={24} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">Modificar DNA do Ativo</h3>
                         <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">Alteração de Parâmetros Operacionais em Tempo Real</p>
                      </div>
                   </div>
                   <button onClick={() => { setShowEditModal(false); resetEquipmentForm(); }} className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-all">
                      <X size={20} />
                   </button>
                </div>
                <div className="p-8">
                   <EquipmentFormFields isModal={true} targetId={editingEq?.id} />
                </div>
                <div className="px-8 py-4 bg-slate-950/40 border-t border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                      <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Sessão de Engenharia Ativa • ID: {editingEq?.id}</span>
                   </div>
                   <button onClick={() => { setShowEditModal(false); resetEquipmentForm(); }} className="text-[8px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Descartar Alterações</button>
                </div>
             </div>
          </div>
        )}
    </div>
  );
};

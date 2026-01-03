
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, Settings as SettingsIcon, Loader2, Gauge, Palette, ShieldAlert, Cpu, HardDrive, CheckCircle2, AlertTriangle, Camera, Activity, Thermometer, Edit } from 'lucide-react';
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
  const [storageStatus, setStorageStatus] = useState<boolean | null>(null);
  
  // Equipments states
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [editingEqId, setEditingEqId] = useState<string | null>(null);
  const [newEqName, setNewEqName] = useState('');
  const [newEqArea, setNewEqArea] = useState(areas[0] || '');
  const [newEqMinRot, setNewEqMinRot] = useState(0);
  const [newEqMaxRot, setNewEqMaxRot] = useState(3600);
  const [newEqMinTemp, setNewEqMinTemp] = useState(20);
  const [newEqMaxTemp, setNewEqMaxTemp] = useState(85);
  const [newEqImageUrl, setNewEqImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDev = currentUser.role === UserRole.DEVELOPER;

  useEffect(() => {
    fetchEquipments();
    if (isDev) {
      storageService.checkBucketExists().then(setStorageStatus);
    }
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
    if (newEqName.trim() && newEqArea) {
      try {
        setLoading(true);
        const eqData = {
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
    setNewEqName('');
    setNewEqImageUrl('');
    setNewEqMinRot(0);
    setNewEqMaxRot(3600);
    setNewEqMinTemp(20);
    setNewEqMaxTemp(85);
  };

  const handleEditEquipment = (eq: Equipment) => {
    setEditingEqId(eq.id);
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
    if (confirm("Deseja remover este equipamento?")) {
      await equipmentService.remove(id);
      fetchEquipments();
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await settingsService.update(localSettings);
      onUpdateSettings(localSettings);
      alert("Configurações aplicadas!");
    } catch (err) { alert("Erro ao salvar."); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in pb-20">
        <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-100 flex items-center gap-3 uppercase tracking-tight">
                  <SettingsIcon className="text-green-500" /> Engenharia de Configuração
              </h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Gestão de Subsistemas e Ficha Técnica de Ativos</p>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={onCancel} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Voltar</button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Gestão de Áreas */}
            <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-800 pb-3 flex items-center gap-2">
                   <Edit2 size={16} className="text-blue-500" /> 1. Subsistemas
                </h3>
                <div className="flex gap-2">
                    <input type="text" value={newArea} onChange={e => setNewArea(e.target.value)} placeholder="Nova Área..." className="flex-1 rounded-xl bg-slate-950 border-slate-800 text-slate-100 p-3 text-sm focus:border-green-500 outline-none" />
                    <button onClick={handleAddArea} disabled={loading} className="bg-blue-600 p-3 rounded-xl text-white hover:bg-blue-500 transition-colors"><Plus size={18} /></button>
                </div>
                <div className="max-h-60 overflow-y-auto bg-slate-950 rounded-2xl border border-slate-800 divide-y divide-slate-800 custom-scrollbar">
                    {areas.map((a, i) => (
                      <div key={i} className="p-3 flex justify-between items-center text-xs font-bold text-slate-400 uppercase group">
                        {a}
                        <button onClick={async () => { if(confirm("Excluir área?")) { await areaService.remove(a); onUpdateAreas(areas.filter(x => x !== a)); } }} className="text-slate-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                    ))}
                </div>
            </div>

            {/* Gestão de Ativos - EDITÁVEL */}
            <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Cpu size={16} className="text-orange-500" /> 2. DNA do Ativo (Inventário)
                  </h3>
                  {editingEqId && (
                    <button onClick={resetEquipmentForm} className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-1 rounded">Cancelar Edição</button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <button type="button" onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600 hover:text-orange-500 hover:border-orange-500/50 transition-all overflow-hidden relative group">
                          {newEqImageUrl ? (
                            <img src={newEqImageUrl} className="w-full h-full object-cover" alt="Preview" />
                          ) : (
                            <>
                              {uploadingImage ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                              <span className="text-[8px] font-black uppercase mt-1">Foto</span>
                            </>
                          )}
                          <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                       </button>
                       <div className="flex-1 space-y-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase">Identificação (TAG)</label>
                          <input type="text" value={newEqName} onChange={e => setNewEqName(e.target.value)} placeholder="Ex: C-202 Compressor" className="w-full rounded-xl bg-slate-950 border-slate-800 text-slate-100 p-3 text-sm focus:border-orange-500 outline-none" />
                          <select value={newEqArea} onChange={e => setNewEqArea(e.target.value)} className="w-full rounded-xl bg-slate-950 border-slate-800 text-slate-100 p-3 text-xs outline-none">
                            {areas.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                       </div>
                    </div>
                  </div>

                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 space-y-4">
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-1"><Activity size={10} /> RPM Min</label>
                          <input type="number" value={newEqMinRot} onChange={e => setNewEqMinRot(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-1"><Activity size={10} /> RPM Max</label>
                          <input type="number" value={newEqMaxRot} onChange={e => setNewEqMaxRot(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-1"><Thermometer size={10} /> Temp Min °C</label>
                          <input type="number" value={newEqMinTemp} onChange={e => setNewEqMinTemp(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-1"><Thermometer size={10} /> Temp Max °C</label>
                          <input type="number" value={newEqMaxTemp} onChange={e => setNewEqMaxTemp(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none" />
                        </div>
                     </div>
                     <button onClick={handleSaveEquipment} disabled={loading || !newEqName} className="w-full bg-orange-600 hover:bg-orange-500 py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-950/20 active:scale-95 transition-all">
                        {loading ? <Loader2 size={14} className="animate-spin mx-auto" /> : (editingEqId ? 'Atualizar Ativo' : 'Cadastrar Ativo')}
                     </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {equipments.map((eq) => (
                      <div key={eq.id} className={`bg-slate-950/80 border ${editingEqId === eq.id ? 'border-orange-500' : 'border-slate-800'} p-4 rounded-2xl flex items-center gap-4 group transition-all`}>
                        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                           {eq.imageUrl ? <img src={eq.imageUrl} className="w-full h-full object-cover" alt={eq.name} /> : <Cpu size={20} className="text-slate-700" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-slate-200 uppercase truncate">{eq.name}</p>
                          <div className="flex gap-2 mt-1">
                             <span className="text-[7px] font-black bg-blue-900/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900/30">{eq.maxRotation} RPM</span>
                             <span className="text-[7px] font-black bg-red-900/20 text-red-400 px-1.5 py-0.5 rounded border border-red-900/30">{eq.maxTemp}°C</span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                           <button onClick={() => handleEditEquipment(eq)} className="p-2 text-blue-400 hover:bg-blue-900/20 rounded-lg"><Edit size={14}/></button>
                           <button onClick={() => handleRemoveEquipment(eq.id)} className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                </div>
            </div>

            {/* Parâmetros de Decisão */}
            <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-800 pb-3 flex items-center gap-2">
                   <Gauge size={16} className="text-green-500" /> 3. Algoritmo GUT
                </h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">Atenção Acumulado ({localSettings.warningThreshold})</label>
                    <input type="range" min="50" max="500" value={localSettings.warningThreshold} onChange={e => setLocalSettings({...localSettings, warningThreshold: Number(e.target.value)})} className="w-full accent-orange-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase">Crítico Acumulado ({localSettings.criticalThreshold})</label>
                    <input type="range" min="100" max="1000" value={localSettings.criticalThreshold} onChange={e => setLocalSettings({...localSettings, criticalThreshold: Number(e.target.value)})} className="w-full accent-red-500" />
                  </div>
                  <div className="pt-4 border-t border-slate-800">
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-2">Cores do Sistema</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center">
                        <input type="color" value={localSettings.colorCritical} onChange={e => setLocalSettings({...localSettings, colorCritical: e.target.value})} className="h-10 w-full bg-transparent border-none cursor-pointer" />
                        <span className="text-[7px] font-black text-slate-600 mt-1 uppercase">Crítico</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <input type="color" value={localSettings.colorWarning} onChange={e => setLocalSettings({...localSettings, colorWarning: e.target.value})} className="h-10 w-full bg-transparent border-none cursor-pointer" />
                        <span className="text-[7px] font-black text-slate-600 mt-1 uppercase">Atenção</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <input type="color" value={localSettings.colorNormal} onChange={e => setLocalSettings({...localSettings, colorNormal: e.target.value})} className="h-10 w-full bg-transparent border-none cursor-pointer" />
                        <span className="text-[7px] font-black text-slate-600 mt-1 uppercase">Normal</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleSaveSettings} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl text-white text-[10px] font-black uppercase tracking-widest mt-4 shadow-xl shadow-green-950/20 active:scale-95 transition-all">
                    {loading ? <Loader2 size={14} className="animate-spin mx-auto"/> : 'Aplicar Alterações'}
                  </button>
                </div>
            </div>
        </div>
    </div>
  );
};

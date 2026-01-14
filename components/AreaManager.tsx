
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, X, Gauge, Cpu, Eye, Info, Shield, Briefcase, Settings2 as ConfigIcon, Layers, Thermometer, Database, Settings2, FileSpreadsheet, Waves, Terminal } from 'lucide-react';
import { areaService, settingsService, equipmentService, storageService, sectorService, permissionService } from '../services/supabase';
import { SystemSettings, User, UserRole, Equipment, RolePermissions } from '../types';
import { DatabaseSetup } from './DatabaseSetup';

interface AreaManagerProps {
  areas: string[];
  onUpdateAreas: (newAreas: string[]) => void;
  onCancel: () => void;
  initialSettings: SystemSettings;
  onUpdateSettings: (s: SystemSettings) => void;
  currentUser: User;
}

export const AreaManager: React.FC<AreaManagerProps> = ({ areas, onUpdateAreas, onCancel, initialSettings, onUpdateSettings, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'assets' | 'rbac' | 'database'>('general');
  const [newArea, setNewArea] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [localSettings, setLocalSettings] = useState<SystemSettings>(initialSettings);
  
  // RBAC states
  const [sectors, setSectors] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<RolePermissions[]>([]);

  // Equipments states
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  useEffect(() => {
    fetchEquipments();
    fetchRBACData();
  }, []);

  const fetchRBACData = async () => {
    try {
      const [s, p] = await Promise.all([
        sectorService.getAll(),
        permissionService.getAll()
      ]);
      setSectors(s);
      setPermissions(p);
    } catch (err) { console.error(err); }
  };

  const fetchEquipments = async () => {
    try {
      const data = await equipmentService.getAll();
      setEquipments(data);
    } catch (err) { console.error(err); }
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

  const handleAddSector = async () => {
    if (newSector.trim()) {
      try {
        setLoading(true);
        await sectorService.add(newSector.trim());
        setSectors(prev => [...prev, newSector.trim()].sort());
        setNewSector('');
      } catch (err) { alert("Erro ao adicionar setor."); }
      finally { setLoading(false); }
    }
  };

  const handleAddRole = async () => {
    if (newRole.trim()) {
      try {
        setLoading(true);
        await permissionService.create(newRole.trim());
        await fetchRBACData();
        setNewRole('');
      } catch (err) { alert("Erro ao adicionar nível de acesso."); }
      finally { setLoading(false); }
    }
  };

  const handleTogglePermission = async (role: string, key: keyof RolePermissions) => {
    const perm = permissions.find(p => p.role === role);
    if (!perm) return;

    const newValue = !perm[key];
    try {
      setPermissions(prev => prev.map(p => p.role === role ? { ...p, [key]: newValue } : p));
      await permissionService.update(role, { [key]: newValue });
    } catch (err) { alert("Erro ao atualizar permissão."); fetchRBACData(); }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await settingsService.update(localSettings);
      onUpdateSettings(localSettings);
      alert("Configurações salvas.");
    } catch (err) { alert("Erro ao salvar."); }
    finally { setLoading(false); }
  };

  const isProtectedRole = (role: string) => {
    return ['Desenvolvedor', 'Administrador', 'Visualizador'].includes(role);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                 <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20 text-green-500">
                    <ConfigIcon size={20} />
                 </div>
                 <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Painel de Administração</h2>
              </div>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">Gestão de Infraestrutura, Ativos e Acessos</p>
            </div>
            <div className="flex gap-2">
               {[
                 { id: 'general', label: 'Geral' },
                 { id: 'rbac', label: 'Acessos & Setores' },
                 { id: 'assets', label: 'Lista Ativos' },
                 { id: 'database', label: 'Banco de Dados' }
               ].map((t) => (
                 <button 
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeTab === t.id ? 'bg-green-600 text-white border-green-500 shadow-lg shadow-green-900/20' : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white'}`}
                 >
                   {t.label}
                 </button>
               ))}
               <button onClick={onCancel} className="px-5 py-2.5 bg-slate-950 hover:bg-slate-900 text-slate-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-800 transition-all ml-4">Voltar</button>
            </div>
        </div>

        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
             <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900/40 border-l-4 border-l-blue-600 border border-slate-800 rounded-2xl p-6 shadow-xl">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-blue-600/10 text-blue-500 rounded-xl border border-blue-500/20">
                         <Layers size={18} />
                      </div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Subsistemas (PlantAreas)</h3>
                   </div>
                   <div className="space-y-4">
                      <div className="flex gap-2">
                         <input type="text" value={newArea} onChange={e => setNewArea(e.target.value)} placeholder="Nova Área..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none" />
                         <button onClick={handleAddArea} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-500 transition-all"><Plus size={16} /></button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-900 custom-scrollbar">
                         {areas.map((a, i) => (
                           <div key={i} className="p-3 flex justify-between items-center group">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{a}</span>
                              <button onClick={async () => { if(confirm("Remover área?")) { await areaService.remove(a); onUpdateAreas(areas.filter(x => x !== a)); } }} className="text-slate-700 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
             <div className="lg:col-span-7">
                <div className="bg-slate-900/40 border-l-4 border-l-emerald-600 border border-slate-800 rounded-2xl p-8 shadow-xl">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                         <Gauge size={20} />
                      </div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">Algoritmos de Risco GUT</h3>
                   </div>
                   <div className="space-y-8">
                      <div className="space-y-3">
                         <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <label>Alerta Moderado (Warning)</label>
                            <span className="text-orange-500">{localSettings.warningThreshold} pts</span>
                         </div>
                         <input type="range" min="50" max="500" value={localSettings.warningThreshold} onChange={e => setLocalSettings({...localSettings, warningThreshold: Number(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-orange-500" />
                      </div>
                      <div className="space-y-3">
                         <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <label>Gargalo Crítico (Critical)</label>
                            <span className="text-red-500">{localSettings.criticalThreshold} pts</span>
                         </div>
                         <input type="range" min="100" max="1000" value={localSettings.criticalThreshold} onChange={e => setLocalSettings({...localSettings, criticalThreshold: Number(e.target.value)})} className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-red-500" />
                      </div>
                      <button onClick={handleSaveSettings} className="w-full bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 transition-all">
                         Salvar Parâmetros Técnicos
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'rbac' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
             <div className="lg:col-span-4 space-y-6">
                <div className="bg-slate-900/40 border-l-4 border-l-orange-600 border border-slate-800 rounded-2xl p-6 shadow-xl">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-orange-600/10 text-orange-500 rounded-xl border border-orange-500/20">
                         <Briefcase size={18} />
                      </div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Setores Operacionais</h3>
                   </div>
                   <div className="space-y-4">
                      <div className="flex gap-2">
                         <input type="text" value={newSector} onChange={e => setNewSector(e.target.value)} placeholder="Novo Setor (ex: Elétrica)..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none" />
                         <button onClick={handleAddSector} className="bg-orange-600 text-white p-3 rounded-xl hover:bg-orange-500 transition-all"><Plus size={16} /></button>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl divide-y divide-slate-900 custom-scrollbar">
                         {sectors.map((s, i) => (
                           <div key={i} className="p-3 flex justify-between items-center group">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s}</span>
                              <button onClick={async () => { if(confirm("Remover setor?")) { await sectorService.remove(s); setSectors(prev => prev.filter(x => x !== s)); } }} className="text-slate-700 hover:text-red-500 p-1.5 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} /></button>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900/40 border-l-4 border-l-purple-600 border border-slate-800 rounded-2xl p-6 shadow-xl">
                   <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-purple-600/10 text-purple-500 rounded-xl border border-purple-500/20">
                         <Shield size={18} />
                      </div>
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">Criar Nível de Acesso</h3>
                   </div>
                   <div className="space-y-4">
                      <div className="flex gap-2">
                         <input type="text" value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="Ex: Eletrotécnico..." className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none" />
                         <button onClick={handleAddRole} className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-500 transition-all"><Plus size={16} /></button>
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="lg:col-span-8">
                <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-8 shadow-xl overflow-x-auto">
                   <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-purple-600/10 text-purple-500 rounded-xl border border-purple-500/20">
                         <Database size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Matriz de Visibilidade de Abas</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Configure o que cada nível pode acessar no sistema</p>
                      </div>
                   </div>

                   <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-2xl min-w-[800px]">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-800 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                               <th className="px-6 py-4">Nível / Cargo</th>
                               <th className="px-2 py-4 text-center">Dash</th>
                               <th className="px-2 py-4 text-center">Setor</th>
                               <th className="px-2 py-4 text-center">GUT</th>
                               <th className="px-2 py-4 text-center">Termo</th>
                               <th className="px-2 py-4 text-center">Vibra</th>
                               <th className="px-2 py-4 text-center">Ativos</th>
                               <th className="px-2 py-4 text-center">Relat.</th>
                               <th className="px-2 py-4 text-center">User</th>
                               <th className="px-2 py-4 text-center">Config</th>
                               <th className="px-2 py-4 text-center">Del</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-900">
                            {permissions.map((p) => (
                               <tr key={p.role} className="hover:bg-white/[0.02] transition-all group">
                                  <td className="px-6 py-5">
                                     <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isProtectedRole(p.role) ? 'bg-purple-500' : 'bg-slate-500'}`}></div>
                                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">{p.role}</span>
                                     </div>
                                  </td>
                                  {[
                                    'can_view_dashboard', 'can_view_sector', 'can_view_gut', 'can_view_thermo', 'can_view_vibration',
                                    'can_view_assets', 'can_view_reports', 'can_view_users', 'can_view_settings'
                                  ].map((key) => (
                                    <td key={key} className="px-2 py-5 text-center">
                                       <button 
                                        onClick={() => handleTogglePermission(p.role, key as any)}
                                        className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all border ${p[key as keyof RolePermissions] ? 'bg-green-600/10 border-green-500/20 text-green-500' : 'bg-slate-900 border-slate-800 text-slate-700'}`}
                                       >
                                          {p[key as keyof RolePermissions] ? <Eye size={12} /> : <X size={12} />}
                                       </button>
                                    </td>
                                  ))}
                                  <td className="px-2 py-5 text-center">
                                     {!isProtectedRole(p.role) && (
                                       <button 
                                         onClick={async () => { if(confirm(`Remover nível "${p.role}"?`)) { await permissionService.remove(p.role); await fetchRBACData(); } }}
                                         className="p-2 text-slate-700 hover:text-red-500 transition-all mx-auto"
                                       >
                                          <Trash2 size={12} />
                                       </button>
                                     )}
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                   <div className="mt-6 bg-slate-900/50 p-4 rounded-xl flex items-start gap-3 border border-slate-800">
                      <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        As alterações de permissão são aplicadas em tempo real. Se uma aba for removida, ela deixará de aparecer no menu lateral para usuários desse nível.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-6 animate-fade-in">
             <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                   <div className="p-3 bg-orange-600/10 text-orange-500 rounded-xl border border-orange-500/20">
                      <Cpu size={20} />
                   </div>
                   <h3 className="text-lg font-black text-white uppercase tracking-tight">Inventário de Ativos Registrados</h3>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                   <table className="w-full text-left">
                      <thead className="bg-slate-900 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                         <tr>
                            <th className="px-6 py-4">TAG</th>
                            <th className="px-6 py-4">Equipamento</th>
                            <th className="px-6 py-4">Área</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                         {equipments.map(eq => (
                           <tr key={eq.id} className="hover:bg-white/[0.02]">
                              <td className="px-6 py-4 text-[10px] font-black text-orange-500 uppercase">{eq.tag}</td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-200 uppercase">{eq.name}</td>
                              <td className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">{eq.areaName}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="animate-fade-in">
             <DatabaseSetup />
          </div>
        )}
    </div>
  );
};


import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Settings, Thermometer, ListFilter, Users, LogOut, Terminal, HardDrive, ChevronLeft, ChevronRight, Send, Sparkles, Bot, Briefcase, Wrench, Zap, Radio, ClipboardCheck, FlaskConical, Droplets, Activity, AlertCircle, X, ChevronDown, ChevronUp, FileSpreadsheet, Waves } from 'lucide-react';
import { GUTIssue, Status, SystemSettings, ThermographyRecord, VibrationRecord, User, UserRole, RolePermissions } from './types';
import { StatsCards } from './components/StatsCards';
import { IssueForm } from './components/IssueForm';
import { GUTTable } from './components/GUTTable';
import { Charts } from './components/Charts';
import { AreaManager } from './components/AreaManager';
import { DetailsModal } from './components/DetailsModal';
import { ThermographyManager } from './components/ThermographyManager';
import { VibrationManager } from './components/VibrationManager';
import { Login } from './components/Login';
import { AdminUsers } from './components/AdminUsers';
import { EquipmentProfile } from './components/EquipmentProfile';
import { EquipmentBrowser } from './components/EquipmentBrowser';
import { ResolutionModal } from './components/ResolutionModal';
import { SectorPortal } from './components/SectorPortal';
import { ReportsManager } from './components/ReportsManager';
import { NotificationBell } from './components/NotificationBell';
import { issueService, areaService, settingsService, thermographyService, vibrationService, userService, permissionService } from './services/supabase';
import { explainSystemToUser } from './services/geminiService';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
    google?: any;
  }
}

type MainView = 'dashboard' | 'gut' | 'thermography' | 'vibration' | 'assets' | 'areas' | 'users' | 'equipment-profile' | 'reports' |
                 'sector-mecanica-lub' | 'sector-eletrica-instr' | 'sector-operacao' | 'sector-quimica';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<GUTIssue[]>([]);
  const [thermography, setThermography] = useState<ThermographyRecord[]>([]);
  const [vibration, setVibration] = useState<VibrationRecord[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<RolePermissions | null>(null);
  const [settings, setSettings] = useState<SystemSettings>({ 
    criticalThreshold: 250, 
    warningThreshold: 100, 
    individualCriticalThreshold: 80,
    individualWarningThreshold: 40,
    accentColor: '#10b981',
    colorNormal: '#10b981',
    colorWarning: '#f59e0b',
    colorCritical: '#ef4444'
  });
  
  const [view, setView] = useState<MainView>('dashboard');
  const [predictiveExpanded, setPredictiveExpanded] = useState(true);
  const [selectedEqName, setSelectedEqName] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentIssue, setCurrentIssue] = useState<GUTIssue | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiConnected, setAiConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [resolutionTarget, setResolutionTarget] = useState<{ issue: GUTIssue, status: Status } | null>(null);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [helpQuestion, setHelpQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
      fetchPermissions();
    }
  }, [currentUser]);

  useEffect(() => {
    checkAiStatus();
    const interval = setInterval(checkAiStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkAiStatus = async () => {
    const envKey = process.env.API_KEY;
    if (envKey && envKey !== 'undefined' && envKey !== '') {
      setAiConnected(true);
      return;
    }
    if (window.aistudio) {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setAiConnected(hasKey);
      } catch (e) { setAiConnected(false); }
    }
  };

  const fetchPermissions = async () => {
    if (!currentUser) return;
    try {
      const allPerms = await permissionService.getAll();
      const myPerm = allPerms.find(p => p.role === currentUser.role);
      if (myPerm) {
        setUserPermissions(myPerm);
      }
    } catch (err) { console.error("Erro permissions:", err); }
  };

  const handleConnectAi = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setAiConnected(true);
      } catch (err) { console.error("Erro AI:", err); }
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedIssues, fetchedAreas, fetchedSettings, fetchedThermo, fetchedVib] = await Promise.all([
        issueService.getAll().catch(() => []),
        areaService.getAll().catch(() => []),
        settingsService.get().catch(() => settings),
        thermographyService.getAll().catch(() => []),
        vibrationService.getAll().catch(() => [])
      ]);
      setIssues(fetchedIssues);
      setAreas(fetchedAreas);
      setSettings(fetchedSettings);
      setThermography(fetchedThermo);
      setVibration(fetchedVib);
    } catch (err: any) {
      setError(`Erro ao carregar dados: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendHelpQuestion = async () => {
    if (!helpQuestion.trim() || aiChatLoading || !currentUser) return;
    const userMsg = helpQuestion.trim();
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setHelpQuestion('');
    setAiChatLoading(true);
    try {
      const response = await explainSystemToUser(userMsg, currentUser.name);
      setChatHistory(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Erro ao sincronizar com a BIOHUB." }]);
    } finally {
      setAiChatLoading(false);
    }
  };

  const handleStatusChangeAttempt = (id: string, newStatus: Status) => {
    const issue = issues.find(i => i.id === id);
    if (!issue) return;
    if (newStatus === Status.RESOLVED || newStatus === Status.MITIGATED) {
      setResolutionTarget({ issue, status: newStatus });
    } else {
      updateIssueStatus(id, newStatus);
    }
  };

  const updateIssueStatus = async (id: string, status: Status, resolution?: string, aiEval?: string) => {
    if (currentUser?.role === UserRole.VIEWER) return;
    try {
      setLoading(true);
      const updates: Partial<GUTIssue> = { status };
      if (resolution !== undefined) updates.resolution = resolution;
      if (aiEval !== undefined) updates.aiResolutionEvaluation = aiEval;
      const updated = await issueService.update(id, updates);
      setIssues(prev => prev.map(i => i.id === id ? updated : i));
      setResolutionTarget(null);
    } catch (err: any) {
      alert(`Falha: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIssue = async (newIssueData: Omit<GUTIssue, 'id' | 'createdAt'>, id?: string) => {
    if (currentUser?.role === UserRole.VIEWER) return;
    try {
      setLoading(true);
      if (id) {
        const updated = await issueService.update(id, newIssueData);
        setIssues(prev => prev.map(i => String(i.id) === String(id) ? updated : i));
      } else {
        const created = await issueService.create(newIssueData);
        setIssues(prev => [created, ...prev]);
      }
      setShowForm(false);
    } catch (err: any) {
      alert(`Falha: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserPermissions(null);
    setView('dashboard');
  };

  const onViewProfile = (name: string) => {
    setSelectedEqName(name);
    setView('equipment-profile');
  };

  if (!currentUser) {
    return <Login onLoginSuccess={setCurrentUser} />;
  }

  const isDev = currentUser.role === 'Desenvolvedor';
  const isAdmin = currentUser.role === 'Administrador' || isDev;
  const isEditor = currentUser.role !== 'Visualizador';

  const NavButton = ({ target, icon: Icon, label, colorClass, visible, isSubItem = false }: any) => {
    if (visible === false) return null;
    const isActive = view === target;
    return (
      <button 
        onClick={() => setView(target)}
        className={`w-full flex items-center ${sidebarOpen ? `px-3 ${isSubItem ? 'ml-2 border-l border-slate-800' : ''} justify-start` : 'px-0 justify-center'} py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all group ${isActive ? `${colorClass} shadow-lg shadow-black/20` : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}
      >
        <Icon size={14} className={`${isActive ? 'scale-110' : 'opacity-50 group-hover:opacity-100'} transition-transform shrink-0`} />
        <span className={`${sidebarOpen ? 'block ml-2.5' : 'hidden'} transition-all truncate`}>{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden selection:bg-green-500/30">
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-50 relative`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute top-6 -right-3 bg-slate-800 border border-slate-700 rounded-full p-1 text-slate-400 hover:text-white transition-all shadow-xl z-[60] hover:scale-110 active:scale-95">
          {sidebarOpen ? <ChevronLeft size={12}/> : <ChevronRight size={12}/>}
        </button>
        <div className="p-4 flex flex-col items-center overflow-y-auto custom-scrollbar h-full">
          <div className="flex flex-col items-center group cursor-pointer mb-6 shrink-0" onClick={() => setView('dashboard')}>
             {sidebarOpen ? (
               <span className="font-black text-white italic tracking-tighter text-xl animate-fade-in">
                 BIOMETANO <span className="text-orange-500">Caieiras</span>
               </span>
             ) : (
               <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center font-black text-white italic text-base shadow-lg shadow-orange-900/20">B</div>
             )}
          </div>

          <div className={`mb-6 w-full ${sidebarOpen ? 'flex gap-2' : 'flex flex-col items-center gap-4'}`}>
              <NotificationBell 
                user={currentUser} 
                issues={issues} 
                thermography={thermography} 
                vibration={vibration}
                sidebarOpen={sidebarOpen}
                onViewGUT={(id) => { const issue = issues.find(i => i.id === id); if (issue) { setCurrentIssue(issue); setShowDetails(true); setView('gut'); } }}
                onViewThermo={() => setView('thermography')}
                onViewVib={() => setView('vibration')}
              />
              {sidebarOpen && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 flex-1 flex items-center justify-between">
                   <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Sincronismo</span>
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                </div>
              )}
          </div>

          <div className="w-full space-y-1">
            <p className={`text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 ml-3 ${!sidebarOpen && 'hidden'}`}>Central de Controle</p>
            <NavButton target="dashboard" icon={LayoutDashboard} label="Dashboard" colorClass="bg-slate-100 text-slate-950" visible={userPermissions?.can_view_dashboard} />
            <NavButton target="assets" icon={HardDrive} label="Ativos" colorClass="bg-indigo-600 text-white" visible={userPermissions?.can_view_assets} />
            
            <div className="pt-4 space-y-1">
               <p className={`text-[7px] font-black text-orange-600/80 uppercase tracking-[0.3em] mb-2 ml-3 ${!sidebarOpen && 'hidden'}`}>Preditiva</p>
               
               <div className="space-y-1">
                  <button 
                    onClick={() => {
                      if (!sidebarOpen) setSidebarOpen(true);
                      setPredictiveExpanded(!predictiveExpanded);
                    }}
                    className={`w-full flex items-center ${sidebarOpen ? 'px-3 justify-between' : 'justify-center'} py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all text-slate-500 hover:text-white hover:bg-slate-800/50`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Activity size={14} className="opacity-50" />
                      {sidebarOpen && <span>Eng. Preditiva</span>}
                    </div>
                    {sidebarOpen && (predictiveExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>)}
                  </button>

                  {predictiveExpanded && (
                    <div className={`${sidebarOpen ? 'block' : 'hidden'} animate-fade-in space-y-1`}>
                      <NavButton target="gut" icon={ListFilter} label="Matriz GUT" colorClass="bg-blue-600 text-white" visible={userPermissions?.can_view_gut} isSubItem={true} />
                      <NavButton target="thermography" icon={Thermometer} label="Termografia" colorClass="bg-orange-600 text-white" visible={userPermissions?.can_view_thermo} isSubItem={true} />
                      <NavButton target="vibration" icon={Waves} label="Vibração" colorClass="bg-cyan-600 text-white" visible={userPermissions?.can_view_vibration} isSubItem={true} />
                    </div>
                  )}
               </div>
            </div>

            <div className="pt-4 space-y-1">
               <p className={`text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 ml-3 ${!sidebarOpen && 'hidden'}`}>Setores Operacionais</p>
               <NavButton target="sector-mecanica-lub" icon={Wrench} label="Mecânica e Lub" colorClass="bg-blue-600 text-white" visible={userPermissions?.can_view_sector} />
               <NavButton target="sector-eletrica-instr" icon={Zap} label="Elétrica e Instr" colorClass="bg-yellow-600 text-white" visible={userPermissions?.can_view_sector} />
               <NavButton target="sector-operacao" icon={ClipboardCheck} label="Operação" colorClass="bg-emerald-600 text-white" visible={userPermissions?.can_view_sector} />
               <NavButton target="sector-quimica" icon={FlaskConical} label="Química" colorClass="bg-pink-600 text-white" visible={userPermissions?.can_view_sector} />
            </div>

            <div className="pt-4 space-y-1 pb-4">
               <p className={`text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 ml-3 ${!sidebarOpen && 'hidden'}`}>Administração</p>
               <NavButton target="users" icon={Users} label="Usuários" colorClass="bg-purple-600 text-white" visible={userPermissions?.can_view_users} />
               <NavButton target="reports" icon={FileSpreadsheet} label="Relatórios" colorClass="bg-emerald-600 text-white" visible={userPermissions?.can_view_reports || isAdmin} />
               <NavButton target="areas" icon={Settings} label="Configuração" colorClass="bg-green-600 text-white" visible={userPermissions?.can_view_settings} />
            </div>
          </div>
        </div>

        <div className="mt-auto p-3 border-t border-slate-800 space-y-2 shrink-0">
           <button onClick={() => setAiAssistantOpen(true)} className={`w-full flex items-center ${sidebarOpen ? 'px-3 justify-start' : 'justify-center'} py-3 rounded-xl bg-orange-600/10 border border-orange-500/20 text-orange-400 hover:bg-orange-600/20 transition-all group shadow-lg shadow-orange-900/10`}>
              <Sparkles size={16} className="shrink-0 group-hover:rotate-12 transition-transform" />
              {sidebarOpen && <span className="ml-2.5 font-black text-[9px] uppercase tracking-widest">BIOHUB</span>}
           </button>

           <div className={`flex items-center ${sidebarOpen ? 'gap-2 px-2' : 'justify-center px-0'} py-2 rounded-xl bg-black/20 overflow-hidden`}>
               <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black uppercase border transition-all shrink-0 ${isDev ? 'bg-purple-900/30 text-purple-400 border-purple-800/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {isDev ? <Terminal size={16}/> : currentUser.name.charAt(0)}
               </div>
               {sidebarOpen && (
                 <div className="truncate">
                    <p className="text-[9px] font-black text-slate-200 uppercase tracking-tight truncate leading-none">{currentUser.name}</p>
                    <p className={`text-[7px] font-bold uppercase tracking-widest mt-1 ${isDev ? 'text-purple-400' : 'text-slate-500'}`}>{currentUser.sector || currentUser.role}</p>
                 </div>
               )}
           </div>
           <button onClick={handleLogout} className={`w-full flex items-center ${sidebarOpen ? 'px-3 justify-start' : 'justify-center'} py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-all font-black text-[9px] uppercase tracking-widest`}>
             <LogOut size={16} className="shrink-0" />
             {sidebarOpen && <span className="ml-2.5">Sair</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 relative">
        <div className="max-w-6xl mx-auto px-5 py-8">
          {error && <div className="bg-red-950/40 border border-red-800/50 text-red-200 p-4 rounded-xl mb-6 flex items-start gap-4 animate-fade-in"><AlertCircle size={18} className="text-red-500 shrink-0 mt-1" /><div><p className="font-black uppercase text-[10px] tracking-widest mb-1">Erro Crítico</p><p className="text-[11px] opacity-80 leading-relaxed">{error}</p></div></div>}
          {!loading && (
            <div className="animate-fade-in">
              {view === 'dashboard' && userPermissions?.can_view_dashboard && (
                <div className="space-y-10">
                  <header className="mb-6"><h1 className="text-2xl font-black text-white tracking-tighter uppercase">Visão Geral Operacional</h1><p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1">Painel de Monitoramento de Risco e Disponibilidade</p></header>
                  <StatsCards issues={issues} thermography={thermography} onViewGUTDetail={(id) => { const issue = issues.find(i => i.id === id); if (issue) { setCurrentIssue(issue); setShowDetails(true); } }} onViewThermo={() => setView('thermography')} />
                  <Charts issues={issues} thermography={thermography} areas={areas} settings={settings} />
                </div>
              )}
              {view === 'reports' && (userPermissions?.can_view_reports || isAdmin) && (
                <ReportsManager onCancel={() => setView('dashboard')} />
              )}
              {view.startsWith('sector-') && userPermissions?.can_view_sector && (
                <SectorPortal 
                  sectorId={view.replace('sector-', '')} 
                  issues={issues} 
                  currentUser={currentUser}
                  onNavigate={(target: any) => setView(target)}
                  onStatusChange={handleStatusChangeAttempt}
                  onEdit={(id) => { const issue = issues.find(i => i.id === id); if (issue) { setCurrentIssue(issue); setShowForm(true); } }}
                  onDetails={(id) => { const issue = issues.find(i => i.id === id); if (issue) { setCurrentIssue(issue); setShowDetails(true); } }}
                />
              )}
              {view === 'gut' && userPermissions?.can_view_gut && (
                <div className="space-y-6">
                   {showForm ? <IssueForm onSave={handleSaveIssue} onCancel={() => {setShowForm(false); setCurrentIssue(null);}} onDelete={async (id) => { if (!isAdmin) return; await issueService.delete(id); setIssues(prev => prev.filter(i => i.id !== id)); setShowForm(false); }} areas={areas.length > 0 ? areas : ["Geral"]} initialData={currentIssue} onConnectAI={handleConnectAi} isAIConnected={aiConnected} /> : <GUTTable issues={issues} onStatusChange={handleStatusChangeAttempt} onEdit={(id) => { const issue = issues.find(i => i.id === id); if (issue) { setCurrentIssue(issue); setShowForm(true); } }} onDetails={(id) => { const issue = issues.find(i => i.id === id); if (issue) { setCurrentIssue(issue); setShowDetails(true); } }} onAdd={isEditor ? () => setShowForm(true) : undefined} />}
                </div>
              )}
              {view === 'thermography' && userPermissions?.can_view_thermo && <ThermographyManager areas={areas} userRole={currentUser.role as UserRole} onViewEquipmentProfile={onViewProfile} />}
              {view === 'vibration' && userPermissions?.can_view_vibration && <VibrationManager areas={areas} userRole={currentUser.role as UserRole} onViewEquipmentProfile={onViewProfile} />}
              {view === 'assets' && userPermissions?.can_view_assets && <EquipmentBrowser areas={areas} onSelectEquipment={onViewProfile} userRole={currentUser.role as UserRole} />}
              {view === 'users' && userPermissions?.can_view_users && <AdminUsers currentUser={currentUser} />}
              {view === 'areas' && userPermissions?.can_view_settings && <AreaManager areas={areas} onUpdateAreas={() => fetchInitialData()} onCancel={() => setView('dashboard')} initialSettings={settings} onUpdateSettings={(s) => setSettings(s)} currentUser={currentUser} />}
              {view === 'equipment-profile' && selectedEqName && <EquipmentProfile equipmentName={selectedEqName} onClose={() => setView('assets')} userRole={currentUser.role as UserRole} />}
            </div>
          )}
        </div>
      </main>

      {resolutionTarget && <ResolutionModal issue={resolutionTarget.issue} targetStatus={resolutionTarget.status} onConfirm={(res, evalText) => updateIssueStatus(resolutionTarget.issue.id, resolutionTarget.status, res, evalText)} onCancel={() => setResolutionTarget(null)} />}
      
      {aiAssistantOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-end p-6 bg-slate-950/40 backdrop-blur-sm animate-fade-in pointer-events-none">
           <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up ring-1 ring-white/10 flex flex-col h-[520px] pointer-events-auto">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/40">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-600/10 text-orange-500 rounded-xl border border-orange-500/20">
                       <Bot size={20} />
                    </div>
                    <div>
                       <h3 className="text-xs font-black text-white uppercase tracking-widest">BIOHUB</h3>
                       <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Inteligência do Sistema</p>
                    </div>
                 </div>
                 <button onClick={() => setAiAssistantOpen(false)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-slate-950/20">
                 {chatHistory.map((msg, i) => (
                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] p-4 rounded-2xl text-[10px] leading-relaxed ${msg.role === 'user' ? 'bg-orange-600 text-white font-bold' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                         <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </div>
                   </div>
                 ))}
                 <div ref={chatEndRef} />
              </div>
              <div className="p-6 bg-slate-950/40 border-t border-white/5">
                 <div className="flex gap-2">
                    <input type="text" value={helpQuestion} onChange={e => setHelpQuestion(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendHelpQuestion()} placeholder="Dúvida sobre o sistema..." className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-[11px] text-white outline-none focus:border-orange-500/50 transition-all" />
                    <button onClick={handleSendHelpQuestion} disabled={aiChatLoading} className="bg-orange-600 hover:bg-orange-500 text-white p-3 rounded-xl transition-all"><Send size={18} /></button>
                 </div>
              </div>
           </div>
        </div>
      )}
      {showDetails && currentIssue && <DetailsModal issue={currentIssue} onClose={() => setShowDetails(false)} />}
    </div>
  );
}

export default App;


import React, { useState, useEffect } from 'react';
import { PlusCircle, LayoutDashboard, Settings, Loader2, Thermometer, ListFilter, AlertCircle, Users, LogOut, Terminal, HardDrive, Menu, X as CloseIcon, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { GUTIssue, Status, SystemSettings, ThermographyRecord, User, UserRole } from './types';
import { StatsCards } from './components/StatsCards';
import { IssueForm } from './components/IssueForm';
import { GUTTable } from './components/GUTTable';
import { Charts } from './components/Charts';
import { AreaManager } from './components/AreaManager';
import { DetailsModal } from './components/DetailsModal';
import { ThermographyManager } from './components/ThermographyManager';
import { Login } from './components/Login';
import { AdminUsers } from './components/AdminUsers';
import { EquipmentProfile } from './components/EquipmentProfile';
import { EquipmentBrowser } from './components/EquipmentBrowser';
import { DatabaseSetup } from './components/DatabaseSetup';
import { issueService, areaService, settingsService, thermographyService, userService, storageService } from './services/supabase';

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

type MainView = 'dashboard' | 'gut' | 'thermography' | 'assets' | 'areas' | 'users' | 'equipment-profile' | 'db-setup';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<GUTIssue[]>([]);
  const [thermography, setThermography] = useState<ThermographyRecord[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
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
  const [selectedEqName, setSelectedEqName] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentIssue, setCurrentIssue] = useState<GUTIssue | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiConnected, setAiConnected] = useState(false);
  const [storageAlert, setStorageAlert] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchInitialData();
      if (currentUser.role === UserRole.DEVELOPER) {
        checkInfra();
      }
    }
  }, [currentUser]);

  useEffect(() => {
    checkAiStatus();
    const interval = setInterval(checkAiStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkInfra = async () => {
    const exists = await storageService.checkBucketExists();
    setStorageAlert(!exists);
  };

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
      } catch (e) {
        setAiConnected(false);
      }
    }
  };

  const handleConnectAi = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setAiConnected(true);
      } catch (err) {
        console.error("Erro ao abrir seletor de chaves:", err);
      }
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedIssues, fetchedAreas, fetchedSettings, fetchedThermo] = await Promise.all([
        issueService.getAll().catch(() => []),
        areaService.getAll().catch(() => []),
        settingsService.get().catch(() => settings),
        thermographyService.getAll().catch(() => [])
      ]);
      setIssues(fetchedIssues);
      setAreas(fetchedAreas);
      setSettings(fetchedSettings);
      setThermography(fetchedThermo);
    } catch (err: any) {
      setError(`Erro ao carregar dados: ${err.message}`);
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
      alert(`Falha ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('dashboard');
  };

  const onViewProfile = (name: string) => {
    setSelectedEqName(name);
    setView('equipment-profile');
  };

  if (!currentUser) {
    return <Login onLoginSuccess={setCurrentUser} />;
  }

  const isDev = currentUser.role === UserRole.DEVELOPER;
  const isAdmin = currentUser.role === UserRole.ADMIN || isDev;
  const isEditor = currentUser.role === UserRole.EDITOR || isAdmin;

  const NavButton = ({ target, icon: Icon, label, colorClass }: any) => (
    <button 
      onClick={() => setView(target)}
      className={`w-full flex items-center ${sidebarOpen ? 'px-4 justify-start' : 'px-0 justify-center'} py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all group ${view === target ? `${colorClass} shadow-lg shadow-black/20` : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}
    >
      <Icon size={18} className={`${view === target ? 'scale-110' : 'opacity-50 group-hover:opacity-100'} transition-transform shrink-0`} />
      <span className={`${sidebarOpen ? 'block ml-3' : 'hidden'} transition-all truncate`}>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden selection:bg-green-500/30">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-50 relative`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute top-6 -right-3 bg-slate-800 border border-slate-700 rounded-full p-1.5 text-slate-400 hover:text-white transition-all shadow-xl z-[60] hover:scale-110 active:scale-95">
          {sidebarOpen ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>}
        </button>
        <div className="p-6 flex flex-col items-center">
          <div className="flex flex-col items-center group cursor-pointer mb-8" onClick={() => setView('dashboard')}>
             {sidebarOpen ? (
               <span className="font-black text-white italic tracking-tighter text-2xl animate-fade-in">
                 BIOMETANO <span className="text-orange-500">Caieiras</span>
               </span>
             ) : (
               <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white italic text-lg shadow-lg shadow-orange-900/20">B</div>
             )}
          </div>
          <div className="w-full space-y-2">
            <NavButton target="dashboard" icon={LayoutDashboard} label="Dashboard" colorClass="bg-slate-100 text-slate-950" />
            <NavButton target="gut" icon={ListFilter} label="Matrix GUT" colorClass="bg-blue-600 text-white" />
            <NavButton target="thermography" icon={Thermometer} label="Termografia" colorClass="bg-orange-600 text-white" />
            <NavButton target="assets" icon={HardDrive} label="Ativos" colorClass="bg-emerald-600 text-white" />
            {isAdmin && <NavButton target="users" icon={Users} label="Usuários" colorClass="bg-indigo-600 text-white" />}
            {isAdmin && <NavButton target="areas" icon={Settings} label="Configuração" colorClass="bg-green-600 text-white" />}
            {isDev && <NavButton target="db-setup" icon={Database} label="Banco SQL" colorClass="bg-blue-900 text-blue-200" />}
          </div>
        </div>
        <div className="mt-auto p-4 border-t border-slate-800">
           <div className={`flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-3 rounded-2xl bg-black/20 mb-4 overflow-hidden`}>
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase border transition-all shrink-0 ${isDev ? 'bg-purple-900/30 text-purple-400 border-purple-800/50' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {isDev ? <Terminal size={18}/> : currentUser.name.charAt(0)}
               </div>
               {sidebarOpen && (
                 <div className="truncate">
                    <p className="text-[10px] font-black text-slate-200 uppercase tracking-tight truncate leading-none">{currentUser.name}</p>
                    <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${isDev ? 'text-purple-400' : 'text-slate-500'}`}>{currentUser.role}</p>
                 </div>
               )}
           </div>
           <button onClick={handleLogout} className={`w-full flex items-center ${sidebarOpen ? 'px-4 justify-start' : 'justify-center'} py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-black text-[10px] uppercase tracking-widest`}>
             <LogOut size={18} className="shrink-0" />
             {sidebarOpen && <span className="ml-3">Sair</span>}
           </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950 relative">
        <div className="max-w-7xl mx-auto px-6 py-10">
          {error && <div className="bg-red-950/40 border border-red-800/50 text-red-200 p-5 rounded-2xl mb-8 flex items-start gap-4 animate-fade-in"><AlertCircle className="text-red-500 shrink-0 mt-1" /><div><p className="font-black uppercase text-xs tracking-widest mb-1">Erro Crítico</p><p className="text-xs opacity-80 leading-relaxed">{error}</p></div></div>}
          {loading && issues.length === 0 && !error && <div className="flex flex-col items-center justify-center py-40 gap-4"><Loader2 size={48} className="animate-spin text-green-500" /><p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Acessando Central de Caieiras...</p></div>}
          {!loading && (
            <div className="animate-fade-in">
              {view === 'dashboard' && (
                <div className="space-y-12">
                  <header className="mb-8"><h1 className="text-3xl font-black text-white tracking-tighter uppercase">Visão Geral Operacional</h1><p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Painel de Monitoramento de Risco e Disponibilidade</p></header>
                  <StatsCards issues={issues} thermography={thermography} onViewGUTDetail={(id) => { const issue = issues.find(i => i.id === id); if (issue) { setCurrentIssue(issue); setShowDetails(true); } }} onViewThermo={() => setView('thermography')} />
                  <Charts issues={issues} thermography={thermography} areas={areas} settings={settings} />
                </div>
              )}
              {view === 'gut' && (
                <div className="space-y-8">
                   {showForm ? <IssueForm onSave={handleSaveIssue} onCancel={() => {setShowForm(false); setCurrentIssue(null);}} onDelete={async (id) => { if (!isAdmin) return; await issueService.delete(id); setIssues(prev => prev.filter(i => i.id !== id)); setShowForm(false); }} areas={areas.length > 0 ? areas : ["Geral"]} initialData={currentIssue} onConnectAI={handleConnectAi} isAIConnected={aiConnected} /> : <GUTTable issues={issues} onStatusChange={async (id, status) => { const updated = await issueService.update(id, { status }); setIssues(prev => prev.map(i => i.id === id ? updated : i)); }} onEdit={(id) => { const issue = issues.find(i => i.id === id); if (issue) { setCurrentIssue(issue); setShowForm(true); } }} onDetails={(id) => { const issue = issues.find(i => i.id === id); if (issue) { setCurrentIssue(issue); setShowDetails(true); } }} />}
                </div>
              )}
              {view === 'thermography' && <ThermographyManager areas={areas} userRole={currentUser.role} onViewEquipmentProfile={onViewProfile} />}
              {view === 'assets' && <EquipmentBrowser areas={areas} onSelectEquipment={onViewProfile} userRole={currentUser.role} />}
              {view === 'users' && isAdmin && <AdminUsers currentUser={currentUser} />}
              {view === 'areas' && isAdmin && <AreaManager areas={areas} onUpdateAreas={() => fetchInitialData()} onCancel={() => setView('dashboard')} initialSettings={settings} onUpdateSettings={(s) => setSettings(s)} currentUser={currentUser} />}
              {view === 'equipment-profile' && selectedEqName && <EquipmentProfile equipmentName={selectedEqName} onClose={() => setView('assets')} userRole={currentUser.role} />}
              {view === 'db-setup' && isDev && <DatabaseSetup />}
            </div>
          )}
        </div>
      </main>
      {showDetails && currentIssue && <DetailsModal issue={currentIssue} onClose={() => setShowDetails(false)} />}
    </div>
  );
}

export default App;

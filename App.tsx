
import React, { useState, useEffect } from 'react';
import { PlusCircle, LayoutDashboard, Settings, Loader2, Database, ShieldCheck, Zap, Key } from 'lucide-react';
import { GUTIssue, Status } from './types';
import { StatsCards } from './components/StatsCards';
import { IssueForm } from './components/IssueForm';
import { GUTTable } from './components/GUTTable';
import { Charts } from './components/Charts';
import { AreaManager } from './components/AreaManager';
import { DetailsModal } from './components/DetailsModal';
import { issueService, areaService } from './services/supabase';

// Declaração global segura para o seletor de chaves
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

function App() {
  const [issues, setIssues] = useState<GUTIssue[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [view, setView] = useState<'dashboard' | 'form' | 'areas'>('dashboard');
  const [currentIssue, setCurrentIssue] = useState<GUTIssue | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiConnected, setAiConnected] = useState(false);

  useEffect(() => {
    fetchInitialData();
    checkAiStatus();
  }, []);

  const checkAiStatus = async () => {
    // 1. Verifica se a chave já está presente no ambiente (padrão para a maioria dos deploys)
    const hasKeyInEnv = !!(process.env.API_KEY && process.env.API_KEY !== 'undefined' && process.env.API_KEY !== '');
    
    if (hasKeyInEnv) {
      setAiConnected(true);
      return;
    }

    // 2. Tenta verificar se o seletor de chaves está disponível (ambientes de preview)
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
    } else {
      alert("A chave de API deve ser configurada nas variáveis de ambiente do projeto para este navegador.");
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [fetchedIssues, fetchedAreas] = await Promise.all([
        issueService.getAll(),
        areaService.getAll()
      ]);
      setIssues(fetchedIssues);
      setAreas(fetchedAreas);
    } catch (err: any) {
      setError(`Erro de conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIssue = async (newIssueData: Omit<GUTIssue, 'id' | 'createdAt'>, id?: string) => {
    try {
      setLoading(true);
      if (id) {
        const updated = await issueService.update(id, newIssueData);
        setIssues(prev => prev.map(i => String(i.id) === String(id) ? updated : i));
      } else {
        const created = await issueService.create(newIssueData);
        setIssues(prev => [created, ...prev]);
      }
      setView('dashboard');
    } catch (err: any) {
      alert(`Falha ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && issues.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500/30">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex flex-col cursor-pointer group" onClick={() => setView('dashboard')}>
            <span className="text-2xl font-black text-white italic tracking-tighter group-hover:text-green-500 transition-colors">
              BIOMETANO <span className="text-orange-500">Caieiras</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Engenharia de Risco</span>
              {aiConnected ? (
                <span className="flex items-center gap-1 text-[8px] text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded border border-purple-800/40 font-black uppercase tracking-widest">
                  <Zap size={8} fill="currentColor" /> IA Ativa
                </span>
              ) : (
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">
                  IA Offline
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-4 items-center">
             <button 
                onClick={() => setView('areas')} 
                className={`p-2 rounded-lg transition-all ${view === 'areas' ? 'text-green-500 bg-green-500/10' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
             >
                <Settings size={22} />
             </button>
             <button 
                onClick={() => {setCurrentIssue(null); setView('form');}}
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center gap-2"
             >
                <PlusCircle size={18} /> Novo Evento
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10">
        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 p-4 rounded-xl mb-8 flex items-center gap-3">
            <Zap size={18} /> {error}
          </div>
        )}

        {view === 'dashboard' && (
          <div className="space-y-12 animate-fade-in">
            <StatsCards issues={issues} />
            <Charts issues={issues} areas={areas} />
            <GUTTable 
                issues={issues} 
                onStatusChange={async (id, status) => {
                  const updated = await issueService.update(id, { status });
                  setIssues(prev => prev.map(i => i.id === id ? updated : i));
                }}
                onEdit={(id) => {
                  const issue = issues.find(i => i.id === id);
                  if (issue) { setCurrentIssue(issue); setView('form'); }
                }}
                onDetails={(id) => {
                  const issue = issues.find(i => i.id === id);
                  if (issue) { setCurrentIssue(issue); setShowDetails(true); }
                }}
            />
          </div>
        )}

        {view === 'form' && (
          <IssueForm 
            onSave={handleSaveIssue} 
            onCancel={() => setView('dashboard')} 
            onDelete={async (id) => {
              if (confirm("Deseja realmente excluir este registro permanentemente?")) {
                await issueService.delete(id);
                setIssues(prev => prev.filter(i => i.id !== id));
                setView('dashboard');
              }
            }}
            areas={areas.length > 0 ? areas : ["Geral"]}
            initialData={currentIssue}
          />
        )}

        {view === 'areas' && (
          <AreaManager 
            areas={areas} 
            onUpdateAreas={() => fetchInitialData()} 
            onCancel={() => setView('dashboard')} 
          />
        )}
      </main>

      {showDetails && currentIssue && (
        <DetailsModal issue={currentIssue} onClose={() => setShowDetails(false)} />
      )}
    </div>
  );
}

export default App;

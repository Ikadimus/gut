
import React, { useState, useEffect } from 'react';
import { PlusCircle, LayoutDashboard, Settings, Loader2, AlertCircle, Database, ShieldCheck, Zap, Key } from 'lucide-react';
import { GUTIssue, Status } from './types';
import { StatsCards } from './components/StatsCards';
import { IssueForm } from './components/IssueForm';
import { GUTTable } from './components/GUTTable';
import { Charts } from './components/Charts';
import { AreaManager } from './components/AreaManager';
import { DetailsModal } from './components/DetailsModal';
import { issueService, areaService } from './services/supabase';

// Extensão de tipos para o ambiente AI Studio - Fixed to match pre-defined AIStudio type in the environment
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio: AIStudio;
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
  const [showAiSetup, setShowAiSetup] = useState(false);

  useEffect(() => {
    fetchInitialData();
    checkAiStatus();
  }, []);

  const checkAiStatus = async () => {
    // 1. Verifica se já existe chave injetada (process.env.API_KEY)
    if (process.env.API_KEY && process.env.API_KEY !== 'undefined') {
      setAiConnected(true);
      return;
    }

    // 2. Se não, verifica se o navegador tem o seletor do AI Studio disponível
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setAiConnected(hasKey);
      if (!hasKey) {
        setShowAiSetup(true); // Mostra aviso se não houver chave
      }
    }
  };

  const handleConnectAi = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Após abrir o seletor, assumimos sucesso conforme instruções de race condition
        setAiConnected(true);
        setShowAiSetup(false);
      } catch (err) {
        console.error("Erro ao abrir seletor:", err);
      }
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
      setError(`Erro: ${err.message}`);
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
      alert(`Falha: ${err.message}`);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Overlay de Configuração de IA (Apenas se não conectado) */}
      {showAiSetup && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 p-8 rounded-3xl text-center shadow-2xl ring-1 ring-white/10 animate-slide-up">
            <div className="bg-purple-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-400 border border-purple-500/20">
              <Zap size={32} className="animate-pulse" />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Ativar IA Analítica</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Para usar o sistema de sugestão GUT automática em produção, você precisa autorizar o uso da sua chave de API do Gemini.
            </p>
            <button 
              onClick={handleConnectAi}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-purple-900/40"
            >
              <Key size={18} /> Selecionar Chave API
            </button>
            <p className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">
              Requisito de Segurança: <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-purple-400 underline">Faturamento Ativo</a>
            </p>
          </div>
        </div>
      )}

      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex flex-col cursor-pointer" onClick={() => setView('dashboard')}>
            <span className="text-2xl font-black text-white italic tracking-tighter">BIOMETANO <span className="text-orange-500">Caieiras</span></span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">Matriz GUT</span>
              {aiConnected ? (
                <span className="flex items-center gap-1 text-[8px] text-purple-400 bg-purple-900/20 px-1.5 py-0.5 rounded border border-purple-800/40 font-black uppercase">
                  <Zap size={8} /> IA Online
                </span>
              ) : (
                <button onClick={handleConnectAi} className="text-[8px] text-slate-500 underline font-black uppercase">IA Offline - Clique p/ Ativar</button>
              )}
            </div>
          </div>

          <div className="flex gap-4">
             <button onClick={() => setView('areas')} className="text-slate-500 hover:text-white transition-colors p-2"><Settings size={20} /></button>
             <button 
                onClick={() => {setCurrentIssue(null); setView('form');}}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
             >
                <PlusCircle size={16} /> Novo Registro
             </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-10">
        {view === 'dashboard' && (
          <div className="space-y-10">
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
              await issueService.delete(id);
              setIssues(prev => prev.filter(i => i.id !== id));
              setView('dashboard');
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

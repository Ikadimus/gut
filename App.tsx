
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

// Declaração global para o seletor de chaves da plataforma
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    // FIX: Adicionando modificador opcional para coincidir com a declaração global do ambiente e evitar conflitos de modificadores
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
  const [showAiSetup, setShowAiSetup] = useState(false);

  useEffect(() => {
    fetchInitialData();
    checkAiStatus();
  }, []);

  const checkAiStatus = async () => {
    // Verifica se a chave já está presente no ambiente
    const hasKeyInEnv = !!(process.env.API_KEY && process.env.API_KEY !== 'undefined' && process.env.API_KEY !== '');
    
    if (hasKeyInEnv) {
      setAiConnected(true);
      setShowAiSetup(false);
      return;
    }

    // Se não houver chave no env, verifica via API do AI Studio
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setAiConnected(hasKey);
      if (!hasKey) {
        setShowAiSetup(true);
      }
    } else {
      // Em ambientes sem window.aistudio, se não tem API_KEY, precisa de setup
      setShowAiSetup(true);
    }
  };

  const handleConnectAi = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Após abrir o seletor, assumimos sucesso para liberar a interface
        setAiConnected(true);
        setShowAiSetup(false);
      } catch (err) {
        console.error("Erro ao abrir seletor de chaves:", err);
      }
    } else {
      alert("Para ativar a IA em produção, utilize um navegador compatível com o seletor de chaves do AI Studio.");
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
      {/* Bloqueio de IA: Exibe quando não há chave detectada */}
      {showAiSetup && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700/50 p-10 rounded-[2.5rem] text-center shadow-2xl ring-1 ring-white/10 animate-fade-in">
            <div className="bg-purple-500/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 text-purple-400 border border-purple-500/20 shadow-inner">
              <Zap size={40} className="animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3">Ativação Necessária</h2>
            <p className="text-slate-400 text-sm mb-10 leading-relaxed font-medium">
              O módulo de inteligência artificial requer uma chave de API para processar as análises GUT da planta de Biometano.
            </p>
            <button 
              onClick={handleConnectAi}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all shadow-2xl shadow-purple-900/40 active:scale-95"
            >
              <Key size={20} /> Vincular Chave API
            </button>
            <div className="mt-8 pt-6 border-t border-slate-800">
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">
                Utilize a chave que você possui no seletor que será aberto.<br/>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-purple-400 hover:text-purple-300 underline underline-offset-4">Verificar Faturamento</a>
               </p>
            </div>
          </div>
        </div>
      )}

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
                <button onClick={handleConnectAi} className="text-[8px] text-slate-500 hover:text-purple-400 font-black uppercase flex items-center gap-1">
                  <Key size={8} /> Conectar IA
                </button>
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

import React, { useState, useEffect } from 'react';
import { PlusCircle, LayoutDashboard, Settings, Loader2, AlertCircle, Database } from 'lucide-react';
import { GUTIssue, Status } from './types';
import { StatsCards } from './components/StatsCards';
import { IssueForm } from './components/IssueForm';
import { GUTTable } from './components/GUTTable';
import { Charts } from './components/Charts';
import { AreaManager } from './components/AreaManager';
import { DetailsModal } from './components/DetailsModal';
import { issueService, areaService } from './services/supabase';

function App() {
  const [issues, setIssues] = useState<GUTIssue[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [view, setView] = useState<'dashboard' | 'form' | 'areas'>('dashboard');
  const [currentIssue, setCurrentIssue] = useState<GUTIssue | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedIssues, fetchedAreas] = await Promise.all([
        issueService.getAll(),
        areaService.getAll()
      ]);
      setIssues(fetchedIssues);
      setAreas(fetchedAreas);
    } catch (err: any) {
      setError(`Erro de Rede: ${err.message || 'Falha na conexão'}`);
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
      setCurrentIssue(null);
    } catch (err: any) {
      alert(`Falha ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Status) => {
    try {
      const updated = await issueService.update(id, { status: newStatus });
      setIssues(prev => prev.map(i => String(i.id) === String(id) ? updated : i));
    } catch (err) {
      alert("Erro ao sincronizar status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    
    try {
      setLoading(true);
      // 1. Comando direto ao Supabase
      const success = await issueService.delete(id);
      
      if (success) {
        // 2. Limpeza do estado local imediata
        setIssues(prev => prev.filter(issue => String(issue.id) !== String(id)));
        
        // 3. Reset de interface
        setCurrentIssue(null);
        setView('dashboard');
      }
    } catch (err: any) {
      alert(`ERRO DE SISTEMA: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAreas = async (newAreas: string[]) => {
    await fetchInitialData();
  };

  const handleEdit = (id: string) => {
    const issue = issues.find(i => String(i.id) === String(id));
    if (issue) {
      setCurrentIssue(issue);
      setView('form');
    }
  };

  const handleOpenDetails = (id: string) => {
    const issue = issues.find(i => String(i.id) === String(id));
    if (issue) {
      setCurrentIssue(issue);
      setShowDetails(true);
    }
  };

  if (loading && issues.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
        <Loader2 size={48} className="animate-spin text-green-500 mb-6" />
        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse italic">Acessando Nucleo de Dados Biometano...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-green-500/30 selection:text-green-200">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex flex-col items-start cursor-pointer group" onClick={() => setView('dashboard')}>
            <span className="text-2xl font-black text-white italic tracking-tighter leading-none">BIOMETANO <span className="text-orange-500">Caieiras</span></span>
            <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">Matriz de Risco GUT</span>
                <span className="h-1 w-1 bg-slate-700 rounded-full"></span>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5 opacity-80"><Database size={10} /> Database Online</p>
            </div>
          </div>

          <div className="flex gap-4 items-center">
             <button 
                onClick={() => setView('areas')}
                className={`px-4 py-2 rounded-lg font-black text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all border ${view === 'areas' ? 'bg-slate-800 text-white border-slate-600' : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50'}`}
             >
                <Settings size={18} /> Áreas
             </button>

             {view === 'dashboard' || view === 'areas' ? (
                <button 
                  onClick={() => {setCurrentIssue(null); setView('form');}}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all shadow-xl shadow-green-950/40 active:scale-95 border border-green-400/20"
                >
                  <PlusCircle size={18} /> Novo Evento
                </button>
             ) : (
                <button 
                  onClick={() => {setView('dashboard'); setCurrentIssue(null);}}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all border border-slate-700 active:scale-95"
                >
                  <LayoutDashboard size={18} /> Dashboard
                </button>
             )}
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-900/30 p-4 text-center text-[10px] font-black uppercase tracking-[0.4em] border-b border-red-800/40 flex items-center justify-center gap-3 text-red-400 animate-pulse">
          <AlertCircle size={16} /> Falha de Conexão: Verifique seu Banco de Dados
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {view === 'dashboard' && !error && (
          <div className="animate-fade-in space-y-10">
            <StatsCards issues={issues} />
            {issues.length > 0 ? (
              <>
                <Charts issues={issues} />
                <GUTTable 
                    issues={issues} 
                    onStatusChange={handleStatusChange} 
                    onEdit={handleEdit}
                    onDetails={handleOpenDetails}
                />
              </>
            ) : (
              <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-[2.5rem] p-32 text-center shadow-inner">
                 <Database size={56} className="text-slate-800 mx-auto mb-8 opacity-40" />
                 <h2 className="text-xl font-black text-slate-500 uppercase tracking-[0.5em] italic">Base de Dados Vazia</h2>
                 <p className="text-slate-600 mt-3 text-[10px] font-bold uppercase tracking-widest mb-10">Inicie o monitoramento da planta de biometano</p>
                 <button 
                    onClick={() => {setCurrentIssue(null); setView('form');}}
                    className="bg-green-600 hover:bg-green-500 text-white px-12 py-4 rounded-full font-black uppercase text-xs tracking-[0.3em] transition-all shadow-2xl shadow-green-950/40 active:scale-95"
                 >
                    Novo Registro GUT
                 </button>
              </div>
            )}
          </div>
        )}

        {view === 'form' && (
          <IssueForm 
            onSave={handleSaveIssue} 
            onCancel={() => {setView('dashboard'); setCurrentIssue(null);}} 
            onDelete={handleDelete}
            areas={areas.length > 0 ? areas : ["Geral"]}
            initialData={currentIssue}
          />
        )}

        {view === 'areas' && (
          <AreaManager 
            areas={areas} 
            onUpdateAreas={handleUpdateAreas} 
            onCancel={() => setView('dashboard')} 
          />
        )}
      </main>

      {showDetails && currentIssue && (
        <DetailsModal 
          issue={currentIssue} 
          onClose={() => {setShowDetails(false); setCurrentIssue(null);}} 
        />
      )}

      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.8em] italic">
            2025 | BIOMETANO CAIEIRAS | ENGENHARIA DE PROCESSO & MONITORAMENTO
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
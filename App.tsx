import React, { useState } from 'react';
import { PlusCircle, Factory, LayoutDashboard, Settings } from 'lucide-react';
import { GUTIssue, Status, PlantArea } from './types';
import { MOCK_ISSUES } from './constants';
import { StatsCards } from './components/StatsCards';
import { IssueForm } from './components/IssueForm';
import { GUTTable } from './components/GUTTable';
import { Charts } from './components/Charts';
import { AreaManager } from './components/AreaManager';

function App() {
  const [issues, setIssues] = useState<GUTIssue[]>(MOCK_ISSUES);
  const [areas, setAreas] = useState<string[]>(Object.values(PlantArea));
  const [view, setView] = useState<'dashboard' | 'form' | 'areas'>('dashboard');

  const handleSaveIssue = (newIssueData: Omit<GUTIssue, 'id' | 'createdAt'>) => {
    const newIssue: GUTIssue = {
      ...newIssueData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    setIssues([newIssue, ...issues]);
    setView('dashboard');
  };

  const handleStatusChange = (id: string, newStatus: Status) => {
    setIssues(issues.map(i => i.id === id ? { ...i, status: newStatus } : i));
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta ocorrência?')) {
      setIssues(issues.filter(i => i.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="bg-green-600 p-2 rounded-lg text-white">
                <Factory size={24} />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Biometano <span className="text-green-600">GUT</span></h1>
                <p className="text-xs text-slate-500 font-medium">Sistema de Priorização de Manutenção</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={() => setView('areas')}
                className={`px-3 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${view === 'areas' ? 'bg-slate-200 text-slate-900' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
                title="Gerenciar Áreas"
             >
                <Settings size={18} /> <span className="hidden sm:inline">Áreas</span>
             </button>

             {view === 'dashboard' || view === 'areas' ? (
                <button 
                  onClick={() => setView('form')}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all shadow-sm"
                >
                  <PlusCircle size={18} /> Nova Ocorrência
                </button>
             ) : (
                <button 
                  onClick={() => setView('dashboard')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all"
                >
                  <LayoutDashboard size={18} /> Voltar ao Painel
                </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {view === 'dashboard' && (
          <div className="animate-fade-in">
            <StatsCards issues={issues} />
            
            <Charts issues={issues} />

            <div className="mt-8">
               <GUTTable 
                 issues={issues} 
                 onStatusChange={handleStatusChange} 
                 onDelete={handleDelete}
               />
            </div>
          </div>
        )}

        {view === 'form' && (
          <div className="animate-slide-up">
            <IssueForm 
              onSave={handleSaveIssue} 
              onCancel={() => setView('dashboard')} 
              areas={areas}
            />
          </div>
        )}

        {view === 'areas' && (
           <div className="animate-slide-up">
              <AreaManager 
                 areas={areas} 
                 onUpdateAreas={setAreas} 
                 onCancel={() => setView('dashboard')} 
              />
           </div>
        )}

      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          <p className="text-xs text-slate-400 mt-1">desenvolvido por 6580005</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
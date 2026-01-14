
import React, { useState } from 'react';
import { FileDown, Calendar, CheckSquare, Square, Download, Loader2, Table as TableIcon, FileSpreadsheet, Waves } from 'lucide-react';
import { GUTIssue, ThermographyRecord, VibrationRecord } from '../types';
import { issueService, thermographyService, vibrationService } from '../services/supabase';

// Usaremos a biblioteca xlsx via esm.sh
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

interface ReportsManagerProps {
  onCancel: () => void;
}

const GUT_COLUMNS = [
  { id: 'title', label: 'Evento' },
  { id: 'description', label: 'Descrição' },
  { id: 'area', label: 'Área' },
  { id: 'equipmentName', label: 'Equipamento' },
  { id: 'gravity', label: 'G' },
  { id: 'urgency', label: 'U' },
  { id: 'tendency', label: 'T' },
  { id: 'score', label: 'Score' },
  { id: 'status', label: 'Status' },
  { id: 'createdAt', label: 'Data Criação' },
  { id: 'resolution', label: 'Resolução' },
];

const THERMO_COLUMNS = [
  { id: 'equipmentName', label: 'Equipamento' },
  { id: 'area', label: 'Área' },
  { id: 'currentTemp', label: 'Temp Atual' },
  { id: 'maxTemp', label: 'Limite Max' },
  { id: 'minTemp', label: 'Temp Amb' },
  { id: 'riskLevel', label: 'Risco' },
  { id: 'lastInspection', label: 'Inspeção' },
  { id: 'notes', label: 'Notas' },
];

const VIB_COLUMNS = [
  { id: 'equipmentName', label: 'Equipamento' },
  { id: 'area', label: 'Área' },
  { id: 'overallVelocity', label: 'Velocidade (mm/s)' },
  { id: 'acceleration', label: 'Aceleração (g)' },
  { id: 'peakFrequency', label: 'Freq. Pico (Hz)' },
  { id: 'riskLevel', label: 'Risco' },
  { id: 'lastInspection', label: 'Inspeção' },
  { id: 'notes', label: 'Notas' },
];

export const ReportsManager: React.FC<ReportsManagerProps> = ({ onCancel }) => {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [includeGUT, setIncludeGUT] = useState(true);
  const [includeThermo, setIncludeThermo] = useState(true);
  const [includeVib, setIncludeVib] = useState(true);
  
  const [selectedGUTCols, setSelectedGUTCols] = useState<string[]>(GUT_COLUMNS.map(c => c.id));
  const [selectedThermoCols, setSelectedThermoCols] = useState<string[]>(THERMO_COLUMNS.map(c => c.id));
  const [selectedVibCols, setSelectedVibCols] = useState<string[]>(VIB_COLUMNS.map(c => c.id));
  
  const [generating, setGenerating] = useState(false);

  const toggleColumn = (table: 'gut' | 'thermo' | 'vib', colId: string) => {
    if (table === 'gut') {
      setSelectedGUTCols(prev => prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]);
    } else if (table === 'thermo') {
      setSelectedThermoCols(prev => prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]);
    } else {
      setSelectedVibCols(prev => prev.includes(colId) ? prev.filter(c => c !== colId) : [...prev, colId]);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const workbook = XLSX.utils.book_new();
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (includeGUT) {
        const issues = await issueService.getAll();
        const filteredIssues = issues.filter(i => {
          const d = new Date(i.createdAt);
          return d >= start && d <= end;
        });

        const gutData = filteredIssues.map(i => {
          const row: any = {};
          selectedGUTCols.forEach(colId => {
            const colDef = GUT_COLUMNS.find(c => c.id === colId);
            if (colDef) {
              let val = (i as any)[colId];
              if (colId === 'createdAt') val = new Date(val).toLocaleString();
              row[colDef.label] = val;
            }
          });
          return row;
        });

        const gutSheet = XLSX.utils.json_to_sheet(gutData);
        XLSX.utils.book_append_sheet(workbook, gutSheet, "Matriz GUT");
      }

      if (includeThermo) {
        const records = await thermographyService.getAll();
        const filteredRecords = records.filter(r => {
          const d = new Date(r.createdAt);
          return d >= start && d <= end;
        });

        const thermoData = filteredRecords.map(r => {
          const row: any = {};
          selectedThermoCols.forEach(colId => {
            const colDef = THERMO_COLUMNS.find(c => c.id === colId);
            if (colDef) {
              row[colDef.label] = (r as any)[colId];
            }
          });
          return row;
        });

        const thermoSheet = XLSX.utils.json_to_sheet(thermoData);
        XLSX.utils.book_append_sheet(workbook, thermoSheet, "Termografia");
      }

      if (includeVib) {
        const records = await vibrationService.getAll();
        const filteredRecords = records.filter(r => {
          const d = new Date(r.createdAt);
          return d >= start && d <= end;
        });

        const vibData = filteredRecords.map(r => {
          const row: any = {};
          selectedVibCols.forEach(colId => {
            const colDef = VIB_COLUMNS.find(c => c.id === colId);
            if (colDef) {
              row[colDef.label] = (r as any)[colId];
            }
          });
          return row;
        });

        const vibSheet = XLSX.utils.json_to_sheet(vibData);
        XLSX.utils.book_append_sheet(workbook, vibSheet, "Vibração");
      }

      const fileName = `Relatorio_Biometano_${startDate}_a_${endDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      alert("Erro ao gerar relatório.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
           <div className="p-4 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 text-emerald-500 shadow-xl">
              <FileSpreadsheet size={28} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Central de Relatórios</h2>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">Exportação de Dados Operacionais em Excel</p>
           </div>
        </div>
        <button onClick={onCancel} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest border border-slate-800 transition-all">
          Cancelar
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filtros de Período */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-xl">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Calendar size={16} className="text-emerald-500" /> Período dos Dados
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Data Inicial</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500/50 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Data Final</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500/50 transition-all" />
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-xl">
            <h3 className="text-xs font-black text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-6">
              <TableIcon size={16} className="text-blue-500" /> Seleção de Módulos
            </h3>
            <div className="space-y-3">
              <button onClick={() => setIncludeGUT(!includeGUT)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${includeGUT ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-950 border-slate-800'}`}>
                 <span className={`text-[10px] font-black uppercase ${includeGUT ? 'text-blue-400' : 'text-slate-600'}`}>Matriz GUT</span>
                 {includeGUT ? <CheckSquare size={16} className="text-blue-400" /> : <Square size={16} className="text-slate-800" />}
              </button>
              <button onClick={() => setIncludeThermo(!includeThermo)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${includeThermo ? 'bg-orange-600/10 border-orange-500/30' : 'bg-slate-950 border-slate-800'}`}>
                 <span className={`text-[10px] font-black uppercase ${includeThermo ? 'text-orange-400' : 'text-slate-600'}`}>Termografia</span>
                 {includeThermo ? <CheckSquare size={16} className="text-orange-400" /> : <Square size={16} className="text-slate-800" />}
              </button>
              <button onClick={() => setIncludeVib(!includeVib)} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${includeVib ? 'bg-cyan-600/10 border-cyan-500/30' : 'bg-slate-950 border-slate-800'}`}>
                 <span className={`text-[10px] font-black uppercase ${includeVib ? 'text-cyan-400' : 'text-slate-600'}`}>Vibração</span>
                 {includeVib ? <CheckSquare size={16} className="text-cyan-400" /> : <Square size={16} className="text-slate-800" />}
              </button>
            </div>
          </section>

          <button 
            onClick={handleGenerateReport}
            disabled={generating || (!includeGUT && !includeThermo && !includeVib)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {generating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {generating ? 'Gerando Planilha...' : 'Exportar para Excel'}
          </button>
        </div>

        {/* Configuração de Colunas */}
        <div className="lg:col-span-8 space-y-6">
          {includeGUT && (
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-xl animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">Colunas Matriz GUT</h3>
                 <button onClick={() => setSelectedGUTCols(selectedGUTCols.length === GUT_COLUMNS.length ? [] : GUT_COLUMNS.map(c => c.id))} className="text-[8px] font-black text-slate-500 uppercase hover:text-white transition-colors">
                   {selectedGUTCols.length === GUT_COLUMNS.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                 </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {GUT_COLUMNS.map(col => (
                   <button key={col.id} onClick={() => toggleColumn('gut', col.id)} className={`flex items-center gap-3 p-3 rounded-xl border text-[9px] font-black uppercase transition-all ${selectedGUTCols.includes(col.id) ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-600 border-slate-800 hover:border-slate-700'}`}>
                      {selectedGUTCols.includes(col.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                      {col.label}
                   </button>
                 ))}
              </div>
            </div>
          )}

          {includeThermo && (
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-xl animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">Colunas Termografia</h3>
                 <button onClick={() => setSelectedThermoCols(selectedThermoCols.length === THERMO_COLUMNS.length ? [] : THERMO_COLUMNS.map(c => c.id))} className="text-[8px] font-black text-slate-500 uppercase hover:text-white transition-colors">
                   {selectedThermoCols.length === THERMO_COLUMNS.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                 </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {THERMO_COLUMNS.map(col => (
                   <button key={col.id} onClick={() => toggleColumn('thermo', col.id)} className={`flex items-center gap-3 p-3 rounded-xl border text-[9px] font-black uppercase transition-all ${selectedThermoCols.includes(col.id) ? 'bg-orange-600 text-white border-orange-500' : 'bg-slate-950 text-slate-600 border-slate-800 hover:border-slate-700'}`}>
                      {selectedThermoCols.includes(col.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                      {col.label}
                   </button>
                 ))}
              </div>
            </div>
          )}

          {includeVib && (
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-xl animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">Colunas Vibração</h3>
                 <button onClick={() => setSelectedVibCols(selectedVibCols.length === VIB_COLUMNS.length ? [] : VIB_COLUMNS.map(c => c.id))} className="text-[8px] font-black text-slate-500 uppercase hover:text-white transition-colors">
                   {selectedVibCols.length === VIB_COLUMNS.length ? 'Desmarcar Todas' : 'Marcar Todas'}
                 </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 {VIB_COLUMNS.map(col => (
                   <button key={col.id} onClick={() => toggleColumn('vib', col.id)} className={`flex items-center gap-3 p-3 rounded-xl border text-[9px] font-black uppercase transition-all ${selectedVibCols.includes(col.id) ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-slate-950 text-slate-600 border-slate-800 hover:border-slate-700'}`}>
                      {selectedVibCols.includes(col.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                      {col.label}
                   </button>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

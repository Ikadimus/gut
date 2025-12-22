import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Settings, Loader2 } from 'lucide-react';
import { areaService } from '../services/supabase';

interface AreaManagerProps {
  areas: string[];
  onUpdateAreas: (newAreas: string[]) => void;
  onCancel: () => void;
}

export const AreaManager: React.FC<AreaManagerProps> = ({ areas, onUpdateAreas, onCancel }) => {
  const [newArea, setNewArea] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (newArea.trim()) {
      try {
        setLoading(true);
        await areaService.add(newArea.trim());
        onUpdateAreas([...areas, newArea.trim()]);
        setNewArea('');
      } catch (err) {
        alert("Erro ao adicionar área ao Supabase");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (index: number) => {
    const areaName = areas[index];
    if (confirm(`Tem certeza que deseja remover a área "${areaName}"? Isso não removerá os chamados já criados nela.`)) {
      try {
        setLoading(true);
        await areaService.remove(areaName);
        onUpdateAreas(areas.filter((_, i) => i !== index));
      } catch (err) {
        alert("Erro ao excluir área");
      } finally {
        setLoading(false);
      }
    }
  };

  const startEdit = (index: number, val: string) => {
    setEditingIndex(index);
    setEditValue(val);
  };

  const saveEdit = async (index: number) => {
    const oldName = areas[index];
    if (editValue.trim() && editValue !== oldName) {
      try {
        setLoading(true);
        await areaService.update(oldName, editValue.trim());
        const updated = [...areas];
        updated[index] = editValue.trim();
        onUpdateAreas(updated);
        setEditingIndex(null);
      } catch (err) {
        alert("Erro ao atualizar nome da área");
      } finally {
        setLoading(false);
      }
    } else {
      setEditingIndex(null);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto border border-slate-700">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <Settings className="text-slate-400" /> Gerenciar Áreas da Planta
            </h2>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-200 font-medium">Voltar ao Painel</button>
        </div>

        <div className="flex gap-3 mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700 relative overflow-hidden">
            {loading && <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center z-10"><Loader2 className="animate-spin text-green-500" /></div>}
            <input 
                type="text" 
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="Nome da nova área..."
                className="flex-1 rounded-md bg-slate-800 border-slate-600 text-slate-100 placeholder-slate-500 shadow-sm border p-2 focus:ring-green-500 focus:border-green-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button 
                onClick={handleAdd}
                disabled={!newArea.trim() || loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
            >
                <Plus size={18} /> Adicionar
            </button>
        </div>

        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden relative">
             {loading && !editingIndex && <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] z-10"></div>}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 font-medium text-slate-400 text-sm">
                Áreas Sincronizadas ({areas.length})
            </div>
            <ul className="divide-y divide-slate-700">
                {areas.length === 0 ? (
                  <li className="p-8 text-center text-slate-500">Nenhuma área cadastrada no banco.</li>
                ) : areas.map((area, index) => (
                    <li key={index} className="p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                        {editingIndex === index ? (
                            <div className="flex-1 flex gap-2 mr-4">
                                <input 
                                    type="text" 
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="flex-1 rounded bg-slate-700 border-slate-500 text-slate-100 border p-2 text-sm focus:border-blue-500 outline-none"
                                />
                                <button onClick={() => saveEdit(index)} className="text-green-400 hover:bg-green-900/30 p-2 rounded" disabled={loading}><Save size={18}/></button>
                                <button onClick={() => setEditingIndex(null)} className="text-red-400 hover:bg-red-900/30 p-2 rounded" disabled={loading}><X size={18}/></button>
                            </div>
                        ) : (
                            <span className="text-slate-200">{area}</span>
                        )}
                        
                        {editingIndex !== index && (
                            <div className="flex gap-1">
                                <button onClick={() => startEdit(index, area)} className="text-slate-500 hover:text-blue-400 hover:bg-blue-900/30 p-2 rounded transition-colors" title="Editar" disabled={loading}>
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(index)} className="text-slate-500 hover:text-red-400 hover:bg-red-900/30 p-2 rounded transition-colors" title="Excluir" disabled={loading}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    </div>
  );
};
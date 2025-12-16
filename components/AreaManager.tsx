import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, Settings } from 'lucide-react';

interface AreaManagerProps {
  areas: string[];
  onUpdateAreas: (newAreas: string[]) => void;
  onCancel: () => void;
}

export const AreaManager: React.FC<AreaManagerProps> = ({ areas, onUpdateAreas, onCancel }) => {
  const [newArea, setNewArea] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = () => {
    if (newArea.trim()) {
      onUpdateAreas([...areas, newArea.trim()]);
      setNewArea('');
    }
  };

  const handleDelete = (index: number) => {
    if (confirm('Tem certeza que deseja remover esta área?')) {
      const updated = areas.filter((_, i) => i !== index);
      onUpdateAreas(updated);
    }
  };

  const startEdit = (index: number, val: string) => {
    setEditingIndex(index);
    setEditValue(val);
  };

  const saveEdit = (index: number) => {
    if (editValue.trim()) {
      const updated = [...areas];
      updated[index] = editValue.trim();
      onUpdateAreas(updated);
      setEditingIndex(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="text-slate-600" /> Gerenciar Áreas da Planta
            </h2>
            <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 font-medium">Voltar ao Painel</button>
        </div>

        <div className="flex gap-3 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
            <input 
                type="text" 
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="Nome da nova área..."
                className="flex-1 rounded-md border-slate-300 shadow-sm border p-2 focus:ring-green-500 focus:border-green-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button 
                onClick={handleAdd}
                disabled={!newArea.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium"
            >
                <Plus size={18} /> Adicionar
            </button>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-medium text-slate-600 text-sm">
                Áreas Cadastradas ({areas.length})
            </div>
            <ul className="divide-y divide-slate-100">
                {areas.map((area, index) => (
                    <li key={index} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        {editingIndex === index ? (
                            <div className="flex-1 flex gap-2 mr-4">
                                <input 
                                    type="text" 
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="flex-1 rounded border-slate-300 border p-2 text-sm focus:border-blue-500 outline-none"
                                />
                                <button onClick={() => saveEdit(index)} className="text-green-600 hover:bg-green-50 p-2 rounded"><Save size={18}/></button>
                                <button onClick={() => setEditingIndex(null)} className="text-red-500 hover:bg-red-50 p-2 rounded"><X size={18}/></button>
                            </div>
                        ) : (
                            <span className="text-slate-800">{area}</span>
                        )}
                        
                        {editingIndex !== index && (
                            <div className="flex gap-1">
                                <button onClick={() => startEdit(index, area)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors" title="Editar">
                                    <Edit2 size={18} />
                                </button>
                                <button onClick={() => handleDelete(index)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors" title="Excluir">
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

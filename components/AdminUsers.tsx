
import React, { useState, useEffect } from 'react';
import { User, UserRole, RolePermissions } from '../types';
import { userService, sectorService, permissionService } from '../services/supabase';
import { Users, Plus, Trash2, UserPlus, X, Save, Edit, Terminal, Briefcase, Loader2 } from 'lucide-react';

interface AdminUsersProps {
  currentUser: User;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [sector, setSector] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchSectorsAndRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchSectorsAndRoles = async () => {
    try {
      const [s, p] = await Promise.all([
        sectorService.getAll(),
        permissionService.getAll()
      ]);
      setSectors(s);
      const roles = p.map(perm => perm.role);
      setAvailableRoles(roles);
      
      if (s.length > 0) setSector(s[0]);
      if (roles.length > 0) setRole(roles[0]);
    } catch (err) { console.error(err); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUserId) {
        const updates: any = { name, email, role, sector };
        if (password) updates.password = password;
        await userService.update(editingUserId, updates);
      } else {
        await userService.create({ name, email, password, role, sector });
      }
      setShowAddForm(false);
      setEditingUserId(null);
      resetForm();
      fetchUsers();
    } catch (err) { alert("Erro ao salvar usuário."); }
    finally { setLoading(false); }
  };

  const handleEdit = (user: User) => {
    if (!canEdit(user)) {
      alert("Você não tem permissão para editar este usuário.");
      return;
    }

    setEditingUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); 
    setRole(user.role);
    setSector(user.sector || (sectors.length > 0 ? sectors[0] : ''));
    setShowAddForm(true);
  };

  const handleDelete = async (user: User) => {
    if (!canDelete(user)) {
      alert("Este usuário é protegido.");
      return;
    }

    if (confirm(`Remover acesso de ${user.name}?`)) {
      await userService.delete(user.id);
      fetchUsers();
    }
  };

  const resetForm = () => {
    setName(''); setEmail(''); setPassword(''); 
    setRole(availableRoles[0] || 'Visualizador');
    setSector(sectors.length > 0 ? sectors[0] : '');
  };

  const canEdit = (target: User) => {
    if (currentUser.role === 'Desenvolvedor') return true;
    if (currentUser.id === target.id) return true;
    if (currentUser.role === 'Administrador') {
      return target.role !== 'Desenvolvedor';
    }
    return false;
  };

  const canDelete = (target: User) => {
    if (target.email === 'efilho@essencisbiometano.com.br') return false;
    if (currentUser.role === 'Desenvolvedor') return currentUser.id !== target.id;
    if (currentUser.role === 'Administrador') {
      return target.role !== 'Desenvolvedor' && target.role !== 'Administrador';
    }
    return false;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight uppercase">
            <Users className="text-blue-500" /> Gestão de Acessos
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">
            Seu Perfil: {currentUser.role}
          </p>
        </div>
        <button 
          onClick={() => { setEditingUserId(null); resetForm(); setShowAddForm(true); }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
        >
          <UserPlus size={16} /> Novo Usuário
        </button>
      </div>

      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 animate-slide-up ring-1 ring-white/5">
          <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
            <h3 className="font-black text-slate-100 uppercase text-xs tracking-[0.3em]">
              {editingUserId ? 'Editar Usuário' : 'Cadastrar Novo Acesso'}
            </h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">E-mail</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Senha {editingUserId && '(vazio p/ manter)'}</label>
              <input type="password" required={!editingUserId} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nível de Acesso</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 outline-none">
                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Setor Operacional</label>
              <select value={sector} onChange={e => setSector(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 outline-none">
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="lg:col-span-5 flex justify-end">
              <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                {editingUserId ? 'Atualizar Dados' : 'Salvar Usuário'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-950 text-slate-500 uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">Nome / Email</th>
              <th className="px-6 py-4">Setor</th>
              <th className="px-6 py-4 text-center">Papel</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-800/30 transition-all">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-200 text-xs uppercase">{u.name}</p>
                  <p className="text-[10px] text-slate-500">{u.email}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <Briefcase size={12} className="text-slate-600" />
                     {u.sector || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`mx-auto px-3 py-1 rounded-full text-[9px] font-black uppercase border flex items-center gap-1 w-fit
                    ${u.role === 'Desenvolvedor' ? 'text-purple-400 border-purple-800/50' :
                      u.role === 'Administrador' ? 'text-red-400 border-red-800/50' : 'text-slate-400 border-slate-700'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={() => handleEdit(u)} disabled={!canEdit(u)} className={`p-2 rounded-lg transition-all ${canEdit(u) ? 'text-blue-400 hover:bg-blue-900/20' : 'text-slate-700 cursor-not-allowed'}`}><Edit size={16}/></button>
                  <button onClick={() => handleDelete(u)} disabled={!canDelete(u)} className={`p-2 rounded-lg transition-all ${canDelete(u) ? 'text-red-400 hover:bg-red-900/20' : 'text-slate-700 cursor-not-allowed'}`}><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

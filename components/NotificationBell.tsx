
import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, Thermometer, Waves, X, Circle, Info, ArrowRight, Zap } from 'lucide-react';
import { GUTIssue, ThermographyRecord, VibrationRecord, User, Status } from '../types';

interface NotificationBellProps {
  user: User;
  issues: GUTIssue[];
  thermography: ThermographyRecord[];
  vibration: VibrationRecord[];
  onViewGUT: (id: string) => void;
  onViewThermo: () => void;
  onViewVib: () => void;
  sidebarOpen: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  user, issues, thermography, vibration, onViewGUT, onViewThermo, onViewVib, sidebarOpen 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Alertas de Setor (Pendentes)
  const sectorAlerts = issues.filter(i => 
    i.sector === user.sector && i.status !== Status.RESOLVED
  );

  // 2. Alertas Críticos Globais (GUT > 80)
  const criticalGUT = issues.filter(i => i.score >= 81 && i.status !== Status.RESOLVED);

  // 3. Termografia Crítica
  const criticalThermo = thermography.filter(t => t.currentTemp >= t.maxTemp);

  // 4. Vibração Perigosa/Crítica
  const criticalVib = vibration.filter(v => 
    v.riskLevel === 'Crítico' || v.riskLevel === 'Perigoso'
  );

  const totalCount = sectorAlerts.length + criticalGUT.length + criticalThermo.length + criticalVib.length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all ${totalCount > 0 ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
      >
        <Bell size={20} className={totalCount > 0 ? 'animate-bounce' : ''} />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg">
            {totalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          style={{ 
            left: sidebarOpen ? '250px' : '75px',
            top: '20px'
          }}
          className="fixed w-[340px] bg-slate-900 border border-slate-700 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[200] overflow-hidden animate-slide-up ring-1 ring-white/10"
        >
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
             <div>
                <h4 className="text-xs font-black text-white uppercase tracking-widest">Central de Alertas</h4>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Sincronização BIOHUB</p>
             </div>
             <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors p-1"><X size={18}/></button>
          </div>

          <div className="max-h-[450px] overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-900">
            {totalCount === 0 ? (
              <div className="py-14 text-center opacity-30 flex flex-col items-center gap-3">
                 <Circle size={32} />
                 <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma anormalidade detectada</p>
              </div>
            ) : (
              <>
                {/* SETOR DO USUÁRIO */}
                {sectorAlerts.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="px-2 text-[8px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <Zap size={10}/> Pendências do seu Setor
                    </p>
                    {sectorAlerts.map(alert => (
                      <button 
                        key={alert.id} 
                        onClick={() => { onViewGUT(alert.id); setIsOpen(false); }}
                        className="w-full p-4 bg-blue-950/20 border border-blue-900/30 rounded-2xl flex items-center gap-4 hover:bg-blue-900/40 transition-all text-left group"
                      >
                         <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500">
                            <Zap size={14} />
                         </div>
                         <div className="flex-1 overflow-hidden">
                            <p className="text-[11px] font-black text-slate-200 uppercase truncate">{alert.title}</p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase">Status: {alert.status}</p>
                         </div>
                         <ArrowRight size={14} className="text-slate-700 group-hover:text-blue-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {/* RISCOS CRÍTICOS GLOBAIS */}
                {(criticalGUT.length > 0 || criticalThermo.length > 0 || criticalVib.length > 0) && (
                  <div className="space-y-1.5 pt-3">
                    <p className="px-2 text-[8px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                       <AlertTriangle size={10}/> Alertas de Risco Global
                    </p>
                    
                    {criticalGUT.map(alert => (
                      <button 
                        key={alert.id} 
                        onClick={() => { onViewGUT(alert.id); setIsOpen(false); }}
                        className="w-full p-4 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center gap-4 hover:bg-red-900/40 transition-all text-left group border-l-4 border-l-red-600"
                      >
                         <AlertTriangle size={14} className="text-red-500 shrink-0" />
                         <div className="flex-1 overflow-hidden">
                            <p className="text-[11px] font-black text-white uppercase truncate">{alert.title}</p>
                            <p className="text-[8px] text-red-400 font-bold uppercase tracking-tight">GUT CRÍTICO • {alert.score} PTS</p>
                         </div>
                      </button>
                    ))}

                    {criticalThermo.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => { onViewThermo(); setIsOpen(false); }}
                        className="w-full p-4 bg-orange-950/20 border border-orange-900/30 rounded-2xl flex items-center gap-4 hover:bg-orange-900/40 transition-all text-left group border-l-4 border-l-orange-600"
                      >
                         <Thermometer size={14} className="text-orange-500 shrink-0" />
                         <div className="flex-1 overflow-hidden">
                            <p className="text-[11px] font-black text-white uppercase truncate">{t.equipmentName}</p>
                            <p className="text-[8px] text-orange-400 font-bold uppercase">ALERTA TÉRMICO: {t.currentTemp}°C</p>
                         </div>
                      </button>
                    ))}

                    {criticalVib.map(v => (
                      <button 
                        key={v.id} 
                        onClick={() => { onViewVib(); setIsOpen(false); }}
                        className="w-full p-4 bg-cyan-950/20 border border-cyan-900/30 rounded-2xl flex items-center gap-4 hover:bg-cyan-900/40 transition-all text-left group border-l-4 border-l-cyan-600"
                      >
                         <Waves size={14} className="text-cyan-500 shrink-0" />
                         <div className="flex-1 overflow-hidden">
                            <p className="text-[11px] font-black text-white uppercase truncate">{v.equipmentName}</p>
                            <p className="text-[8px] text-cyan-400 font-bold uppercase">VIBRAÇÃO {v.riskLevel?.toUpperCase()}</p>
                         </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="p-4 bg-slate-950/60 text-center border-t border-slate-800">
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">Protocolo de Monitoramento Ativo</span>
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ShieldAlert, Trash2, UserX, Check, AlertCircle } from 'lucide-react';

export default function ModeracaoPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    try {
      const data = await apiRequest<any[]>('/moderation/reports');
      setReports(data);
    } catch (err) {
      console.error('Erro ao carregar denúncias:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleAction = async (reportId: string, action: 'DISMISS' | 'REMOVE_CONTENT' | 'BAN_USER') => {
    if (!confirm(`Confirmar ação de moderação: ${action}?`)) return;

    try {
      await apiRequest(`/moderation/reports/${reportId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      loadReports();
    } catch (err: any) {
      alert(err.message || 'Erro ao processar ação de moderação.');
    }
  };

  if (!user || (user.role !== 'RESTAURANT_ADMIN' && user.role !== 'SUPERADMIN')) {
    return (
      <div className="surface-elevated rounded-3xl p-8 text-center border border-[#2C221A]">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="font-display font-bold text-[#FBF8F5] text-base">Acesso Restrito à Moderação</h3>
        <p className="text-xs text-[#A89F96] mt-1.5 max-w-sm mx-auto">
          Apenas administradores e moderadores autorizados do Restaurante Pirambeira têm acesso a esta área.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="surface-elevated rounded-3xl p-6 sm:p-7 border border-red-500/25">
        <div className="flex items-center gap-1.5 text-xs font-black text-red-400 uppercase tracking-widest mb-1.5">
          <ShieldAlert className="w-4 h-4" />
          <span>SEGURANÇA & BOAS PRÁTICAS</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#FBF8F5] tracking-tight">
          Fila de Moderação
        </h1>
        <p className="text-xs text-[#A89F96] mt-1.5 max-w-lg leading-relaxed font-medium">
          Avaliação de conteúdos e perfis reportados por frequentadores no Restaurante Pirambeira.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="surface-ambient rounded-3xl p-5 h-32 animate-pulse border border-[#2C221A]" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="surface-ambient rounded-3xl p-10 text-center border border-emerald-500/20">
          <Check className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="font-display font-bold text-[#FBF8F5] text-sm">Nenhuma denúncia pendente</h3>
          <p className="text-xs text-[#A89F96] mt-1 max-w-sm mx-auto leading-relaxed">
            A comunidade do Pirambeira está tranquila e em harmonia no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="surface-elevated rounded-3xl p-5 border border-[#2C221A] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-2.5 py-0.5 rounded-full border border-red-500/30 uppercase tracking-wider">
                    Denúncia de {r.targetType}
                  </span>
                  <h4 className="font-display font-bold text-[#FBF8F5] text-sm mt-1.5">{r.reason}</h4>
                  <p className="text-xs text-[#A89F96] mt-0.5">
                    Enviada por {r.reporterName} em {new Date(r.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>

                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  r.status === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-[#18130F] text-[#A89F96]'
                }`}>
                  {r.status}
                </span>
              </div>

              {/* Target info preview */}
              {r.targetInfo && (
                <div className="p-3 bg-[#18130F] rounded-2xl border border-[#2C221A] text-xs text-[#FBF8F5]">
                  <span className="text-[10px] text-[#6E655D] font-bold uppercase block mb-1">
                    Conteúdo ou Alvo Reportado:
                  </span>
                  {r.targetInfo.content && <p className="italic">"{r.targetInfo.content}"</p>}
                  {r.targetInfo.author && <p className="text-[#A89F96] mt-1">Autor: {r.targetInfo.author}</p>}
                  {r.targetInfo.name && <p>Usuário: {r.targetInfo.name} ({r.targetInfo.email})</p>}
                </div>
              )}

              {r.notes && (
                <p className="text-xs text-[#A89F96] bg-[#18130F] p-2.5 rounded-2xl border border-[#2C221A]">
                  <strong className="text-[#FBF8F5]">Observação do Denunciante:</strong> {r.notes}
                </p>
              )}

              {/* Action Buttons */}
              {r.status === 'PENDING' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2C221A]">
                  <button
                    onClick={() => handleAction(r.id, 'DISMISS')}
                    className="py-1.5 px-3 rounded-xl bg-[#18130F] hover:bg-[#241B15] text-[#A89F96] text-xs font-semibold cursor-pointer"
                  >
                    Arquivar
                  </button>

                  <button
                    onClick={() => handleAction(r.id, 'REMOVE_CONTENT')}
                    className="py-1.5 px-3 rounded-xl bg-orange-600/20 text-orange-300 hover:bg-orange-600/30 border border-orange-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>

                  <button
                    onClick={() => handleAction(r.id, 'BAN_USER')}
                    className="py-1.5 px-3 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Banir Infrator</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

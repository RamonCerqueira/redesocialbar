'use client';

import React, { useState } from 'react';
import { apiRequest } from '@/lib/api';
import { ShieldAlert, X, CheckCircle2 } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'POST' | 'COMMENT' | 'USER';
  targetId: string;
}

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
}: ReportModalProps) {
  const [reason, setReason] = useState('Comportamento Inadequado / Desrespeito');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiRequest('/moderation/reports', {
        method: 'POST',
        body: JSON.stringify({
          restaurantSlug: 'pirambeira',
          targetType,
          targetId,
          reason,
          notes,
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1600);
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar denúncia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm surface-floating rounded-3xl p-6 border border-red-500/30">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#A89F96] hover:text-[#FBF8F5] hover:bg-[#1E1814]"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h4 className="font-display font-bold text-[#FBF8F5] text-base">Denúncia Enviada</h4>
            <p className="text-xs text-[#A89F96] mt-1 leading-relaxed">
              Obrigado por ajudar a manter o Restaurante Pirambeira um ambiente seguro e acolhedor.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-display font-black text-sm text-[#FBF8F5]">Reportar à Administração</h3>
            </div>

            <p className="text-xs text-[#A89F96] leading-relaxed">
              Sua denúncia é confidencial e será avaliada com prioridade pela gerência do Pirambeira.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#FBF8F5] mb-1">
                Motivo da denúncia
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl px-3.5 py-2.5 text-xs text-[#FBF8F5] focus:outline-none focus:border-amber-500"
              >
                <option value="Comportamento Inadequado / Desrespeito">Comportamento Inadequado / Desrespeito</option>
                <option value="Assédio ou Importunação">Assédio ou Importunação</option>
                <option value="Conteúdo Impróprio / Explícito">Conteúdo Impróprio / Explícito</option>
                <option value="Spam / Publicidade não autorizada">Spam / Publicidade não autorizada</option>
                <option value="Outro Motivo">Outro Motivo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#FBF8F5] mb-1">
                Detalhes adicionais (opcional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descreva o ocorrido brevemente..."
                className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl p-3 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500 resize-none font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-display font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Enviando...' : 'Confirmar Denúncia'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { FlirtNote, Patron } from '@/lib/types';
import {
  X,
  MapPin,
  Send,
  Sparkles,
  User,
  Heart,
  EyeOff,
} from 'lucide-react';

interface RecadinhoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newNote: FlirtNote) => void;
  restaurantSlug?: string;
}

export function RecadinhoModal({
  isOpen,
  onClose,
  onSuccess,
  restaurantSlug = 'pirambeira',
}: RecadinhoModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [targetPatron, setTargetPatron] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [patrons, setPatrons] = useState<Patron[]>([]);
  useEffect(() => {
    if (!isOpen) return;
    apiRequest<{ patrons: Patron[] }>(`/check-ins/who-is-here/${restaurantSlug}?filter=all`)
      .then(data => setPatrons(data.patrons)).catch(() => setPatrons([]));
  }, [isOpen, restaurantSlug]);
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMsg('Por favor, escreva a mensagem no guardanapo.');
      return;
    }

    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const finalContext = tableNumber.trim() || 'No Piramba';

    try {
      const res = await apiRequest<any>('/posts', {
        method: 'POST',
        body: JSON.stringify({
          restaurantSlug,
          type: 'FLIRT',
          content: content.trim(),
          flirtContext: finalContext,
          tableNumber: tableNumber.trim() || undefined,
          targetPatron: targetPatron.trim() || undefined,
          isAnonymous,
        }),
      });

      const createdNote: FlirtNote = {
        id: res?.id || 'note-' + Date.now(),
        content: content.trim(),
        flirtContext: finalContext,
        tableNumber: tableNumber.trim() || undefined,
        targetPatron: targetPatron.trim() || undefined,
        isAnonymous,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
        author: {
          id: isAnonymous ? 'anon' : user.id || 'me',
          name: isAnonymous ? 'Pirambeiro Secreto' : user.profile?.name || 'Pirambeiro',
          username: isAnonymous ? 'anonimo' : user.profile?.username || 'pirambeiro',
          avatarUrl: isAnonymous
            ? undefined
            : user.profile?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        },
      };

      onSuccess(createdNote);
      setContent('');
      setTableNumber('');
      setTargetPatron('');
      setIsAnonymous(false);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Não foi possível enviar o recado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-[26px] bg-[#120F0D] border border-[#3E2E20] p-5 sm:p-6 shadow-2xl space-y-4 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2C221A]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFB800]/15 border border-[#FFB800]/30 flex items-center justify-center text-[#FFB800] text-lg">
              ✍️
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-[#FBF8F5] tracking-tight leading-tight">
                Recado no Guardanapo
              </h2>
              <span className="text-[11px] text-[#A89F96]">
                Como aqueles bilhetinhos que o garçom leva na mesa 🍻
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1714] text-[#A89F96] hover:text-[#FBF8F5] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Mensagem do Guardanapo (Obrigatório) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#E5DDD5]">
                Seu recado no guardanapo:
              </label>
              <span
                className={`text-[10px] font-mono ${
                  content.length > 250 ? 'text-[#FFB800] font-bold' : 'text-[#8E867E]'
                }`}
              >
                {content.length}/280
              </span>
            </div>

            <textarea
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= 280) setContent(e.target.value);
              }}
              rows={4}
              placeholder="Escreva seu recadinho... Ex: Adorei sua risada na mesa ao lado! Um brinde pra você! 🥂"
              className="w-full bg-[#18130F] border border-[#2C221A] focus:border-[#FFB800] rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-[#6E655D] focus:outline-none transition-colors resize-none leading-relaxed"
              autoFocus
            />
          </div>

          {/* 2. Mesa Destinatária (Opcional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#E5DDD5] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF7900]" />
                <span>Mesa destinatária</span>
              </label>
              <span className="text-[10px] text-[#8E867E] uppercase font-bold tracking-wider">
                Opcional
              </span>
            </div>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Ex: Mesa 04, Mesa 12, Balcão, Varanda..."
              className="w-full bg-[#18130F] border border-[#2C221A] focus:border-[#FF7900] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#6E655D] focus:outline-none transition-colors"
              maxLength={40}
            />
          </div>

          {/* 3. Marcar Pírambeiro (Opcional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#E5DDD5] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#FF2D70]" />
                <span>Para quem é o recado?</span>
              </label>
              <span className="text-[10px] text-[#8E867E] uppercase font-bold tracking-wider">
                Opcional
              </span>
            </div>
            <input
              type="text"
              value={targetPatron}
              onChange={(e) => setTargetPatron(e.target.value)}
              placeholder="Ex: @laribahia, Garota de verde, ou nome..."
              className="w-full bg-[#18130F] border border-[#2C221A] focus:border-[#FF2D70] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-[#6E655D] focus:outline-none transition-colors"
              maxLength={50}
            />

            {/* Sugestões rápidas de quem está no bar agora */}
            <div className="pt-1 flex items-center gap-1.5 overflow-x-auto pb-1 scroll-x-hide">
              <span className="text-[10px] text-[#7A726A] shrink-0 font-medium">
                Sugeridos:
              </span>
              {patrons.slice(0, 4).map((patron) => (
                <button
                  key={patron.userId}
                  type="button"
                  onClick={() => setTargetPatron(`@${patron.username}`)}
                  className="px-2 py-0.5 rounded-full bg-[#201915] hover:bg-[#2F221B] border border-[#3A2C21] text-[10px] text-[#C5BCB2] hover:text-[#FFB800] shrink-0 transition-colors cursor-pointer"
                >
                  @{patron.username}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Escolha de Remetente (Assinar ou Anônimo) */}
          <div className="p-3 rounded-2xl bg-[#18130F] border border-[#2C221A] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#251E19] border border-[#3A2E26] flex items-center justify-center text-sm">
                {isAnonymous ? '🤫' : '👤'}
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {isAnonymous ? 'Enviar em segredo (Anônimo)' : `Assinar como ${user?.profile?.name || 'Você'}`}
                </span>
                <span className="text-[10px] text-[#8E867E] block">
                  {isAnonymous
                    ? 'Seu nome e foto não serão revelados no guardanapo'
                    : 'Quem ler verá seu perfil e foto'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isAnonymous
                  ? 'bg-[#FF2D70]/20 text-[#FF2D70] border border-[#FF2D70]/50'
                  : 'bg-[#251E19] text-[#A89F96] border border-[#3A2E26] hover:text-white'
              }`}
            >
              {isAnonymous ? 'Anônimo ✓' : 'Ficar Anônimo'}
            </button>
          </div>

          {/* 5. Pré-visualização do Guardanapo */}
          {content.trim() && (
            <div className="space-y-1 pt-1 animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-[#8E867E] uppercase tracking-wider block">
                Pré-visualização do seu guardanapo:
              </span>
              <div
                className="rounded-[18px] p-4 border border-[#3E2E20] text-xs space-y-2 shadow-lg"
                style={{
                  background: 'linear-gradient(150deg, #181412 0%, #110E0D 100%)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-[#271E18] text-[#FFB800] text-[9px] font-bold uppercase">
                      ✍️ Guardanapo
                    </span>
                    {tableNumber.trim() && (
                      <span className="px-2 py-0.5 rounded-full bg-[#1F1713] text-[#FF9E40] text-[9px] font-semibold">
                        📍 {tableNumber.trim()}
                      </span>
                    )}
                    {targetPatron.trim() && (
                      <span className="px-2 py-0.5 rounded-full bg-[#2A151D] text-[#FF6B99] text-[9px] font-bold">
                        💌 Para: {targetPatron.trim()}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-[#7A726A] font-mono">Agora</span>
                </div>

                <p className="text-sm font-normal text-[#F2ECE4] leading-relaxed italic p-2.5 rounded-xl bg-[#100D0C]/80 border border-white/[0.04]">
                  "{content}"
                </p>

                <div className="text-[10px] text-[#8E867E] pt-1">
                  <span>De: </span>
                  <span className="font-bold text-white">
                    {isAnonymous ? 'Pirambeiro Secreto 🤫' : user?.profile?.name || 'Você'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-[#FF2D70] font-semibold bg-[#FF2D70]/10 border border-[#FF2D70]/25 p-2.5 rounded-xl">
              {errorMsg}
            </p>
          )}

          {/* Botões do Rodapé */}
          <div className="flex items-center gap-2.5 pt-2 border-t border-[#2C221A]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#1C1714] hover:bg-[#251F1B] text-[#C4BCB3] hover:text-white font-bold text-xs transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="flex-[2] py-3 px-4 rounded-2xl bg-[#FFB800] hover:bg-[#FFC928] disabled:opacity-40 text-[#080807] font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-amber active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isSubmitting ? 'ENVIANDO...' : 'ENTREGAR RECADINHO ✍️'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

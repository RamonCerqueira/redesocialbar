'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { FlirtNote } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { playGlassClinkSound } from '@/lib/audio-effects';
import { ReportModal } from './report-modal';
import confetti from 'canvas-confetti';
import {
  MoreHorizontal,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';

interface FlirtNoteCardProps {
  note: FlirtNote;
  restaurantSlug?: string;
}

export function FlirtNoteCard({ note, restaurantSlug = 'pirambeira' }: FlirtNoteCardProps) {
  const { user } = useAuth();
  const [cheersCount, setCheersCount] = useState(note.likesCount || 0);
  const [hasCheered, setHasCheered] = useState(false);
  const [isClinking, setIsClinking] = useState(false);
  const [showFloatBadge, setShowFloatBadge] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const toastBtnRef = useRef<HTMLButtonElement | null>(null);

  const isMe = user?.id === note.author?.id;
  const isAnonymous = note.isAnonymous || note.author?.username === 'anonimo';

  // Executa o brinde completo com microinterações sênior e integração backend
  const handleCheers = async () => {
    if (isProcessing) return;

    // Se o usuário não estiver logado, redireciona suavemente
    if (!user) {
      window.location.href = '/login';
      return;
    }

    const nextState = !hasCheered;
    setHasCheered(nextState);
    setCheersCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    // Efeitos táteis e visuais acionados no brinde positivo
    if (nextState) {
      // 1. Sintetizador de som acústico de brinde (Web Audio API)
      playGlassClinkSound();

      // 2. Animação de tilintar de canecas
      setIsClinking(true);
      setTimeout(() => setIsClinking(false), 500);

      // 3. Floating Badge animado "+1 Brinde! 🍻"
      setShowFloatBadge(true);
      setTimeout(() => setShowFloatBadge(false), 1100);

      // 4. Explosão de espuma dourada e bolhas de chopp (Canvas Confetti)
      if (toastBtnRef.current) {
        const rect = toastBtnRef.current.getBoundingClientRect();
        const originX = (rect.left + rect.width / 2) / window.innerWidth;
        const originY = (rect.top + rect.height / 2) / window.innerHeight;

        confetti({
          particleCount: 22,
          spread: 48,
          startVelocity: 14,
          origin: { x: originX, y: originY },
          colors: ['#FFB800', '#FF7900', '#FFFFFF', '#FFE082'],
          ticks: 45,
          scalar: 0.75,
          disableForReducedMotion: true,
        });
      }
    }

    // 5. Integração com o backend via API
    setIsProcessing(true);
    try {
      await apiRequest(`/posts/${note.id}/react`, {
        method: 'POST',
        body: JSON.stringify({ type: 'CHEERS' }),
      });
    } catch (err) {
      console.warn('Erro ao registrar brinde no backend:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Horário legível do recado
  const formattedTime = (() => {
    try {
      const date = new Date(note.createdAt);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Agora há pouco';
    }
  })();

  return (
    <>
      <article
        className="relative rounded-[22px] p-4 sm:p-5 transition-all duration-300 group overflow-hidden border border-white/[0.08] hover:border-[#FFB800]/40 shadow-[0_12px_36px_rgba(0,0,0,0.7),0_0_20px_rgba(255,184,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.08)] bg-[#171310]/80 backdrop-blur-2xl"
      >
        {/* Efeito de dobradura suave de guardanapo no canto superior direito */}
        <div
          className="absolute top-0 right-0 w-8 h-8 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity"
          style={{
            background: 'linear-gradient(225deg, rgba(255,184,0,0.35) 0%, rgba(255,122,0,0.15) 50%, transparent 50%)',
          }}
        />

        {/* Linha Superior: Marcadores do Guardanapo (Mesa e Pírambeiro Opcionais) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Tag do Guardanapo */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full bg-[#271E18]/90 border border-white/[0.08] text-[10px] font-bold text-[#FFB800] tracking-wide uppercase backdrop-blur-md">
              <span>✍️ Guardanapo</span>
            </span>

            {/* Marcador de Mesa (se houver) */}
            {(note.tableNumber || note.flirtContext) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full bg-[#1F1713]/90 border border-[#FF7900]/30 text-[10px] font-semibold text-[#FF9E40] backdrop-blur-md">
                <MapPin className="w-2.5 h-2.5 text-[#FF7900]" />
                <span>{note.tableNumber || note.flirtContext}</span>
              </span>
            )}

            {/* Marcador de Pírambeiro Marcado (se houver) */}
            {note.targetPatron && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-full bg-[#2B1B12]/90 border border-[#FFB800]/30 text-[10px] font-bold text-[#FFB800] backdrop-blur-md">
                <span>💌 Para:</span>
                <span className="text-white">{note.targetPatron}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[#8E867E]">
            <span className="text-[10px] font-mono flex items-center gap-1 text-[#7A726A]">
              <Clock className="w-3 h-3 text-[#5F5750]" />
              {formattedTime}
            </span>
            <button
              onClick={() => setShowReport(true)}
              className="text-[#6E655D] hover:text-[#FBF8F5] p-1 rounded-lg transition-colors cursor-pointer"
              title="Reportar recado"
              aria-label="Reportar recado"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Corpo do Recado no Guardanapo (Texto de bilhetinho autêntico) */}
        <div className="relative my-3 p-3.5 sm:p-4 rounded-[16px] bg-[#100D0C]/75 backdrop-blur-md border border-white/[0.06]">
          <p className="font-sans text-[13.5px] sm:text-[14.5px] font-normal text-[#F2ECE4] leading-relaxed select-text italic">
            "{note.content}"
          </p>
        </div>

        {/* Rodapé: De Quem + ÚNICA Interação Oficial: "BRINDAR 🍻" */}
        <div className="pt-3 flex items-center justify-between gap-3 border-t border-white/[0.06]">
          {/* Remetente */}
          {isAnonymous ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#2A231F] border border-[#483B32] flex items-center justify-center text-sm shadow-sm shrink-0">
                🤫
              </div>
              <div>
                <span className="text-xs font-semibold text-[#C5BCB2] block leading-none">
                  Pirambeiro Secreto
                </span>
                <span className="text-[9px] text-[#7A726A] block mt-0.5">
                  Recado anônimo
                </span>
              </div>
            </div>
          ) : (
            <Link
              href={note.author?.username ? `/perfil/${note.author.username}` : '#'}
              className="flex items-center gap-2 group/author cursor-pointer"
            >
              <img
                src={
                  note.author?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                }
                alt={note.author?.name || 'Autor'}
                className="w-8 h-8 rounded-full object-cover border border-[#FFB800]/40 group-hover/author:border-[#FFB800] transition-colors shrink-0"
              />
              <div>
                <span className="text-xs font-bold text-[#F5EDE3] group-hover/author:text-[#FFB800] transition-colors block leading-none">
                  {note.author?.name || 'Pirambeiro'}
                </span>
                <span className="text-[9px] text-[#7A726A] block mt-0.5">
                  Deixou na mesa
                </span>
              </div>
            </Link>
          )}

          {/* ÚNICO BOTÃO DE INTERAÇÃO: BRINDAR 🍻 (Microinteração Sênior) */}
          <div className="relative shrink-0">
            {/* Floating Badge "+1 Brinde! 🍻" que sobe suavemente */}
            {showFloatBadge && (
              <div className="absolute left-1/2 -top-1 pointer-events-none z-30 animate-float-up whitespace-nowrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFB800] text-[#080807] font-display font-black text-[10px] shadow-[0_0_12px_rgba(255,184,0,0.6)]">
                  +1 Brinde! 🍻
                </span>
              </div>
            )}

            <button
              ref={toastBtnRef}
              type="button"
              onClick={handleCheers}
              disabled={isProcessing}
              className={`relative h-[36px] px-3.5 rounded-full text-xs font-display font-black flex items-center gap-1.5 transition-all duration-200 cursor-pointer active:scale-90 select-none ${
                hasCheered
                  ? 'bg-gradient-to-r from-[#FFB800] to-[#FF7900] text-[#080807] shadow-[0_0_20px_rgba(255,184,0,0.45)] border border-[#FFC928]'
                  : 'bg-[#1D1713] text-[#D8CFC5] hover:text-white border border-[#3A2D22] hover:border-[#FFB800]/50 hover:bg-[#251E19]'
              }`}
              title={hasCheered ? 'Você já brindou! Clique para desfazer' : 'Brindar com esta mesa!'}
            >
              {/* Ícone de Caneca com Animação de Tilintar */}
              <span
                className={`text-base leading-none inline-block transition-transform duration-300 ${
                  isClinking ? 'animate-clink-left' : ''
                }`}
              >
                🍻
              </span>

              {/* Rótulo */}
              <span className="tracking-wide">
                {hasCheered ? 'Brindado!' : 'Brindar'}
              </span>

              {/* Contador de Brindes */}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none transition-colors ${
                  hasCheered
                    ? 'bg-black/30 text-black font-extrabold'
                    : 'bg-[#2A211B] text-[#FFB800] font-bold'
                }`}
              >
                {cheersCount}
              </span>
            </button>
          </div>
        </div>
      </article>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetType="POST"
        targetId={note.id}
      />
    </>
  );
}

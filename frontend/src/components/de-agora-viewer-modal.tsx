'use client';

import React, { useState, useEffect } from 'react';
import { Story } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { FullscreenDialog } from './fullscreen-dialog';
import {
  X,
  Send,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  Check,
} from 'lucide-react';

interface DeAgoraViewerModalProps {
  isOpen: boolean;
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
  onViewed?: (id: string) => void;
}

export function DeAgoraViewerModal({
  isOpen,
  stories,
  initialIndex = 0,
  onClose,
  onViewed,
}: DeAgoraViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [focusedReply, setFocusedReply] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setElapsed(0);
  }, [initialIndex, isOpen]);

  useEffect(() => { setElapsed(0); }, [currentIndex]);
  useEffect(() => {
    if (!isOpen) return;
    const listener = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.key === 'ArrowLeft') setCurrentIndex(index => Math.max(0, index - 1));
      if (event.key === 'ArrowRight') {
        if (currentIndex < stories.length - 1) setCurrentIndex(index => index + 1);
        else onClose();
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [isOpen, currentIndex, stories.length, onClose]);

  // Passagem automática de stories a cada 5 segundos se não estiver pausado
  useEffect(() => {
    if (!isOpen || isPaused || focusedReply || isSendingReply || loadedId !== stories[currentIndex]?.id) return;
    const timer = setInterval(() => { if (!document.hidden) setElapsed(value => Math.min(5000, value + 50)); }, 50);
    return () => clearInterval(timer);
  }, [isOpen, isPaused, focusedReply, isSendingReply, currentIndex, stories, loadedId]);

  useEffect(() => {
    if (!isOpen || elapsed < 5000) return;
    setElapsed(0);
      if (currentIndex < stories.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setReplySent(false);
        setReplyText('');
      } else {
        onClose();
      }
  }, [isOpen, elapsed, currentIndex, stories.length, onClose]);

  if (!isOpen || stories.length === 0) return null;

  const currentStory = stories[currentIndex];
  if (!currentStory) return null;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setReplySent(false);
      setReplyText('');
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setReplySent(false);
      setReplyText('');
    } else {
      onClose();
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSendingReply) return;

    setIsSendingReply(true);
    try {
      await apiRequest(`/stories/${currentStory.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          content: replyText.trim(),
          storyId: currentStory.id,
        }),
      });
      setReplySent(true);
      setReplyText('');
      setTimeout(() => setReplySent(false), 2500);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Não foi possível enviar a resposta.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const isOfficial = currentStory.author?.isOfficial;

  return (
    <FullscreenDialog title="DE AGORA" onClose={onClose}>
    <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 bg-black/95 backdrop-blur-md select-none">
      {/* Botões Laterais de Navegação (Desktop) */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={handlePrev}
          className="hidden sm:flex absolute left-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white items-center justify-center transition-all cursor-pointer z-50"
          aria-label="Momento anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {currentIndex < stories.length - 1 && (
        <button
          type="button"
          onClick={handleNext}
          className="hidden sm:flex absolute right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white items-center justify-center transition-all cursor-pointer z-50"
          aria-label="Próximo momento"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Card do Story 9:16 */}
      <div
        className="relative w-full max-w-sm max-h-[96dvh] aspect-[9/16] rounded-3xl overflow-hidden bg-[#080706] border border-amber-500/30 shadow-2xl flex flex-col justify-between p-4 sm:p-5"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        onTouchCancel={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Imagem de Fundo em Tela Cheia */}
        <img
          key={currentStory.id}
          src={currentStory.mediaUrl}
          alt={currentStory.author.name}
          onLoad={() => { setLoadedId(currentStory.id); onViewed?.(currentStory.id); }}
          onError={() => setFailedId(currentStory.id)}
          className="absolute inset-0 w-full h-full object-contain animate-in fade-in duration-300"
        />
        {failedId === currentStory.id && <div role="alert" className="absolute inset-0 flex items-center justify-center text-white text-sm">Não foi possível carregar este momento.</div>}

        {/* Gradientes Superior e Inferior para Leitura Perfeita */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 pointer-events-none" />

        {/* Zonas de Toque Esquerda/Direita para avançar/voltar rápido */}
        <div
          onClick={handlePrev}
          className="absolute inset-y-16 left-0 w-1/3 z-10 cursor-pointer"
          aria-hidden="true"
        />
        <div
          onClick={handleNext}
          className="absolute inset-y-16 right-0 w-1/3 z-10 cursor-pointer"
          aria-hidden="true"
        />

        {/* 1. TOPO: Barras de Progresso Segmentadas + Info do Autor */}
        <div className="relative z-20 space-y-2.5">
          {/* Segmentos da Barra de Progresso */}
          <div className="flex gap-1 w-full">
            {stories.map((story, idx) => (
              <div
                key={story.id}
                className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${idx < currentIndex ? 100 : idx === currentIndex ? elapsed / 50 : 0}%` }}
                />
              </div>
            ))}
          </div>

          {/* Cabeçalho do Autor */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src={
                    currentStory.author.avatarUrl ||
                    '/LogoPirambeiraSemFundo.png'
                  }
                  alt={currentStory.author.name}
                  className={`w-9 h-9 rounded-full object-cover border-2 shadow-sm ${
                    isOfficial ? 'border-amber-400 bg-black/50' : 'border-amber-500/60'
                  }`}
                />
                {isOfficial && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-black flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-xs text-white drop-shadow-sm">
                    {currentStory.author.name}
                  </span>
                  {isOfficial && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-amber-500/25 border border-amber-500/40 text-amber-300">
                      Bar Oficial
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                  <span>@{currentStory.author.username}</span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-amber-300">
                    <MapPin className="w-2.5 h-2.5" />
                    Piramba
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/80 transition-colors cursor-pointer border border-white/10"
              aria-label="Fechar DE AGORA"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* 2. BASE: Legenda & Caixa de Mensagem Rápida */}
        <div className="relative z-20 space-y-3">
          {/* Legenda do Story */}
          {currentStory.caption && (
            <div className="bg-black/65 backdrop-blur-md border border-white/15 p-3 rounded-2xl shadow-lg">
              <p className="text-xs text-white font-medium leading-relaxed drop-shadow-md">
                {currentStory.caption}
              </p>
            </div>
          )}

          {/* Campo de Resposta Rápida */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setFocusedReply(true)}
              onBlur={() => setFocusedReply(false)}
              placeholder={`Mandar mensagem para ${currentStory.author.name.split(' ')[0]}...`}
              className="flex-1 bg-black/60 backdrop-blur-md border border-white/25 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/60 focus:outline-none focus:border-amber-400 transition-colors shadow-inner"
            />
            <button
              type="submit"
              disabled={isSendingReply || !replyText.trim()}
              className="p-2.5 rounded-full amber-gradient text-[#080706] font-bold shadow-lg glow-amber-sm disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
              title="Enviar mensagem"
            >
              {replySent ? (
                <Check className="w-4 h-4 text-black stroke-[3]" />
              ) : (
                <Send className="w-4 h-4 fill-current stroke-none" />
              )}
            </button>
          </form>

          {replySent && (
            <div className="text-center">
              <span className="text-[10px] font-bold text-emerald-400 bg-black/60 px-3 py-1 rounded-full border border-emerald-500/30 animate-in fade-in">
                ✨ Mensagem enviada com sucesso!
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
    </FullscreenDialog>
  );
}

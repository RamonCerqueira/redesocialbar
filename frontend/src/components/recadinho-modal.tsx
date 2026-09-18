'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { FlirtNote } from '@/lib/types';
import {
  Heart,
  X,
  MapPin,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface RecadinhoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newNote: FlirtNote) => void;
  restaurantSlug?: string;
}

const PRESET_LOCATIONS = [
  'Mesa 1',
  'Mesa 2',
  'Mesa 3',
  'Mesa 5',
  'Mesa 8',
  'Mesa 12',
  'Mesa 15',
  'Balcão Principal',
  'Deck Externo',
  'Perto da Pista',
];

export function RecadinhoModal({
  isOpen,
  onClose,
  onSuccess,
  restaurantSlug = 'pirambeira',
}: RecadinhoModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Mesa 5');
  const [customLocation, setCustomLocation] = useState('');
  const [isCustomLoc, setIsCustomLoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const finalLocation = isCustomLoc
    ? customLocation.trim() || 'No Piramba'
    : selectedLocation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setErrorMsg('Por favor, escreva o seu recadinho.');
      return;
    }

    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await apiRequest<any>('/posts', {
        method: 'POST',
        body: JSON.stringify({
          restaurantSlug,
          type: 'FLIRT',
          content: content.trim(),
          flirtContext: finalLocation,
        }),
      });

      // Construct immediate local flirt note for smooth optimistic UI
      const createdNote: FlirtNote = {
        id: res?.id || 'note-' + Date.now(),
        content: content.trim(),
        flirtContext: finalLocation,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
        author: {
          id: user.id || 'me',
          name: user.profile?.name || 'Pirambeiro',
          username: user.profile?.username,
          avatarUrl: user.profile?.avatarUrl,
        },
      };

      onSuccess(createdNote);
      setContent('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar recadinho. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#120F0D] border border-rose-500/35 p-5 sm:p-7 shadow-2xl space-y-4 overflow-hidden glow-rose"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient glow */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2C221A]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400">
              <Heart className="w-4 h-4 fill-rose-500/40" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-[#FBF8F5] tracking-tight">
                Novo Recadinho
              </h2>
              <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">
                Mural da Paquera • Restaurante Pirambeira
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#1C1714] text-[#A89F96] hover:text-[#FBF8F5] transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Autor do Recado (Perfil logado) */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#18130F] border border-[#2A221C]">
          <img
            src={
              user?.profile?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
            }
            alt={user?.profile?.name || 'Seu perfil'}
            className="w-10 h-10 rounded-full object-cover border border-rose-500/50 shadow-sm shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate block">
                {user?.profile?.name || 'Você'}
              </span>
              {user?.profile?.username && (
                <span className="text-[10px] text-[#8E867E] truncate font-mono">
                  @{user.profile.username}
                </span>
              )}
            </div>
            <p className="text-[10px] text-rose-300/80 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-rose-400" />
              <span>Seu recado aparecerá no mural para quem estiver no bar</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Seleção de Mesa / Localização */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#E5DDD5] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Onde você está sentado?</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomLoc(!isCustomLoc)}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
              >
                {isCustomLoc ? 'Escolher da lista' : 'Outro local'}
              </button>
            </div>

            {!isCustomLoc ? (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-none py-1">
                {PRESET_LOCATIONS.map((loc) => {
                  const isSelected = selectedLocation === loc;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setSelectedLocation(loc)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-[#F5A623] text-[#080706] shadow-sm font-black'
                          : 'bg-[#18130F] text-[#C4BCB3] hover:text-white border border-[#2A221C] hover:border-amber-500/40'
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="Ex: Mesa 9, Sofá da entrada, Lounge..."
                className="w-full bg-[#18130F] border border-[#2C221A] focus:border-[#F5A623] rounded-2xl px-3.5 py-2 text-xs text-white placeholder-[#6E655D] focus:outline-none transition-colors"
                maxLength={40}
                autoFocus
              />
            )}
          </div>

          {/* 2. Campo de Texto do Recadinho */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#E5DDD5]">
                O seu recado (apenas texto):
              </label>
              <span
                className={`text-[10px] font-mono ${
                  content.length > 250 ? 'text-amber-400 font-bold' : 'text-[#8E867E]'
                }`}
              >
                {content.length}/280
              </span>
            </div>

            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => {
                  if (e.target.value.length <= 280) setContent(e.target.value);
                }}
                rows={4}
                placeholder="Ex: Vi você de blusa preta na mesa ao lado rindo com as amigas... Um brinde discreto! 🥂"
                className="w-full bg-[#18130F] border border-[#2C221A] focus:border-rose-500/70 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-[#6E655D] focus:outline-none transition-colors resize-none leading-relaxed"
                autoFocus={!isCustomLoc}
              />
            </div>
          </div>

          {/* 3. Mini Pré-visualização do Bilhete */}
          {content.trim() && (
            <div className="space-y-1 animate-in fade-in duration-150">
              <span className="text-[10px] font-bold text-[#8E867E] uppercase tracking-wider block">
                Pré-visualização do bilhete:
              </span>
              <div className="kraft-note rounded-2xl p-3.5 border border-rose-500/30 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 bg-rose-950/70 text-rose-300 border border-rose-700/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{finalLocation}</span>
                  </span>
                  <span className="text-[10px] text-[#8E867E] font-mono">Agora</span>
                </div>
                <blockquote className="text-xs font-medium text-white italic pl-2 border-l-2 border-rose-500/60 leading-snug">
                  "{content}"
                </blockquote>
              </div>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              {errorMsg}
            </p>
          )}

          {/* Botões de Ação */}
          <div className="flex items-center gap-2.5 pt-2">
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
              className="flex-[2] py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-rose active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isSubmitting ? 'ENVIANDO...' : 'DEIXAR RECADINHO'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

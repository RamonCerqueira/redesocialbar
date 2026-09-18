'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Patron } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { MatchModal } from './match-modal';
import { Flame, Clock, Eye, Sparkles, Check, Heart } from 'lucide-react';

interface PatronCardProps {
  patron: Patron;
  restaurantSlug?: string;
}

export function PatronCard({ patron, restaurantSlug = 'pirambeira' }: PatronCardProps) {
  const { user } = useAuth();
  const [isSendingInterest, setIsSendingInterest] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [matchData, setMatchData] = useState<{
    isOpen: boolean;
    matchedUser: any;
    conversationId: string;
  }>({
    isOpen: false,
    matchedUser: null,
    conversationId: '',
  });

  const isMe = user?.id === patron.userId;

  const handleSendInterest = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsSendingInterest(true);
    try {
      const res = await apiRequest<any>('/flirt/interest', {
        method: 'POST',
        body: JSON.stringify({
          targetUserId: patron.userId,
          restaurantSlug,
        }),
      });

      setInterestSent(true);

      if (res.isMatch) {
        setMatchData({
          isOpen: true,
          matchedUser: res.matchedUser,
          conversationId: res.conversationId,
        });
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao demonstrar interesse.');
    } finally {
      setIsSendingInterest(false);
    }
  };

  return (
    <>
      <div className="surface-elevated rounded-3xl p-4 border border-amber-500/15 flex flex-col justify-between hover:border-amber-500/35 transition-all group relative overflow-hidden">
        <div>
          {/* Avatar com Anel de Presença Viva */}
          <div className="relative mb-3 inline-block">
            <img
              src={
                patron.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
              }
              alt={patron.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/80 shadow-md group-hover:scale-105 transition-transform"
            />
            {/* Indicador de presença pulsante */}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#080706] indicator-pulse-emerald flex items-center justify-center" />
          </div>

          {/* Nome, Status e Fidelidade */}
          <div className="space-y-1">
            <h4 className="font-display font-bold text-[#FBF8F5] text-sm truncate group-hover:text-amber-400 transition-colors">
              {patron.name}
            </h4>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] bg-amber-500/15 text-amber-400 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Flame className="w-3 h-3" />
                {patron.checkInCount} {patron.checkInCount === 1 ? 'visita' : 'visitas'}
              </span>
            </div>

            {/* Tempo no bar */}
            <p className="text-[11px] text-[#A89F96] flex items-center gap-1 pt-1 font-medium">
              <Clock className="w-3 h-3 text-[#6E655D]" />
              <span>Chegou às {new Date(patron.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </p>

            {/* Bio contextual */}
            {patron.bio && (
              <p className="text-xs text-[#A89F96] line-clamp-2 pt-1 leading-snug">
                {patron.bio}
              </p>
            )}

            {/* Tags da noite */}
            {patron.interests && patron.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {patron.interests.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] bg-[#18130F] text-[#A89F96] px-2 py-0.5 rounded-md border border-[#2C221A]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="pt-3 mt-3 border-t border-[#2C221A] flex flex-col gap-1.5">
          {patron.showInFlirtRadar && !isMe && (
            <button
              onClick={handleSendInterest}
              disabled={isSendingInterest || interestSent}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                interestSent
                  ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40 glow-rose'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 glow-rose'
              }`}
            >
              {interestSent ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Interesse Enviado</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isSendingInterest ? 'Enviando...' : 'Mandar um olhar'}</span>
                </>
              )}
            </button>
          )}

          <Link
            href={`/perfil/${patron.username}`}
            className="w-full py-2 px-3 rounded-xl bg-[#18130F] hover:bg-[#241B15] text-[#A89F96] hover:text-[#FBF8F5] text-xs font-bold text-center border border-[#2C221A] transition-colors"
          >
            Ver perfil
          </Link>
        </div>
      </div>

      {/* Match celebration modal */}
      {matchData.isOpen && (
        <MatchModal
          isOpen={matchData.isOpen}
          onClose={() => setMatchData({ isOpen: false, matchedUser: null, conversationId: '' })}
          matchedUser={matchData.matchedUser}
          conversationId={matchData.conversationId}
        />
      )}
    </>
  );
}

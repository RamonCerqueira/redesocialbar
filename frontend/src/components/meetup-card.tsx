'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Meetup } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Beer, Users, Calendar, Check, ArrowRight, Clock } from 'lucide-react';

interface MeetupCardProps {
  meetup: Meetup;
  onMeetupUpdate?: () => void;
}

export function MeetupCard({ meetup, onMeetupUpdate }: MeetupCardProps) {
  const { user } = useAuth();
  const [isJoined, setIsJoined] = useState(meetup.isJoined);
  const [participantsCount, setParticipantsCount] = useState(meetup.participantsCount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleJoin = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest<{ joined: boolean; message: string }>(
        `/meetups/${meetup.id}/join`,
        { method: 'POST' },
      );
      setIsJoined(res.joined);
      setParticipantsCount((prev) => (res.joined ? prev + 1 : prev - 1));
      if (onMeetupUpdate) onMeetupUpdate();
    } catch (err: any) {
      alert(err.message || 'Erro ao participar do encontro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCreator = user?.id === meetup.creator.id;

  return (
    <div className="surface-elevated rounded-3xl p-5 border border-amber-500/15 mb-4 hover:border-amber-500/35 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
          <Beer className="w-4 h-4 text-amber-400" />
          <span>MESA COMUNITÁRIA</span>
        </div>

        <span className="text-[11px] font-mono bg-[#18130F] text-[#A89F96] px-3 py-1 rounded-full border border-[#2C221A] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          {new Date(meetup.scheduledFor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <h3 className="font-display font-extrabold text-base sm:text-lg text-[#FBF8F5] mb-1.5 tracking-tight">
        {meetup.title}
      </h3>

      <p className="text-xs text-[#A89F96] leading-relaxed mb-4 font-medium">
        {meetup.description}
      </p>

      {/* Creator & Participants Stack */}
      <div className="flex items-center justify-between pt-3 border-t border-[#2C221A]">
        <div className="flex items-center gap-2.5">
          <div className="flex -space-x-2 overflow-hidden">
            {meetup.participants.slice(0, 4).map((p, idx) => (
              <img
                key={p.userId || idx}
                src={p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                alt="Participante"
                className="w-8 h-8 rounded-2xl object-cover border-2 border-[#080706]"
              />
            ))}
          </div>
          <span className="text-xs text-[#A89F96] font-medium">
            <span className="font-bold text-[#FBF8F5]">{participantsCount}</span> na mesa
          </span>
        </div>

        <button
          onClick={handleToggleJoin}
          disabled={isSubmitting || isCreator}
          className={`py-2 px-4 rounded-2xl text-xs font-extrabold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
            isCreator
              ? 'bg-[#18130F] text-amber-400 border border-amber-500/30 cursor-default'
              : isJoined
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 glow-emerald'
              : 'amber-gradient text-[#080706] shadow-md glow-amber-sm'
          }`}
        >
          {isCreator ? (
            'Você é o Anfitrião'
          ) : isJoined ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Cadeira Confirmada</span>
            </>
          ) : (
            <>
              <span>Puxar Cadeira</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

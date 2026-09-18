'use client';

import React, { useState } from 'react';
import { BarEvent } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Calendar, Clock, Music, Check, ArrowRight } from 'lucide-react';

interface EventCardProps {
  event: BarEvent;
  onEventUpdate?: () => void;
}

export function EventCard({ event, onEventUpdate }: EventCardProps) {
  const { user } = useAuth();
  const [isRsvpd, setIsRsvpd] = useState(event.isRsvpd);
  const [count, setCount] = useState(event.participantsCount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRsvp = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest<{ rsvpd: boolean; message: string }>(
        `/events/${event.id}/rsvp`,
        { method: 'POST' },
      );
      setIsRsvpd(res.rsvpd);
      setCount((prev) => (res.rsvpd ? prev + 1 : prev - 1));
      if (onEventUpdate) onEventUpdate();
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar presença');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="surface-elevated rounded-3xl overflow-hidden border border-amber-500/20 mb-5 group hover:border-amber-500/40 transition-all glow-amber-sm">
      {event.coverImageUrl && (
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-black">
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#13100E] via-transparent to-transparent" />
          <span className="absolute top-3 left-3 bg-[#080706]/85 backdrop-blur-md text-amber-400 text-[10px] font-black px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 uppercase tracking-widest shadow-md">
            <Music className="w-3 h-3" />
            {event.category}
          </span>
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 text-xs text-[#A89F96] mb-2 font-medium">
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(event.date).toLocaleDateString('pt-BR', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
            })}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#6E655D]" />
            {event.startTime}
          </span>
        </div>

        <h3 className="font-display font-black text-lg sm:text-xl text-[#FBF8F5] mb-2 leading-snug tracking-tight">
          {event.title}
        </h3>

        <p className="text-xs text-[#A89F96] leading-relaxed mb-4 font-medium">
          {event.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-[#2C221A]">
          <span className="text-xs text-[#A89F96] font-medium">
            <span className="font-bold text-[#FBF8F5] font-mono">{count}</span> confirmados no bar
          </span>

          <button
            onClick={handleRsvp}
            disabled={isSubmitting}
            className={`py-2 px-4 rounded-2xl text-xs font-extrabold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              isRsvpd
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 glow-emerald'
                : 'amber-gradient text-[#080706] shadow-md glow-amber-sm'
            }`}
          >
            {isRsvpd ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Vou colar</span>
              </>
            ) : (
              <>
                <span>Confirmar Presença</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

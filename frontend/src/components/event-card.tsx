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
    <div className="h-[94px] rounded-[18px] bg-[#14110E]/75 backdrop-blur-2xl border border-white/[0.08] hover:border-[#FFB800]/40 flex overflow-hidden group transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      {/* Imagem lateral 94x94 */}
      <div className="relative w-[94px] h-[94px] shrink-0 overflow-hidden bg-black">
        <img
          src={
            event.coverImageUrl ||
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80'
          }
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {event.category && (
          <span className="absolute top-1.5 left-1.5 bg-[#080807]/90 text-[#FFB800] text-[9px] font-black px-1.5 py-0.5 rounded-full border border-[#FFB800]/30 uppercase tracking-wider">
            {event.category}
          </span>
        )}
      </div>

      {/* Conteúdo à direita (padding: 11px, flex vertical centralizado) */}
      <div className="p-[11px] flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2 text-[10px] text-[#A89F96] font-medium leading-none mb-1">
          <span className="flex items-center gap-1 text-[#FFB800] font-bold">
            <Calendar className="w-3 h-3" />
            {new Date(event.date).toLocaleDateString('pt-BR', {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
            })}
          </span>
          <span>•</span>
          <span className="flex items-center gap-0.5 text-[#858079]">
            <Clock className="w-3 h-3" />
            {event.startTime}
          </span>
        </div>

        <h3 className="font-display font-extrabold text-[14px] text-white truncate leading-tight mb-1">
          {event.title}
        </h3>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-[10px] text-[#8E8982]">
            <strong className="text-white font-mono">{count}</strong> no bar
          </span>

          <button
            type="button"
            onClick={handleRsvp}
            disabled={isSubmitting}
            className={`h-[24px] px-2.5 rounded-[12px] text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 cursor-pointer ${
              isRsvpd
                ? 'bg-[#00D084] text-[#080807]'
                : 'bg-[#FFB800] hover:bg-[#FFC928] text-[#080807]'
            }`}
          >
            {isRsvpd ? (
              <>
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Vou</span>
              </>
            ) : (
              <>
                <span>Bora</span>
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

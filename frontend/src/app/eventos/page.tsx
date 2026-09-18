'use client';

import React, { useState, useEffect } from 'react';
import { BarEvent } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { EventCard } from '@/components/event-card';
import { Calendar, Music, Sparkles } from 'lucide-react';

export default function EventosPage() {
  const [events, setEvents] = useState<BarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEvents = async () => {
    try {
      const data = await apiRequest<BarEvent[]>('/events/restaurant/pirambeira');
      setEvents(data);
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="surface-elevated rounded-3xl p-6 sm:p-7 border border-amber-500/20 glow-amber-sm">
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-widest mb-1.5">
          <Calendar className="w-4 h-4" />
          <span>AGENDA CULTURAL DA CASA</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#FBF8F5] tracking-tight">
          Eventos & Samba no Piramba
        </h1>
        <p className="text-xs text-[#A89F96] mt-1.5 max-w-lg leading-relaxed font-medium">
          Samba de roda, transmissões do Ba-Vi em telão, chopp em dobro e música ao vivo na Pituba, Salvador.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="surface-ambient rounded-3xl h-64 animate-pulse border border-amber-500/10" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="surface-ambient rounded-3xl p-10 text-center border border-amber-500/15">
          <Music className="w-12 h-12 text-[#6E655D] mx-auto mb-3" />
          <h3 className="font-display font-bold text-[#FBF8F5] text-sm">
            Nenhum evento anunciado no momento
          </h3>
          <p className="text-xs text-[#A89F96] mt-1.5 max-w-sm mx-auto leading-relaxed">
            Fique atento às notificações para novas atrações e rodas de samba no Pirambeira!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {events.map((e) => (
            <EventCard key={e.id} event={e} onEventUpdate={loadEvents} />
          ))}
        </div>
      )}
    </div>
  );
}

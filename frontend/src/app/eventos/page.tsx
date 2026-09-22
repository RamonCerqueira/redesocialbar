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

  const [activeFilter, setActiveFilter] = useState('TODOS');
  const filters = ['TODOS', 'SAMBA', 'AO VIVO', 'HAPPY HOUR', 'FUTEBOL'];

  const filteredEvents = activeFilter === 'TODOS'
    ? events
    : events.filter(e => e.category?.toUpperCase().includes(activeFilter) || e.title?.toUpperCase().includes(activeFilter));

  return (
    <div className="pb-24">
      {/* Header: padding 20px 18px 12px */}
      <div className="pt-5 px-[18px] pb-3">
        <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FFB800] uppercase tracking-widest mb-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>AGENDA DO PIRAMBEIRA</span>
        </div>
        <h1 className="font-display font-black text-[27px] text-white tracking-tight leading-tight">
          Eventos & Samba
        </h1>
        <p className="text-xs text-[#A9A5A0] mt-1 font-medium">
          Música ao vivo, roda de samba e transmissões exclusivas na Pituba.
        </p>
      </div>

      {/* Filters: display flex, gap 8, padding 0 18px 16px, overflow-x-auto */}
      <div className="flex items-center gap-2 px-[18px] pb-4 overflow-x-auto scroll-x-hide">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFilter(f)}
            className={`h-[34px] px-[15px] rounded-[17px] text-[11px] font-bold shrink-0 transition-all cursor-pointer backdrop-blur-md ${
              activeFilter === f
                ? 'bg-[#FFB800] text-[#080807] border border-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.35)]'
                : 'bg-[#14110E]/70 text-[#A9A5A0] border border-white/[0.08] hover:text-white hover:border-white/20'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* EventList: padding 0 18px, display flex, flex-col, gap 10 */}
      <div className="px-[18px] flex flex-col gap-2.5">
        {isLoading ? (
          <div className="flex flex-col gap-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[94px] rounded-[18px] bg-[#14110E]/60 border border-white/[0.06] animate-pulse backdrop-blur-md" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-[20px] bg-[#12110F]/75 backdrop-blur-2xl border border-white/[0.08] p-8 text-center shadow-xl">
            <Music className="w-10 h-10 text-[#716D68] mx-auto mb-2" />
            <h3 className="font-display font-bold text-white text-sm">
              Nenhum evento nesta categoria
            </h3>
            <p className="text-xs text-[#A9A5A0] mt-1">
              Fique ligado nas notificações para novas datas confirmadas!
            </p>
          </div>
        ) : (
          filteredEvents.map((e) => (
            <EventCard key={e.id} event={e} onEventUpdate={loadEvents} />
          ))
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Patron } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { PatronCard } from '@/components/patron-card';
import { Users, Filter, Sparkles, UserPlus, Heart, MapPin, Beer } from 'lucide-react';

export default function QuemEstaAquiPage() {
  const [patrons, setPatrons] = useState<Patron[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'new' | 'friends' | 'flirt'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatrons = async (currentFilter: 'all' | 'new' | 'friends' | 'flirt') => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ totalActivePatrons: number; patrons: Patron[] }>(
        `/check-ins/who-is-here/pirambeira?filter=${currentFilter}`,
      );
      setPatrons(data.patrons);
      setTotalCount(data.totalActivePatrons);
    } catch (err) {
      console.error('Erro ao buscar presentes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatrons(filter);
  }, [filter]);

  const filterButtons = [
    { key: 'all', label: 'Todos no Bar', icon: Users },
    { key: 'flirt', label: 'Paquera & Conversa', icon: Heart },
    { key: 'new', label: 'Primeira Vez', icon: Sparkles },
    { key: 'friends', label: 'Meus Amigos', icon: UserPlus },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Hero / Big Number Presence Header */}
      <div className="rounded-[26px] p-6 sm:p-7 border border-white/[0.08] bg-[#14110E]/75 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.75),0_0_20px_rgba(0,208,132,0.06),inset_0_1px_0_0_rgba(255,255,255,0.08)] relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-widest mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 indicator-pulse-emerald" />
          <span>AO VIVO NO PIRAMBEIRA</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="font-display font-black text-4xl sm:text-5xl text-[#FBF8F5] tracking-tight">
                {totalCount ?? 0}
              </span>
              <span className="font-display font-extrabold text-lg sm:text-xl text-amber-400 uppercase tracking-wide">
                PESSOAS AQUI AGORA
              </span>
            </div>
            <p className="text-xs text-[#A89F96] mt-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Restaurante Pirambeira • Pituba, Salvador - BA</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Filter Tabs (Chips Táteis) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none px-0.5">
        {filterButtons.map((btn) => {
          const isActive = filter === btn.key;
          const Icon = btn.icon;
          return (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key as any)}
              className={`flex items-center gap-2 py-2 px-4 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer backdrop-blur-md ${
                isActive
                  ? 'amber-gradient text-[#080706] shadow-md glow-amber-sm'
                  : 'bg-[#18130F]/70 hover:bg-[#241B15] text-[#A89F96] hover:text-[#FBF8F5] border border-white/[0.08]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Grid of Frequentadores */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="surface-ambient rounded-3xl p-4 h-64 animate-pulse border border-amber-500/10" />
          ))}
        </div>
      ) : patrons.length === 0 ? (
        <div className="surface-ambient rounded-3xl p-10 text-center border border-amber-500/15">
          <Users className="w-12 h-12 text-[#6E655D] mx-auto mb-3" />
          <h3 className="font-display font-bold text-[#FBF8F5] text-sm">
            Ninguém encontrado com esse filtro no momento
          </h3>
          <p className="text-xs text-[#A89F96] mt-1.5 max-w-sm mx-auto">
            Que tal escolher a aba "Todos no Bar" para ver todo mundo que está com copo na mão hoje?
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
          {patrons.map((patron) => (
            <PatronCard key={patron.userId} patron={patron} restaurantSlug="pirambeira" />
          ))}
        </div>
      )}
    </div>
  );
}

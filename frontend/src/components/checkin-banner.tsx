'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { MapPin, Users, LogOut, CheckCircle2, ArrowRight, Sparkles, Beer } from 'lucide-react';

interface CheckInBannerProps {
  activeCount: number;
  restaurantName?: string;
  restaurantSlug?: string;
  onCheckInChange?: () => void;
}

export function CheckInBanner({
  activeCount,
  restaurantName = 'Restaurante Pirambeira',
  restaurantSlug = 'pirambeira',
  onCheckInChange,
}: CheckInBannerProps) {
  const { user, activeCheckIn, setActiveCheckIn } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckIn = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsProcessing(true);
    try {
      const data = await apiRequest<any>('/check-ins', {
        method: 'POST',
        body: JSON.stringify({
          restaurantSlug,
          approxLatitude: -13.0031,
          approxLongitude: -38.4554,
        }),
      });
      setActiveCheckIn(data);
      if (onCheckInChange) onCheckInChange();
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar check-in.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!confirm('Deseja encerrar seu check-in no Pirambeira?')) return;

    setIsProcessing(true);
    try {
      await apiRequest('/check-ins/checkout', { method: 'POST' });
      setActiveCheckIn(null);
      if (onCheckInChange) onCheckInChange();
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar check-out.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ESTADO: USUÁRIO COM CHECK-IN ATIVO ("VOCÊ ESTÁ AQUI")
  if (activeCheckIn) {
    return (
      <div className="relative overflow-hidden rounded-3xl surface-elevated border border-amber-500/30 p-5 glow-amber-sm">
        {/* Background glow and subtle ambient light */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 indicator-pulse-emerald" />
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                VOCÊ ESTÁ AQUI • CHECK-IN ATIVO
              </span>
            </div>

            <h2 className="font-display font-black text-xl sm:text-2xl text-[#FBF8F5] tracking-tight">
              E aí, {user?.profile?.name?.split(' ')[0] || 'Pirambeiro'}!
            </h2>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A89F96]">
              <span className="flex items-center gap-1 text-[#FBF8F5] font-semibold">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {restaurantName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Users className="w-3.5 h-3.5" />
                {activeCount || 128} pessoas no bar agora
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            <Link
              href="/aqui"
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-2xl amber-gradient text-[#080706] font-extrabold text-xs flex items-center justify-center gap-2 shadow-md glow-amber-sm hover:scale-[1.02] active:scale-95 transition-all"
            >
              <span>Ver quem está aqui</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>

            <button
              onClick={handleCheckOut}
              disabled={isProcessing}
              title="Encerrar Check-in"
              className="p-2.5 rounded-2xl bg-[#13100E] hover:bg-[#2C221A] text-[#A89F96] hover:text-red-400 border border-[#2C221A] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ESTADO: USUÁRIO SEM CHECK-IN ("VOCÊ ESTÁ POR PERTO")
  return (
    <div className="relative overflow-hidden rounded-3xl surface-ambient border border-amber-500/20 p-5">
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              AO VIVO NO PIRAMBEIRA
            </span>
          </div>

          <h2 className="font-display font-black text-lg sm:text-xl text-[#FBF8F5] tracking-tight">
            Chegou no bar?
          </h2>

          <p className="text-xs text-[#A89F96] max-w-md leading-relaxed">
            Confirme que você está no Pirambeira para descobrir quem está aqui agora, mandar recados na paquera e curtir o rolê.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {activeCount || 128} pessoas estão aqui agora
            </span>
          </div>
        </div>

        <button
          onClick={handleCheckIn}
          disabled={isProcessing}
          className="py-3 px-6 rounded-2xl amber-gradient text-[#080706] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg glow-amber-sm hover:scale-[1.02] active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <Beer className="w-4 h-4 stroke-[2.5]" />
          <span>{isProcessing ? 'ENTRANDO...' : 'ESTOU NO PIRAMBA!'}</span>
        </button>
      </div>
    </div>
  );
}

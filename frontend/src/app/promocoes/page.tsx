'use client';

import React, { useState, useEffect } from 'react';
import { Promotion } from '@/lib/types';
import { LoadError } from '@/components/load-error';
import { apiRequest } from '@/lib/api';
import { CouponCard } from '@/components/coupon-card';
import { Tag, Sparkles, Percent, Beer } from 'lucide-react';

export default function PromocoesPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadPromos = async () => {
    setIsLoading(true); setLoadError('');
    try {
      const data = await apiRequest<Promotion[]>('/promotions/restaurant/pirambeira');
      setPromotions(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar as promoções.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPromos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-[26px] p-6 sm:p-7 border border-white/[0.08] bg-[#14110E]/75 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.75),0_0_20px_rgba(255,184,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-widest mb-1.5">
          <Percent className="w-4 h-4" />
          <span>RODADAS EXCLUSIVAS DO SALÃO</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#FBF8F5] tracking-tight">
          Promoções & Happy Hour
        </h1>
        <p className="text-xs text-[#A89F96] mt-1.5 max-w-lg leading-relaxed font-medium">
          Descontos de chopp artesanal, petiscos da casa e cortesias exclusivas para quem está com check-in ativo no Restaurante Pirambeira.
        </p>
      </div>

      {loadError ? <LoadError message={loadError} retry={() => void loadPromos()}/> : isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="surface-ambient rounded-3xl h-44 animate-pulse border border-amber-500/10" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="surface-ambient rounded-3xl p-10 text-center border border-amber-500/15">
          <Beer className="w-12 h-12 text-[#6E655D] mx-auto mb-3" />
          <h3 className="font-display font-bold text-[#FBF8F5] text-sm">
            Nenhuma promoção ativa no momento
          </h3>
          <p className="text-xs text-[#A89F96] mt-1.5 max-w-sm mx-auto leading-relaxed">
            As próximas ofertas da casa serão publicadas aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {promotions.map((p) => (
            <CouponCard key={p.id} promotion={p} onPromotionUpdate={loadPromos} />
          ))}
        </div>
      )}
    </div>
  );
}

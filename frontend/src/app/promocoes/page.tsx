'use client';

import React, { useState, useEffect } from 'react';
import { Promotion } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { CouponCard } from '@/components/coupon-card';
import { Tag, Sparkles, Percent, Beer } from 'lucide-react';

export default function PromocoesPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPromos = async () => {
    try {
      const data = await apiRequest<Promotion[]>('/promotions/restaurant/pirambeira');
      setPromotions(data);
    } catch (err) {
      console.error('Erro ao buscar promoções:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPromos();
  }, []);

  return (
    <div className="space-y-6">
      <div className="surface-elevated rounded-3xl p-6 sm:p-7 border border-amber-500/20 glow-amber-sm">
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

      {isLoading ? (
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
            Fique ligado! Em breve teremos novas rodadas de chopp e petiscos do chef Edu Moraes com desconto especial.
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

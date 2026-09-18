'use client';

import React, { useState } from 'react';
import { Promotion } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Tag, Sparkles, Copy, Check, QrCode, Beer } from 'lucide-react';

interface CouponCardProps {
  promotion: Promotion;
  onPromotionUpdate?: () => void;
}

export function CouponCard({ promotion, onPromotionUpdate }: CouponCardProps) {
  const { user } = useAuth();
  const [userCoupon, setUserCoupon] = useState(promotion.userCoupon);
  const [isClaiming, setIsClaiming] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClaim = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    setIsClaiming(true);
    try {
      const res = await apiRequest<{ message: string; coupon: any }>(
        `/promotions/${promotion.id}/claim`,
        { method: 'POST' },
      );
      setUserCoupon(res.coupon);
      if (onPromotionUpdate) onPromotionUpdate();
    } catch (err: any) {
      alert(err.message || 'Erro ao resgatar promoção.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleCopy = () => {
    if (userCoupon?.code) {
      navigator.clipboard.writeText(userCoupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="surface-elevated rounded-3xl p-5 sm:p-6 border border-amber-500/25 relative overflow-hidden mb-5 group hover:border-amber-500/45 transition-all glow-amber-sm">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <span className="text-[10px] bg-amber-500/20 text-amber-400 font-display font-black px-3 py-1 rounded-full border border-amber-500/35 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
          <Beer className="w-3 h-3 text-amber-400" />
          {promotion.badge || 'PROMOÇÃO DE BOTECO'}
        </span>

        <span className="text-[11px] font-mono text-[#A89F96]">
          Válido até {new Date(promotion.validUntil).toLocaleDateString('pt-BR')}
        </span>
      </div>

      <div className="mt-1">
        <span className="font-display font-black text-2xl sm:text-3xl text-amber-400 tracking-tight block">
          {promotion.discountText}
        </span>
        <h4 className="font-display font-bold text-base sm:text-lg text-[#FBF8F5] mt-0.5">
          {promotion.title}
        </h4>
      </div>

      <p className="text-xs text-[#A89F96] mt-2 leading-relaxed font-medium">
        {promotion.description}
      </p>

      {promotion.terms && (
        <p className="text-[10px] text-[#6E655D] mt-2 italic font-mono">
          * {promotion.terms}
        </p>
      )}

      {/* Action / Claimed Coupon Details */}
      <div className="pt-4 mt-4 border-t border-[#2C221A]">
        {userCoupon ? (
          <div className="bg-[#18130F] rounded-2xl p-3 sm:p-4 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/25 shadow-sm">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[#A89F96] uppercase font-bold tracking-wider block">
                  Código de Mesa (Apresentar ao Garçom)
                </span>
                <span className="font-mono font-black text-amber-400 text-base tracking-widest">
                  {userCoupon.code}
                </span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="py-2 px-3.5 rounded-xl bg-[#241B15] hover:bg-[#2C221A] text-[#FBF8F5] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A89F96] font-medium font-mono">
              {promotion.totalCoupons - promotion.redeemedCount} cupons disponíveis
            </span>

            <button
              onClick={handleClaim}
              disabled={isClaiming || !promotion.isAvailable}
              className="py-2.5 px-5 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs uppercase tracking-wider shadow-md glow-amber-sm active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isClaiming ? 'Resgatando...' : 'Resgatar na Mesa'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

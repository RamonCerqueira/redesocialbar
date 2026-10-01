'use client';

import React, { useState, useEffect } from 'react';
import { Promotion } from '@/lib/types';
import { LoadError } from '@/components/load-error';
import { apiRequest } from '@/lib/api';
import { CouponCard } from '@/components/coupon-card';
import { useAuth } from '@/lib/auth-context';
import { Tag, Sparkles, Percent, Beer } from 'lucide-react';

export default function PromocoesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'offers' | 'mine'>('offers');
  const [coupons, setCoupons] = useState<Array<{id: string; code: string; status: string; claimedAt: string; usedAt?: string; promotion: Promotion}>>([]);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  async function loadCoupons() { if (!user) return; setCouponLoading(true); try { setCoupons(await apiRequest('/promotions/mine')); setCouponError(''); } catch(e) { setCouponError(e instanceof Error ? e.message : 'Não foi possível carregar seus cupons.'); } finally { setCouponLoading(false); } }
  useEffect(() => { if (tab === 'mine') void loadCoupons(); }, [user, tab]);
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

      <div className="flex gap-3"><button onClick={() => setTab('offers')} className={'rounded-xl p-3 ' + (tab === 'offers' ? 'bg-amber-400 text-black' : 'bg-white/5')}>Promoções</button><button onClick={() => setTab('mine')} className={'rounded-xl p-3 ' + (tab === 'mine' ? 'bg-amber-400 text-black' : 'bg-white/5')}>Meus cupons</button></div>
      {tab === 'mine' ? <div className="space-y-5">{!user ? <a href="/login" className="text-amber-300">Entre para ver seus cupons</a> : couponLoading ? <p role="status">Carregando cupons…</p> : couponError ? <LoadError message={couponError} retry={() => void loadCoupons()} /> : <>{['CLAIMED', 'USED', 'EXPIRED'].map(status => <section key={status} className="space-y-3"><h2 className="font-bold">{{CLAIMED:'Resgatados',USED:'Utilizados',EXPIRED:'Expirados'}[status]}</h2>{coupons.filter(c => c.status === status).length === 0 && <p className="text-sm text-stone-400">Nenhum cupom nesta categoria.</p>}{coupons.filter(c => c.status === status).map(c => <article key={c.id} className="rounded-2xl border border-white/10 p-4"><h3 className="font-bold">{c.promotion.title}</h3><p className="font-mono text-amber-300 break-all mt-2">{c.code}</p><p className="text-xs text-stone-400 mt-2">Resgatado em {new Date(c.claimedAt).toLocaleString('pt-BR')}</p>{c.usedAt && <p className="text-xs text-stone-400">Utilizado em {new Date(c.usedAt).toLocaleString('pt-BR')}</p>}<p className="text-xs mt-2">{c.promotion.terms}</p>{status === 'CLAIMED' && <p className="text-sm mt-2">Apresente este código à equipe. O uso é confirmado pelo estabelecimento.</p>}</article>)}</section>)}</>}</div> : loadError ? <LoadError message={loadError} retry={() => void loadPromos()}/> : isLoading ? (
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

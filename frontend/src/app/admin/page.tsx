'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  Flame,
  MessageSquare,
  Tag,
  BarChart3,
  CheckCircle2,
  Calendar,
  Search,
  Beer,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Coupon validator state
  const [couponCode, setCouponCode] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    apiRequest<any>('/admin/dashboard/pirambeira')
      .then(setData)
      .catch((err) => console.error('Erro ao carregar métricas:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleValidateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await apiRequest<any>('/promotions/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: couponCode.trim(),
          restaurantSlug: 'pirambeira',
        }),
      });
      setValidationResult({ success: true, data: res });
      setCouponCode('');
    } catch (err: any) {
      setValidationResult({ success: false, message: err.message || 'Cupom inválido.' });
    } finally {
      setIsValidating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="surface-elevated rounded-3xl p-6 sm:p-7 border border-amber-500/20 glow-amber-sm">
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-widest mb-1.5">
          <BarChart3 className="w-4 h-4" />
          <span>GESTÃO DO ESTABELECIMENTO</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#FBF8F5] tracking-tight">
          Painel do Restaurante Pirambeira
        </h1>
        <p className="text-xs text-[#A89F96] mt-1.5 max-w-lg leading-relaxed font-medium">
          Acompanhamento em tempo real da ocupação física, interações dos frequentadores e validação de cupons na mesa.
        </p>
      </div>

      {/* Real-time Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
        <div className="surface-elevated rounded-3xl p-5 border border-emerald-500/30 glow-emerald">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Presentes Agora</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 indicator-pulse-emerald" />
          </div>
          <span className="font-display font-black text-3xl sm:text-4xl text-[#FBF8F5]">
            {m.activePatronsCount || 128}
          </span>
          <p className="text-[10px] text-[#A89F96] mt-1">Check-ins ativos no salão</p>
        </div>

        <div className="surface-elevated rounded-3xl p-5 border border-amber-500/30 glow-amber-sm">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Check-ins Hoje</span>
            <Flame className="w-4 h-4" />
          </div>
          <span className="font-display font-black text-3xl sm:text-4xl text-[#FBF8F5]">
            {m.todayCheckInsCount || 0}
          </span>
          <p className="text-[10px] text-[#A89F96] mt-1">Frequentadores acumulados</p>
        </div>

        <div className="surface-ambient rounded-3xl p-5 border border-[#2C221A]">
          <div className="flex items-center justify-between text-[#A89F96] mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Brindes & Reações</span>
            <Beer className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-display font-black text-3xl sm:text-4xl text-[#FBF8F5]">
            {m.interactionsCount || 0}
          </span>
          <p className="text-[10px] text-[#A89F96] mt-1">Interações comunitárias</p>
        </div>

        <div className="surface-ambient rounded-3xl p-5 border border-[#2C221A]">
          <div className="flex items-center justify-between text-[#A89F96] mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Cupons Resgatados</span>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-display font-black text-3xl sm:text-4xl text-[#FBF8F5]">
            {m.redeemedCouponsCount || 0}
          </span>
          <p className="text-[10px] text-[#A89F96] mt-1">Descontos aproveitados</p>
        </div>

        <div className="surface-ambient rounded-3xl p-5 border border-[#2C221A]">
          <div className="flex items-center justify-between text-[#A89F96] mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Momentos Postados</span>
            <span className="text-amber-400 font-bold">📸</span>
          </div>
          <span className="font-display font-black text-3xl sm:text-4xl text-[#FBF8F5]">
            {m.postsCount || 0}
          </span>
          <p className="text-[10px] text-[#A89F96] mt-1">Fotos e notas no mural</p>
        </div>

        <div className="surface-ambient rounded-3xl p-5 border border-[#2C221A]">
          <div className="flex items-center justify-between text-[#A89F96] mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider">Mesas & Eventos</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-display font-black text-3xl sm:text-4xl text-[#FBF8F5]">
            {(m.eventsCount || 0) + (m.meetupsCount || 0)}
          </span>
          <p className="text-[10px] text-[#A89F96] mt-1">Mesas ativas na casa</p>
        </div>
      </div>

      {/* Hourly Flow Chart Representation */}
      <section className="surface-elevated rounded-3xl p-6 border border-[#2C221A]">
        <h3 className="font-display font-black text-sm uppercase tracking-wider text-[#FBF8F5] mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span>Fluxo de Clientes por Horário (Pico Noturno)</span>
        </h3>

        <div className="space-y-2.5">
          {data?.charts?.hourlyTraffic?.map((item: any) => {
            const percentage = Math.round((item.patrons / 100) * 100);
            return (
              <div key={item.hour} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-mono text-[#A89F96] font-bold">{item.hour}</span>
                <div className="flex-1 h-3 bg-[#18130F] rounded-full overflow-hidden border border-[#2C221A]">
                  <div
                    className="h-full amber-gradient rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-20 text-right font-mono font-bold text-[#FBF8F5]">
                  {item.patrons} clientes
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Staff Coupon Validator Tool */}
      <section className="surface-elevated rounded-3xl p-6 border border-amber-500/30 glow-amber-sm">
        <h3 className="font-display font-black text-sm uppercase tracking-wider text-[#FBF8F5] mb-1 flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-400" />
          <span>Validador de Cupons (Equipe do Bar / Garçom)</span>
        </h3>
        <p className="text-xs text-[#A89F96] mb-4">
          Insira o código do cupom apresentado pelo cliente no momento da conta ou pedido no balcão.
        </p>

        <form onSubmit={handleValidateCoupon} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6E655D] absolute left-3.5 top-3" />
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Ex: PIRAMBA-CHOPP-8821"
              className="w-full bg-[#18130F] border border-[#2C221A] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[#FBF8F5] uppercase tracking-wider font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            disabled={isValidating || !couponCode.trim()}
            className="py-2.5 px-5 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs uppercase tracking-wider shadow-md glow-amber-sm active:scale-95 transition-transform shrink-0 cursor-pointer"
          >
            {isValidating ? 'Validando...' : 'Validar Cupom'}
          </button>
        </form>

        {validationResult && (
          <div
            className={`mt-4 p-4 rounded-2xl border text-xs animate-in fade-in ${
              validationResult.success
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/70 border-red-500/40 text-red-300'
            }`}
          >
            {validationResult.success ? (
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h5 className="font-display font-bold text-[#FBF8F5] text-sm">
                    {validationResult.data.promotion.discountText}
                  </h5>
                  <p className="mt-0.5">
                    Cliente: <strong>{validationResult.data.customer.name}</strong> (@{validationResult.data.customer.username})
                  </p>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                    ✓ Cupom validado e baixado no sistema com sucesso.
                  </span>
                </div>
              </div>
            ) : (
              <p className="font-bold">{validationResult.message}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

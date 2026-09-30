'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RestaurantGallery } from '@/components/restaurant-gallery';
import { MobileMenu } from '@/components/mobile-menu';
import { apiRequest, ApiError } from '@/lib/api';
import { LoadError } from '@/components/load-error';
import { useAuth } from '@/lib/auth-context';
import {
  Phone,
  Instagram,
  Star,
  Utensils,
  Calendar,
  Tag,
  Beer,
} from 'lucide-react';

interface RestaurantPageProps {
  params: Promise<{ slug: string }>;
}

export default function RestaurantDetailPage({ params }: RestaurantPageProps) {
  const { slug } = React.use(params);
  const { user, activeCheckIn, setActiveCheckIn } = useAuth();
  const [canManage, setCanManage] = useState(false);
  useEffect(() => {
    let active = true;
    setCanManage(false);
    if (user?.role === 'SUPERADMIN' || user?.role === 'RESTAURANT_ADMIN') {
      apiRequest<{slug:string}[]>('/admin/restaurants').then(items => { if(active)setCanManage(items.some(item=>item.slug===slug)); }).catch(()=>{});
    }
    return ()=>{active=false;};
  }, [user?.id, user?.role, slug]);

  const [restaurant, setRestaurant] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'CARDAPIO' | 'EVENTOS' | 'PROMOCOES'>('CARDAPIO');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadRestaurant = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await apiRequest<any>(`/restaurants/${slug}`);
      setRestaurant(data);
    } catch (err) {
      setRestaurant(null);
      if (!(err instanceof ApiError && err.status === 404)) setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar o restaurante.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurant();
  }, [slug]);

  const handleCheckIn = async () => {
    try {
      const res = await apiRequest<any>('/check-ins', {
        method: 'POST',
        body: JSON.stringify({
          restaurantSlug: slug,
        }),
      });
      setActiveCheckIn(res);
      loadRestaurant();
      alert('Check-in realizado com sucesso no Restaurante Pirambeira!');
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar check-in.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  function summarizeHours(hours: Record<string,string> | undefined | null): string {
    if (!hours || typeof hours !== 'object') return 'Consulte o horário no local';
    const entries = Object.entries(hours).filter(([,v])=>v && String(v).trim() && !/fechad/i.test(String(v)));
    if (!entries.length) return 'Fechado agora · consulte o local';
    if (entries.length === 7) {
      const sample = entries[0][1];
      if (entries.every(([,v]) => v === sample)) return sample;
    }
    const today = new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Bahia',weekday:'long'}).format(new Date()).replace('-feira','');
    const todayEntry = Object.entries(hours).find(([day])=>day.toLocaleLowerCase('pt-BR').replace('-feira','')===today);
    return (todayEntry?.[1] || 'Horário não informado') + ' · hoje';
  }

  const fallbackCover = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80';
  const fallbackLogo = '/LogoPirambeiraSemFundo.png';
  const logoUrl = restaurant?.logoUrl || fallbackLogo;
  const taglineText = restaurant?.tagline || 'Bar & Encontros';
  const subLocality = [restaurant?.neighborhood, [restaurant?.city, restaurant?.state].filter(Boolean).join(' - ')].filter(Boolean).join(' • ') || 'Salvador - BA';
  const scheduleText = summarizeHours(restaurant?.openingHours as Record<string,string> | undefined | null);

  if (loadError) return <div className="px-[18px]"><LoadError message={loadError} retry={loadRestaurant} /></div>;

  if (!restaurant) {
    return (
      <div className="surface-elevated rounded-3xl p-8 text-center border border-[#2C221A]">
        <h3 className="font-display font-bold text-[#FBF8F5]">Restaurante não encontrado</h3>
      </div>
    );
  }

  return (
    <div className="restaurant-detail space-y-6">
      {canManage&&<Link href={`/admin?section=settings&restaurant=${encodeURIComponent(slug)}`} className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 px-4 py-2 text-xs font-bold text-amber-300">Editar página do restaurante</Link>}
      {/* 1. Cover: height 190, relative, gradient linear-gradient(transparent,#080807) */}
      <div className="restaurant-cover relative h-[190px] w-full overflow-hidden bg-[#080807]">
        <img
          src={
            restaurant.coverUrl || fallbackCover
          }
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, #080807 100%)',
          }}
        />

        {/* Rating Badge Top Right */}
        <div className="absolute top-3 right-4 bg-[#080807]/85 backdrop-blur-md border border-[#FFB800]/30 text-[#FFB800] px-3 py-1 rounded-full flex items-center gap-1 text-[11px] font-black shadow-lg">
          <Star className="w-3 h-3 fill-[#FFB800]" />
          <span>{restaurant.rating || 4.9}</span>
        </div>
      </div>

      {/* 2. Profile Identity: marginTop -50, padding 0 18px */}
      <div className="-mt-[50px] relative px-[18px] z-10">
        <div className="flex items-end justify-between">
          {/* Avatar: width 90, height 90, borderRadius 45, border 4px solid #080807 */}
          <div className="w-[90px] h-[90px] rounded-[45px] border-[4px] border-[#080807] overflow-hidden bg-[#11100F] shadow-2xl relative">
            <img
              src={logoUrl}
              alt={restaurant.name}
              className="w-full h-full object-contain p-1.5"
            />
          </div>

          {/* Status de Check-in Ativo */}
          {activeCheckIn?.restaurant?.slug === slug ? (
            <div className="bg-[#00D084]/15 border border-[#00D084]/40 text-[#00D084] text-xs px-3.5 py-1.5 rounded-full font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00D084] indicator-pulse-emerald" />
              <span>Você está aqui</span>
            </div>
          ) : (
            <button
              onClick={handleCheckIn}
              className="h-[38px] px-4 rounded-[19px] bg-[#FFB800] text-[#080807] font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,184,0,0.35)] active:scale-95 transition-all cursor-pointer"
            >
              <Beer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Check-in</span>
            </button>
          )}
        </div>

        {/* Name: fontSize 21, fontWeight 800 */}
        <div className="mt-3">
          <h1 className="font-display font-extrabold text-[21px] text-white tracking-tight leading-tight flex items-center gap-1.5">
            {restaurant.name}
            <span className="w-4 h-4 rounded-full bg-[#1D9BF0] flex items-center justify-center text-white text-[9px] font-black leading-none shrink-0" title="Verificado Oficial">
              ✓
            </span>
          </h1>
          <p className="text-xs text-[#AAA49C] mt-0.5 font-medium">
            {taglineText} • {subLocality}
          </p>
        </div>

        {/* 3. Stats: display grid, repeat(3, 1fr), marginTop 16, padding 14px 0, borderTop 1px solid #29251F, borderBottom 1px solid #29251F */}
        <div className="grid grid-cols-3 mt-4 py-[14px] border-t border-b border-[#29251F] text-center">
          <div>
            <span className="font-display font-extrabold text-[16px] text-[#00D084] block leading-none">
              {restaurant.activePeopleCount ?? 0}
            </span>
            <span className="text-[10px] text-[#716D68] uppercase font-bold tracking-wider mt-1 block">
              No Bar Agora
            </span>
          </div>
          <div className="border-l border-r border-[#29251F]">
            <span className="font-display font-extrabold text-[16px] text-white block leading-none">
              {restaurant.rating || 4.9}
            </span>
            <span className="text-[10px] text-[#716D68] uppercase font-bold tracking-wider mt-1 block">
              Avaliação
            </span>
          </div>
          <div>
            <span className="font-display font-extrabold text-[16px] text-[#FFB800] block leading-none">
              {scheduleText}
            </span>
            <span className="text-[10px] text-[#716D68] uppercase font-bold tracking-wider mt-1 block">
              Horário
            </span>
          </div>
        </div>

        {/* 4. Actions: grid 2 colunas, gap 8, marginTop 12, buttons height 38, borderRadius 19, border 1px solid #FFB800 */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => setActiveTab('CARDAPIO')}
            className="h-[38px] rounded-[19px] border border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800]/10 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Cardápio</span>
          </button>
          <a
            href={`https://instagram.com/${encodeURIComponent(String(restaurant.instagram || 'pirambeira.bar').replace(/^https?:\/\/(www\.)?instagram\.com\//i,'').replace(/^@/,'').split(/[/?#]/)[0])}`}
            target="_blank"
            rel="noreferrer"
            className="h-[38px] rounded-[19px] border border-[#302A20] bg-[#11100F] text-white hover:border-[#FFB800]/40 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Instagram className="w-3.5 h-3.5 text-[#FF2D70]" />
            <span>Instagram</span>
          </a>
        </div>

        <RestaurantGallery photos={restaurant.galleryPhotos || []}/>
        <details className="mt-4 rounded-2xl border border-amber-500/15 p-4 text-xs text-[#b9afa4]">
          <summary className="cursor-pointer font-bold text-amber-300">Sobre o restaurante e horários</summary>
          <div className="space-y-3 pt-4">
            {restaurant.description&&<p className="whitespace-pre-line leading-relaxed">{restaurant.description}</p>}
            <p>{restaurant.address} · {subLocality}</p>
            {restaurant.phone&&<a className="inline-flex items-center gap-2 text-amber-300" href={'tel:'+String(restaurant.phone).replace(/[^+\d]/g,'')}><Phone size={14}/>{restaurant.phone}</a>}
            {Object.entries(restaurant.openingHours||{}).map(([day,hours])=><p key={day} className="flex justify-between gap-4"><span>{day}</span><span>{String(hours||'Não informado')}</span></p>)}
          </div>
        </details>
      </div>

      {/* Tabs */}
      <div className="restaurant-tabs flex items-center gap-2 p-1 bg-[#18130F] rounded-2xl border border-[#2C221A]">
        <button
          onClick={() => setActiveTab('CARDAPIO')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'CARDAPIO'
              ? 'amber-gradient text-[#080706] shadow-md glow-amber-sm'
              : 'text-[#A89F96] hover:text-[#FBF8F5]'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Cardápio Digital</span>
        </button>

        <button
          onClick={() => setActiveTab('EVENTOS')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'EVENTOS'
              ? 'amber-gradient text-[#080706] shadow-md glow-amber-sm'
              : 'text-[#A89F96] hover:text-[#FBF8F5]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Eventos ({restaurant.events?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('PROMOCOES')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'PROMOCOES'
              ? 'amber-gradient text-[#080706] shadow-md glow-amber-sm'
              : 'text-[#A89F96] hover:text-[#FBF8F5]'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Promoções ({restaurant.promotions?.length || 0})</span>
        </button>
      </div>

      {activeTab === 'CARDAPIO' && <MobileMenu categories={restaurant.menuCategories || []} />}

      {/* Tab Content: Eventos */}
      {activeTab === 'EVENTOS' && (
        <div className="space-y-4">
          {restaurant.events?.map((ev: any) => (
            <div key={ev.id} className="surface-elevated rounded-3xl p-5 border border-amber-500/20 flex justify-between items-center gap-4">
              <div>
                <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider">{ev.category}</span>
                <h4 className="font-display font-bold text-[#FBF8F5] text-sm mt-0.5">{ev.title}</h4>
                <p className="text-xs text-[#A89F96] mt-1">{ev.description}</p>
                <span className="text-[11px] text-[#6E655D] mt-2 block font-mono">
                  {new Date(ev.date).toLocaleDateString('pt-BR')} às {ev.startTime}
                </span>
              </div>
              <Link
                href="/eventos"
                className="py-2 px-3.5 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs shrink-0 shadow-sm glow-amber-sm"
              >
                Participar
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Promoções */}
      {activeTab === 'PROMOCOES' && (
        <div className="space-y-4">
          {restaurant.promotions?.map((p: any) => (
            <div key={p.id} className="surface-elevated rounded-3xl p-5 border border-amber-500/25 flex justify-between items-center gap-4 glow-amber-sm">
              <div>
                <span className="font-display font-black text-amber-400 text-lg block">{p.discountText}</span>
                <h4 className="font-display font-bold text-[#FBF8F5] text-xs mt-0.5">{p.title}</h4>
                <p className="text-[11px] text-[#A89F96] mt-1">{p.description}</p>
              </div>
              <Link
                href="/promocoes"
                className="py-2 px-3.5 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs shrink-0 shadow-sm glow-amber-sm"
              >
                Resgatar
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

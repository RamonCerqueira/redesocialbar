'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Restaurant } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  MapPin,
  Clock,
  Phone,
  Instagram,
  Star,
  Users,
  Utensils,
  Wine,
  Calendar,
  Tag,
  CheckCircle2,
  Beer,
} from 'lucide-react';

interface RestaurantPageProps {
  params: Promise<{ slug: string }>;
}

export default function RestaurantDetailPage({ params }: RestaurantPageProps) {
  const { slug } = React.use(params);
  const { activeCheckIn, setActiveCheckIn } = useAuth();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'CARDAPIO' | 'EVENTOS' | 'PROMOCOES'>('CARDAPIO');
  const [isLoading, setIsLoading] = useState(true);

  const loadRestaurant = async () => {
    try {
      const data = await apiRequest<any>(`/restaurants/${slug}`);
      setRestaurant(data);
    } catch (err) {
      console.error('Erro ao carregar restaurante:', err);
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
          approxLatitude: -13.0031,
          approxLongitude: -38.4554,
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

  if (!restaurant) {
    return (
      <div className="surface-elevated rounded-3xl p-8 text-center border border-[#2C221A]">
        <h3 className="font-display font-bold text-[#FBF8F5]">Restaurante não encontrado</h3>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-5">
      {/* 1. Cover: height 190, relative, gradient linear-gradient(transparent,#080807) */}
      <div className="relative h-[190px] w-full overflow-hidden bg-[#080807]">
        <img
          src={
            restaurant.coverUrl ||
            'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80'
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
              src="/LogoPirambeiraSemFundo.png"
              alt="Pirambeira"
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
            Bar & Encontros • Salvador - BA
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
              17h às 02h
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
            href={`https://instagram.com/${restaurant.instagram?.replace('@', '') || 'pirambeira.bar'}`}
            target="_blank"
            rel="noreferrer"
            className="h-[38px] rounded-[19px] border border-[#302A20] bg-[#11100F] text-white hover:border-[#FFB800]/40 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Instagram className="w-3.5 h-3.5 text-[#FF2D70]" />
            <span>Instagram</span>
          </a>
        </div>

        {/* 5. Story Highlights: display flex, gap 12, padding 18px 0, overflow-x-auto */}
        <div className="flex items-center gap-3 py-[18px] overflow-x-auto scroll-x-hide">
          {[
            { label: 'Drinks 🍸', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=150&q=80' },
            { label: 'Samba 🎶', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=150&q=80' },
            { label: 'Petiscos 🍤', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=150&q=80' },
            { label: 'Galera 🍻', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80' },
          ].map((hl) => (
            <div key={hl.label} className="w-[58px] shrink-0 text-center cursor-pointer group">
              <div className="w-[58px] h-[58px] rounded-full p-[2px] border-2 border-[#FFB800] group-hover:scale-105 transition-transform overflow-hidden">
                <img src={hl.img} alt={hl.label} className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-[10px] font-medium text-[#AAA49C] mt-1 block truncate">
                {hl.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#18130F] rounded-2xl border border-[#2C221A]">
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

      {/* Tab Content: Cardápio */}
      {activeTab === 'CARDAPIO' && (
        <div className="space-y-6">
          {restaurant.menuCategories?.map((cat: any) => (
            <div key={cat.name} className="surface-elevated rounded-3xl p-5 sm:p-6 border border-amber-500/15">
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-amber-400 flex items-center gap-2 pb-3 border-b border-[#2C221A]">
                {cat.name.includes('Drinks') ? <Wine className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
                <span>{cat.name}</span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-3.5 mt-4">
                {cat.items.map((item: any) => (
                  <div key={item.name} className="bg-[#18130F] p-3.5 rounded-2xl border border-[#2C221A]/80 hover:border-amber-500/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-display font-bold text-xs text-[#FBF8F5]">{item.name}</h4>
                      <span className="font-mono font-black text-xs text-amber-400 shrink-0">{item.price}</span>
                    </div>
                    <p className="text-[11px] text-[#A89F96] mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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

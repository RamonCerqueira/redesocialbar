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
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="surface-elevated rounded-3xl overflow-hidden border border-amber-500/25 glow-amber-sm">
        <div className="relative h-52 sm:h-72 w-full">
          <img
            src={
              restaurant.coverUrl ||
              'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1600&q=80'
            }
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080706] via-[#080706]/40 to-transparent" />

          {/* Rating Badge */}
          <div className="absolute top-4 right-4 bg-[#080706]/85 backdrop-blur-md border border-amber-500/30 text-amber-400 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-black shadow-lg">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{restaurant.rating}</span>
            <span className="text-[#A89F96] font-normal">(4.9 estrelas)</span>
          </div>
        </div>

        {/* Info & Venue Details */}
        <div className="p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C221A]">
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-[#FBF8F5] tracking-tight">
                {restaurant.name}
              </h1>
              <p className="text-xs text-amber-400 font-bold mt-0.5">{restaurant.tagline}</p>
            </div>

            {/* Check-In Button */}
            <div>
              {activeCheckIn?.restaurant.slug === slug ? (
                <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs px-4 py-2.5 rounded-2xl font-black flex items-center gap-2 glow-emerald">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 indicator-pulse-emerald" />
                  <span>Você está aqui agora</span>
                </div>
              ) : (
                <button
                  onClick={handleCheckIn}
                  className="py-2.5 px-5 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg glow-amber-sm active:scale-95 transition-transform cursor-pointer"
                >
                  <Beer className="w-4 h-4 stroke-[2.5]" />
                  <span>Fazer Check-in no Bar</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-[#A89F96] leading-relaxed mt-4 font-medium">
            {restaurant.description}
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <div className="bg-[#18130F] p-3 rounded-2xl border border-[#2C221A]">
              <span className="text-[10px] text-[#6E655D] uppercase font-black block tracking-wider">
                Presentes Agora
              </span>
              <span className="text-base font-display font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <Users className="w-4 h-4" />
                {restaurant.activePeopleCount || 128}
              </span>
            </div>

            <div className="bg-[#18130F] p-3 rounded-2xl border border-[#2C221A]">
              <span className="text-[10px] text-[#6E655D] uppercase font-black block tracking-wider">
                Bairro
              </span>
              <span className="text-xs font-bold text-[#FBF8F5] mt-1 block truncate">
                Pituba, Salvador
              </span>
            </div>

            <div className="bg-[#18130F] p-3 rounded-2xl border border-[#2C221A]">
              <span className="text-[10px] text-[#6E655D] uppercase font-black block tracking-wider">
                Instagram
              </span>
              <a
                href={`https://instagram.com/${restaurant.instagram?.replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-rose-400 hover:underline mt-1 block truncate"
              >
                {restaurant.instagram || '@pirambeira.bar'}
              </a>
            </div>

            <div className="bg-[#18130F] p-3 rounded-2xl border border-[#2C221A]">
              <span className="text-[10px] text-[#6E655D] uppercase font-black block tracking-wider">
                Telefone
              </span>
              <span className="text-xs font-bold text-[#FBF8F5] mt-1 block">
                {restaurant.phone || '(71) 98844-3210'}
              </span>
            </div>
          </div>

          {/* Location & Opening Hours */}
          <div className="mt-5 pt-4 border-t border-[#2C221A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#A89F96]">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{restaurant.address} • Pituba, Salvador - BA</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Qua a Dom: a partir das 17h (Almoço sex a dom)</span>
            </div>
          </div>
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

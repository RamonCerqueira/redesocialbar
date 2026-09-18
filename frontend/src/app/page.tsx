'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Post } from '@/lib/types';
import { MOCK_POSTS } from '@/lib/mock-data';
import { PostCard } from '@/components/post-card';
import {
  Flame,
  ArrowRight,
  Calendar,
  Users,
  Tag,
  Wine,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreVertical,
  Plus,
  Beer,
  X,
  Sparkles,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Music,
  Gift,
  Loader2,
} from 'lucide-react';
import { InviteModal } from '@/components/invite-modal';

// Promoções Reais do Carrossel do Piramba
const PROMO_SLIDES = [
  {
    id: 'happy-hour',
    tag: 'TERÇA É',
    title: 'HAPPY HOUR',
    descPrefix: 'Drinks e cervejas com ',
    highlight: '20% de desconto!',
    link: '/promocoes',
    buttonText: 'Ver mais',
    image: 'https://images.unsplash.com/photo-1575037614876-c38a4d44f5b8?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    badge: 'crown',
  },
  {
    id: 'samba',
    tag: 'SEXTA TEM',
    title: 'SAMBA NO DECK',
    descPrefix: 'Roda de samba ao vivo com ',
    highlight: 'Chopp em dobro até 20h!',
    link: '/eventos',
    buttonText: 'Programação',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    badge: 'music',
  },
  {
    id: 'caipirinha',
    tag: 'QUARTA DA',
    title: 'DOBRADINHA',
    descPrefix: 'Peça uma caipirinha e a ',
    highlight: '2ª é por conta do bar!',
    link: '/promocoes',
    buttonText: 'Pegar cupom',
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    badge: 'drinks',
  },
  {
    id: 'aniversario',
    tag: 'FIM DE SEMANA',
    title: 'ANIVERSÁRIO VIP',
    descPrefix: 'Mesa com 10 amigos ganha ',
    highlight: '1 torre de chopp grátis!',
    link: '/encontros',
    buttonText: 'Juntar mesa',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    badge: 'gift',
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const [activeStory, setActiveStory] = useState<any>(null);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Feed infinito 1 por vez (como Instagram)
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [visibleCount, setVisibleCount] = useState(2);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const data = await apiRequest<Post[]>('/posts/feed/pirambeira');
        if (data && data.length > 0) {
          setPosts(data);
        }
      } catch {
        // fallback to MOCK_POSTS
      }
    }
    fetchPosts();
  }, []);

  // Rolagem infinita com IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore && hasMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => {
              const next = prev + 2;
              if (next >= 12) {
                setHasMore(false);
              }
              return next;
            });
            setIsLoadingMore(false);
          }, 650);
        }
      },
      { threshold: 0.1, rootMargin: '200px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingMore, hasMore, posts.length]);

  // Auto-play do Carrossel de Promoções
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Stories Data
  const stories = [
    {
      id: 'create',
      isCreate: true,
      label: 'Criar story',
    },
    {
      id: 'hoje',
      label: 'Hoje no Bar',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80',
      storyImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1080&q=80',
      caption: 'A casa tá fervendo! Roda de samba rolando ao vivo no deck externo 🎶🔥',
    },
    {
      id: 'drinks',
      label: 'Drinks',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
      storyImage: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1080&q=80',
      caption: 'Novos coquetéis autorais da casa com frutas locais e cachaça da Bahia! 🍹',
    },
    {
      id: 'musica',
      label: 'Música',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
      storyImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1080&q=80',
      caption: 'DJ comandando a pista com as melhores brasilidades e remixes até as 2h 🎧',
    },
    {
      id: 'clientes',
      label: 'Clientes',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=400&q=80',
      storyImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1080&q=80',
      caption: 'Mesa 12 comemorando aniversário com chopp trincando e petiscos! 🍻🎉',
    },
    {
      id: 'promocoes',
      label: 'Promoções',
      image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=400&q=80',
      storyImage: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1080&q=80',
      caption: 'Chopp em dobro até as 20h para quem fizer check-in no aplicativo! 🍺',
    },
  ];

  return (
    <div className="space-y-5 pb-16 max-w-xl mx-auto">
      {/* 1. HERO BANNER: "Boa noite, Ramon! Aqui é Piramba!" */}
      <div className="relative overflow-hidden rounded-3xl bg-[#120F0D] border border-[#2A221C] shadow-2xl">
        {/* Background Image of lively bar */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=80"
            alt="Ambiente Piramba"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080706] via-[#080706]/75 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-7 flex items-center justify-between">
          <div className="max-w-[70%] space-y-1.5">
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight leading-tight">
              <span className="text-white block">Boa noite,</span>
              <span className="text-[#F5A623] block">
                {user?.profile?.name?.split(' ')[0] || 'Ramon'}!
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-[#D1C9C1] leading-relaxed pt-0.5">
              Hoje tem gente boa, drinks gelados e aquele clima que só o Piramba tem.
            </p>

            {/* Small yellow underline bar */}
            <div className="w-14 h-1 bg-[#F5A623] rounded-full mt-3" />
          </div>

          {/* Handwritten "Aqui é Piramba!" Graphic */}
          <div className="shrink-0 rotate-[-8deg] translate-y-1 select-none pr-1">
            <span
              className="text-[#F5A623] font-black text-xl sm:text-2xl tracking-wide drop-shadow-[0_2px_12px_rgba(245,166,35,0.4)] block text-right font-serif italic"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Aqui é
              <br />
              Piramba!
            </span>
          </div>
        </div>
      </div>

      {/* 2. STORIES DO BAR */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-display font-black text-sm text-white tracking-tight">
            Stories do Bar
          </h2>
          <button
            onClick={() => setActiveStory(stories[1])}
            className="text-xs text-[#F5A623] hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Circular Horizontal Stories */}
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 scrollbar-none px-0.5">
          {stories.map((story) => {
            if (story.isCreate) {
              return (
                <Link
                  key={story.id}
                  href="/publicar"
                  className="flex flex-col items-center shrink-0 w-16 group cursor-pointer"
                >
                  <div className="relative mb-1.5">
                    <div className="w-16 h-16 rounded-full bg-[#120F0D] border-2 border-[#F5A623] p-1 flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-amber-500/20">
                      <div className="w-full h-full rounded-full bg-[#1C1714] flex items-center justify-center p-2 overflow-hidden">
                        <img
                          src="/LogoPirambeiraSemFundo.png"
                          alt="Piramba"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    {/* Plus badge */}
                    <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#F5A623] border-2 border-[#080706] flex items-center justify-center text-[#080706]">
                      <Plus className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-white text-center truncate w-full group-hover:text-[#F5A623] transition-colors">
                    {story.label}
                  </span>
                </Link>
              );
            }

            return (
              <button
                key={story.id}
                onClick={() => setActiveStory(story)}
                className="flex flex-col items-center shrink-0 w-16 group cursor-pointer text-left focus:outline-none"
              >
                <div className="relative mb-1.5">
                  <div className="w-16 h-16 rounded-full border-2 border-[#F5A623] p-[2px] group-hover:scale-105 transition-transform shadow-md shadow-amber-500/20">
                    <img
                      src={story.image}
                      alt={story.label}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-white text-center truncate w-full group-hover:text-[#F5A623] transition-colors">
                  {story.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED PROMO CAROUSEL DINÂMICO (Carrossel Real do Bar) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#120F0D] border border-[#2A221C] shadow-2xl p-4 sm:p-6 group">
        {/* Background gradient/texture */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-[#14100D] to-[#241A0E] opacity-95" />
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-[#F5A623]/10 rounded-full blur-2xl pointer-events-none" />

        {(() => {
          const slide = PROMO_SLIDES[currentPromoIndex];
          return (
            <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300">
              {/* Left: Foto da Promoção com Fallback seguro */}
              <div className="w-24 sm:w-36 h-28 sm:h-36 shrink-0 relative rounded-2xl overflow-hidden shadow-xl border border-white/5 bg-black">
                <img
                  key={slide.id}
                  src={slide.image}
                  alt={slide.title}
                  onError={(e) => {
                    e.currentTarget.src = slide.fallback;
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 animate-in fade-in"
                />
              </div>

              {/* Center: Informações da Promoção */}
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] font-black text-[#F5A623] uppercase tracking-widest block">
                  {slide.tag}
                </span>

                <h3 className="font-display font-black text-xl sm:text-3xl text-white tracking-tight leading-tight">
                  {slide.title}
                </h3>

                <p className="text-xs text-[#C4BCB3] leading-snug">
                  {slide.descPrefix}
                  <strong className="text-[#F5A623] font-black">{slide.highlight}</strong>
                </p>

                <div className="pt-1.5 flex items-center gap-2">
                  <Link
                    href={slide.link}
                    className="inline-flex items-center gap-1.5 bg-[#F5A623] hover:bg-[#ffb338] text-[#080706] font-display font-black text-xs px-3.5 py-1.5 rounded-xl shadow-md active:scale-95 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{slide.buttonText}</span>
                  </Link>

                  {/* Setas de Controle Próximo / Anterior */}
                  <div className="flex items-center gap-1 ml-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPromoIndex(
                          (prev) => (prev - 1 + PROMO_SLIDES.length) % PROMO_SLIDES.length
                        )
                      }
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Anterior"
                      aria-label="Promoção anterior"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPromoIndex((prev) => (prev + 1) % PROMO_SLIDES.length)
                      }
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Próxima"
                      aria-label="Próxima promoção"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Doodle Dourado & Paginação Clicável */}
              <div className="flex flex-col items-end justify-between self-stretch shrink-0 py-1">
                {/* Badge temático de acordo com a promo */}
                {slide.badge === 'crown' && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F5A623"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-7 h-7 sm:w-11 sm:h-11 rotate-12 opacity-90 animate-in fade-in"
                  >
                    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
                  </svg>
                )}
                {slide.badge === 'music' && (
                  <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-full bg-amber-500/15 flex items-center justify-center text-[#F5A623] rotate-6 animate-in fade-in">
                    <Music className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.3]" />
                  </div>
                )}
                {slide.badge === 'drinks' && (
                  <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-full bg-amber-500/15 flex items-center justify-center text-[#F5A623] -rotate-6 animate-in fade-in">
                    <Beer className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.3]" />
                  </div>
                )}
                {slide.badge === 'gift' && (
                  <div className="w-7 h-7 sm:w-11 sm:h-11 rounded-full bg-amber-500/15 flex items-center justify-center text-[#F5A623] rotate-12 animate-in fade-in">
                    <Gift className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.3]" />
                  </div>
                )}

                {/* Pontos Clicáveis de Paginação: [- • • •] */}
                <div className="flex items-center gap-1 sm:gap-1.5 pt-2">
                  {PROMO_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentPromoIndex(idx)}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        currentPromoIndex === idx
                          ? 'w-3.5 sm:w-4 h-1 sm:h-1.5 bg-[#F5A623]'
                          : 'w-1 sm:w-1.5 h-1 sm:h-1.5 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 4. QUICK ACTION 4-BUTTON GRID (Convidar pirambeiro, Meus amigos, Eventos, Promoções) */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        {/* 1. Convidar Pirambeiro (Substitui Reservar Mesa) */}
        <button
          type="button"
          onClick={() => setShowInviteModal(true)}
          className="bg-[#120F0D] hover:bg-[#1A1512] border border-[#221B16] hover:border-[#F5A623]/40 p-2 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 transition-all active:scale-95 group shadow-sm text-center sm:text-left cursor-pointer"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 text-[#F5A623] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </div>
          <div className="leading-tight">
            <span className="text-[10px] sm:text-xs font-bold text-white block group-hover:text-[#F5A623] transition-colors">
              Convidar
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-white block group-hover:text-[#F5A623] transition-colors">
              pirambeiro
            </span>
          </div>
        </button>

        <Link
          href="/aqui"
          className="bg-[#120F0D] hover:bg-[#1A1512] border border-[#221B16] hover:border-[#F5A623]/40 p-2 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 transition-all active:scale-95 group shadow-sm text-center sm:text-left"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 text-[#F5A623] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </div>
          <div className="leading-tight">
            <span className="text-[10px] sm:text-xs font-bold text-white block group-hover:text-[#F5A623] transition-colors">
              Meus
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-white block group-hover:text-[#F5A623] transition-colors">
              amigos
            </span>
          </div>
        </Link>

        <Link
          href="/eventos"
          className="bg-[#120F0D] hover:bg-[#1A1512] border border-[#221B16] hover:border-[#F5A623]/40 p-2 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 transition-all active:scale-95 group shadow-sm text-center sm:text-left"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 text-[#F5A623] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-white group-hover:text-[#F5A623] transition-colors pt-0.5 sm:pt-0">
            Eventos
          </span>
        </Link>

        <Link
          href="/promocoes"
          className="bg-[#120F0D] hover:bg-[#1A1512] border border-[#221B16] hover:border-[#F5A623]/40 p-2 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 transition-all active:scale-95 group shadow-sm text-center sm:text-left"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 text-[#F5A623] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Tag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-white group-hover:text-[#F5A623] transition-colors pt-0.5 sm:pt-0">
            Promoções
          </span>
        </Link>
      </div>

      {/* 5. "O QUE ESTÁ ROLANDO" (FEED 1 POR VEZ COM ROLAGEM INFINITA - ESTILO INSTAGRAM) */}
      <section className="space-y-4 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#F5A623] fill-[#F5A623]" />
            <h2 className="font-display font-black text-base sm:text-lg text-white tracking-tight">
              O que está rolando
            </h2>
          </div>

          <Link
            href="/feed"
            className="text-xs text-[#F5A623] hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
          >
            <span>Ver tudo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Feed de Postagens: 1 por vez, não agrupadas, igual ao Instagram */}
        <div className="space-y-4">
          {Array.from({ length: Math.min(visibleCount, 12) }).map((_, idx) => {
            const originalPost = posts[idx % posts.length];
            const uniquePost = {
              ...originalPost,
              id: `${originalPost.id}-${idx}`,
            };
            return <PostCard key={uniquePost.id} post={uniquePost} />;
          })}
        </div>

        {/* Sentinel de Rolagem Infinita & Indicador de Carregamento */}
        <div ref={sentinelRef} className="py-4 flex flex-col items-center justify-center text-center">
          {isLoadingMore ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#120F0D] border border-amber-500/25 shadow-lg shadow-amber-500/5 animate-in fade-in">
              <Loader2 className="w-4 h-4 text-[#F5A623] animate-spin" />
              <span className="text-xs text-[#D1C9C1] font-semibold">
                Carregando mais momentos do Piramba...
              </span>
            </div>
          ) : !hasMore ? (
            <div className="text-center py-4 space-y-1.5 border-t border-[#221B16] w-full mt-2">
              <p className="text-xs text-[#A89F96]">
                🍻 Você viu todos os momentos recentes do bar!
              </p>
              <Link
                href="/publicar"
                className="inline-flex items-center gap-1.5 text-xs text-[#F5A623] font-bold hover:underline"
              >
                <span>Registrar o seu momento agora</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* STORY VIEWER MODAL */}
      {activeStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm aspect-[9/16] rounded-3xl overflow-hidden bg-[#080706] border border-amber-500/30 shadow-2xl flex flex-col justify-between p-5">
            {/* Story Image */}
            <img
              src={activeStory.storyImage || activeStory.image}
              alt={activeStory.label}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />

            {/* Top Bar: Progress & Close */}
            <div className="relative z-10 space-y-2.5">
              <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-[#F5A623] w-full animate-[progress_5s_linear]" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-[#F5A623] overflow-hidden">
                    <img src={activeStory.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-white block">{activeStory.label}</span>
                    <span className="text-[10px] text-[#C4BCB3]">Piramba Bar • Há pouco</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveStory(null)}
                  className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom: Caption & Quick Reaction */}
            <div className="relative z-10 space-y-3">
              <p className="text-xs text-white font-medium drop-shadow-md">
                {activeStory.caption}
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enviar mensagem para o bar..."
                  className="flex-1 bg-black/60 border border-white/20 rounded-full px-4 py-2 text-xs text-white placeholder-[#8E867E] focus:outline-none focus:border-[#F5A623]"
                />
                <button
                  onClick={() => setActiveStory(null)}
                  className="p-2 rounded-full bg-[#F5A623] text-black font-bold"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONVIDAR PIRAMBEIRO */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Post, Story } from '@/lib/types';
import { MOCK_BAR_POSTS } from '@/lib/mock-data';
import { PostCard } from '@/components/post-card';
import { DeAgoraCameraModal } from '@/components/de-agora-camera-modal';
import { DeAgoraViewerModal } from '@/components/de-agora-viewer-modal';
import { InviteModal } from '@/components/invite-modal';
import {
  Flame,
  ArrowRight,
  Calendar,
  Users,
  Tag,
  Heart,
  Plus,
  Beer,
  Sparkles,
  UserPlus,
  ChevronRight,
  Music,
  Gift,
  Loader2,
  Camera,
  MapPin,
  Bell,
} from 'lucide-react';

// Destaques e Promoções do Restaurante Pirambeira
const PROMO_SLIDES = [
  {
    id: 'happy-hour',
    tag: 'TERÇA É',
    title: 'HAPPY HOUR',
    descPrefix: 'Drinks e cervejas com ',
    highlight: '20% de desconto!',
    when: 'HOJE • 17H–20H',
    link: '/promocoes',
    buttonText: 'VER PROMOÇÃO',
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
    when: 'SEXTA • 19H–23H',
    link: '/eventos',
    buttonText: 'VER PROGRAMAÇÃO',
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
    when: 'QUARTA • ATÉ 22H',
    link: '/promocoes',
    buttonText: 'PEGAR CUPOM',
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
    when: 'SAB & DOM',
    link: '/encontros',
    buttonText: 'JUNTAR MESA',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
    fallback: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=600&q=80',
    badge: 'gift',
  },
];

// Mock de pessoas no bar agora (será substituído por dados reais com check-in)
const MOCK_HERE_NOW = [
  { id: '1', name: 'Ramon', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: '2', name: 'Larissa', avatar: 'https://i.pravatar.cc/150?img=25' },
  { id: '3', name: 'Lucas', avatar: 'https://i.pravatar.cc/150?img=13' },
  { id: '4', name: 'Camila', avatar: 'https://i.pravatar.cc/150?img=32' },
  { id: '5', name: 'Anaga', avatar: 'https://i.pravatar.cc/150?img=47' },
  { id: '6', name: 'Diego', avatar: 'https://i.pravatar.cc/150?img=59' },
];

// Cálculo dinâmico do horário de funcionamento do Restaurante Pirambeira (Pituba)
function getBarStatus() {
  const now = new Date();
  const day = now.getDay(); // 0: Dom, 1: Seg, 2: Ter, 3: Qua, 4: Qui, 5: Sex, 6: Sáb
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentMinutes = hour * 60 + minute;

  // Aberto em horário de madrugada (Sexta e Sábado até 1h)
  if ((day === 6 || day === 0) && hour < 1) {
    return { isOpen: true, closesAt: '01:00', opensAt: null };
  }

  // Quarta e Quinta: 17:00 às 00:00
  if (day === 3 || day === 4) {
    if (currentMinutes >= 17 * 60 && currentMinutes <= 24 * 60) {
      return { isOpen: true, closesAt: '00:00', opensAt: null };
    }
    return { isOpen: false, closesAt: null, opensAt: '17:00' };
  }

  // Sexta: 17:00 às 01:00
  if (day === 5) {
    if (currentMinutes >= 17 * 60) {
      return { isOpen: true, closesAt: '01:00', opensAt: null };
    }
    return { isOpen: false, closesAt: null, opensAt: '17:00' };
  }

  // Sábado: 14:00 às 01:00
  if (day === 6) {
    if (currentMinutes >= 14 * 60) {
      return { isOpen: true, closesAt: '01:00', opensAt: null };
    }
    return { isOpen: false, closesAt: null, opensAt: '14:00' };
  }

  // Domingo: 14:00 às 22:00
  if (day === 0) {
    if (currentMinutes >= 14 * 60 && currentMinutes <= 22 * 60) {
      return { isOpen: true, closesAt: '22:00', opensAt: null };
    }
    return { isOpen: false, closesAt: null, opensAt: '14:00' };
  }

  // Segunda e Terça
  return { isOpen: false, closesAt: null, opensAt: 'quarta às 17:00' };
}

export default function HomePage() {
  const { user } = useAuth();
  const [barStatus, setBarStatus] = useState(() => getBarStatus());

  // Stories dinâmicos
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Carrossel de Promoções
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Feed
  const [posts, setPosts] = useState<Post[]>(MOCK_BAR_POSTS);
  const [visibleCount, setVisibleCount] = useState(2);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 1. Carregar Stories da API
  useEffect(() => {
    async function fetchStories() {
      try {
        setIsLoadingStories(true);
        const data = await apiRequest<Story[]>('/stories/restaurant/pirambeira');
        if (data && data.length > 0) {
          setStories(data);
        }
      } catch (err) {
        console.warn('Erro ao buscar Stories:', err);
      } finally {
        setIsLoadingStories(false);
      }
    }
    fetchStories();
  }, []);

  // 2. Carregar Posts Oficiais do Bar
  useEffect(() => {
    async function fetchPosts() {
      try {
        const data = await apiRequest<Post[]>('/posts/bar/pirambeira');
        if (data && data.length > 0) {
          setPosts(data);
        } else {
          setPosts(MOCK_BAR_POSTS);
        }
      } catch {
        setPosts(MOCK_BAR_POSTS);
      }
    }
    fetchPosts();
  }, []);

  // 3. Atualizar Status Aberto/Fechado a cada minuto
  useEffect(() => {
    const statusTimer = setInterval(() => {
      setBarStatus(getBarStatus());
    }, 60000);
    return () => clearInterval(statusTimer);
  }, []);

  // 4. Rolagem infinita com IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore && hasMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => {
              const next = prev + 1;
              if (next >= posts.length) {
                setHasMore(false);
              }
              return next;
            });
            setIsLoadingMore(false);
          }, 600);
        }
      },
      { threshold: 0.1, rootMargin: '200px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingMore, hasMore, posts.length]);

  // 5. Auto-play do Carrossel de Promoções
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % PROMO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Saudação dinâmica conforme o horário do dia
  const currentHour = new Date().getHours();
  const greetingTime =
    currentHour >= 5 && currentHour < 12
      ? 'Bom dia,'
      : currentHour >= 12 && currentHour < 18
      ? 'Boa tarde,'
      : 'Boa noite,';

  const userFirstName = user?.profile?.name?.split(' ')[0] || 'Pírambeiro';
  const hereCount = 42; // TODO: API de check-in

  return (
    <div className="space-y-0 pb-24 max-w-xl mx-auto">

      {/* ══════════════════════════════════════════
          1. HERO CARD "BOA TARDE, PÍRAMBEIRO!"
          Foto de bar ao fundo · saudação · status · contador · ESTOU AQUI
          ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] shadow-2xl mx-0 mt-0">
        {/* Foto de fundo imersiva */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Gradiente para legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060404]/95 via-[#060404]/80 to-[#060404]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060404]/70 via-transparent to-transparent" />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 p-4 sm:p-5 space-y-3">
          {/* Status do bar */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full inline-block shrink-0 ${
                barStatus.isOpen
                  ? 'bg-emerald-400 indicator-pulse-emerald'
                  : 'bg-neutral-500'
              }`}
            />
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/60">
              {barStatus.isOpen
                ? `Pirambeira Aberto • Fecha às ${barStatus.closesAt}`
                : `Pirambeira Fechado • Abre às ${barStatus.opensAt}`}
            </span>
          </div>

          {/* Saudação grande */}
          <div>
            <p className="text-sm font-semibold text-white/60">{greetingTime}</p>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-[#F5A623] via-[#FFB938] to-[#FFD480] bg-clip-text text-transparent">
                {userFirstName}!
              </span>{' '}
              👋
            </h1>
            <p className="text-sm text-white/55 mt-0.5">
              {barStatus.isOpen
                ? 'Bora viver essa noite? 🍻'
                : `O Pirambeira abre às ${barStatus.opensAt}.`}
            </p>
          </div>

          {/* Contador "Pessoas no bar" + Botão ESTOU AQUI */}
          <div className="flex items-end justify-between gap-3 pt-1">
            <Link
              href="/aqui"
              className="flex items-center gap-2 group"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 indicator-pulse-emerald inline-block shrink-0" />
              <span className="text-[13px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                <span className="text-emerald-400 font-black">{hereCount} pessoas</span>{' '}
                estão no bar agora
              </span>
            </Link>

            <Link
              href="/aqui"
              className="flex items-center gap-2 shrink-0 bg-[#F5A623] hover:bg-[#ffb338] active:scale-95 text-[#080706] font-display font-black text-[13px] px-4 py-2.5 rounded-2xl shadow-lg shadow-amber-500/30 transition-all"
            >
              <MapPin className="w-4 h-4 stroke-[2.5]" />
              <span>ESTOU AQUI</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          ESPAÇAMENTO INTERNO
          ══════════════════════════════════════════ */}
      <div className="px-4 space-y-5 pt-5">

        {/* ══════════════════════════════════════════
            2. STORIES
            ══════════════════════════════════════════ */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-black text-[13px] tracking-widest uppercase text-white/70">
              Stories
            </h2>
            {stories.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveStoryIndex(0);
                  setShowViewerModal(true);
                }}
                className="text-[12px] text-[#F5A623] hover:text-amber-300 font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
              >
                Ver todos
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Fila de Stories */}
          <div
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Seu story (câmera) */}
            <button
              type="button"
              onClick={() => setShowCameraModal(true)}
              className="flex flex-col items-center shrink-0 w-[60px] group cursor-pointer focus:outline-none"
              aria-label="Adicionar story"
            >
              <div className="relative mb-1.5">
                <div className="w-[60px] h-[60px] rounded-full bg-[#1A1410] border-2 border-dashed border-[#F5A623]/60 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera className="w-5 h-5 text-[#F5A623]" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#F5A623] border-2 border-[#080706] flex items-center justify-center text-black">
                  <Plus className="w-3 h-3 stroke-[3]" />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-white/70 truncate w-full text-center">
                Seu story
              </span>
            </button>

            {/* Story Oficial Pirambeira (sempre primeiro se existir) */}
            {stories.filter(s => s.author?.isOfficial).map((story, idx) => (
              <button
                key={story.id}
                type="button"
                onClick={() => { setActiveStoryIndex(idx); setShowViewerModal(true); }}
                className="flex flex-col items-center shrink-0 w-[60px] group cursor-pointer focus:outline-none"
              >
                <div className="relative mb-1.5">
                  {/* Anel gradiente especial para oficial */}
                  <div className="w-[60px] h-[60px] rounded-full p-[2px] group-hover:scale-105 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #F5A623 0%, #ff6b35 50%, #F5A623 100%)' }}
                  >
                    <img
                      src={story.mediaUrl}
                      alt="Pirambeira"
                      className="w-full h-full rounded-full object-cover border-2 border-[#0D0A08]"
                    />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-400 border-2 border-[#0D0A08] flex items-center justify-center">
                    <Sparkles className="w-2.5 h-2.5 text-black fill-black" />
                  </div>
                </div>
                <span className="text-[11px] font-black text-[#F5A623] truncate w-full text-center">
                  Pírambeira
                </span>
              </button>
            ))}

            {/* Stories de usuários */}
            {stories.filter(s => !s.author?.isOfficial).slice(0, 4).map((story, idx) => (
              <button
                key={story.id}
                type="button"
                onClick={() => { setActiveStoryIndex(idx); setShowViewerModal(true); }}
                className="flex flex-col items-center shrink-0 w-[60px] group cursor-pointer focus:outline-none"
              >
                <div className="relative mb-1.5">
                  <div className="w-[60px] h-[60px] rounded-full p-[2px] group-hover:scale-105 transition-transform"
                    style={{ background: 'linear-gradient(135deg, #F5A623, #ea580c)' }}
                  >
                    <img
                      src={story.mediaUrl}
                      alt={story.author.name}
                      className="w-full h-full rounded-full object-cover border-2 border-[#0D0A08]"
                    />
                  </div>
                  {/* Indicador online */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0D0A08]" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 truncate w-full text-center">
                  {story.author.name.split(' ')[0]}
                </span>
              </button>
            ))}

            {/* +N restantes */}
            {stories.filter(s => !s.author?.isOfficial).length > 4 && (
              <button
                type="button"
                onClick={() => { setActiveStoryIndex(0); setShowViewerModal(true); }}
                className="flex flex-col items-center shrink-0 w-[60px] group cursor-pointer focus:outline-none"
              >
                <div className="w-[60px] h-[60px] rounded-full bg-[#1A1410] border-2 border-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-[13px] font-black text-white">
                    +{stories.filter(s => !s.author?.isOfficial).length - 4}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-white/50 mt-1.5">Mais</span>
              </button>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            3. NO PIRAMBEIRA AGORA
            Quem está no bar neste momento
            ══════════════════════════════════════════ */}
        <section className="space-y-3">
          <Link href="/aqui" className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 indicator-pulse-emerald shrink-0" />
              <div>
                <p className="text-[13px] font-black text-emerald-400 uppercase tracking-wider leading-none">
                  No Pirambeira Agora
                </p>
                <p className="text-[11px] text-white/50 mt-0.5">
                  {hereCount} pessoas estão aqui neste momento
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
          </Link>

          {/* Avatares de quem está aqui */}
          <div
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {MOCK_HERE_NOW.map((person) => (
              <Link
                key={person.id}
                href="/aqui"
                className="flex flex-col items-center shrink-0 w-[56px] group"
              >
                <div className="relative mb-1">
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-emerald-400/20 group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#080706]" />
                </div>
                <span className="text-[11px] font-semibold text-white/70 truncate w-full text-center mt-1">
                  {person.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            4. CARD DE PROMOÇÃO / DESTAQUE
            Happy Hour · Eventos · Promoções
            ══════════════════════════════════════════ */}
        {(() => {
          const slide = PROMO_SLIDES[currentPromoIndex];
          return (
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] shadow-2xl group cursor-pointer"
              onClick={() => setCurrentPromoIndex((prev) => (prev + 1) % PROMO_SLIDES.length)}
            >
              {/* Foto de fundo */}
              <img
                key={slide.id}
                src={slide.image}
                alt={slide.title}
                onError={(e) => { e.currentTarget.src = slide.fallback; }}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {/* Overlay escuro para leitura */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Badge de quando */}
              <div className="absolute top-3.5 right-3.5 z-10">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                  <Calendar className="w-3 h-3 text-[#F5A623]" />
                  <span className="text-[10px] font-black text-white tracking-wider">{slide.when}</span>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="relative z-10 p-4 sm:p-5 space-y-2">
                <span className="text-[10px] font-black text-[#F5A623] uppercase tracking-widest block">
                  {slide.tag}
                </span>
                <h3 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight leading-none">
                  {slide.title}
                </h3>
                <p className="text-[13px] text-white/70">
                  {slide.descPrefix}
                  <span className="text-[#F5A623] font-black">{slide.highlight}</span>
                </p>

                <div className="flex items-center justify-between pt-2">
                  <Link
                    href={slide.link}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 bg-[#F5A623] hover:bg-[#ffb338] text-[#080706] font-display font-black text-[12px] px-4 py-2 rounded-xl shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
                  >
                    <span>{slide.buttonText}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </Link>

                  {/* Dots de paginação */}
                  <div className="flex items-center gap-1.5">
                    {PROMO_SLIDES.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setCurrentPromoIndex(idx); }}
                        className={`transition-all duration-300 rounded-full cursor-pointer ${
                          currentPromoIndex === idx
                            ? 'w-4 h-1.5 bg-[#F5A623]'
                            : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/60'
                        }`}
                        aria-label={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════
            5. ATALHOS RÁPIDOS — 3 CHIPS LARGOS
            Quem está aqui · Eventos · Promoções
            ══════════════════════════════════════════ */}
        <div className="space-y-2">
          {/* Quem está aqui */}
          <Link
            href="/aqui"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#111009] border border-white/[0.07] hover:border-emerald-500/30 hover:bg-[#141210] transition-all group active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Users className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white leading-none">Quem está aqui</p>
              <p className="text-[11px] text-white/40 mt-0.5">Convide seus amigos</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 transition-colors" />
          </Link>

          {/* Eventos */}
          <Link
            href="/eventos"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#111009] border border-white/[0.07] hover:border-amber-500/30 hover:bg-[#141210] transition-all group active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Calendar className="w-4.5 h-4.5 text-[#F5A623]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white leading-none">Eventos</p>
              <p className="text-[11px] text-white/40 mt-0.5">Não perca nada</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors" />
          </Link>

          {/* Promoções */}
          <Link
            href="/promocoes"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#111009] border border-white/[0.07] hover:border-amber-500/30 hover:bg-[#141210] transition-all group active:scale-[0.98]"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Tag className="w-4.5 h-4.5 text-[#F5A623]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-white leading-none">Promoções</p>
              <p className="text-[11px] text-white/40 mt-0.5">Ofertas exclusivas</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors" />
          </Link>
        </div>

        {/* ══════════════════════════════════════════
            6. O QUE ESTÁ ROLANDO — FEED OFICIAL DO BAR
            ══════════════════════════════════════════ */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#F5A623] fill-[#F5A623]" />
              <h2 className="font-display font-black text-[15px] text-white tracking-tight">
                O que está rolando
              </h2>
            </div>
            <Link
              href="/feed"
              className="text-[12px] text-[#F5A623] hover:text-amber-300 font-bold flex items-center gap-0.5 transition-colors"
            >
              Ver mais
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Feed de Postagens */}
          <div className="space-y-4">
            {posts.slice(0, visibleCount).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Sentinel de Rolagem Infinita */}
          <div ref={sentinelRef} className="py-2 flex flex-col items-center justify-center">
            {isLoadingMore ? (
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#120F0D] border border-amber-500/20">
                <Loader2 className="w-4 h-4 text-[#F5A623] animate-spin" />
                <span className="text-xs text-white/60 font-semibold">
                  Carregando mais...
                </span>
              </div>
            ) : !hasMore ? (
              <div className="text-center py-5 space-y-3 border-t border-white/[0.05] w-full mt-2">
                <p className="text-xs font-bold text-white/50">
                  É isso aí por hoje! 🍻
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Link
                    href="/feed"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-[#F5A623] font-bold hover:bg-amber-500/20 transition-all"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Feed da Galera</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/paquera"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-bold hover:bg-rose-500/20 transition-all"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Paquera</span>
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </section>

      </div>{/* fim .px-4 */}

      {/* MODAIS */}
      <DeAgoraCameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onStoryCreated={(newStory) => {
          setStories((prev) => [newStory, ...prev]);
          setActiveStoryIndex(0);
          setShowViewerModal(true);
        }}
      />

      <DeAgoraViewerModal
        isOpen={showViewerModal}
        stories={stories}
        initialIndex={activeStoryIndex}
        onClose={() => setShowViewerModal(false)}
      />

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}

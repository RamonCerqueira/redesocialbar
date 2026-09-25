'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Post, Story, Patron } from '@/lib/types';
import { SponsoredCard } from '@/components/sponsored-card';
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
  Plus,
  ChevronRight,
  Loader2,
  Camera,
  MapPin,
  Crown,
} from 'lucide-react';


export default function HomePage() {
  const { user, activeCheckIn, setActiveCheckIn } = useAuth();

  // Estados de Check-in (Mostra ESTRITAMENTE APENAS usuários que fizeram check-in)
  const [checkedInPatrons, setCheckedInPatrons] = useState<Patron[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isProcessingCheckIn, setIsProcessingCheckIn] = useState(false);

  // Stories dinâmicos
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoadingStories, setIsLoadingStories] = useState(true);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  // Carrossel de Promoções
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Feed
  const [posts, setPosts] = useState<Post[]>([]);
  const [visibleCount, setVisibleCount] = useState(2);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // 1. Sincronizar status de check-in do usuário logado
  useEffect(() => {
    setIsCheckedIn(Boolean(activeCheckIn));
  }, [activeCheckIn]);

  // 2. Carregar Lista de Usuários que fizeram check-in
  useEffect(() => {
    async function fetchCheckedInPatrons() {
      try {
        const data = await apiRequest<{ totalActivePatrons: number; patrons: Patron[] }>(
          '/check-ins/who-is-here/pirambeira?filter=all',
        );
        if (data && data.patrons && data.patrons.length > 0) {
          // Filtra estritamente apenas quem tem check-in ativo
          const validPatrons = data.patrons.filter((p) => Boolean(p.checkInId));
          setCheckedInPatrons(validPatrons);
          setActiveCount(data.totalActivePatrons || validPatrons.length);
        }
      } catch {
        // Modo offline / mock inicial: já configurado com INITIAL_CHECKED_IN_PATRONS
      }
    }
    fetchCheckedInPatrons();
  }, []);

  // 3. Carregar Stories da API
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

  // 4. Carregar Posts Oficiais do Bar
  useEffect(() => {
    async function fetchPosts() {
      try {
        const data = await apiRequest<Post[]>('/posts/bar/pirambeira');
        if (data && data.length > 0) {
          setPosts(data);
        } else {
          setPosts([]);
        }
      } catch {
        setPosts([]);
      }
    }
    fetchPosts();
  }, []);

  // 6. Rolagem infinita do Feed
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

  // Função para realizar Check-in Instantâneo ao clicar em "ESTOU AQUI"
  const handleToggleCheckIn = async () => {
    if (!user) { window.location.href = '/login'; return; }
    if (isCheckedIn) {
      const confirmCheckout = window.confirm('Deseja encerrar seu check-in no Pírambeira?');
      if (confirmCheckout) {
        setIsProcessingCheckIn(true);
        try {
          await apiRequest('/check-ins/checkout', { method: 'POST' });
        } catch (error) {
          alert(error instanceof Error ? error.message : 'Falha ao sair.');
          setIsProcessingCheckIn(false);
          return;
        }
        setIsCheckedIn(false);
        setActiveCheckIn(null);
        setCheckedInPatrons((prev) => prev.filter((p) => p.userId !== (user?.id || 'me-current')));
        setActiveCount((prev) => Math.max(0, prev - 1));
        setIsProcessingCheckIn(false);
      }
      return;
    }

    setIsProcessingCheckIn(true);
    try {
      const data = await apiRequest<any>('/check-ins', {
        method: 'POST',
        body: JSON.stringify({
          restaurantSlug: 'pirambeira',
          approxLatitude: -13.0031,
          approxLongitude: -38.4554,
        }),
      });
      setActiveCheckIn(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao fazer check-in.');
      setIsProcessingCheckIn(false);
      return;
    }

    // Confetti comemorativo de boas-vindas ao bar
    try {
      const confetti = (await import('canvas-confetti')).default;
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch {}

    setIsCheckedIn(true);
    setActiveCount((prev) => prev + 1);

    // Insere o usuário imediatamente no topo da seção "NO PIRAMBEIRA AGORA"
    const myPatron: Patron = {
      checkInId: 'chk-' + Date.now(),
      userId: user?.id || 'me-current',
      name: user?.profile?.name?.split(' ')[0] || 'Você',
      username: user?.profile?.username || 'voce',
      avatarUrl:
        user?.profile?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      startedAt: new Date().toISOString(),
      interests: [],
      checkInCount: 1,
      showInFlirtRadar: false,
      timePresentMinutes: 0,
    };

    setCheckedInPatrons((prev) => [myPatron, ...prev.filter((p) => p.userId !== myPatron.userId)]);
    setIsProcessingCheckIn(false);
  };


  return (
    <div className="w-full max-w-[430px] mx-auto pb-24 space-y-0">

      {/* ══════════════════════════════════════════
          1. WELCOME HERO (Exact JSON Spec: h-150px, margin 12px 18px 18px, rounded-22px)
          ══════════════════════════════════════════ */}
      <div className="mx-[18px] mt-3 mb-[18px]">
        <div className="relative h-[150px] overflow-hidden rounded-[22px] border border-white/[0.12] bg-[#12100E]/75 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(255,184,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.12)]">
          {/* Foto de fundo de brinde com iluminação noturna */}
          <div className="absolute inset-0 z-0">
            <img
              src="/hero_toasting.jpg"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1000&q=80';
              }}
              alt="Pirambeira Bar"
              className="w-full h-full object-cover object-right"
            />
            {/* Overlay gradiente exato do JSON: linear-gradient(90deg,rgba(0,0,0,.85),rgba(0,0,0,.25)) */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 100%)',
              }}
            />
          </div>

          {/* Conteúdo do Card (padding: 16px) */}
          <div className="relative z-10 p-4 h-full flex flex-col justify-between">
            <div>
              {/* Title com Emoji e cores exatas de REFERENCE.png */}
              <div className="flex items-center gap-1.5">
                <span className="text-lg">👋</span>
                <span className="font-display font-black text-[20px] text-white leading-tight tracking-tight">
                  Boa tarde,
                </span>
              </div>
              <h1 className="font-display font-black text-[21px] text-[#FFB800] leading-tight tracking-tight">
                Pírambeiro!
              </h1>

              {/* Description com 17h em verde */}
              <div className="text-[12px] text-[#AAA49D] font-medium leading-tight mt-1 space-y-0.5">
                <p>
                  O Pirambeira abre às <span className="text-[#00D084] font-bold">17h.</span>
                </p>
                <p>Bora viver essa noite?</p>
              </div>
            </div>

            {/* Live Indicator Pill: 42 pessoas em verde + estão no bar agora */}
            <Link
              href="/aqui"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-[#00D084]/40 shadow-sm group hover:border-[#00D084] transition-colors w-fit"
            >
              <span className="w-2 h-2 rounded-full bg-[#00D084] indicator-pulse-emerald inline-block shrink-0" />
              <span className="text-xs font-bold text-white">
                <span className="text-[#00D084] font-black">{activeCount} pessoas</span>{' '}
                <span className="text-[#AAA49D] font-normal">estão no bar agora</span>
              </span>
            </Link>

            {/* Button: position absolute, right 14, bottom 16, height 42, padding 0 18px, borderRadius 21, bg #FFB800 */}
            <button
              type="button"
              onClick={handleToggleCheckIn}
              disabled={isProcessingCheckIn}
              className={`absolute right-[14px] bottom-[16px] h-[42px] px-[18px] rounded-[21px] font-display font-black text-xs tracking-wider uppercase cursor-pointer active:scale-95 transition-all shadow-[0_0_20px_rgba(255,184,0,0.35)] flex items-center justify-center gap-1.5 ${
                isCheckedIn
                  ? 'bg-[#00D084] text-[#080807]'
                  : 'bg-[#FFB800] hover:bg-[#FFC928] text-[#080807]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 fill-[#080807] stroke-[#080807]" />
              <span>{isCheckedIn ? '✓ ESTOU AQUI' : 'ESTOU AQUI'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          CORPO PRINCIPAL (SPACING 18PX)
          ══════════════════════════════════════════ */}
      <div className="px-[18px] space-y-[18px] pt-4">

        {/* ══════════════════════════════════════════
            2. DE AGORA (Anteriormente Stories)
            ══════════════════════════════════════════ */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#FF7900] rounded-full inline-block" />
              <h2 className="font-display font-black text-xs tracking-widest uppercase text-white">
                DE AGORA
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveStoryIndex(0);
                setShowViewerModal(true);
              }}
              className="text-xs text-[#FFB800] hover:text-[#FFC928] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              Ver todos
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fila de Stories */}
          <div className="flex items-center gap-3.5 overflow-x-auto pb-1.5 scroll-x-hide">
            {/* Seu story (câmera com badge de +) */}
            <button
              type="button"
              onClick={() => setShowCameraModal(true)}
              className="flex flex-col items-center shrink-0 w-[62px] group cursor-pointer focus:outline-none"
              aria-label="Adicionar story"
            >
              <div className="relative mb-1">
                <div className="w-[60px] h-[60px] rounded-full bg-[#161310]/80 backdrop-blur-md border-2 border-dashed border-white/20 group-hover:border-[#FFB800] flex items-center justify-center transition-colors">
                  <Camera className="w-5 h-5 text-white/50 group-hover:text-[#FFB800] transition-colors" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#FFB800] border-2 border-[#080807] flex items-center justify-center text-black shadow-sm">
                  <Plus className="w-3.5 h-3.5 stroke-[3.5]" />
                </div>
              </div>
              <span className="text-[10px] font-medium text-white/90 truncate w-full text-center">
                Seu story
              </span>
            </button>

            {stories.map((story,index)=>(
              <button key={story.id} type="button" onClick={()=>{setActiveStoryIndex(index);setShowViewerModal(true);}} className="flex flex-col items-center shrink-0 w-[62px] gap-1">
                <img src={story.author.avatarUrl || '/LogoPirambeiraSemFundo.png'} alt={story.author.name} className="w-[60px] h-[60px] rounded-full object-cover border-2 border-amber-400"/>
                <span className="text-[10px] truncate w-full">{story.author.name}</span>
              </button>
            ))}
            {!isLoadingStories && !stories.length && <p className="text-xs text-stone-400 py-4">Compartilhe o primeiro momento de hoje.</p>}
          </div>
        </section>

        {/* ══════════════════════════════════════════
            3. NO PIRAMBEIRA AGORA (PeopleNow — Glassmorphism Noturno)
            ══════════════════════════════════════════ */}
        <div className="bg-[#12100E]/75 backdrop-blur-2xl border border-white/[0.08] hover:border-[#00D084]/40 rounded-[22px] p-[15px] space-y-3 shadow-[0_12px_36px_rgba(0,0,0,0.7),0_0_20px_rgba(0,208,132,0.06),inset_0_1px_0_0_rgba(255,255,255,0.08)] mb-5 transition-all duration-300 relative overflow-hidden group">
          <Link href="/aqui" className="flex items-center justify-between group">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00D084]" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00D084] indicator-pulse-emerald shrink-0" />
                  <p className="text-[14px] font-extrabold text-[#00D084] uppercase tracking-wider leading-none">
                    NO PIRAMBEIRA AGORA
                  </p>
                </div>
                <p className="text-[11px] text-[#8E8982] mt-1">
                  {checkedInPatrons.length > 0
                    ? `${activeCount} ${activeCount === 1 ? 'pessoa está' : 'pessoas estão'} aqui neste momento`
                    : 'Nenhum cliente com check-in no momento'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#FFB800] group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Avatares squircle dos usuários com check-in ativo (52x52, radius 14px, border 2px #FFB800, dot 10x10) */}
          {checkedInPatrons.length === 0 ? (
            <div className="text-center py-4 px-3 bg-[#181512]/80 backdrop-blur-md rounded-xl border border-white/5 space-y-2">
              <p className="text-xs text-[#AAA49D]">Nenhum cliente fez check-in ainda.</p>
              <button
                type="button"
                onClick={handleToggleCheckIn}
                className="text-xs font-bold text-[#FFB800] hover:underline cursor-pointer"
              >
                Seja o primeiro a avisar que chegou! 📍
              </button>
            </div>
          ) : (
            <div className="flex gap-[10px] overflow-x-auto pb-1 mt-3 scroll-x-hide">
              {checkedInPatrons.map((person) => (
                <Link
                  key={person.checkInId || person.userId}
                  href={person.userId === user?.id ? '/perfil' : `/perfil/${person.username}`}
                  className="flex flex-col items-center shrink-0 w-[52px] group"
                >
                  <div className="relative mb-1">
                    <img
                      src={
                        person.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={person.name}
                      className="w-[52px] h-[52px] rounded-[14px] object-cover border-2 border-[#FFB800] group-hover:scale-105 transition-all shadow-md"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-[10px] h-[10px] rounded-[5px] bg-[#00D084] border-2 border-[#0F0F0D]" />
                  </div>
                  <span className="text-[11px] font-medium text-white/90 truncate w-[52px] text-center mt-0.5">
                    {person.name.split(' ')[0]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            4. PROMOTION BANNER (Imagem preenche o card com borda neon e botão por cima)
            ══════════════════════════════════════════ */}
        <SponsoredCard placement="BANNER" />
        <SponsoredCard placement="SIDEBAR" />

        {/* ══════════════════════════════════════════
            5. QUICK ACTIONS (Glassmorphism & Exact REFERENCE.png Layout)
            ══════════════════════════════════════════ */}
        <div className="grid grid-cols-3 gap-2 mb-[22px]">
          {/* Quem está aqui */}
          <Link
            href="/aqui"
            className="flex items-center justify-between p-2.5 rounded-[18px] bg-[#14110E]/75 backdrop-blur-2xl border border-white/[0.08] hover:border-[#FFB800]/40 shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:bg-[#181410]/85 transition-all group active:scale-[0.98] min-h-[68px]"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FFB800]/15 border border-[#FFB800]/30 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-[#FFB800]" />
            </div>
            <div className="flex-1 min-w-0 mx-1.5">
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-bold text-white leading-tight truncate">
                  Quem está aqui
                </p>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D70] shrink-0" />
              </div>
              <p className="text-[9px] text-[#AAA49D] truncate mt-0.5">
                Convide seus amigos
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#FFB800] transition-colors shrink-0" />
          </Link>

          {/* Eventos */}
          <Link
            href="/eventos"
            className="flex items-center justify-between p-2.5 rounded-[18px] bg-[#14110E]/75 backdrop-blur-2xl border border-white/[0.08] hover:border-[#FF2D70]/40 shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:bg-[#181410]/85 transition-all group active:scale-[0.98] min-h-[68px]"
          >
            <div className="w-8 h-8 rounded-xl bg-[#FF2D70]/15 border border-[#FF2D70]/30 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-[#FF2D70]" />
            </div>
            <div className="flex-1 min-w-0 mx-1.5">
              <p className="text-[11px] font-bold text-white leading-tight truncate">
                Eventos
              </p>
              <p className="text-[9px] text-[#AAA49D] truncate mt-0.5">
                Não perca nada
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#FF2D70] transition-colors shrink-0" />
          </Link>

          {/* Promoções */}
          <Link
            href="/promocoes"
            className="flex items-center justify-between p-2.5 rounded-[18px] bg-[#14110E]/75 backdrop-blur-2xl border border-white/[0.08] hover:border-[#E52532]/40 shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:bg-[#181410]/85 transition-all group active:scale-[0.98] min-h-[68px]"
          >
            <div className="w-8 h-8 rounded-xl bg-[#E52532]/15 border border-[#E52532]/30 flex items-center justify-center shrink-0">
              <Tag className="w-4 h-4 text-[#E52532]" />
            </div>
            <div className="flex-1 min-w-0 mx-1.5">
              <p className="text-[11px] font-bold text-white leading-tight truncate">
                Promoções
              </p>
              <p className="text-[9px] text-[#AAA49D] truncate mt-0.5">
                Ofertas exclusivas
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#E52532] transition-colors shrink-0" />
          </Link>
        </div>

        {/* ══════════════════════════════════════════
            6. O QUE ESTÁ ROLANDO — FEED OFICIAL DO BAR
            ══════════════════════════════════════════ */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#FF7900] fill-[#FF7900]" />
              <h2 className="font-display font-black text-xs uppercase tracking-wider text-white">
                O QUE ESTÁ ROLANDO
              </h2>
            </div>
            <Link
              href="/feed"
              className="text-xs text-[#FFB800] hover:text-[#FFC928] font-bold flex items-center gap-1 transition-colors"
            >
              Ver mais
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Feed de Postagens */}
          <div className="space-y-3.5">
            {posts.slice(0, visibleCount).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Sentinel de Rolagem Infinita */}
          <div ref={sentinelRef} className="py-2 flex flex-col items-center justify-center">
            {isLoadingMore ? (
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#12110F] border border-white/10">
                <Loader2 className="w-4 h-4 text-[#FFB800] animate-spin" />
                <span className="text-xs text-[#AAA49D] font-medium">
                  Carregando mais...
                </span>
              </div>
            ) : !hasMore ? (
              <div className="text-center py-4 space-y-2 border-t border-white/[0.06] w-full mt-2">
                <p className="text-xs font-bold text-[#AAA49D]">
                  É isso aí por hoje! 🍻
                </p>
              </div>
            ) : null}
          </div>
        </section>

      </div>

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

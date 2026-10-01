'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { loadAllMoments, unseenFirst } from '@/lib/de-agora';
import { Post, Story, Patron, Promotion, CheckIn } from '@/lib/types';
import { SponsoredCard } from '@/components/sponsored-card';
import { PostCard } from '@/components/post-card';
import { DeAgoraCameraModal } from '@/components/de-agora-camera-modal';
import { DeAgoraViewerModal } from '@/components/de-agora-viewer-modal';
import { Flame, ArrowRight, CalendarDays, Ticket, Plus, ChevronRight, Loader2, MapPin, Camera, Users } from 'lucide-react';
import './home.css';
import { PromotionFeature } from '@/components/promotion-feature';

export default function HomePage() {
  const { user, activeCheckIn, setActiveCheckIn } = useAuth();
  const [patrons, setPatrons] = useState<Patron[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [stories, setStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [cover, setCover] = useState('/hero-brinde-v2.png');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [camera, setCamera] = useState(false);
  const [viewer, setViewer] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [viewerStories, setViewerStories] = useState<Story[]>([]);
  const closeViewer = useCallback(() => setViewer(false), []);
  const [greeting, setGreeting] = useState('Boas-vindas,');
  const [visiblePosts, setVisiblePosts] = useState(3);
  const STORAGE_KEY = `tonopiramba:de-agora:pirambeira:${user?.id || 'guest'}`;
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());

  // Carrossel
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr: unknown = raw ? JSON.parse(raw) : [];
      setViewedStories(new Set(Array.isArray(arr) ? arr.filter((id): id is string => typeof id === 'string') : []));
    } catch { setViewedStories(new Set()); }
  }, [STORAGE_KEY]);

  const markViewed = useCallback((storyId: string) => {
    setViewedStories(prev => {
      if (prev.has(storyId)) return prev;
      const next = new Set(prev);
      next.add(storyId);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next).slice(-5000))); } catch { }
      }
      return next;
    });
  }, [STORAGE_KEY]);

  const sortedStories = useMemo(() => unseenFirst(stories, viewedStories), [stories, viewedStories]);
  const checkedIn = activeCheckIn?.restaurant?.slug === 'pirambeira';

  // Slides do carrossel — 3 slides temáticos
  const slides = useMemo(() => [
    {
      image: cover,
      eyebrow: greeting,
      title: user?.profile?.name?.split(' ')[0] || 'Pírambeiro',
      sub: 'Sua mesa, seus encontros.\nBora curtir essa noite?',
      accent: '#ffc04f',
      cta: null,
      position: '65% center',
    },
    {
      image: '/pirambeira_night_crowd.jpg',
      eyebrow: '🍺 Hoje no Pirambeira',
      title: `${activeCount > 0 ? activeCount : 'Várias'} pessoas`,
      sub: 'estão por aqui agora.\nVenha fazer parte!',
      accent: '#41e995',
      cta: { label: 'Quem está aqui →', href: '/aqui' },
      position: 'center center',
    },
    {
      image: '/happy_hour_banner_full.png',
      eyebrow: '❤️ Mural da Paquera',
      title: 'Deixe um recadinho',
      sub: 'Encontre alguém especial\nnessa noite.',
      accent: '#ff6faa',
      cta: { label: 'Ir para Paquera →', href: '/paquera' },
      position: 'center 40%',
    },
  ], [cover, greeting, user, activeCount]);

  // Auto-play
  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setSlide(s => (s + 1) % slides.length);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, slides.length]);

  function goTo(idx: number) {
    setSlide(idx);
    // Reset timer
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!paused) {
      intervalRef.current = setInterval(() => setSlide(s => (s + 1) % slides.length), 5000);
    }
  }

  const loadPatrons = useCallback(async () => {
    const data = await apiRequest<{ totalActivePatrons: number; patrons: Patron[] }>('/check-ins/who-is-here/pirambeira?filter=all');
    setPatrons(data.patrons); setActiveCount(data.totalActivePatrons);
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const results = await Promise.allSettled([
      loadPatrons(),
      loadAllMoments(cursor => apiRequest<Story[]>(`/stories/restaurant/pirambeira${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`)).then(setStories),
      apiRequest<Post[]>('/posts/bar/pirambeira').then(setPosts),
      apiRequest<Promotion[]>('/promotions/restaurant/pirambeira').then(setPromotions),
      apiRequest<{ coverUrl?: string }>('/restaurants/pirambeira').then(data => { if (data.coverUrl) setCover(data.coverUrl); }),
    ]);
    if (results.some(result => result.status === 'rejected')) setError('Não foi possível atualizar parte da página.');
    setLoading(false);
  }, [loadPatrons]);

  useEffect(() => {
    void load();
    const hour = Number(new Intl.DateTimeFormat('pt-BR', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Bahia' }).format(new Date()));
    setGreeting(hour < 12 ? 'Bom dia,' : hour < 18 ? 'Boa tarde,' : 'Boa noite,');
  }, [load, user?.id]);

  async function toggleCheckIn() {
    if (!user) { window.location.href = '/login'; return; }
    if (checkedIn && !window.confirm('Deseja encerrar seu check-in no Pirambeira?')) return;
    setProcessing(true); setError('');
    try {
      if (checkedIn) { await apiRequest('/check-ins/checkout', { method: 'POST' }); setActiveCheckIn(null); }
      else { const result = await apiRequest<CheckIn>('/check-ins', { method: 'POST', body: JSON.stringify({ restaurantSlug: 'pirambeira' }) }); setActiveCheckIn(result); }
      await loadPatrons();
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível atualizar seu check-in.'); }
    finally { setProcessing(false); }
  }

  const promotion = promotions.find(item => item.isAvailable);
  const current = slides[slide];

  return <div className="piramba-home">
    {error && <div role="alert" className="home-error">{error}<button onClick={() => void load()}>Tentar novamente</button></div>}

    {/* ===== HERO CARROSSEL ===== */}
    <section
      className="home-hero"
      aria-labelledby="welcome-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) goTo((slide + (dx < 0 ? 1 : -1) + slides.length) % slides.length);
        touchStartX.current = null;
      }}
    >
      {/* Slides — crossfade via opacity */}
      {slides.map((s, i) => (
        <div
          key={i}
          className={`home-slide ${i === slide ? 'home-slide--active' : ''}`}
          aria-hidden={i !== slide}
        >
          <img
            src={s.image}
            alt=""
            className={`home-slide-img ${i === slide ? 'home-slide-img--zoom' : ''}`}
            style={{ objectPosition: s.position }}
          />
          <div className="home-hero-shade" />
          {/* Glow colorido por slide */}
          <div
            className="home-slide-glow"
            style={{ background: `radial-gradient(ellipse 70% 60% at 15% 80%, ${s.accent}22 0%, transparent 70%)` }}
          />
        </div>
      ))}

      {/* Conteúdo — sempre por cima */}
      <div className="home-hero-content">
        <div className="home-welcome">
          <p style={{ color: current.accent }}>{current.eyebrow}</p>
          <h1 id="welcome-title" style={{ color: current.accent === '#ffc04f' ? '#ffc04f' : '#ffffff' }}>
            {current.title}!
          </h1>
          <span style={{ whiteSpace: 'pre-line' }}>{current.sub}</span>
          {current.cta && (
            <Link href={current.cta.href} className="home-hero-cta" style={{ borderColor: `${current.accent}55`, color: current.accent }}>
              {current.cta.label}
            </Link>
          )}
        </div>

        {/* Bottom row: presença + check-in (só no slide 0) */}
        <div className="home-hero-bottom">
          <Link href="/aqui" className="home-presence">
            <i />
            <span>
              <strong>{loading ? '…' : activeCount}</strong>
              <span> no bar</span>
            </span>
          </Link>
          <button
            onClick={toggleCheckIn}
            disabled={processing}
            className={'home-checkin' + (checkedIn ? ' is-present' : '')}
          >
            {processing ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
            <span>{checkedIn ? 'ESTOU AQUI ✓' : 'ESTOU AQUI'}</span>
          </button>
        </div>

        {/* Indicadores de slide */}
        <div className="home-carousel-dots" role="tablist" aria-label="Slides do hero">
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === slide}
              aria-label={`Slide ${i + 1}`}
              className={`home-carousel-dot ${i === slide ? 'home-carousel-dot--active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      </div>
    </section>

    <section aria-labelledby="deagora-title"><div className="home-section-heading"><h2 id="deagora-title"><span className="home-dash" />DE AGORA</h2></div>
      <div className="home-stories"><button className="home-story" onClick={() => user ? setCamera(true) : window.location.assign('/login')} aria-label="Publicar no DE AGORA"><span className="home-story-ring own"><Camera size={26} /><i><Plus size={15} /></i></span><span>Seu momento</span></button>
        {sortedStories.map((story, index) => <button className="home-story" key={story.id} aria-label={`DE AGORA de ${story.author.name}${viewedStories.has(story.id) ? ', visto' : ''}`} onClick={() => { setViewerStories([...sortedStories]); setStoryIndex(index); setViewer(true); }}><span className={'home-story-ring' + (viewedStories.has(story.id) ? ' is-viewed' : '')}><img src={story.author.avatarUrl || '/LogoPirambeiraSemFundo.png'} alt="" /></span><span>{story.author.name}</span></button>)}
        {!sortedStories.length && <p className="home-muted">{loading ? 'Carregando momentos…' : 'A noite começa com você. Compartilhe um momento.'}</p>}
      </div>
    </section>

    <section className="home-people">
      <div className="home-people-heading">
        <h2><i />No Pirambeira agora</h2>
        <Link href="/aqui" className="home-people-see-all">Ver todos <ChevronRight size={14} /></Link>
      </div>
      <div className="home-patrons">{patrons.slice(0, 10).map(person => <Link href={`/perfil/${person.username}`} key={person.checkInId} className="home-patron"><span><img src={person.avatarUrl || '/LogoPirambeiraSemFundo.png'} alt="" /><i /></span><span>{person.name.split(' ')[0]}</span></Link>)}
        {!loading && !patrons.length && <p className="home-muted">{checkedIn ? 'Seu check-in está ativo. Sua visibilidade segue as preferências do seu perfil.' : 'Chegou? Faça check-in e encontre sua turma.'}</p>}
      </div>
    </section>

    {promotion && <PromotionFeature promotion={promotion} />}
    <SponsoredCard placement="BANNER" />

    <div className="home-shortcuts">
      <Link href="/aqui"><span className="shortcut-icon people"><Users /></span><div><strong>Quem está aqui</strong><small>Encontre sua turma</small></div><ChevronRight size={15} /></Link>
      <Link href="/eventos"><span className="shortcut-icon events"><CalendarDays /></span><div><strong>Eventos</strong><small>Não perca nada</small></div><ChevronRight size={15} /></Link>
      <Link href="/promocoes"><span className="shortcut-icon offers"><Ticket /></span><div><strong>Promoções</strong><small>Ofertas da casa</small></div><ChevronRight size={15} /></Link>
    </div>
    <section><div className="home-section-heading"><h2><Flame size={20} className="text-orange-400" />O que está rolando</h2><Link href="/feed">Ver mais <ArrowRight size={15} /></Link></div>
      <div className="space-y-4">{posts.slice(0, visiblePosts).map(post => <PostCard key={post.id} post={post} />)}</div>
      {!loading && !posts.length && <div className="home-feed-empty"><Flame size={24} /><p>As novidades da casa aparecem aqui.</p><Link href="/feed">Explorar o feed <ArrowRight size={14} /></Link></div>}
      {posts.length > visiblePosts && <button className="home-load-more" onClick={() => setVisiblePosts(value => value + 3)}>Ver mais publicações</button>}
    </section>
    <SponsoredCard placement="SIDEBAR" />
    <DeAgoraCameraModal isOpen={camera} onClose={() => setCamera(false)} onStoryCreated={story => { setStories(previous => [story, ...previous]); setViewerStories([story, ...sortedStories]); setCamera(false); setStoryIndex(0); setViewer(true); }} />
    {viewer && <DeAgoraViewerModal isOpen stories={viewerStories} initialIndex={storyIndex} onViewed={markViewed} onClose={closeViewer} />}
  </div>;
}

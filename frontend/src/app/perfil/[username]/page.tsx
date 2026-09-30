'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Grid3X3, Layers, LogOut, MapPin, Pencil, ShieldAlert, X } from 'lucide-react';
import { apiRequest, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ReportModal } from '@/components/report-modal';
import { LoadError } from '@/components/load-error';
import '../profile.css';

type Moment = { id: string; content: string; createdAt: string; likesCount: number; media: string[] };
type Profile = {
  id: string;
  name: string;
  username: string;
  bio: string;
  city: string;
  avatarUrl: string;
  interests: string[];
  isPrivate: boolean;
  isFollowing: boolean;
  activeCheckIn: { restaurantName: string } | null;
  counts: { posts: number; followers: number; following: number };
  recentPosts: Moment[];
};

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = React.use(params);
  const { user, logout, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selected, setSelected] = useState<Moment | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const isMe = user?.id === profile?.id;

  async function load() {
    setLoading(true);
    setError('');
    setMissing(false);
    try {
      const data = await apiRequest<Profile>(`/users/profile/${encodeURIComponent(username)}`);
      setProfile(data);
      setCursor(data.recentPosts.length < data.counts.posts ? data.recentPosts.at(-1)?.id || null : null);
    } catch (err) {
      setProfile(null);
      if (err instanceof ApiError && err.status === 404) setMissing(true);
      else setError(err instanceof Error ? err.message : 'Não foi possível carregar o perfil.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) void load();
  }, [username, user?.id, authLoading]);

  useEffect(() => {
    setSaved(new URLSearchParams(window.location.search).get('saved') === '1');
  }, []);

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => {
      dialog.current?.close();
      document.body.style.overflow = previous;
    };
  }, [selected]);

  async function follow() {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (!profile || busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await apiRequest<{ following: boolean }>(`/users/${profile.id}/follow`, { method: 'POST' });
      setProfile({
        ...profile,
        isFollowing: data.following,
        counts: { ...profile.counts, followers: Math.max(0, profile.counts.followers + (data.following ? 1 : -1)) },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível seguir.');
    } finally {
      setBusy(false);
    }
  }

  async function more() {
    if (!cursor || busy || !profile) return;
    setBusy(true);
    setError('');
    try {
      const data = await apiRequest<{ items: Moment[]; nextCursor: string | null }>(
        `/users/profile/${encodeURIComponent(username)}/posts?cursor=${encodeURIComponent(cursor)}`
      );
      setProfile({
        ...profile,
        recentPosts: [...profile.recentPosts, ...data.items.filter((item) => !profile.recentPosts.some((p) => p.id === item.id))],
      });
      setCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar mais fotos.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-page flex flex-col gap-6 animate-pulse px-4 py-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full skeleton-shimmer" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 skeleton-shimmer" />
            <div className="h-3 w-24 skeleton-shimmer" />
          </div>
        </div>
        <div className="h-14 w-full skeleton-shimmer" />
        <div className="grid grid-cols-3 gap-2">
          <div className="aspect-square skeleton-shimmer" />
          <div className="aspect-square skeleton-shimmer" />
          <div className="aspect-square skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (missing) {
    return (
      <div className="profile-empty mx-4 my-8">
        <h1 className="text-xl font-bold text-white mb-1">Perfil indisponível</h1>
        <p className="text-sm text-[#A9A5A0]">Esse perfil não foi encontrado ou está temporariamente privado.</p>
        <Link className="profile-button secondary mt-4 inline-flex" href="/">
          Voltar ao início
        </Link>
      </div>
    );
  }

  if (!profile) return <LoadError message={error} retry={load} />;

  const checkInBadge =
    profile.counts.posts >= 15
      ? { label: 'Inimigo do Fim 👑', color: 'bg-amber-400/10 text-amber-400 border-amber-400/40' }
      : profile.counts.posts >= 5
      ? { label: 'Frequentador VIP ✨', color: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/40' }
      : { label: 'Frequentador 🍻', color: 'bg-white/5 text-[#d8cfc0] border-white/10' };

  return (
    <div className="profile-page page-enter-animation pb-24" style={{ paddingLeft: 0, paddingRight: 0 }}>
      <header className="profile-heading sticky top-0 z-20 py-2.5 bg-[#080807]/90 backdrop-blur-md px-4">
        <div className="flex items-center gap-2">
          <span className="profile-handle font-bold text-sm tracking-wide text-white">@{profile.username}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <div className="flex items-center gap-2">
          {isMe ? (
            <button
              className="profile-icon hover:border-amber-400/50 hover:text-amber-400 transition-colors"
              aria-label="Sair da conta"
              onClick={logout}
              title="Sair da conta"
            >
              <LogOut size={17} />
            </button>
          ) : (
            <button
              className="profile-icon hover:border-rose-400/50 hover:text-rose-400 transition-colors"
              aria-label="Denunciar perfil"
              onClick={() => setShowReport(true)}
              title="Denunciar perfil"
            >
              <ShieldAlert size={17} />
            </button>
          )}
        </div>
      </header>

      {saved && isMe && (
        <div role="status" className="profile-notice flex items-center justify-between mx-4 mb-4 animate-bounce-subtle">
          <span>✨ Seu perfil foi atualizado com sucesso!</span>
          <button onClick={() => setSaved(false)} className="text-xs opacity-75 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Hero Full-Bleed — ocupa a largura total sem card */}
      <div className="profile-hero-fullbleed">
        <div className="profile-hero-bg" />
        <div className="profile-hero-orb profile-hero-orb-1" />
        <div className="profile-hero-orb profile-hero-orb-2" />

        <div className="relative z-10 px-5 pt-8 pb-6 flex flex-col items-center text-center">
          {/* Avatar com glow */}
          <div className="profile-hero-avatar-wrap mb-4">
            <div className="profile-hero-avatar-glow" />
            {profile.avatarUrl ? (
              <img
                className="profile-hero-avatar-img"
                src={profile.avatarUrl}
                alt={`Foto de ${profile.name}`}
              />
            ) : (
              <div className="profile-hero-avatar-img profile-hero-avatar-placeholder">
                {profile.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            {profile.activeCheckIn && (
              <span className="profile-hero-online-dot" title="No bar agora" />
            )}
          </div>

          {/* Nome + Badge */}
          <div className="flex items-center gap-2 flex-wrap justify-center mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">{profile.name}</h1>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${checkInBadge.color}`}>
              {checkInBadge.label}
            </span>
          </div>

          {/* Handle */}
          <p className="text-sm text-[#9f9689] mb-2">@{profile.username}</p>

          {/* Check-in ao vivo ou cidade */}
          {profile.activeCheckIn ? (
            <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/15 text-emerald-400 border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              No {profile.activeCheckIn.restaurantName} agora
            </div>
          ) : (
            profile.city && (
              <p className="text-xs text-[#a9a5a0] flex items-center gap-1 mb-3">
                <MapPin size={13} className="text-[#FFB800]" />
                {profile.city}
              </p>
            )
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-[#e8e0d0] leading-relaxed max-w-xs mb-3 opacity-90">
              {profile.bio}
            </p>
          )}

          {/* Interesses */}
          {!!profile.interests?.length && (
            <div className="flex flex-wrap gap-1.5 justify-center mb-4">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-[#FFB800]/10 text-[#f6d48b] border border-[#FFB800]/25 backdrop-blur-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats dentro do hero */}
          <div className="profile-hero-stats">
            <div className="profile-hero-stat">
              <strong>{profile.counts.posts}</strong>
              <span>Momentos</span>
            </div>
            <div className="profile-hero-stat-divider" />
            <div className="profile-hero-stat">
              <strong>{profile.counts.followers}</strong>
              <span>Seguidores</span>
            </div>
            <div className="profile-hero-stat-divider" />
            <div className="profile-hero-stat">
              <strong>{profile.counts.following}</strong>
              <span>Seguindo</span>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="mt-5 w-full max-w-xs">
            {isMe ? (
              <div className="flex gap-3">
                <Link className="profile-button secondary flex-1 active:scale-98 transition-transform" href="/perfil/editar">
                  <Pencil size={15} />
                  Editar perfil
                </Link>
                <Link className="profile-button flex-1 active:scale-98 transition-transform" href="/publicar">
                  <Camera size={16} />
                  Publicar
                </Link>
              </div>
            ) : (
              <button
                id="follow-btn"
                className={`profile-follow-btn w-full active:scale-98 transition-all ${
                  profile.isFollowing ? 'profile-follow-btn--following' : 'profile-follow-btn--default'
                }`}
                disabled={busy}
                onClick={() => void follow()}
              >
                {busy ? (
                  <span className="profile-follow-spinner" />
                ) : profile.isFollowing ? (
                  <>✓ Seguindo</>
                ) : (
                  <>+ Seguir</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <p role="alert" className="profile-error my-3 mx-4">{error}</p>}

      {/* Grid de Fotos e Momentos */}
      <div className="flex items-center justify-between mt-8 mb-3 px-4">
        <h2 className="profile-grid-title flex items-center gap-2 m-0 text-xs font-black tracking-widest text-[#a9a5a0]">
          <Grid3X3 size={16} className="text-[#FFB800]" />
          FOTOS & MOMENTOS NO BAR
        </h2>
        <span className="text-xs text-[#716d68] font-semibold">{profile.recentPosts.length} fotos</span>
      </div>

      {profile.isPrivate && !isMe ? (
        <div className="profile-empty">As publicações deste perfil são privadas.</div>
      ) : profile.recentPosts.length ? (
        <>
          <div className="profile-photo-grid">
            {profile.recentPosts.map((post) => (
              <button
                key={post.id}
                className="profile-tile group active:scale-95 transition-transform cursor-pointer"
                aria-label={`Abrir publicação: ${post.content.slice(0, 70) || 'Foto'}`}
                onClick={() => setSelected(post)}
              >
                {post.media.length ? (
                  <img
                    src={post.media[0]}
                    alt={post.content.slice(0, 100) || 'Foto publicada'}
                    loading="lazy"
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span className="text-xs text-white/90 p-3 leading-relaxed">{post.content}</span>
                )}
                {post.media.length > 1 && <Layers size={16} className="drop-shadow-md" />}
              </button>
            ))}
          </div>
          {cursor && (
            <button
              className="profile-button secondary mt-4 w-full active:scale-98 transition-transform"
              disabled={busy}
              onClick={() => void more()}
            >
              {busy ? 'Carregando mais momentos…' : 'Carregar mais fotos'}
            </button>
          )}
        </>
      ) : (
        <div className="profile-empty">
          <Camera className="mx-auto mb-3 text-[#FFB800]" size={30} />
          <p className="font-semibold text-white">
            {isMe ? 'Seu primeiro momento merece estar aqui.' : 'Ainda não há fotos publicadas.'}
          </p>
          <p className="text-xs text-[#8c8273] mt-1">
            {isMe ? 'Tire uma foto do seu chopp, petisco ou da sua mesa e compartilhe!' : ''}
          </p>
          {isMe && (
            <Link className="profile-button mt-4 inline-flex active:scale-98 transition-transform" href="/publicar">
              Compartilhar uma foto
            </Link>
          )}
        </div>
      )}

      {/* Visualizador de Foto / Modal */}
      <dialog
        className="profile-viewer"
        ref={dialog}
        aria-label="Publicação"
        onCancel={() => setSelected(null)}
        onClose={() => setSelected(null)}
        onClick={(event) => {
          if (event.target === dialog.current) setSelected(null);
        }}
      >
        {selected && (
          <>
            <header>
              <strong>{profile.name}</strong>
              <button aria-label="Fechar publicação" onClick={() => setSelected(null)}>
                <X size={22} />
              </button>
            </header>
            <div className="profile-viewer-images">
              {selected.media.map((url, index) => (
                <img key={url} src={url} alt={`Foto ${index + 1} da publicação`} />
              ))}
            </div>
            {selected.media.length > 1 && (
              <small>Deslize para ver as {selected.media.length} fotos.</small>
            )}
            <p>{selected.content}</p>
            <small>
              {selected.likesCount} curtidas · {new Date(selected.createdAt).toLocaleDateString('pt-BR')}
            </small>
          </>
        )}
      </dialog>

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetType="USER"
        targetId={profile.id}
      />
    </div>
  );
}

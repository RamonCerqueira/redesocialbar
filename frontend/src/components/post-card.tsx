'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { ReportModal } from './report-modal';
import {
  Beer,
  Flame,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  Sparkles,
  MapPin,
  Clock,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Video,
  CheckCircle2,
  Bookmark,
  Crown,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  onPostUpdate?: () => void;
}

export function PostCard({ post, onPostUpdate }: PostCardProps) {
  const { user } = useAuth();
  const [currentReaction, setCurrentReaction] = useState<'CHEERS' | 'FIRE' | 'HEART' | null>(
    (post.userReaction as any) || null,
  );
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);

  // Video playback state - Inicia automaticamente (Instagram-style)
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Inicia o vídeo automaticamente e pausa/toca ao rolar na tela
  useEffect(() => {
    if (!post.isVideo || !videoRef.current) return;
    const videoEl = videoRef.current;

    // Autoplay com mudo ativado (política de navegadores)
    videoEl.muted = isMuted;
    videoEl.play().then(() => setIsPlaying(true)).catch(() => {
      // Navegador aguardando interação do usuário
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoEl.play().then(() => setIsPlaying(true)).catch(() => {});
          } else {
            videoEl.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(videoEl);
    return () => observer.disconnect();
  }, [post.isVideo, isMuted]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const newMuted = !videoRef.current.muted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const duration = videoRef.current.duration || 30;
    const current = videoRef.current.currentTime || 0;
    setVideoProgress((current / duration) * 100);
  };

  const handleReact = async (type: 'CHEERS' | 'FIRE' | 'HEART') => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await apiRequest<{ reacted: boolean; type: string | null }>(
        `/posts/${post.id}/react`,
        {
          method: 'POST',
          body: JSON.stringify({ type }),
        },
      );

      if (res.reacted) {
        if (!currentReaction) setLikesCount((prev) => prev + 1);
        setCurrentReaction(res.type as any);
      } else {
        setLikesCount((prev) => Math.max(0, prev - 1));
        setCurrentReaction(null);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao reagir');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await apiRequest<any>(`/posts/${post.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText }),
      });
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      if (onPostUpdate) onPostUpdate();
    } catch (err: any) {
      alert(err.message || 'Erro ao comentar');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Tô no Piramba - Momento de ${post.author.name}`,
          text: post.content,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isOfficial = post.author.isOfficial || post.isBarOfficial;

  return (
    <article className="rounded-[22px] overflow-hidden border border-white/[0.08] hover:border-[#FFB800]/35 mb-4 transition-all duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.7),0_0_20px_rgba(255,184,0,0.03),inset_0_1px_0_0_rgba(255,255,255,0.08)] bg-[#12100E]/75 backdrop-blur-2xl group relative">
      {/* Altura acompanha o nome e os selos sem encostar nas bordas. */}
      <div className="min-h-[76px] px-4 py-3 flex items-center justify-between gap-3">
        <Link
          href={isOfficial ? '/restaurante/pirambeira' : `/perfil/${post.author.username}`}
          className="flex items-center gap-[9px] group min-w-0 flex-1"
        >
          <div className="relative shrink-0">
            <img
              src={
                post.author.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }
              alt={post.author.name}
              className={`w-[38px] h-[38px] rounded-[19px] object-cover border transition-all shadow-sm ${
                isOfficial
                  ? 'border-[#FFB800] p-0.5 bg-[#11100F] shadow-[0_0_10px_rgba(255,184,0,0.3)]'
                  : 'border-white/10 group-hover:border-[#FFB800]/50'
              }`}
            />
            {(post.author.checkInCount ?? 0) > 3 && !isOfficial && (
              <span className="absolute -bottom-1 -right-1 bg-[#080706] text-[#FFB800] text-[10px] font-black px-1.5 py-0.2 rounded-full border border-[#FFB800]/40">
                🔥{post.author.checkInCount}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-display font-bold text-sm text-white group-hover:text-[#FFB800] transition-colors">
                {post.author.name}
              </h3>
              {isOfficial && (
                <>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#1D9BF0] flex items-center justify-center text-white text-[9px] font-black leading-none shrink-0" title="Verificado">
                    ✓
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-transparent border border-[#FFB800]/40 text-[10px] font-bold text-[#FFB800]">
                    <Crown className="w-2.5 h-2.5 text-[#FFB800] fill-[#FFB800]" />
                    Bar Oficial
                  </span>
                </>
              )}
              {post.type === 'FLIRT' && (
                <span className="text-[10px] bg-rose-500/15 text-rose-400 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Mural da Paquera
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#A6A29D] flex flex-wrap items-center gap-1.5 mt-0.5">
              <span>@{post.author.username}</span>
              <span>•</span>
              <span>2h</span>
              <span>|</span>
              <span className="flex items-center gap-0.5 text-white/70">
                <MapPin className="w-3 h-3 text-[#FFB800]" />
                Pirambeira Bar
              </span>
            </p>
          </div>
        </Link>

        <button
          onClick={() => setShowReport(true)}
          className="p-1.5 text-white/40 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
          title="Opções"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Contexto de mesa / ambiente se houver */}
      {post.flirtContext && (
        <div className="px-4 sm:px-5 pb-2">
          <span className="inline-flex items-center gap-1.5 bg-[#1C1714]/80 backdrop-blur-md text-[#FFB800] text-xs px-2.5 py-1 rounded-xl border border-white/[0.08] font-medium">
            <MapPin className="w-3 h-3 text-[#FFB800]" />
            {post.flirtContext}
          </span>
        </div>
      )}

      {/* 3. Texto / Relato do Momento (acima da mídia conforme mockup) */}
      {post.content && (
        <div className="px-4 sm:px-5 pb-3">
          <p className="text-xs sm:text-sm text-white/95 leading-relaxed whitespace-pre-line font-medium">
            {post.content}
          </p>
        </div>
      )}

      {post.buttonText && post.buttonUrl && <div className="px-4 pb-4"><a href={post.buttonUrl} target="_blank" rel="noopener noreferrer" className="inline-flex bg-amber-400 text-black font-bold rounded-xl px-4 py-2 text-sm">{post.buttonText}</a></div>}

      {/* 4. Mídia Dominante (1 foto ou vídeo curto de 30s exclusivo do bar) */}
      {post.isVideo && post.videoUrl ? (
        /* VÍDEO DO BAR COM CONTROLES INTEGRADOS NO PLAYER */
        <div className="w-full overflow-hidden bg-black">
          <div
            onClick={togglePlay}
            className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black cursor-pointer group overflow-hidden"
          >
            <video
              ref={videoRef}
              src={post.videoUrl}
              poster={post.media?.[0]}
              autoPlay
              playsInline
              loop
              muted={isMuted}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-cover"
            />

            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] transition-opacity">
                <div className="w-14 h-14 rounded-full bg-black/75 border-2 border-[#FFB800] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-amber-500/30">
                  <Play className="w-6 h-6 text-[#FFB800] fill-[#FFB800] ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* Barra de progresso do vídeo */}
          <div className="h-1 bg-[#181614] w-full">
            <div
              className="h-full bg-[#FFB800] transition-all duration-100"
              style={{ width: `${videoProgress}%` }}
            />
          </div>

          <div className="bg-[#0D0C0B]/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-t border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={togglePlay}
                className="w-7 h-7 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-[#FFB800] flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                title={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-[#FFB800]" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-[#FFB800] ml-0.5" />
                )}
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#181614]/80 border border-[#FFB800]/30 backdrop-blur-md">
                <Video className="w-3.5 h-3.5 text-[#FFB800]" />
                <span className="text-[10px] font-black text-[#FFB800] tracking-wide">
                  {post.videoDuration || '0:30'} • VÍDEO DO BAR
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#181614]/80 hover:bg-[#24211D] border border-white/10 text-white transition-all active:scale-95 cursor-pointer shadow-sm backdrop-blur-md"
              title={isMuted ? 'Ativar som' : 'Desativar som'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#A6A29D]" />
                  <span className="text-[11px] font-bold text-[#A6A29D]">Mudo</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#FFB800]" />
                  <span className="text-[11px] font-bold text-[#FFB800]">Com som</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : post.media && post.media.length > 0 ? (
        /* FOTO INDIVIDUAL */
        <div className="post-feed-media">
          <img
            src={post.media[0]}
            alt="Momento no Piramba"
            className="w-full h-full object-contain"
            loading="lazy"
          />
        </div>
      ) : null}

      {/* 5. Ações Sociais (height: 46px, padding: 0 12px, gap: 18px) */}
      <div className="h-[46px] px-3 border-t border-white/[0.06] flex items-center justify-between text-white bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-[18px]">
          {/* Curtir / Coração */}
          <button
            onClick={() => handleReact('HEART')}
            className="flex items-center gap-1.5 group cursor-pointer active:scale-90 transition-transform"
            title="Curtir"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                currentReaction === 'HEART' || likesCount > 0
                  ? 'fill-[#E51D2A] text-[#E51D2A] drop-shadow-[0_0_8px_rgba(229,29,42,0.5)]'
                  : 'text-white/80 group-hover:text-[#E51D2A]'
              }`}
            />
            <span className="text-xs font-bold text-white/90">{likesCount}</span>
          </button>

          {/* Comentários */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 group cursor-pointer active:scale-90 transition-transform"
            title="Comentários"
          >
            <MessageCircle className="w-5 h-5 text-white/80 group-hover:text-white" />
            <span className="text-xs font-bold text-white/90">{comments.length}</span>
          </button>

          {/* Compartilhar */}
          <button
            onClick={handleShare}
            className="text-white/80 hover:text-white cursor-pointer active:scale-90 transition-transform"
            title="Compartilhar"
          >
            <Send className="w-5 h-5 -rotate-45" />
          </button>
        </div>

        {/* Salvar / Bookmark */}
        <button
          onClick={() => {}}
          className="text-white/80 hover:text-[#FFB800] cursor-pointer active:scale-90 transition-transform"
          title="Salvar publicação"
        >
          <Bookmark className="w-5 h-5" />
        </button>
      </div>

      {/* 6. Seção de Comentários Integrada */}
      {showComments && (
        <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-white/[0.06] space-y-3 bg-[#0E0B09]/85 backdrop-blur-2xl">
          {user ? (
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Puxe conversa no bar..."
                className="flex-1 bg-[#181410]/70 backdrop-blur-md border border-white/[0.08] rounded-2xl px-4 py-2 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="p-2 rounded-2xl amber-gradient text-[#080706] font-bold shadow-md glow-amber-sm disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <p className="text-xs text-[#A89F96] text-center py-2">
              <Link href="/login" className="text-amber-400 font-bold underline">
                Acesse sua conta
              </Link>{' '}
              para comentar.
            </p>
          )}

          <div className="space-y-2 pt-1 max-h-56 overflow-y-auto scrollbar-none">
            {comments.length === 0 ? (
              <p className="text-xs text-[#6E655D] text-center py-3">
                Ninguém comentou ainda. Manda uma mensagem pra galera da mesa!
              </p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 text-xs bg-[#16120E]/70 backdrop-blur-md p-2.5 rounded-2xl border border-white/[0.06]">
                  <img
                    src={c.author.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={c.author.name}
                    className="w-7 h-7 rounded-xl object-cover shrink-0 border border-amber-500/30"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#FBF8F5]">{c.author.name}</span>
                      <span className="text-[10px] text-[#6E655D]">
                        {new Date(c.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[#A89F96] mt-0.5 leading-relaxed">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal de Denúncia */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        targetType="POST"
        targetId={post.id}
      />
    </article>
  );
}

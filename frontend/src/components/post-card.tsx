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
    <article className="surface-elevated rounded-3xl overflow-hidden border border-amber-500/15 mb-4 transition-all hover:border-amber-500/30 shadow-xl bg-[#120F0D]">
      {/* 1. Header do Momento: Autor + Contexto do Bar */}
      <div className="p-4 sm:p-5 pb-3 flex items-center justify-between">
        <Link
          href={isOfficial ? '/restaurante/pirambeira' : `/perfil/${post.author.username}`}
          className="flex items-center gap-3 group"
        >
          <div className="relative">
            <img
              src={
                post.author.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              }
              alt={post.author.name}
              className={`w-11 h-11 rounded-2xl object-cover border transition-colors shadow-sm ${
                isOfficial
                  ? 'border-amber-400 p-1 bg-[#1C1714]'
                  : 'border-amber-500/40 group-hover:border-amber-400'
              }`}
            />
            {post.author.checkInCount && post.author.checkInCount > 3 && !isOfficial && (
              <span className="absolute -bottom-1 -right-1 bg-[#080706] text-amber-400 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-amber-500/40">
                🔥{post.author.checkInCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-display font-bold text-sm text-[#FBF8F5] group-hover:text-amber-400 transition-colors">
                {post.author.name}
              </h3>
              {isOfficial && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-[#F5A623]">
                  <CheckCircle2 className="w-3 h-3 text-[#F5A623] fill-amber-500/30" />
                  Bar Oficial
                </span>
              )}
              {post.type === 'FLIRT' && (
                <span className="text-[10px] bg-rose-500/15 text-rose-400 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Mural da Paquera
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#A89F96] flex items-center gap-1.5 mt-0.5">
              <span>@{post.author.username}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <Clock className="w-3 h-3 text-[#6E655D]" />
                {new Date(post.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>•</span>
              <span className="text-amber-400/80">📍 Piramba Bar</span>
            </p>
          </div>
        </Link>

        <button
          onClick={() => setShowReport(true)}
          className="p-1.5 text-[#6E655D] hover:text-[#FBF8F5] rounded-xl hover:bg-[#2C221A] transition-colors"
          title="Opções"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Contexto de mesa / ambiente se houver */}
      {post.flirtContext && (
        <div className="px-4 sm:px-5 pb-2">
          <span className="inline-flex items-center gap-1.5 bg-[#1C1714] text-amber-300 text-xs px-2.5 py-1 rounded-xl border border-amber-500/20 font-medium">
            <MapPin className="w-3 h-3 text-amber-400" />
            {post.flirtContext}
          </span>
        </div>
      )}

      {/* 3. Mídia Dominante (1 foto ou vídeo curto de 30s exclusivo do bar) */}
      {post.isVideo && post.videoUrl ? (
        /* VÍDEO DO BAR COM CONTROLES INTEGRADOS NO PLAYER (NÃO NA FRENTE DO VÍDEO) */
        <div className="w-full overflow-hidden bg-black">
          {/* Tela do Vídeo (Totalmente limpa, sem sobreposições) */}
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

            {/* Play/Pause center overlay button - só aparece se o usuário pausar manualmente */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] transition-opacity">
                <div className="w-14 h-14 rounded-full bg-black/75 border-2 border-[#F5A623] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-amber-500/30">
                  <Play className="w-6 h-6 text-[#F5A623] fill-[#F5A623] ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* Barra de progresso do vídeo */}
          <div className="h-1 bg-[#1A1512] w-full">
            <div
              className="h-full bg-[#F5A623] transition-all duration-100"
              style={{ width: `${videoProgress}%` }}
            />
          </div>

          {/* Barra de Controles do Player: Faz parte do player e não fica na frente do vídeo */}
          <div className="bg-[#0E0B09] px-4 py-2.5 flex items-center justify-between border-t border-[#1C1714]">
            {/* Esquerda: Play/Pause + Badge 30s Vídeo do Bar */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={togglePlay}
                className="w-7 h-7 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-[#F5A623] flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                title={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-[#F5A623]" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-[#F5A623] ml-0.5" />
                )}
              </button>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#18130F] border border-amber-500/30">
                <Video className="w-3.5 h-3.5 text-[#F5A623]" />
                <span className="text-[10px] font-black text-[#F5A623] tracking-wide">
                  {post.videoDuration || '0:30'} • VÍDEO DO BAR
                </span>
              </div>
            </div>

            {/* Direita: Controle de Áudio (Mudo / Com som) */}
            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#18130F] hover:bg-[#221B16] border border-[#2C221A] text-white transition-all active:scale-95 cursor-pointer shadow-sm"
              title={isMuted ? 'Ativar som' : 'Desativar som'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#A89F96]" />
                  <span className="text-[11px] font-bold text-[#A89F96]">Mudo</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span className="text-[11px] font-bold text-[#F5A623]">Com som</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : post.media && post.media.length > 0 ? (
        /* FOTO INDIVIDUAL (1 por vez, não agrupada) */
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-black">
          <img
            src={post.media[0]}
            alt="Momento no Piramba"
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.02]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#120F0D] via-transparent to-transparent opacity-70 pointer-events-none" />
        </div>
      ) : null}

      {/* 4. Texto / Relato do Momento */}
      {post.content && (
        <div className="p-4 sm:p-5 pt-3">
          <p className="text-xs sm:text-sm text-[#FBF8F5] leading-relaxed whitespace-pre-line font-medium">
            {post.content}
          </p>
        </div>
      )}

      {/* 5. Ações Sociais de Bar: Brinde 🍻, Fogo 🔥, Coração ❤️ */}
      <div className="px-4 sm:px-5 py-3 border-t border-[#2C221A] flex items-center justify-between text-xs text-[#A89F96]">
        <div className="flex items-center gap-1.5">
          {/* Tim-tim / Brinde */}
          <button
            onClick={() => handleReact('CHEERS')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-2xl font-bold transition-all active:scale-95 ${
              currentReaction === 'CHEERS'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 glow-amber-sm'
                : 'bg-[#1C1714] hover:bg-[#2C221A] text-[#FBF8F5]'
            }`}
            title="Um brinde! 🍻"
          >
            <Beer className="w-4 h-4 stroke-[2.5]" />
            <span>Brinde</span>
          </button>

          {/* Fogo no bar */}
          <button
            onClick={() => handleReact('FIRE')}
            className={`p-2 rounded-2xl font-bold transition-all active:scale-95 ${
              currentReaction === 'FIRE'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'bg-[#1C1714] hover:bg-[#2C221A] text-[#A89F96]'
            }`}
            title="Bombando! 🔥"
          >
            <Flame className="w-4 h-4" />
          </button>

          {/* Curtir */}
          <button
            onClick={() => handleReact('HEART')}
            className={`p-2 rounded-2xl font-bold transition-all active:scale-95 ${
              currentReaction === 'HEART'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 glow-rose'
                : 'bg-[#1C1714] hover:bg-[#2C221A] text-[#A89F96]'
            }`}
            title="Adorei ❤️"
          >
            <Heart className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-[#A89F96] ml-2">
            {likesCount} {likesCount === 1 ? 'brinde' : 'brindes'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Comentários */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-2xl bg-[#1C1714] hover:bg-[#2C221A] text-[#A89F96] hover:text-[#FBF8F5] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="font-bold">{comments.length}</span>
          </button>

          {/* Compartilhar */}
          <button
            onClick={handleShare}
            className="p-2 rounded-2xl bg-[#1C1714] hover:bg-[#2C221A] text-[#A89F96] hover:text-[#FBF8F5] transition-colors"
            title="Compartilhar"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 6. Seção de Comentários Integrada */}
      {showComments && (
        <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-[#2C221A] space-y-3 bg-[#0E0B09]">
          {user ? (
            <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Puxe conversa no bar..."
                className="flex-1 bg-[#1C1714] border border-[#2C221A] rounded-2xl px-4 py-2 text-xs text-[#FBF8F5] placeholder-[#6E655D] focus:outline-none focus:border-amber-500"
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
                <div key={c.id} className="flex items-start gap-2.5 text-xs bg-[#18130F] p-2.5 rounded-2xl border border-[#2C221A]/60">
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

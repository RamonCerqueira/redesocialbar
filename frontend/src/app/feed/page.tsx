'use client';
import { SponsoredCard } from '@/components/sponsored-card';


import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { LoadError } from '@/components/load-error';
import { PostCard } from '@/components/post-card';
import {
  Flame,
  RotateCw,
  Camera,
  Loader2,
} from 'lucide-react';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPosts = async () => {
    setLoadError('');
    try {
      const data = await apiRequest<Post[]>('/posts/feed/pirambeira');
      if (data && data.length > 0) {
        setPosts(data);
        setHasMore(data.length > visibleCount);
      } else {
        setPosts([]);
        setHasMore(false);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar o feed.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPosts();
  };

  // Rolagem contínua infinita estilo Instagram
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
              if (next >= posts.length) {
                setHasMore(false);
              }
              return next;
            });
            setIsLoadingMore(false);
          }, 450);
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingMore, hasMore, posts.length]);

  return (
    <div className="w-full max-w-[430px] mx-auto pb-6">
      {loadError&&<LoadError message={loadError} retry={()=>void loadPosts()}/>}
      <SponsoredCard />
      {/* 1. Header do Feed estilo Instagram Clean */}
      <div className="flex items-center justify-between gap-3 pt-3 pb-3 px-1 mb-2 border-b border-[#2A231C]">
        <div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-[#FF7900] fill-[#FF7900]" />
            <h1 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight leading-none">
              Explorar
            </h1>
          </div>
          <p className="text-[11px] text-[#A6A29D] mt-1 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D084] indicator-pulse-emerald inline-block" />
            <span>Momentos ao vivo no Pírambeira</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Atualizar */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-9 h-9 rounded-full bg-[#161311] hover:bg-[#201B17] text-[#A6A29D] hover:text-[#FFB800] border border-[#332A20] flex items-center justify-center transition-all cursor-pointer active:scale-90"
            title="Atualizar feed"
            aria-label="Atualizar feed"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#FFB800]' : ''}`}
            />
          </button>

          {/* Botão Publicar */}
          <Link
            href="/publicar"
            className="h-9 px-3.5 rounded-full bg-[#FFB800] hover:bg-[#FFC928] text-[#080807] font-display font-black text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,184,0,0.3)] active:scale-95 transition-all shrink-0"
          >
            <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Publicar</span>
          </Link>
        </div>
      </div>

      {/* 2. Fluxo Contínuo de Postagens (Instagram-style) */}
      {isLoading ? (
        <div className="space-y-4 pt-1">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-[#11100F] rounded-[20px] p-5 h-80 animate-pulse border border-[#30291F]"
            />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-[#11100F] rounded-[20px] p-8 text-center border border-[#30291F] space-y-3 my-6">
          <div className="w-12 h-12 rounded-2xl bg-[#FFB800]/15 text-[#FFB800] flex items-center justify-center mx-auto">
            <Camera className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-white text-base">
              Nenhum momento publicado ainda
            </h3>
            <p className="text-xs text-[#A6A29D] max-w-sm mx-auto leading-relaxed">
              Tirou foto do brinde ou da galera na mesa? Seja o primeiro a registrar a noite no Pírambeira!
            </p>
          </div>

          <Link
            href="/publicar"
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-[#FFB800] hover:bg-[#FFC928] text-[#080807] font-display font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all mt-2"
          >
            <span>Publicar agora</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.slice(0, visibleCount).map((post) => (
            <PostCard key={post.id} post={post} onPostUpdate={loadPosts} />
          ))}

          {/* Sentinel de Rolagem Infinita */}
          <div ref={sentinelRef} className="py-4 flex flex-col items-center justify-center">
            {isLoadingMore ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161311] border border-[#30291F]">
                <Loader2 className="w-3.5 h-3.5 text-[#FFB800] animate-spin" />
                <span className="text-[11px] text-[#A6A29D] font-medium">
                  Carregando mais momentos...
                </span>
              </div>
            ) : !hasMore && posts.length > 2 ? (
              <div className="text-center py-4 space-y-1 border-t border-[#29221B] w-full mt-2">
                <p className="text-xs font-bold text-[#A6A29D]">
                  Você viu todas as novidades por enquanto! 🍻
                </p>
                <p className="text-[11px] text-[#6E6760]">
                  Bora pedir mais uma rodada?
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

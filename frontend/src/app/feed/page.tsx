'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { PostCard } from '@/components/post-card';
import {
  Flame,
  Plus,
  RotateCw,
  Camera,
  Beer,
  Sparkles,
  MapPin,
  Image as ImageIcon,
  Users,
  Video,
} from 'lucide-react';

const FILTER_TAGS = [
  { id: 'all', label: 'Todos', icon: Flame },
  { id: 'videos', label: 'Vídeos (Bar)', icon: Video },
  { id: 'photos', label: 'Fotos', icon: ImageIcon },
  { id: 'friends', label: 'Mesas & Galera', icon: Users },
  { id: 'drinks', label: 'Drinks & Chopp', icon: Beer },
];

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadPosts = async () => {
    try {
      const data = await apiRequest<Post[]>('/posts/feed/pirambeira');
      setPosts(data);
    } catch (err) {
      console.error('Erro ao carregar feed:', err);
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

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'videos') return Boolean(post.isVideo);
    if (activeFilter === 'photos') return post.media && post.media.length > 0 && !post.isVideo;
    if (activeFilter === 'friends') {
      return (
        post.content.toLowerCase().includes('amig') ||
        post.content.toLowerCase().includes('mesa') ||
        post.content.toLowerCase().includes('@')
      );
    }
    if (activeFilter === 'drinks') {
      return (
        post.content.toLowerCase().includes('drink') ||
        post.content.toLowerCase().includes('chopp') ||
        post.content.toLowerCase().includes('cerveja')
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-14">
      {/* 1. Header do Feed com Botão de Publicar */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-[#F5A623] fill-[#F5A623]" />
            <h1 className="font-display font-black text-2xl text-white tracking-tight">
              Feed do Piramba
            </h1>
          </div>
          <p className="text-xs text-[#A89F96] mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 indicator-pulse-emerald inline-block" />
            <span>Momentos ao vivo no Restaurante Pirambeira</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Atualizar Feed */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-2xl bg-[#18130F] hover:bg-[#221B16] text-[#A89F96] hover:text-white border border-[#2C221A] transition-all cursor-pointer active:scale-95"
            title="Atualizar feed"
            aria-label="Atualizar feed"
          >
            <RotateCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#F5A623]' : ''}`}
            />
          </button>

          {/* Botão Registrar Momento */}
          <Link
            href="/publicar"
            className="py-2.5 px-3.5 sm:px-4 rounded-2xl bg-[#F5A623] hover:bg-[#ffb338] text-[#080706] font-display font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 active:scale-95 transition-all shrink-0"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
            <span>Publicar</span>
          </Link>
        </div>
      </div>

      {/* 2. Filtros de Categorias do Feed */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
        {FILTER_TAGS.map((tab) => {
          const isActive = activeFilter === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-[#F5A623] text-[#080706] shadow-md shadow-amber-500/20 font-black'
                  : 'bg-[#120F0D] text-[#A89F96] hover:text-white border border-[#221B16] hover:border-amber-500/30'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Lista de Posts / Momentos */}
      {isLoading ? (
        <div className="space-y-4 pt-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-[#120F0D] rounded-3xl p-5 h-64 animate-pulse border border-[#221B16]"
            />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-[#120F0D] rounded-3xl p-8 sm:p-10 text-center border border-[#221B16] space-y-3 mt-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-[#F5A623] flex items-center justify-center mx-auto">
            <Camera className="w-6 h-6 stroke-[2]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-white text-base">
              Nenhum momento publicado nesta categoria
            </h3>
            <p className="text-xs text-[#A89F96] max-w-sm mx-auto leading-relaxed">
              Tirou foto do brinde ou da galera na mesa? Seja o primeiro a registrar a noite no Piramba!
            </p>
          </div>

          <Link
            href="/publicar"
            className="inline-flex items-center gap-2 py-2.5 px-5 rounded-2xl bg-[#F5A623] hover:bg-[#ffb338] text-[#080706] font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition-all mt-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Publicar agora</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onPostUpdate={loadPosts} />
          ))}
        </div>
      )}
    </div>
  );
}

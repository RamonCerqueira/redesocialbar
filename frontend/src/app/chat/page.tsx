'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Conversation } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { MessageSquare, Sparkles, User, Clock, Heart } from 'lucide-react';

export default function ChatListPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      apiRequest<Conversation[]>('/chat/conversations')
        .then(setConversations)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="surface-elevated rounded-3xl p-8 text-center border border-[#2C221A]">
        <MessageSquare className="w-12 h-12 text-[#6E655D] mx-auto mb-3" />
        <h3 className="font-display font-bold text-[#FBF8F5] text-sm">Acesse sua conta para conversar</h3>
        <p className="text-xs text-[#A89F96] mt-1.5 mb-4 max-w-xs mx-auto">
          O chat privado é liberado após match mútuo ou participação em encontros.
        </p>
        <Link
          href="/login"
          className="py-2.5 px-5 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs uppercase tracking-wider inline-block shadow-md glow-amber-sm"
        >
          Fazer Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="surface-elevated rounded-3xl p-6 sm:p-7 border border-amber-500/20 glow-amber-sm">
        <div className="flex items-center gap-1.5 text-xs font-black text-amber-400 uppercase tracking-widest mb-1.5">
          <MessageSquare className="w-4 h-4" />
          <span>CONVERSAS DESBLOQUEADAS</span>
        </div>
        <h1 className="font-display font-black text-2xl sm:text-3xl text-[#FBF8F5] tracking-tight">
          Mensagens do Bar
        </h1>
        <p className="text-xs text-[#A89F96] mt-1.5 max-w-lg leading-relaxed font-medium">
          Conversas 1-on-1 geradas a partir de Matches mútuos na paquera e salas das mesas comunitárias.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="surface-ambient rounded-3xl p-4 h-20 animate-pulse border border-amber-500/10" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="surface-ambient rounded-3xl p-10 text-center border border-amber-500/15">
          <Sparkles className="w-12 h-12 text-[#6E655D] mx-auto mb-3" />
          <h3 className="font-display font-bold text-[#FBF8F5] text-sm">Nenhuma conversa ativa ainda</h3>
          <p className="text-xs text-[#A89F96] mt-1.5 max-w-sm mx-auto leading-relaxed">
            Mande um olhar discreto no Mural da Paquera ou puxe uma cadeira nas Mesas Comunitárias!
          </p>
          <Link
            href="/paquera"
            className="inline-flex items-center gap-2 mt-4 py-2.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md glow-rose"
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Ir para o Mural da Paquera</span>
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-[#2C221A] surface-elevated rounded-3xl overflow-hidden border border-amber-500/15">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`/chat/${c.id}`}
              className="flex items-center gap-3.5 p-4 hover:bg-[#1C1714] transition-colors"
            >
              <div className="relative">
                <img
                  src={
                    c.otherUser?.avatarUrl ||
                    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
                  }
                  alt={c.otherUser?.name || 'Frequentador'}
                  className="w-12 h-12 rounded-2xl object-cover border border-amber-500/40"
                />
                {c.type === 'MATCH' && (
                  <span className="absolute -bottom-1 -right-1 bg-rose-600 text-white p-1 rounded-full text-[9px] shadow-sm glow-rose">
                    ✨
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h4 className="font-display font-bold text-sm text-[#FBF8F5] truncate">
                    {c.otherUser?.name || 'Conversa da Mesa'}
                  </h4>
                  {c.lastMessage && (
                    <span className="text-[10px] text-[#6E655D] font-mono">
                      {new Date(c.lastMessage.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#A89F96] truncate">
                  {c.lastMessage ? (
                    c.lastMessage.content
                  ) : (
                    <span className="text-rose-400 font-bold">✨ Deu match no Piramba! Inicie o papo.</span>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

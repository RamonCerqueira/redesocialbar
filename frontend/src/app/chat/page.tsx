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

  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(c =>
    c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24">
      {/* Header: padding 20px 18px 12px */}
      <div className="pt-5 px-[18px] pb-3">
        <h1 className="font-display font-black text-[27px] text-white tracking-tight leading-tight">
          Mensagens
        </h1>
        <p className="text-xs text-[#A9A5A0] mt-0.5 font-medium">
          Conversas privadas de conexões e matches no Piramba
        </p>
      </div>

      {/* Search: margin 0 18px 12px, height 42, borderRadius 21 */}
      <div className="mx-[18px] mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar conversas..."
          className="w-full h-[42px] rounded-[21px] bg-[#11100F] border border-[#302A20] px-4 text-xs text-white placeholder-[#716D68] focus:outline-none focus:border-[#FFB800] transition-colors"
        />
      </div>

      {/* ConversationList: padding 0 18px */}
      <div className="px-[18px]">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] rounded-xl bg-[#11100F] border border-[#201E1B] animate-pulse" />
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="rounded-[20px] bg-[#12110F] border border-[#302A20] p-8 text-center mt-2">
            <Sparkles className="w-10 h-10 text-[#716D68] mx-auto mb-2" />
            <h3 className="font-display font-bold text-white text-sm">Nenhuma conversa encontrada</h3>
            <p className="text-xs text-[#A9A5A0] mt-1">
              Participe do Mural da Paquera para abrir conversas exclusivas!
            </p>
            <Link
              href="/paquera"
              className="inline-flex items-center gap-1.5 mt-4 h-[36px] px-4 rounded-[18px] bg-[#FF2D70] text-white font-bold text-xs shadow-[0_0_15px_rgba(255,45,112,0.3)]"
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Ver Mural da Paquera</span>
            </Link>
          </div>
        ) : (
          <div>
            {filteredConversations.map((c) => (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className="h-[72px] flex items-center gap-3 border-b border-[#201E1B] hover:bg-[#12110F]/60 transition-colors px-1 group"
              >
                {/* Avatar: width 52, height 52, borderRadius 26 */}
                <div className="relative shrink-0">
                  <img
                    src={
                      c.otherUser?.avatarUrl ||
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
                    }
                    alt={c.otherUser?.name || 'Frequentador'}
                    className="w-[52px] h-[52px] rounded-[26px] object-cover border border-[#FFB800]/30 group-hover:border-[#FFB800] transition-colors"
                  />
                  {c.type === 'MATCH' && (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-[#FF2D70] text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] shadow-sm">
                      ✨
                    </span>
                  )}
                </div>

                {/* Content: flex 1, name: 14px 700, message: 12px #858079, time: 10px #77736D */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className="text-[14px] font-bold text-white truncate leading-tight group-hover:text-[#FFB800] transition-colors">
                      {c.otherUser?.name || 'Frequentador'}
                    </h4>
                    <span className="text-[10px] text-[#77736D] shrink-0 font-medium">
                      {c.lastMessage?.createdAt
                        ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '18:42'}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#858079] truncate leading-tight">
                    {c.lastMessage?.content || 'Inicie a conversa agora...'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { AppNotification } from '@/lib/types';
import {
  Bell,
  MapPin,
  ChevronDown,
  X,
  Check,
  Search,
  Beer,
  Heart,
  Music,
  Sparkles,
  ArrowRight,
  Crown,
} from 'lucide-react';

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'PROMO',
    title: 'Terça é Happy Hour! 🍺',
    body: 'Drinks e cervejas artesanais com 20% de desconto hoje no Pirambeira até as 21h.',
    link: '/promocoes',
    isRead: false,
    createdAt: 'Agora há pouco',
  },
  {
    id: 'notif-2',
    type: 'FLIRT',
    title: 'Alguém mandou um olhar 👀',
    body: 'Você recebeu um recadinho discreto no Mural da Paquera vindo da mesa 04.',
    link: '/paquera',
    isRead: false,
    createdAt: 'Há 25 minutos',
  },
  {
    id: 'notif-3',
    type: 'EVENT',
    title: 'Samba no Deck Sexta-Feira 🎶',
    body: 'Roda de samba ao vivo confirmada a partir das 19h! Chopp em dobro até 20h.',
    link: '/eventos',
    isRead: true,
    createdAt: 'Há 2 horas',
  },
];

export function Header() {
  const { user, activeCheckIn } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(DEFAULT_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(2);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      apiRequest<{ unreadCount: number; notifications: AppNotification[] }>('/notifications')
        .then((data) => {
          if (data && data.notifications && data.notifications.length > 0) {
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount ?? data.notifications.filter((n) => !n.isRead).length);
          }
        })
        .catch(() => { });
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
    } catch { }
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <header className="sticky top-0 z-40 h-[72px] bg-[#080807]/90 backdrop-blur-xl border-b border-[rgba(255,184,0,0.12)] px-[18px] py-3 transition-all">
      {/* Glow ambiente sutil superior */}
      <div className="absolute top-0 left-10 w-48 h-10 bg-amber-500/10 blur-2xl pointer-events-none" />

      <div className="max-w-xl mx-auto h-full flex items-center justify-between relative z-10">
        {/* Left: Brand Logo & Title (gap: 10px, logo: 46x46, title: 18px/800, subtitle: 9px/600/1.4px) */}
        <Link href="/" className="flex items-center gap-[10px] group">
          {/* Logo Oficial Sem Fundo */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-[#FFB800]/20 blur-md rounded-full group-hover:bg-[#FFB800]/35 transition-all" />
            <img
              src="/LogoPirambeiraSemFundo.png"
              alt="Pírambeira"
              className="relative w-[46px] h-[46px] object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_2px_12px_rgba(255,184,0,0.35)]"
            />
          </div>

          <div className="flex flex-col">
            <span className="font-display font-extrabold text-[18px] text-[#FFFFFF] leading-tight tracking-tight">
              Pírambeira
            </span>
            <span className="text-[9px] font-semibold tracking-[1.4px] text-[#AAA49C] uppercase">
              BAR & ENCONTROS • SALVADOR
            </span>
          </div>
        </Link>

        {/* Right: Actions (gap: 8px, iconButton: 40x40, border: 1px solid #332F2A, bg: #11100F) */}
        <div className="flex items-center gap-2">
          {/* Botão Busca (Circular 40x40) */}
          <Link
            href="/aqui"
            className="w-10 h-10 rounded-full border border-[#332F2A] bg-[#11100F] text-white flex items-center justify-center transition-all active:scale-90 hover:border-[#FFB800]/40 shadow-sm"
            aria-label="Buscar"
            title="Buscar pessoas e eventos"
          >
            <Search className="w-4 h-4 stroke-[2]" />
          </Link>

          {/* Bell Icon with Red Dot (Circular 40x40) */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-full border border-[#332F2A] bg-[#11100F] text-white flex items-center justify-center transition-all active:scale-90 hover:border-[#FFB800]/40 shadow-sm relative cursor-pointer"
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4 stroke-[2]" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#E52532] border-2 border-[#080807]" />
              )}
            </button>

            {/* Overlay para fechar suavemente ao clicar fora */}
            {showNotifications && (
              <div
                className="fixed inset-0 z-40 bg-black/55 backdrop-blur-xs"
                onClick={() => setShowNotifications(false)}
              />
            )}

            {/* Notifications Popover Modernizado */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] max-w-sm sm:w-96 rounded-[28px] bg-[#14100C]/95 backdrop-blur-2xl border border-amber-500/30 shadow-[0_24px_60px_rgba(0,0,0,0.9),0_0_24px_rgba(245,166,35,0.1)] p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                {/* Header do Popover */}
                <div className="flex items-center justify-between pb-3.5 border-b border-[#2C221A]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#F5A623]">
                      <Bell className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display font-black text-sm text-white tracking-tight leading-none">
                          Notificações
                        </h3>
                        {unreadCount > 0 ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                            {unreadCount} nova{unreadCount === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#A89F96] font-semibold px-2 py-0.5 rounded-full bg-white/[0.04]">
                            Tudo lido
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#A89F96] mt-0.5 block">
                        Novidades e avisos do bar
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[10px] text-[#F5A623] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>Marcar lidas</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowNotifications(false)}
                      className="w-7 h-7 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#A89F96] hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                      aria-label="Fechar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lista de Notificações com Ícones e Design de Alta Qualidade */}
                <div className="divide-y divide-white/[0.05] max-h-84 overflow-y-auto mt-2 space-y-1.5 scrollbar-none pr-0.5">
                  {notifications.map((notif) => {
                    const isPromo = notif.type === 'PROMO';
                    const isFlirt = notif.type === 'FLIRT';
                    const isEvent = notif.type === 'EVENT';

                    return (
                      <Link
                        key={notif.id}
                        href={notif.link || '#'}
                        onClick={() => {
                          // Marca esta como lida
                          setNotifications((prev) =>
                            prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
                          );
                          if (!notif.isRead) {
                            setUnreadCount((c) => Math.max(0, c - 1));
                          }
                          setShowNotifications(false);
                        }}
                        className={`p-3 rounded-2xl flex items-start gap-3 transition-all cursor-pointer group mt-1.5 block ${
                          !notif.isRead
                            ? 'bg-gradient-to-r from-amber-500/[0.14] via-amber-500/[0.04] to-transparent border border-amber-500/30 shadow-sm'
                            : 'bg-white/[0.02] hover:bg-white/[0.06] border border-transparent'
                        }`}
                      >
                        {/* Ícone Estilizado da Notificação */}
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm mt-0.5 ${
                            isPromo
                              ? 'bg-amber-500/20 text-[#F5A623] border border-amber-500/35'
                              : isFlirt
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/35'
                              : isEvent
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/35'
                              : 'bg-white/10 text-white border border-white/20'
                          }`}
                        >
                          {isPromo ? (
                            <Beer className="w-4 h-4 stroke-[2]" />
                          ) : isFlirt ? (
                            <Heart className="w-4 h-4 stroke-[2] fill-rose-500/30" />
                          ) : isEvent ? (
                            <Music className="w-4 h-4 stroke-[2]" />
                          ) : (
                            <Sparkles className="w-4 h-4 stroke-[2]" />
                          )}
                        </div>

                        {/* Textos da Notificação */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <p className="font-bold text-xs text-[#FBF8F5] group-hover:text-[#F5A623] transition-colors line-clamp-1">
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#F5A623] shrink-0 indicator-pulse-amber" />
                            )}
                          </div>

                          <p className="text-[11px] text-[#A89F96] mt-0.5 leading-relaxed line-clamp-2">
                            {notif.body}
                          </p>

                          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/[0.04]">
                            <span className="text-[10px] text-[#7A7067] font-mono">
                              {notif.createdAt}
                            </span>
                            <span className="text-[10px] text-[#F5A623] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                              <span>Ver detalhe</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Footer do Popover */}
                <div className="pt-2.5 mt-2 border-t border-[#2C221A] flex items-center justify-between text-[11px]">
                  <span className="text-[#8E867E]">
                    Pirambeira Bar & Encontros
                  </span>
                  <Link
                    href="/promocoes"
                    onClick={() => setShowNotifications(false)}
                    className="text-[#F5A623] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Ver promoções</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

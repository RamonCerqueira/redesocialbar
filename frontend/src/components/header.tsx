'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { AppNotification } from '@/lib/types';
import { Bell, MapPin, ChevronDown, X, Check, Search } from 'lucide-react';

export function Header() {
  const { user, activeCheckIn } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(1);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      apiRequest<{ unreadCount: number; notifications: AppNotification[] }>('/notifications')
        .then((data) => {
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount || 1);
        })
        .catch(() => { });
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#080706]/95 backdrop-blur-md border-b border-[#221B16]/80 px-4 py-3 transition-all">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Logo Oficial Sem Fundo (Livre de caixas/fundo amarelo) */}
          <img
            src="/LogoPirambeiraSemFundo.png"
            alt="Piramba Bar & Encontros"
            className="w-11 h-11 object-contain shrink-0 group-hover:scale-105 transition-transform drop-shadow-[0_2px_8px_rgba(245,166,35,0.25)]"
          />

          <div className="flex flex-col leading-none">
            <span className="font-display font-black text-xl tracking-tight text-white">
              PIRAMBEIRA
            </span>
            <span className="text-[9px] font-bold tracking-[0.24em] text-[#C4BCB3] mt-0.5">
              BAR & ENCONTROS
            </span>
          </div>
        </Link>

        {/* Right: Location selector & Notifications */}
        <div className="flex items-center gap-2.5">
          {/* Location selector pill */}
          {/* <Link
            href="/restaurante/pirambeira"
            className="flex items-center gap-1.5 bg-[#141210] border border-[#2C241E] hover:border-amber-500/40 px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all active:scale-95"
          >
            <MapPin className="w-3.5 h-3.5 text-[#F5A623] fill-[#F5A623]" />
            <span>Pirambeira</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#A89F96]" />
          </Link> */}

          {/* Botão Explorar (Quem está aqui agora) */}
          <Link
            href="/aqui"
            className="p-1.5 rounded-full text-[#D1C9C1] hover:text-[#F5A623] hover:bg-white/5 transition-colors"
            aria-label="Explorar quem está no bar"
            title="Explorar quem está no bar"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </Link>

          {/* Bell Icon with Yellow Notification Dot */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-full text-white hover:text-amber-400 transition-colors"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5 stroke-[2]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#F5A623] ring-2 ring-[#080706]" />
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 surface-floating rounded-3xl shadow-2xl border border-amber-500/25 p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-[#2C221A]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm text-[#FBF8F5]">Notificações do Bar</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                        {unreadCount} novas
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Check className="w-3 h-3" />
                        Marcar lidas
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[#A89F96] hover:text-[#FBF8F5] p-1 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-[#2C221A]/60 max-h-80 overflow-y-auto mt-2 scrollbar-none">
                  <div className="py-3 text-xs bg-amber-500/10 px-2.5 rounded-2xl mb-1">
                    <p className="font-bold text-[#FBF8F5]">Terça é Happy Hour! 🍺</p>
                    <p className="text-[#A89F96] mt-0.5 leading-relaxed">
                      Drinks e cervejas artesanais com 20% de desconto hoje no Pirambeira até 21h.
                    </p>
                    <span className="text-[10px] text-amber-400 mt-1 block font-mono">
                      Agora há pouco
                    </span>
                  </div>
                  <div className="py-3 text-xs">
                    <p className="font-bold text-[#FBF8F5]">Alguém mandou um olhar 👀</p>
                    <p className="text-[#A89F96] mt-0.5 leading-relaxed">
                      Você recebeu um recado discreto no Mural da Paquera da mesa 04.
                    </p>
                    <span className="text-[10px] text-[#6E655D] mt-1 block font-mono">
                      Há 35 minutos
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

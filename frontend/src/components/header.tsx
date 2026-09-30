'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { AppNotification } from '@/lib/types';
import {
  Bell,
  X,
  Check,
  Beer,
  Heart,
  Music,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

export function Header() {
  const { user, activeCheckIn } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setNotifications([]);
    setUnreadCount(0);
    if (user) {
      apiRequest<{ unreadCount: number; notifications: AppNotification[] }>('/notifications')
        .then((data) => {
          if (data && data.notifications) {
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
    } catch { return; }
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <>
      <style>{`
        @keyframes drawerSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes drawerSlideOut {
          from { transform: translateX(0); }
          to   { transform: translateX(100%); }
        }
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <header className="sticky top-0 z-40 h-[72px] bg-[#080807]/90 backdrop-blur-xl border-b border-[rgba(255,184,0,0.12)] px-[18px] py-3 transition-all">
        {/* Glow ambiente sutil superior */}
        <div className="absolute top-0 left-10 w-48 h-10 bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="max-w-2xl mx-auto h-full flex items-center justify-between relative z-10">
          {/* Left: Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-2 min-w-0 group">
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-[#FFB800]/20 blur-md rounded-full group-hover:bg-[#FFB800]/35 transition-all" />
              <img
                src="/LogoPirambeiraSemFundo.png"
                alt="Pirambeira"
                className="relative w-[46px] h-[46px] object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_2px_12px_rgba(255,184,0,0.35)]"
              />
            </div>

            <div className="flex flex-col">
              <span className="font-display font-black text-[21px] uppercase text-[#ff9c22] leading-tight tracking-tight">
                Pirambeira
              </span>
              <span className="text-[8px] sm:text-[9px] font-semibold tracking-[.8px] text-[#AAA49C] uppercase">
                BAR &amp; ENCONTROS &bull; SALVADOR
              </span>
            </div>
          </Link>

          {/* Right: Bell */}
          <button
            onClick={() => setShowNotifications(true)}
            className="w-10 h-10 rounded-full border border-[#332F2A] bg-[#11100F] text-white flex items-center justify-center transition-all active:scale-90 hover:border-[#FFB800]/40 shadow-sm relative cursor-pointer"
            aria-label="Notificacoes"
          >
            <Bell className="w-4 h-4 stroke-[2]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#E52532] border-2 border-[#080807]" />
            )}
          </button>
        </div>
      </header>

      {/* ===== NOTIFICATION DRAWER ===== */}
      {showNotifications && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            style={{ animation: 'overlayFadeIn .25s ease both' }}
            onClick={() => setShowNotifications(false)}
          />

          {/* Drawer */}
          <div
            className="fixed top-0 right-0 h-full w-full max-w-[360px] z-[70] flex flex-col bg-[#0c0a08] border-l border-white/[0.07] shadow-[-24px_0_60px_rgba(0,0,0,.7)]"
            style={{ animation: 'drawerSlideIn .3s cubic-bezier(0.16,1,0.3,1) both' }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#F5A623]/15 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[#F5A623] stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="font-black text-[15px] text-white tracking-tight leading-none">Notificacoes</h2>
                  <p className="text-[10px] text-[#6b6560] mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} nova${unreadCount === 1 ? '' : 's'}` : 'Tudo em dia'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.09] text-[10px] text-[#A89F96] hover:text-[#F5A623] transition-all cursor-pointer"
                  >
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    <span>Marcar lidas</span>
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#A89F96] hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                  aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 scrollbar-none">
              {!notifications.length && (
                <div className="flex flex-col items-center justify-center h-full gap-3 py-20 text-center">
                  <div className="w-14 h-14 rounded-3xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <Bell className="w-6 h-6 text-[#4a4540] stroke-[1.5]" />
                  </div>
                  <p className="text-sm text-[#6b6560]">
                    {user ? 'Nenhuma notificacao ainda.' : 'Entre na sua conta para ver.'}
                  </p>
                </div>
              )}

              {notifications.map((notif) => {
                const isPromo = notif.type === 'PROMO';
                const isFlirt = notif.type === 'FLIRT';
                const isEvent = notif.type === 'EVENT';

                return (
                  <Link
                    key={notif.id}
                    href={notif.link || '#'}
                    onClick={() => {
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
                      );
                      if (!notif.isRead) setUnreadCount((c) => Math.max(0, c - 1));
                      setShowNotifications(false);
                    }}
                    className={`flex items-start gap-3.5 px-3.5 py-3.5 rounded-2xl transition-all group ${
                      !notif.isRead
                        ? 'bg-[#F5A623]/[0.07] hover:bg-[#F5A623]/[0.12]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isPromo  ? 'bg-amber-500/20 text-[#F5A623]'
                      : isFlirt ? 'bg-rose-500/20 text-rose-400'
                      : isEvent ? 'bg-violet-500/20 text-violet-300'
                      : 'bg-white/10 text-white'
                    }`}>
                      {isPromo   ? <Beer     className="w-4 h-4 stroke-[2]" />
                      : isFlirt  ? <Heart    className="w-4 h-4 stroke-[2]" />
                      : isEvent  ? <Music    className="w-4 h-4 stroke-[2]" />
                      :            <Sparkles className="w-4 h-4 stroke-[2]" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-[13px] text-[#EDE9E4] group-hover:text-[#F5A623] transition-colors leading-snug">
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#F5A623] shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[12px] text-[#7A7067] mt-1 leading-relaxed line-clamp-3">
                        {notif.body}
                      </p>
                      <span className="text-[10px] text-[#4a4540] mt-1.5 block">
                        {notif.createdAt}
                      </span>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#3a3530] group-hover:text-[#F5A623] shrink-0 mt-1 transition-colors" />
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer */}
            {notifications.length > 0 && (
              <div className="shrink-0 border-t border-white/[0.06] px-5 py-4">
                <Link
                  href="/promocoes"
                  onClick={() => setShowNotifications(false)}
                  className="flex items-center justify-between w-full py-3 px-4 rounded-2xl bg-[#F5A623]/10 hover:bg-[#F5A623]/18 border border-[#F5A623]/20 transition-all group"
                >
                  <span className="text-[12px] text-[#F5A623] font-bold">Ver todas as promocoes</span>
                  <ArrowRight className="w-4 h-4 text-[#F5A623] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
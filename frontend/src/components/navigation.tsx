'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Home,
  Flame,
  Compass,
  Plus,
  Heart,
  User as UserIcon,
  Beer,
  Calendar,
  Tag,
  MessageSquare,
  ShieldAlert,
  BarChart3,
  Store,
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  const mobileNavItems = [
    { label: 'Início', href: '/', icon: Home, exact: true },
    { label: 'Explorar', href: '/feed', icon: Compass },
    { label: 'Publicar', href: '/publicar', icon: Plus, isAction: true },
    { label: 'Paquera', href: '/paquera', icon: Heart },
    { label: 'Perfil', href: user ? '/perfil' : '/login', icon: UserIcon },
  ];

  const desktopNavItems = [
    { label: 'Início', href: '/', icon: Home, exact: true },
    { label: 'Feed do Piramba', href: '/feed', icon: Flame, highlight: true },
    { label: 'Quem está aqui agora?', href: '/aqui', icon: Compass },
    { label: 'Mural da Paquera', href: '/paquera', icon: Heart },
    { label: 'Mesas & Encontros', href: '/encontros', icon: Beer },
    { label: 'Eventos & Samba', href: '/eventos', icon: Calendar },
    { label: 'Promoções & Cupons', href: '/promocoes', icon: Tag },
    { label: 'Mensagens & Matches', href: '/chat', icon: MessageSquare },
    { label: 'Restaurante Pirambeira', href: '/restaurante/pirambeira', icon: Store },
  ];

  const isAdmin = user?.role === 'RESTAURANT_ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <>
      {/* Mobile Floating App Dock Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-2 sm:pb-3 px-3">
        <div className="pointer-events-auto max-w-md mx-auto rounded-[28px] bg-[#120F0D]/95 backdrop-blur-2xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.85),0_0_20px_rgba(245,166,35,0.08)] px-2 py-1.5 flex items-center justify-around relative">
          {/* Subtle top amber highlight sheen */}
          <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#F5A623]/35 to-transparent pointer-events-none" />

          {mobileNavItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;

            if (item.isAction) {
              const isPaqueraPage = pathname.startsWith('/paquera');

              return (
                <Link
                  key={item.href}
                  href={isPaqueraPage ? '#recadinho' : item.href}
                  onClick={(e) => {
                    if (isPaqueraPage) {
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('open-recadinho-modal'));
                    }
                  }}
                  aria-label={isPaqueraPage ? "Deixar recadinho no mural da paquera" : "Registrar momento no bar"}
                  className="-mt-7 group relative flex flex-col items-center focus:outline-none cursor-pointer"
                >
                  {/* Ambient pulsing backlight aura */}
                  <div
                    className={`absolute -inset-1 rounded-full transition-opacity animate-pulse ${
                      isPaqueraPage
                        ? 'bg-gradient-to-tr from-rose-600 via-rose-500 to-pink-400 opacity-65 blur-md group-hover:opacity-90'
                        : 'bg-gradient-to-tr from-[#EA580C] via-[#F5A623] to-[#FFC043] opacity-45 blur-md group-hover:opacity-85'
                    }`}
                  />

                  {/* Luminous Elevated Button */}
                  <div
                    className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-full p-[3px] group-hover:scale-110 group-active:scale-90 transition-all duration-300 ease-out flex items-center justify-center ring-4 ring-[#120F0D] ${
                      isPaqueraPage
                        ? 'bg-gradient-to-tr from-rose-700 via-rose-500 to-pink-400 shadow-[0_6px_24px_rgba(244,63,94,0.65)]'
                        : 'bg-gradient-to-tr from-[#D97706] via-[#F5A623] to-[#FFBF47] shadow-[0_6px_22px_rgba(245,166,35,0.5)]'
                    }`}
                  >
                    <div
                      className={`w-full h-full rounded-full flex items-center justify-center shadow-inner transition-colors ${
                        isPaqueraPage
                          ? 'bg-gradient-to-b from-rose-500 to-rose-600 text-white group-hover:bg-rose-500'
                          : 'bg-gradient-to-b from-[#F5A623] to-[#D97706] text-[#080706] group-hover:bg-[#FFB338]'
                      }`}
                    >
                      <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3.2] transition-transform duration-300 group-hover:rotate-90 group-active:rotate-45" />
                    </div>
                  </div>

                  {/* Micro Pill Badge under button */}
                  <span
                    className={`mt-1 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full shadow-sm transition-colors ${
                      isPaqueraPage
                        ? 'text-rose-200 bg-[#1C1714] border border-rose-500/40 group-hover:text-rose-100'
                        : 'text-white/90 bg-[#1C1714] border border-[#F5A623]/30 group-hover:text-[#F5A623]'
                    }`}
                  >
                    {isPaqueraPage ? 'Recadinho' : 'Publicar'}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 active:scale-90 group cursor-pointer ${
                  isActive ? 'text-[#F5A623]' : 'text-[#8E867E] hover:text-white'
                }`}
              >
                {/* Active Tab Background Glow Pill */}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#F5A623]/15 to-[#F5A623]/5 border border-[#F5A623]/25 shadow-[0_0_12px_rgba(245,166,35,0.15)] animate-in fade-in zoom-in-95 duration-200" />
                )}

                {/* Icon with bounce & glow when active */}
                <div
                  className={`relative transition-all duration-300 ${
                    isActive ? '-translate-y-0.5 scale-110' : 'group-hover:scale-105'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isActive
                        ? 'stroke-[2.5] text-[#F5A623] drop-shadow-[0_0_8px_rgba(245,166,35,0.4)]'
                        : 'stroke-[1.9] text-[#8E867E] group-hover:text-white'
                    }`}
                  />
                  {/* Paquera heartbeat badge */}
                  {item.href === '/paquera' && (
                    <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse border border-[#120F0D]" />
                  )}
                  {/* Feed fresh badge */}
                  {item.href === '/feed' && (
                    <span className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse border border-[#120F0D]" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`relative text-[10px] tracking-tight mt-0.5 transition-all duration-300 font-medium ${
                    isActive
                      ? 'text-[#F5A623] font-black scale-105'
                      : 'text-[#8E867E] group-hover:text-white'
                  }`}
                >
                  {item.label}
                </span>

                {/* Active indicator micro-dot */}
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#F5A623] shadow-[0_0_6px_#F5A623] mt-0.5 animate-in zoom-in duration-300" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-[#080706] border-r border-[#221B16] flex-col z-40 p-5">
        {/* Brand Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-[#221B16]">
          {/* Logo Oficial Sem Fundo */}
          <img
            src="/LogoPirambeiraSemFundo.png"
            alt="Piramba Bar & Encontros"
            className="w-11 h-11 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(245,166,35,0.25)]"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-black text-base tracking-tight text-white">
                PIRAMBA
              </h1>
              <span className="text-[9px] bg-amber-500/20 text-[#F5A623] font-black px-1.5 py-0.5 rounded-md border border-amber-500/30">
                BA
              </span>
            </div>
            <p className="text-xs text-[#8E867E] flex items-center gap-1.5 mt-0.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Bar & Encontros
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="flex-1 py-5 space-y-1.5 overflow-y-auto scrollbar-none">
          {desktopNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-[#F5A623] border border-amber-500/35 shadow-sm shadow-amber-500/10'
                    : 'text-[#A89F96] hover:bg-[#18130F] hover:text-white hover:border-[#2C221A] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 transition-transform duration-200 group-hover:translate-x-1">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#F5A623] stroke-[2.5]' : 'text-[#6E655D] group-hover:text-[#F5A623]'
                    }`}
                  />
                  <span className={isActive ? 'font-bold' : ''}>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 indicator-pulse-emerald" />
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-[#221B16] space-y-1">
              <p className="px-3 text-[10px] font-black tracking-widest text-[#F5A623]/70 uppercase">
                Administração
              </p>
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${pathname === '/admin'
                  ? 'bg-amber-500/15 text-[#F5A623] border border-amber-500/30'
                  : 'text-[#A89F96] hover:bg-[#141210] hover:text-white'
                  }`}
              >
                <BarChart3 className="w-4 h-4 text-[#6E655D]" />
                Métricas do Bar
              </Link>
              <Link
                href="/moderacao"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${pathname === '/moderacao'
                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                  : 'text-[#A89F96] hover:bg-[#141210] hover:text-white'
                  }`}
              >
                <ShieldAlert className="w-4 h-4 text-[#6E655D]" />
                Moderação
              </Link>
            </div>
          )}
        </div>

        {/* User Card / Auth Footer */}
        <div className="pt-4 border-t border-[#221B16]">
          {user ? (
            <Link
              href="/perfil"
              className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-[#141210] transition-colors group"
            >
              <img
                src={user.profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={user.profile?.name || 'Perfil'}
                className="w-10 h-10 rounded-2xl object-cover border border-amber-500/40 group-hover:border-[#F5A623] transition-colors"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-[#F5A623] transition-colors">
                  {user.profile?.name || 'Pirambeiro'}
                </p>
                <p className="text-[11px] text-[#8E867E] truncate">
                  @{user.profile?.username || user.email?.split('@')[0] || 'usuario'}
                </p>
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-2xl bg-[#F5A623] text-[#080706] font-display font-black text-xs flex items-center justify-center shadow-md active:scale-95 transition-all"
            >
              Entrar no Piramba
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

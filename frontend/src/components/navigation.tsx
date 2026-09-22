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
      {/* Mobile App Navigation Bar — Fiel ao JSON (height: 76px, bg: rgba(10,9,8,0.96), borderTop: 1px solid #302A20) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-[76px] px-3 py-2 border-t border-[#302A20] pb-safe flex items-center justify-around"
        style={{
          background: 'rgba(10,9,8,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="w-full max-w-md mx-auto flex items-center justify-around relative">
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
                  aria-label={isPaqueraPage ? "Deixar recadinho no mural da paquera" : "Publicar momento no bar"}
                  className="-mt-7 group relative flex flex-col items-center focus:outline-none cursor-pointer active:scale-95 transition-transform"
                >
                  {/* Luminous Create Button do JSON (58x58, border 4px #191611, double ring #FFB800, glow 24px) */}
                  <div
                    className="relative w-[58px] h-[58px] rounded-[29px] flex items-center justify-center text-[#080807] transition-all group-hover:scale-105"
                    style={{
                      background: 'linear-gradient(145deg, #FFC928, #FF8500)',
                      border: '4px solid #191611',
                      boxShadow: '0 0 0 2px #FFB800, 0 0 24px rgba(255,184,0,0.35)',
                    }}
                  >
                    <Plus className="w-6 h-6 stroke-[3.2] text-[#080807]" />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`h-[58px] flex flex-col items-center justify-center gap-1 transition-all duration-200 active:scale-90 group cursor-pointer ${
                  isActive ? 'text-[#FFB800] font-bold' : 'text-[#77736E] hover:text-white'
                }`}
              >
                {/* Icon */}
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive
                      ? 'stroke-[2.5] fill-[#FFB800]/20 text-[#FFB800] drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]'
                      : 'stroke-[1.8] text-[#77736E] group-hover:text-white'
                  }`}
                />

                {/* Label (fontSize: 10) */}
                <span className="text-[10px] tracking-tight leading-none">
                  {item.label}
                </span>
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 group active:scale-95 ${isActive
                    ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-[#F5A623] border border-amber-500/35 shadow-sm shadow-amber-500/10'
                    : 'text-[#A89F96] hover:bg-[#18130F] hover:text-white hover:border-[#2C221A] border border-transparent'
                  }`}
              >
                <div className="flex items-center gap-3 transition-transform duration-200 group-hover:translate-x-1">
                  <Icon
                    className={`w-4 h-4 transition-colors ${isActive ? 'text-[#F5A623] stroke-[2.5]' : 'text-[#6E655D] group-hover:text-[#F5A623]'
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
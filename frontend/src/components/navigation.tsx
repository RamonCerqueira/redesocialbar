'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Home,
  Flame,
  Search,
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
    { label: 'Feed', href: '/feed', icon: Flame },
    { label: 'Publicar', href: '/publicar', icon: Plus, isAction: true },
    { label: 'Paquera', href: '/paquera', icon: Heart },
    { label: 'Perfil', href: user ? '/perfil' : '/login', icon: UserIcon },
  ];

  const desktopNavItems = [
    { label: 'Início', href: '/', icon: Home, exact: true },
    { label: 'Feed do Piramba', href: '/feed', icon: Flame, highlight: true },
    { label: 'Quem está aqui agora?', href: '/aqui', icon: Search },
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
      {/* Mobile Bottom Navigation Bar (Pixel-perfect match to reference) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#080706] border-t border-[#1C1714] px-4 pt-2 pb-5">
        <div className="flex items-center justify-around max-w-md mx-auto relative">
          {mobileNavItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label="Registrar momento no bar"
                  className="-mt-7 group relative flex flex-col items-center focus:outline-none"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#F5A623] flex items-center justify-center text-[#080706] shadow-xl shadow-amber-500/30 group-active:scale-95 group-hover:scale-105 transition-all duration-200">
                    <Plus className="w-7 h-7 stroke-[3]" />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-3 transition-colors ${isActive ? 'text-[#F5A623]' : 'text-[#8E867E] hover:text-white'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] fill-[#F5A623]/20' : 'stroke-[2]'}`} />
                <span className={`text-[10px] mt-1 font-semibold ${isActive ? 'text-[#F5A623] font-bold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* iOS Home Indicator Bar */}
        <div className="w-32 h-1 bg-white/20 rounded-full mx-auto mt-2.5" />
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group ${isActive
                  ? 'bg-amber-500/15 text-[#F5A623] border border-amber-500/30'
                  : 'text-[#A89F96] hover:bg-[#141210] hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#F5A623]' : 'text-[#6E655D] group-hover:text-[#F5A623]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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

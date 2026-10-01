'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Home, Flame, Compass, Plus, Heart, UserRound, Beer, CalendarDays, Ticket, Store, Ellipsis, X, ArrowUpRight, LayoutDashboard, LogOut } from 'lucide-react';

const destinations = [
  { label: 'Privacidade e termos', href: '/central-de-privacidade', icon: UserRound },
  { label: 'Início', href: '/', icon: Home },
  { label: 'Feed do Piramba', href: '/feed', icon: Flame },
  { label: 'Quem está aqui agora?', href: '/aqui', icon: Compass },
  { label: 'Mural da Paquera', href: '/paquera', icon: Heart },
  { label: 'Mesas & Encontros', href: '/encontros', icon: Beer },
  { label: 'Eventos & Samba', href: '/eventos', icon: CalendarDays },
  { label: 'Promoções & Cupons', href: '/promocoes', icon: Ticket },
  { label: 'Restaurante Pirambeira', href: '/restaurante/pirambeira', icon: Store },
];
const extras = destinations.filter(item => !['/', '/feed', '/paquera'].includes(item.href));
export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const sheet = useRef<HTMLDialogElement>(null);
  const moreButton = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const admin = user?.role === 'RESTAURANT_ADMIN' || user?.role === 'SUPERADMIN';
  function close() { sheet.current?.close(); setOpen(false); }
  function show() { sheet.current?.showModal(); setOpen(true); }
  useEffect(() => { sheet.current?.close(); setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  const activeExtra = extras.some(item => pathname.startsWith(item.href)) || pathname.startsWith('/perfil') || pathname.startsWith('/login');
  const navClass = (active: boolean) =>
    'relative flex flex-col items-center justify-center gap-1 min-w-[52px] min-h-[50px] text-[10px] font-semibold transition-all duration-200 ' +
    (active
      ? 'text-[#FFB800] scale-105 drop-shadow-[0_2px_8px_rgba(255,184,0,0.4)]'
      : 'text-[#8E877D] hover:text-white active:scale-95');

  return (
    <>
      <nav
        aria-label="Navegação principal"
        className="lg:hidden fixed inset-x-3 z-50 rounded-3xl border border-[#FFB800]/20 bg-[#0E0C09]/85 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.8),0_0_20px_rgba(255,184,0,0.08)]"
        style={{ bottom: 'max(10px, env(safe-area-inset-bottom))', paddingBottom: '4px' }}
      >
        <div className="max-w-md mx-auto flex items-center justify-around h-[58px] px-2 relative">
          <Link href="/" className={navClass(pathname === '/')} aria-current={pathname === '/' ? 'page' : undefined}>
            <Home size={20} className={pathname === '/' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span>Início</span>
            {pathname === '/' && <span className="absolute -bottom-1 w-4 h-1 rounded-full bg-[#FFB800] shadow-[0_0_8px_#FFB800]" />}
          </Link>

          <Link href="/feed" className={navClass(pathname === '/feed')} aria-current={pathname === '/feed' ? 'page' : undefined}>
            <Flame size={20} className={pathname === '/feed' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span>Feed</span>
            {pathname === '/feed' && <span className="absolute -bottom-1 w-4 h-1 rounded-full bg-[#FFB800] shadow-[0_0_8px_#FFB800]" />}
          </Link>

          {/* Botão de Destaque Central */}
          <Link
            href="/publicar"
            aria-label={pathname === '/paquera' ? 'Deixar recadinho' : 'Publicar momento'}
            onClick={(e) => {
              if (pathname === '/paquera') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('open-recadinho-modal'));
              }
            }}
            className="flex items-center justify-center w-13 h-13 -mt-8 rounded-full border-2 border-[#120F0B] ring-2 ring-[#FFB800] bg-gradient-to-tr from-[#FFB800] to-[#FFA800] text-[#120F0B] shadow-[0_4px_22px_rgba(255,184,0,0.45)] active:scale-90 transition-transform"
          >
            <Plus size={26} strokeWidth={2.8} />
          </Link>

          <Link href="/paquera" className={navClass(pathname === '/paquera')} aria-current={pathname === '/paquera' ? 'page' : undefined}>
            <Heart size={20} className={pathname === '/paquera' ? 'stroke-[2.5]' : 'stroke-2'} />
            <span>Paquera</span>
            {pathname === '/paquera' && <span className="absolute -bottom-1 w-4 h-1 rounded-full bg-[#FFB800] shadow-[0_0_8px_#FFB800]" />}
          </Link>

          <button
            ref={moreButton}
            onClick={show}
            aria-label="Mais opções do menu"
            aria-haspopup="dialog"
            aria-controls="mobile-more-menu"
            aria-expanded={open}
            className={navClass(open || activeExtra)}
          >
            <Ellipsis size={22} className={open || activeExtra ? 'stroke-[2.5]' : 'stroke-2'} />
            <span>Mais</span>
            {(open || activeExtra) && <span className="absolute -bottom-1 w-4 h-1 rounded-full bg-[#FFB800] shadow-[0_0_8px_#FFB800]" />}
          </button>
        </div>
      </nav>

      <dialog ref={sheet} id="mobile-more-menu" aria-labelledby="more-menu-title" onClose={() => { setOpen(false); moreButton.current?.focus(); }} onClick={event => { if (event.target === sheet.current) close(); }} className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none max-h-[88dvh] bg-transparent p-0 text-white border-0 backdrop:bg-black/70 backdrop:backdrop-blur-sm">
        <div className="mx-auto max-w-lg bg-[#141512] border border-white/10 rounded-t-[28px] p-6 overflow-auto" style={{ paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }}>
          <div className="w-9 h-1 bg-white/15 rounded-full mx-auto mb-5" aria-hidden="true" />
          <header className="flex items-start justify-between mb-6"><div><p className="text-[10px] tracking-[.2em] text-amber-400 mb-1">TÔ NO PIRAMBA</p><h2 id="more-menu-title" className="text-xl font-semibold tracking-tight">A noite continua.</h2></div><button autoFocus aria-label="Fechar menu" onClick={close} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-stone-400 hover:text-white"><X size={19} /></button></header>
          <Link href={user ? '/perfil' : '/login'} onClick={close} className="flex items-center gap-3 p-4 mb-5 rounded-2xl border border-amber-300/15 bg-amber-300/5">
            <div className="w-10 h-10 rounded-full bg-amber-300/10 flex items-center justify-center">{user?.profile.avatarUrl ? <img src={user.profile.avatarUrl} alt="" className="w-full h-full object-cover rounded-full" /> : <UserRound size={20} className="text-amber-300" />}</div>
            <div className="flex-1"><p className="text-sm font-semibold">{user?.profile.name || 'Entre para fazer parte'}</p><p className="text-[11px] text-stone-400 mt-1">{user ? 'Ver meu perfil' : 'Sua mesa, seus encontros, sua noite.'}</p></div><ArrowUpRight size={17} className="text-amber-300" />
          </Link>
          <div className="grid grid-cols-2 gap-2.5">{extras.map(item => <Link key={item.href} href={item.href} onClick={close} aria-current={pathname === item.href ? 'page' : undefined} className={'min-h-[86px] p-3.5 rounded-2xl border flex flex-col gap-3 transition-colors ' + (pathname === item.href ? 'border-amber-400/40 bg-amber-300/10' : 'border-white/[.07] bg-white/[.025] hover:bg-white/5')}><item.icon size={20} className="text-[#c3a977]" /><span className="text-xs font-medium text-stone-200">{item.label}</span></Link>)}
            {admin && <Link href="/admin" onClick={close} className="min-h-[86px] p-3.5 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 flex flex-col gap-3"><LayoutDashboard size={20} className="text-emerald-300" /><span className="text-xs font-medium">Administração</span></Link>}
          </div>
          {user && <button onClick={() => { logout(); close(); }} className="flex items-center gap-2 text-xs text-stone-400 mt-6 py-2"><LogOut size={15} />Sair da conta</button>}
        </div>
      </dialog>

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-[#080706] border-r border-[#221B16] flex-col z-40 p-5">
        <Link href="/" className="flex items-center gap-3 pb-6 border-b border-white/10"><img src="/LogoPirambeiraSemFundo.png" alt="Pirambeira" className="w-12 h-12 object-contain" /><div><span className="font-bold tracking-wide">PIRAMBA</span><p className="text-xs text-stone-500 mt-1">Bar & Encontros</p></div></Link>
        <nav aria-label="Menu lateral" className="flex-1 py-5 space-y-1 overflow-y-auto">{destinations.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? 'page' : undefined} className={'flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition-colors ' + (pathname === item.href ? 'bg-amber-400/10 text-amber-400 border border-amber-400/25' : 'text-stone-400 border border-transparent hover:bg-white/5 hover:text-white')}><item.icon size={16} />{item.label}</Link>)}
          {admin && <Link href="/admin" className="flex items-center gap-3 px-3.5 py-3 mt-5 border-t border-white/10 text-xs text-amber-300"><LayoutDashboard size={16} />Administração</Link>}
        </nav>
        <Link href={user ? '/perfil' : '/login'} className="flex items-center gap-3 pt-5 border-t border-white/10"><UserRound size={20} className="text-amber-300" /><div><p className="text-xs font-semibold">{user?.profile.name || 'Entrar no Piramba'}</p><p className="text-[11px] text-stone-500 mt-1">{user ? 'Meu perfil' : 'Faça parte da comunidade'}</p></div></Link>
      </aside>
    </>);
}

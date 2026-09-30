'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { MoreHorizontal, X, ExternalLink, LogOut } from 'lucide-react';

type Item = { id: string; label: string; icon: ComponentType<{size?: number}> };
export function AdminMobileNavigation({ items, section, onNavigate, name, onLogout }: {
  items: readonly Item[]; section: string; onNavigate: (id: string) => void; name: string; onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => { dialog.current?.close(); document.body.style.overflow = previous; };
  }, [open]);
  function navigate(id: string) { setOpen(false); onNavigate(id); window.scrollTo({ top: 0, behavior: 'instant' }); }
  const shortcuts = items.filter(item => ['dashboard', 'menu', 'coupons'].includes(item.id));
  return <>
    <header className="admin-mobile-header"><Link href="/" aria-label="Abrir aplicativo"><img src="/LogoPirambeiraSemFundo.png" alt=""/><span>Pirambeira<small>PAINEL DE GESTÃO</small></span></Link><button type="button" aria-label="Abrir menu administrativo" aria-haspopup="dialog" onClick={() => setOpen(true)}><MoreHorizontal size={24}/></button></header>
    <nav className="admin-mobile-dock" aria-label="Atalhos administrativos">
      {shortcuts.map(item => <button type="button" key={item.id} aria-current={section === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><item.icon size={21}/><span>{item.id === 'dashboard' ? 'Resumo' : item.id === 'menu' ? 'Cardápio' : 'Cupons'}</span></button>)}
      <button type="button" aria-label="Mais opções administrativas" aria-haspopup="dialog" aria-expanded={open} data-active={!shortcuts.some(item=>item.id===section)} onClick={() => setOpen(true)}><MoreHorizontal size={23}/><span>Mais</span></button>
    </nav>
    <dialog ref={dialog} className="admin-mobile-drawer" aria-labelledby="admin-mobile-menu-title" onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)} onClick={event=>{if(event.target===event.currentTarget)setOpen(false);}}>
      <div className="admin-mobile-sheet"><header><div><small>ADMINISTRAÇÃO</small><h2 id="admin-mobile-menu-title">O que vamos cuidar?</h2></div><button type="button" aria-label="Fechar menu administrativo" onClick={()=>setOpen(false)}><X size={22}/></button></header>
      <nav aria-label="Todas as funções administrativas">{items.map(item=><button type="button" key={item.id} aria-current={section===item.id?'page':undefined} onClick={()=>navigate(item.id)}><item.icon size={20}/><span>{item.label}</span></button>)}</nav>
      <footer><p>{name}</p><div><Link href="/"><ExternalLink size={17}/>Abrir aplicativo</Link><button type="button" onClick={()=>{setOpen(false);onLogout();}}><LogOut size={17}/>Sair</button></div></footer></div>
    </dialog>
  </>;
}

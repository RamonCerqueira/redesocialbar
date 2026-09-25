'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import './splash-screen.css';

export function SplashScreen() {
  const dialog = useRef<HTMLDialogElement>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [done, setDone] = useState(false);
  const dismiss = useCallback(() => {
    try { sessionStorage.setItem('piramba_intro_v2', 'seen'); } catch {}
    setLeaving(true);
    if (exitTimer.current) clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => { dialog.current?.close(); setDone(true); }, 350);
  }, []);

  useEffect(() => {
    try { if (sessionStorage.getItem('piramba_intro_v2')) { setDone(true); return; } } catch {}
    const element = dialog.current;
    element?.showModal();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(dismiss, reduced ? 150 : 2300);
    return () => { clearTimeout(timer); if (exitTimer.current) clearTimeout(exitTimer.current); element?.close(); };
  }, [dismiss]);
  if (done) return null;
  return <dialog ref={dialog} className={'piramba-intro' + (leaving ? ' is-leaving' : '')} aria-labelledby="intro-title" onCancel={event => { event.preventDefault(); dismiss(); }}>
    <div className="intro-atmosphere" aria-hidden="true"/>
    <div className="intro-topline"><span>PITUBA · SALVADOR</span><span>BAR & ENCONTROS</span></div>
    <div className="intro-center">
      <div className="intro-mark"><div className="intro-orbit" aria-hidden="true"/><img src="/LogoPirambeira.png" alt="Pirambeira" width={280} height={280}/></div>
      <span className="intro-eyebrow">A NOITE FICA MELHOR AQUI</span>
      <h1 id="intro-title">O seu lugar.<br/><em>A nossa noite.</em></h1>
      <p>Boa conversa. Mesa cheia. Novas histórias.</p>
    </div>
    <footer className="intro-footer"><div className="intro-signature"><span/>TÔ NO PIRAMBA</div><button autoFocus onClick={dismiss}>Entrar <ArrowUpRight size={17}/></button></footer>
  </dialog>;
}

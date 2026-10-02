'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Advertisement } from './sponsored-card';

export function BarNewsCarousel() {
  const [items, setItems] = useState<Advertisement[]>([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const root = useRef<HTMLElement>(null);
  const touch = useRef<{x:number;y:number} | null>(null);
  const visible = useRef(false);
  useEffect(() => { let active = true; apiRequest<Advertisement[]>('/ads/restaurant/pirambeira').then(rows => { if(active) setItems(rows.filter(row => row.type === 'BANNER')); }).catch(() => {}); return () => { active = false; }; }, []);
  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(motion.matches); sync(); motion.addEventListener('change', sync);
    return () => motion.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    const element = root.current; if(!element) return;
    let frame = 0;
    const update = () => { frame = 0; if(!visible.current || reduced) return; const bounds = element.getBoundingClientRect(); const offset = Math.max(-18, Math.min(18, (innerHeight / 2 - bounds.top - bounds.height / 2) * .06)); element.style.setProperty('--news-offset', `${offset}px`); };
    const schedule = () => { if(!frame && visible.current) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; schedule(); }); observer.observe(element);
    addEventListener('scroll', schedule, {passive:true}); addEventListener('resize', schedule);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); removeEventListener('scroll', schedule); removeEventListener('resize', schedule); };
  }, [items.length, reduced]);
  useEffect(() => {
    if(items.length < 2 || paused || hovered || focused || reduced) return;
    const timer = setInterval(() => { if(!document.hidden && visible.current) setIndex(i => (i + 1) % items.length); }, 7000);
    return () => clearInterval(timer);
  }, [items.length, paused, hovered, focused, reduced]);
  function go(next:number) { setPaused(true); setIndex((next + items.length) % items.length); }
  const item = items[index % items.length];
  if(!item) return null;
  return <section ref={root} className="bar-news-section" aria-label="Novidades do bar" aria-roledescription="carrossel" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={e => { if(!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false); }} onTouchStart={e => { touch.current = {x:e.touches[0].clientX,y:e.touches[0].clientY}; }} onTouchEnd={e => { if(!touch.current) return; const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y; if(Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)) go(index+(dx<0?1:-1)); touch.current=null; }}>
    <div className="bar-news-heading"><span>Novidades do bar</span><small>{index + 1} / {items.length}</small></div>
    <div className="bar-news-window" role="group" aria-roledescription="slide" aria-label={`${index + 1} de ${items.length}`}><img key={item.id} src={item.imageUrl} alt="" loading="lazy" decoding="async" /><div className="bar-news-shade" /><div key={'copy-'+item.id} className="bar-news-copy"><span>{item.sponsorName}</span><h2>{item.title}</h2>{item.description && <p>{item.description}</p>}{item.targetUrl && <a href={item.targetUrl} className="bar-news-cta" onClick={() => { void apiRequest('/ads/'+item.id+'/click',{method:'POST'}).catch(() => {}); }}>{item.buttonText}<ArrowUpRight size={15} /></a>}</div>
      {items.length>1 && <div className="bar-news-controls"><div className="bar-news-dots">{items.map((row,i) => <button key={row.id} aria-label={`Mostrar novidade ${i+1}`} aria-pressed={index===i} onClick={() => go(i)}><i /></button>)}</div><div><button aria-label="Novidade anterior" onClick={() => go(index-1)}><ChevronLeft size={17} /></button><button aria-label={paused?'Ativar troca automática':'Pausar troca automática'} onClick={() => setPaused(v=>!v)}>{paused?<Play size={14}/>:<Pause size={14}/>}</button><button aria-label="Próxima novidade" onClick={() => go(index+1)}><ChevronRight size={17} /></button></div></div>}
    </div>
  </section>;
}

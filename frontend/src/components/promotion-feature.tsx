'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Ticket } from 'lucide-react';
import { Promotion } from '@/lib/types';

export function PromotionFeature({ promotion }: { promotion: Promotion }) {
  const card = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const element = card.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!element) return;
    let frame = 0;
    let visible = false;
    function update() {
      frame = 0;
      if (!element || motion.matches || !visible) return;
      const bounds = element.getBoundingClientRect();
      const offset = Math.max(-12, Math.min(12, (window.innerHeight / 2 - bounds.top - bounds.height / 2) * .035));
      element.style.setProperty('--promo-offset', `${offset}px`);
    }
    function schedule() { if (!frame && visible && !motion.matches) frame = requestAnimationFrame(update); }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); });
    observer.observe(element);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, []);
  const demo = promotion.badge === 'DEMONSTRAÇÃO';
  const title = demo ? promotion.title.replace(/\s*[—–-]\s*demonstração$/i, '') : promotion.title;
  return <section className="promotion-feature-section" aria-label="Promoção em destaque"><div className="promotion-feature-heading"><span><Ticket size={15} />Uma boa pedida</span><Link href="/promocoes">Ver todas <ArrowUpRight size={14} /></Link></div><Link ref={card} href="/promocoes" className="promotion-feature"><img src={promotion.imageUrl || '/hero-brinde-v2.png'} alt="" loading="lazy" decoding="async" /><div className="promotion-feature-shade" /><div className="promotion-feature-copy"><span className="promotion-feature-badge">{promotion.badge || 'EXCLUSIVO NO APP'}</span><h2>{title}</h2><p>{promotion.discountText}</p><span className="promotion-feature-cta">{demo ? 'Conhecer os cupons' : 'Ver promoção'}<ArrowUpRight size={17} /></span>{demo && <small>Oferta de exemplo · sem valor comercial</small>}</div></Link></section>;
}

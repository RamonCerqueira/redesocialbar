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
      const offset = Math.max(-48, Math.min(48, (window.innerHeight / 2 - bounds.top - bounds.height / 2) * .16));
      element.style.setProperty('--promo-offset', `${offset}px`);
    }
    function schedule() { if (!frame && visible && !motion.matches) frame = requestAnimationFrame(update); }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; element.dataset.visible = String(visible); if (visible) element.dataset.entered = 'true'; schedule(); });
    observer.observe(element);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, []);
  const demo = promotion.badge === 'DEMONSTRAÇÃO';
  const title = demo ? promotion.title.replace(/\s*[—–-]\s*demonstração$/i, '') : promotion.title;
  return <section className="promotion-feature-section" aria-label="Promoção em destaque"><Link ref={card} href="/promocoes" className="promotion-feature"><img src={promotion.imageUrl || '/hero-brinde-v2.png'} alt="" loading="lazy" decoding="async" /><div className="promotion-feature-shade" /><div className="promotion-atmosphere" aria-hidden="true"><i /><i /><i /></div><div className="promotion-feature-copy"><span className="promotion-section-kicker"><Ticket size={14} /> VIVA O PIRAMBA</span><span className="promotion-feature-badge">{promotion.badge || 'EXCLUSIVO NO APP'}</span><h2>{title}</h2><p>{promotion.discountText}</p><span className="promotion-feature-cta">{demo ? 'Explorar os cupons' : 'Ver promoção'}<ArrowUpRight size={18} /></span>{demo && <small>Oferta de exemplo · sem valor comercial</small>}</div><span className="promotion-scroll-hint" aria-hidden="true"><i /> Mais momentos, mais encontros</span></Link></section>;
}
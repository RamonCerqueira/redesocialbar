'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Restaurant } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  MapPin,
  Clock,
  Phone,
  Instagram,
  Star,
  Users,
  Utensils,
  Wine,
  Calendar,
  Tag,
  CheckCircle2,
  Beer,
  Award,
  Flame,
  Sparkles,
  Timer,
  UserRound,
} from 'lucide-react';

interface RestaurantPageProps {
  params: Promise<{ slug: string }>;
}

export default function RestaurantDetailPage({ params }: RestaurantPageProps) {
  const { slug } = React.use(params);
  const { activeCheckIn, setActiveCheckIn } = useAuth();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'CARDAPIO' | 'EVENTOS' | 'PROMOCOES'>('CARDAPIO');
  const [isLoading, setIsLoading] = useState(true);

  const loadRestaurant = async () => {
    try {
      const data = await apiRequest<any>(`/restaurants/${slug}`);
      setRestaurant(data);
    } catch (err) {
      console.error('Erro ao carregar restaurante:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRestaurant();
  }, [slug]);

  const handleCheckIn = async () => {
    try {
      const res = await apiRequest<any>('/check-ins', {
        method: 'POST',
        body: JSON.stringify({
          restaurantSlug: slug,
          approxLatitude: -13.0031,
          approxLongitude: -38.4554,
        }),
      });
      setActiveCheckIn(res);
      loadRestaurant();
      alert('Check-in realizado com sucesso no Restaurante Pirambeira!');
    } catch (err: any) {
      alert(err.message || 'Erro ao realizar check-in.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  function summarizeHours(hours: Record<string,string> | undefined | null): string {
    if (!hours || typeof hours !== 'object') return 'Consulte o horário no local';
    const entries = Object.entries(hours).filter(([,v])=>v && String(v).trim() && !/fechad/i.test(String(v)));
    if (!entries.length) return 'Fechado agora · consulte o local';
    if (entries.length === 7) {
      const sample = entries[0][1];
      if (entries.every(([,v]) => v === sample)) return sample;
    }
    const todayIdx = (new Date().getDay() + 6) % 7;
    const days = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
    const today = days[todayIdx];
    const todayEntry = entries.find(([k])=>k===today) || entries[0];
    if (!todayEntry) return entries[0][1];
    return todayEntry[1] + ' · ' + today.toLowerCase();
  }

  const fallbackCover = 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80';
  const fallbackLogo = '/LogoPirambeiraSemFundo.png';
  const logoUrl = restaurant.logoUrl || fallbackLogo;
  const taglineText = restaurant.tagline || 'Bar & Encontros';
  const subLocality = [restaurant.neighborhood, [restaurant.city, restaurant.state].filter(Boolean).join(' - ')].filter(Boolean).join(' • ') || 'Salvador - BA';
  const scheduleText = summarizeHours(restaurant.openingHours as Record<string,string> | undefined | null);

  if (!restaurant) {
    return (
      <div className="surface-elevated rounded-3xl p-8 text-center border border-[#2C221A]">
        <h3 className="font-display font-bold text-[#FBF8F5]">Restaurante não encontrado</h3>
      </div>
    );
  }

  return (
    <div className="pb-24 space-y-5">
      {/* 1. Cover: height 190, relative, gradient linear-gradient(transparent,#080807) */}
      <div className="relative h-[190px] w-full overflow-hidden bg-[#080807]">
        <img
          src={
            restaurant.coverUrl || fallbackCover
          }
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, #080807 100%)',
          }}
        />

        {/* Rating Badge Top Right */}
        <div className="absolute top-3 right-4 bg-[#080807]/85 backdrop-blur-md border border-[#FFB800]/30 text-[#FFB800] px-3 py-1 rounded-full flex items-center gap-1 text-[11px] font-black shadow-lg">
          <Star className="w-3 h-3 fill-[#FFB800]" />
          <span>{restaurant.rating || 4.9}</span>
        </div>
      </div>

      {/* 2. Profile Identity: marginTop -50, padding 0 18px */}
      <div className="-mt-[50px] relative px-[18px] z-10">
        <div className="flex items-end justify-between">
          {/* Avatar: width 90, height 90, borderRadius 45, border 4px solid #080807 */}
          <div className="w-[90px] h-[90px] rounded-[45px] border-[4px] border-[#080807] overflow-hidden bg-[#11100F] shadow-2xl relative">
            <img
              src={logoUrl}
              alt={restaurant.name}
              className="w-full h-full object-contain p-1.5"
            />
          </div>

          {/* Status de Check-in Ativo */}
          {activeCheckIn?.restaurant?.slug === slug ? (
            <div className="bg-[#00D084]/15 border border-[#00D084]/40 text-[#00D084] text-xs px-3.5 py-1.5 rounded-full font-black flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00D084] indicator-pulse-emerald" />
              <span>Você está aqui</span>
            </div>
          ) : (
            <button
              onClick={handleCheckIn}
              className="h-[38px] px-4 rounded-[19px] bg-[#FFB800] text-[#080807] font-display font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,184,0,0.35)] active:scale-95 transition-all cursor-pointer"
            >
              <Beer className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Check-in</span>
            </button>
          )}
        </div>

        {/* Name: fontSize 21, fontWeight 800 */}
        <div className="mt-3">
          <h1 className="font-display font-extrabold text-[21px] text-white tracking-tight leading-tight flex items-center gap-1.5">
            {restaurant.name}
            <span className="w-4 h-4 rounded-full bg-[#1D9BF0] flex items-center justify-center text-white text-[9px] font-black leading-none shrink-0" title="Verificado Oficial">
              ✓
            </span>
          </h1>
          <p className="text-xs text-[#AAA49C] mt-0.5 font-medium">
            {taglineText} • {subLocality}
          </p>
        </div>

        {/* 3. Stats: display grid, repeat(3, 1fr), marginTop 16, padding 14px 0, borderTop 1px solid #29251F, borderBottom 1px solid #29251F */}
        <div className="grid grid-cols-3 mt-4 py-[14px] border-t border-b border-[#29251F] text-center">
          <div>
            <span className="font-display font-extrabold text-[16px] text-[#00D084] block leading-none">
              {restaurant.activePeopleCount ?? 0}
            </span>
            <span className="text-[10px] text-[#716D68] uppercase font-bold tracking-wider mt-1 block">
              No Bar Agora
            </span>
          </div>
          <div className="border-l border-r border-[#29251F]">
            <span className="font-display font-extrabold text-[16px] text-white block leading-none">
              {restaurant.rating || 4.9}
            </span>
            <span className="text-[10px] text-[#716D68] uppercase font-bold tracking-wider mt-1 block">
              Avaliação
            </span>
          </div>
          <div>
            <span className="font-display font-extrabold text-[16px] text-[#FFB800] block leading-none">
              {scheduleText}
            </span>
            <span className="text-[10px] text-[#716D68] uppercase font-bold tracking-wider mt-1 block">
              Horário
            </span>
          </div>
        </div>

        {/* 4. Actions: grid 2 colunas, gap 8, marginTop 12, buttons height 38, borderRadius 19, border 1px solid #FFB800 */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={() => setActiveTab('CARDAPIO')}
            className="h-[38px] rounded-[19px] border border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800]/10 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Cardápio</span>
          </button>
          <a
            href={`https://instagram.com/${restaurant.instagram?.replace('@', '') || 'pirambeira.bar'}`}
            target="_blank"
            rel="noreferrer"
            className="h-[38px] rounded-[19px] border border-[#302A20] bg-[#11100F] text-white hover:border-[#FFB800]/40 font-display font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Instagram className="w-3.5 h-3.5 text-[#FF2D70]" />
            <span>Instagram</span>
          </a>
        </div>

        {/* 5. Story Highlights: display flex, gap 12, padding 18px 0, overflow-x-auto */}
        <div className="flex items-center gap-3 py-[18px] overflow-x-auto scroll-x-hide">
          {[
            { label: 'Drinks 🍸', img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=150&q=80' },
            { label: 'Samba 🎶', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=150&q=80' },
            { label: 'Petiscos 🍤', img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=150&q=80' },
            { label: 'Galera 🍻', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=150&q=80' },
          ].map((hl) => (
            <div key={hl.label} className="w-[58px] shrink-0 text-center cursor-pointer group">
              <div className="w-[58px] h-[58px] rounded-full p-[2px] border-2 border-[#FFB800] group-hover:scale-105 transition-transform overflow-hidden">
                <img src={hl.img} alt={hl.label} className="w-full h-full rounded-full object-cover" />
              </div>
              <span className="text-[10px] font-medium text-[#AAA49C] mt-1 block truncate">
                {hl.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-[#18130F] rounded-2xl border border-[#2C221A]">
        <button
          onClick={() => setActiveTab('CARDAPIO')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'CARDAPIO'
              ? 'amber-gradient text-[#080706] shadow-md glow-amber-sm'
              : 'text-[#A89F96] hover:text-[#FBF8F5]'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Cardápio Digital</span>
        </button>

        <button
          onClick={() => setActiveTab('EVENTOS')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'EVENTOS'
              ? 'amber-gradient text-[#080706] shadow-md glow-amber-sm'
              : 'text-[#A89F96] hover:text-[#FBF8F5]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Eventos ({restaurant.events?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('PROMOCOES')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'PROMOCOES'
              ? 'amber-gradient text-[#080706] shadow-md glow-amber-sm'
              : 'text-[#A89F96] hover:text-[#FBF8F5]'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Promoções ({restaurant.promotions?.length || 0})</span>
        </button>
      </div>

      {/* Tab Content: Cardápio PREMIUM */}
      {activeTab === 'CARDAPIO' && (
        <div className="premium-menu-space">
          {(!restaurant.menuCategories || (Array.isArray(restaurant.menuCategories) && restaurant.menuCategories.length===0)) && (
            <div className="surface-elevated rounded-3xl p-8 sm:p-10 border border-amber-500/15 text-center menu-empty-premium">
              <div className="menu-empty-ornament">✦ ⋆ ✦ ⋆ ✦</div>
              <Utensils size={48} className="text-amber-400/70 mx-auto mb-4" />
              <h3 className="font-display font-black text-[#FBF8F5] text-lg">Cardápio em preparação</h3>
              <p className="text-[13px] text-[#A89F96] mt-3 max-w-md mx-auto leading-relaxed">Nosso cardápio digital completo estará disponível aqui em breve. Enquanto isso, chame o garçom ou consulte nossas redes sociais!</p>
              <div className="menu-empty-ornament bottom">✦ ⋆ ✦ ⋆ ✦</div>
            </div>
          )}

          {/* ========================== HERO DESTAQUE DA SEMANA DO CHEF ========================== */}
          {(() => {
            let pick: any = null;
            let fromCatName = '';
            (restaurant.menuCategories||[]).forEach((c:any)=>{
              (c.items||[]).forEach((it:any)=>{
                if(!pick && !!it.isWeeklyPick){ pick = it; fromCatName = String(c.name||''); }
              });
            });
            if(!pick) return null;
            const hasImg = !!pick.imageUrl && String(pick.imageUrl).length>4;
            return (
              <section className="weekly-pick-hero" aria-label="Destaque da semana do chef">
                <div className="wp-frame-out">
                  <div className="wp-frame-in">
                    <div className="wp-corner tl" aria-hidden/><div className="wp-corner tr" aria-hidden/>
                    <div className="wp-corner bl" aria-hidden/><div className="wp-corner br" aria-hidden/>
                    <div className="wp-ribbon-top">
                      <span/><span className="wp-ribbon-text">DESTAQUE DA SEMANA</span><span/>
                    </div>

                    <div className={'wp-grid'+(hasImg?'':' noimg')}>
                      {hasImg && (
                        <div className="wp-photo">
                          <img src={String(pick.imageUrl)} alt={String(pick.name||'Destaque da semana')}/>
                          <div className="wp-photo-vignette" aria-hidden/>
                          <div className="wp-photo-tag">
                            <Award size={13}/>
                            <span>{fromCatName}</span>
                          </div>
                          <div className="wp-photo-shimmer" aria-hidden/>
                        </div>
                      )}

                      <div className="wp-body">
                        <div className="wp-kicker">
                          <span className="wp-kicker-dot"/>
                          <span>SELECIONADO PELO CHEF</span>
                          <span className="wp-kicker-dot"/>
                        </div>
                        <h2 className="wp-name">{pick.name}</h2>
                        {pick.weeklyPickNote && (
                          <blockquote className="wp-chef-note">
                            <span className="wp-quote-mark">“</span>
                            <p>{pick.weeklyPickNote}</p>
                          </blockquote>
                        )}
                        {!pick.weeklyPickNote && pick.description && (
                          <p className="wp-desc">{pick.description}</p>
                        )}
                        {pick.description && pick.weeklyPickNote && (
                          <p className="wp-desc small">{pick.description}</p>
                        )}

                        <div className="wp-meta">
                          {pick.portion && (
                            <span className="wp-meta-chip">
                              <UserRound size={13}/> {pick.portion}
                            </span>
                          )}
                          {pick.prepTime && (
                            <span className="wp-meta-chip">
                              <Timer size={13}/> {pick.prepTime}
                            </span>
                          )}
                          {Array.isArray(pick.tags) && pick.tags.slice(0,4).map((t:string)=>(
                            <span key={t} className="wp-meta-chip soft">
                              <Tag size={12}/> {t}
                            </span>
                          ))}
                          {pick.isChefPick && (
                            <span className="wp-meta-chip accent">
                              <Sparkles size={13}/> Chef’s Pick
                            </span>
                          )}
                        </div>

                        <div className="wp-price-row">
                          <div className="wp-price-box">
                            <small>por</small>
                            <div className="wp-price">
                              <span className="wp-price-cur">R$</span>
                              <span className="wp-price-val">{String(pick.price||'').replace(/^R\$\s*/i,'')}</span>
                            </div>
                          </div>
                          <div className="wp-call">
                            <Sparkles size={15}/>
                            <span>Peça agora no garçom</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </section>
            );
          })()}

          <div className="menu-hero-deco" aria-hidden>
            <svg viewBox="0 0 400 18" preserveAspectRatio="none" aria-hidden><defs><linearGradient id="dl" x1="0" x2="1"><stop offset="0%" stopColor="transparent"/><stop offset="50%" stopColor="#f59e0b" stopOpacity=".6"/><stop offset="100%" stopColor="transparent"/></linearGradient></defs><path d="M0 9 H400" stroke="url(#dl)" strokeWidth="1" fill="none"/><circle cx="200" cy="9" r="3.5" fill="#f59e0b" fillOpacity=".85"/></svg>
          </div>

          {restaurant.menuCategories?.map((cat: any, ci: number) => {
            const items = Array.isArray(cat.items) ? cat.items : [];
            const catIcon = (cat.name||'').toLowerCase();
            const ico = catIcon.includes('drink')||catIcon.includes('bebida')||catIcon.includes('chopp')||catIcon.includes('cocktail') ? Wine : catIcon.includes('petisco')||catIcon.includes('entrada')||catIcon.includes('bar') ? Beer : Utensils;
            const Icon = ico;
            return (
              <section key={(cat.name||'cat')+ci} className={'pm-cat'+(cat.highlight?' highlight':'')}>
                <header className="pm-cat-head">
                  <div className="pm-cat-title-row">
                    <div className="pm-cat-glyph">
                      {cat.highlight && <Award className="pm-cat-star" size={15}/>}
                      <Icon size={18}/>
                    </div>
                    <div>
                      <h3 className="pm-cat-title">{String(cat.name||'Categoria').toUpperCase()}</h3>
                      {cat.description && <p className="pm-cat-desc">{cat.description}</p>}
                    </div>
                    <div className="pm-cat-count" aria-hidden>
                      <small>{items.length}</small>
                    </div>
                  </div>
                  <div className="pm-cat-rule" aria-hidden>
                    <span/>
                    <svg viewBox="0 0 40 10" width="40" height="10" preserveAspectRatio="none"><path d="M0 5 H15 M25 5 H40 M20 2 Q20 8 20 8" stroke="#f59e0b" strokeOpacity=".55" strokeWidth="1" fill="none" strokeLinecap="round"/></svg>
                    <span/>
                  </div>
                </header>

                {!items.length && (
                  <div className="pm-cat-empty">Categoria sem itens ainda.</div>
                )}

                <ul className="pm-list">
                  {items.map((item: any, ii: number) => {
                    const hasImage = !!item.imageUrl && String(item.imageUrl).length>4;
                    return (
                      <li key={(item.name||'it')+ii} className={'pm-item'+(item.isChefPick?' chef':'')+(item.isNew?' new':'')+(item.isPromo?' promo':'')+(hasImage?' hasimg':' noimg')}>
                        <div className="pm-item-imgwrap" aria-hidden={!hasImage}>
                          {hasImage && (
                            <>
                              <img src={String(item.imageUrl)} alt={String(item.name||'')} loading="lazy"/>
                              <div className="pm-item-img-shine" aria-hidden/>
                            </>
                          )}
                        </div>

                        <div className="pm-item-body">
                          <div className="pm-item-head">
                            <div className="pm-item-headline">
                              <h4 className="pm-item-name">{item.name}</h4>
                              <div className="pm-item-badges">
                                {item.isChefPick && (
                                  <span className="pm-badge chef">
                                    <Sparkles size={11}/> Chef’s Pick
                                  </span>
                                )}
                                {item.isPromo && (
                                  <span className="pm-badge promo">
                                    <Flame size={11}/> Promoção
                                  </span>
                                )}
                                {item.isNew && (
                                  <span className="pm-badge new">
                                    <Sparkles size={11}/> Novo
                                  </span>
                                )}
                                {Array.isArray(item.tags) && item.tags.slice(0,3).map((t:string)=>(
                                  <span key={t} className="pm-badge tag">{t}</span>
                                ))}
                              </div>
                            </div>
                            <div className="pm-item-price">
                              <span className="pm-item-price-currency">R$</span>
                              <span className="pm-item-price-value">{String(item.price||'').replace(/^R\$\s*/i,'')}</span>
                            </div>
                          </div>

                          {item.description && (
                            <p className="pm-item-desc">
                              {item.description}
                            </p>
                          )}

                          <div className="pm-item-meta">
                            {item.portion && (
                              <span className="pm-meta">
                                <UserRound size={12}/> {item.portion}
                              </span>
                            )}
                            {item.prepTime && (
                              <span className="pm-meta">
                                <Timer size={12}/> {item.prepTime}
                              </span>
                            )}
                            {Array.isArray(item.tags) && item.tags.length>3 && (
                              <span className="pm-meta moretags">+ {item.tags.length-3} etiquetas</span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

          {!!restaurant.menuCategories?.length && (
            <div className="menu-footer-deco">
              <svg viewBox="0 0 400 26" preserveAspectRatio="none"><defs><linearGradient id="d2" x1="0" x2="1"><stop offset="0%" stopColor="transparent"/><stop offset="50%" stopColor="#f59e0b" stopOpacity=".45"/><stop offset="100%" stopColor="transparent"/></linearGradient></defs><path d="M0 13 H160 M240 13 H400" stroke="url(#d2)" strokeWidth="1" fill="none"/><g transform="translate(200 13)"><path d="M-14 0 L0 -9 L14 0 L0 9 Z" fill="#f59e0b" fillOpacity=".85"/></g></svg>
              <p className="menu-footer-msg">Cardápio sujeito a alteração sem aviso prévio · Imagens meramente ilustrativas.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Eventos */}
      {activeTab === 'EVENTOS' && (
        <div className="space-y-4">
          {restaurant.events?.map((ev: any) => (
            <div key={ev.id} className="surface-elevated rounded-3xl p-5 border border-amber-500/20 flex justify-between items-center gap-4">
              <div>
                <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider">{ev.category}</span>
                <h4 className="font-display font-bold text-[#FBF8F5] text-sm mt-0.5">{ev.title}</h4>
                <p className="text-xs text-[#A89F96] mt-1">{ev.description}</p>
                <span className="text-[11px] text-[#6E655D] mt-2 block font-mono">
                  {new Date(ev.date).toLocaleDateString('pt-BR')} às {ev.startTime}
                </span>
              </div>
              <Link
                href="/eventos"
                className="py-2 px-3.5 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs shrink-0 shadow-sm glow-amber-sm"
              >
                Participar
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Promoções */}
      {activeTab === 'PROMOCOES' && (
        <div className="space-y-4">
          {restaurant.promotions?.map((p: any) => (
            <div key={p.id} className="surface-elevated rounded-3xl p-5 border border-amber-500/25 flex justify-between items-center gap-4 glow-amber-sm">
              <div>
                <span className="font-display font-black text-amber-400 text-lg block">{p.discountText}</span>
                <h4 className="font-display font-bold text-[#FBF8F5] text-xs mt-0.5">{p.title}</h4>
                <p className="text-[11px] text-[#A89F96] mt-1">{p.description}</p>
              </div>
              <Link
                href="/promocoes"
                className="py-2 px-3.5 rounded-2xl amber-gradient text-[#080706] font-display font-black text-xs shrink-0 shadow-sm glow-amber-sm"
              >
                Resgatar
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

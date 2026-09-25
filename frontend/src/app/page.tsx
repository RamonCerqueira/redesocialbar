'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { Post, Story, Patron, Promotion, CheckIn } from '@/lib/types';
import { SponsoredCard } from '@/components/sponsored-card';
import { PostCard } from '@/components/post-card';
import { DeAgoraCameraModal } from '@/components/de-agora-camera-modal';
import { DeAgoraViewerModal } from '@/components/de-agora-viewer-modal';
import { Flame, ArrowRight, CalendarDays, Users, Ticket, Plus, ChevronRight, Loader2, MapPin, Camera } from 'lucide-react';
import './home.css';

export default function HomePage() {
  const { user, activeCheckIn, setActiveCheckIn } = useAuth();
  const [patrons, setPatrons] = useState<Patron[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [stories, setStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [cover, setCover] = useState('/hero-brinde-v2.png');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [camera, setCamera] = useState(false);
  const [viewer, setViewer] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [greeting, setGreeting] = useState('Boas-vindas,');
  const [visiblePosts, setVisiblePosts] = useState(3);
  const checkedIn = activeCheckIn?.restaurant?.slug === 'pirambeira';

  const loadPatrons = useCallback(async () => {
    const data = await apiRequest<{totalActivePatrons:number;patrons:Patron[]}>('/check-ins/who-is-here/pirambeira?filter=all');
    setPatrons(data.patrons); setActiveCount(data.totalActivePatrons);
  }, []);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    const results = await Promise.allSettled([
      loadPatrons(),
      apiRequest<Story[]>('/stories/restaurant/pirambeira').then(setStories),
      apiRequest<Post[]>('/posts/bar/pirambeira').then(setPosts),
      apiRequest<Promotion[]>('/promotions/restaurant/pirambeira').then(setPromotions),
      apiRequest<{coverUrl?:string}>('/restaurants/pirambeira').then(data => { if(data.coverUrl)setCover(data.coverUrl); }),
    ]);
    if(results.some(result=>result.status==='rejected')) setError('Não foi possível atualizar parte da página.');
    setLoading(false);
  }, [loadPatrons]);
  useEffect(() => {
    void load();
    const hour=Number(new Intl.DateTimeFormat('pt-BR',{hour:'numeric',hourCycle:'h23',timeZone:'America/Bahia'}).format(new Date()));
    setGreeting(hour<12?'Bom dia,':hour<18?'Boa tarde,':'Boa noite,');
  }, [load, user?.id]);

  async function toggleCheckIn() {
    if(!user){window.location.href='/login';return;}
    if(checkedIn&&!window.confirm('Deseja encerrar seu check-in no Pirambeira?'))return;
    setProcessing(true);setError('');
    try {
      if(checkedIn){await apiRequest('/check-ins/checkout',{method:'POST'});setActiveCheckIn(null);}
      else {const result=await apiRequest<CheckIn>('/check-ins',{method:'POST',body:JSON.stringify({restaurantSlug:'pirambeira'})});setActiveCheckIn(result);}
      await loadPatrons();
    } catch(error) { setError(error instanceof Error?error.message:'Não foi possível atualizar seu check-in.'); }
    finally {setProcessing(false);}
  }
  const promotion=promotions.find(item=>item.isAvailable);
  return <div className="piramba-home">
    {error&&<div role="alert" className="home-error">{error}<button onClick={()=>void load()}>Tentar novamente</button></div>}
    <section className="home-hero" aria-labelledby="welcome-title">
      <img src={cover} alt="Um brinde no Pirambeira" className="home-hero-photo"/>
      <div className="home-hero-shade"/>
      <div className="home-welcome"><p>👋 {greeting}</p><h1 id="welcome-title">{user?.profile?.name?.split(' ')[0]||'Pírambeiro'}!</h1><span>Sua mesa, seus encontros.<br/>Bora viver essa noite?</span></div>
      <div className="home-hero-bottom"><Link href="/aqui" className="home-presence"><i/><span><strong>{loading?'…':activeCount} pessoas</strong><span> no bar agora</span></span></Link>
        <button onClick={toggleCheckIn} disabled={processing} className={'home-checkin'+(checkedIn?' is-present':'')}>{processing?<Loader2 size={16} className="animate-spin"/>:<MapPin size={16}/>}<span>{checkedIn?'ESTOU AQUI ✓':'ESTOU AQUI'}</span></button>
      </div>
    </section>

    <section aria-labelledby="stories-title"><div className="home-section-heading"><h2 id="stories-title"><span className="home-dash"/>Stories <small>DE AGORA</small></h2><button disabled={!stories.length} onClick={()=>{setStoryIndex(0);setViewer(true);}}>Ver todos <ArrowRight size={15}/></button></div>
      <div className="home-stories"><button className="home-story" onClick={()=>user?setCamera(true):window.location.assign('/login')} aria-label="Adicionar story"><span className="home-story-ring own"><Camera size={26}/><i><Plus size={15}/></i></span><span>Seu story</span></button>
        {stories.map((story,index)=><button className="home-story" key={story.id} onClick={()=>{setStoryIndex(index);setViewer(true);}}><span className="home-story-ring"><img src={story.author.avatarUrl||'/LogoPirambeiraSemFundo.png'} alt=""/></span><span>{story.author.name}</span></button>)}
        {!stories.length&&<p className="home-muted">{loading?'Carregando momentos…':'A noite começa com você. Compartilhe um momento.'}</p>}
      </div>
    </section>

    <section className="home-people"><Link className="home-people-heading" href="/aqui"><Users size={28}/><div><h2><i/>No Pirambeira agora</h2><p>{loading?'Atualizando presença…':`${activeCount} pessoas estão aqui neste momento`}</p></div><ChevronRight size={20}/></Link>
      <div className="home-patrons">{patrons.slice(0,10).map(person=><Link href={`/perfil/${person.username}`} key={person.checkInId} className="home-patron"><span><img src={person.avatarUrl||'/LogoPirambeiraSemFundo.png'} alt=""/><i/></span><span>{person.name.split(' ')[0]}</span></Link>)}
        {!loading&&!patrons.length&&<p className="home-muted">{checkedIn?'Seu check-in está ativo. Sua visibilidade segue as preferências do seu perfil.':'Chegou? Faça check-in e encontre sua turma.'}</p>}
      </div>
    </section>

    {promotion&&<Link href="/promocoes" className="home-promotion"><img src={promotion.imageUrl||'/happy_hour_drinks.jpg'} alt=""/><div className="home-promotion-shade"/><div className="home-promotion-copy"><span className="home-promo-eyebrow">{promotion.badge||'BOA PEDIDA DA CASA'}</span><h2>{promotion.title}</h2><p>{promotion.discountText}</p><span className="home-promo-button">Ver promoção <ArrowRight size={16}/></span></div></Link>}
    <SponsoredCard placement="BANNER"/>

    <div className="home-shortcuts">
      <Link href="/aqui"><span className="shortcut-icon people"><Users/></span><div><strong>Quem está aqui</strong><small>Encontre sua turma</small></div><ChevronRight size={15}/></Link>
      <Link href="/eventos"><span className="shortcut-icon events"><CalendarDays/></span><div><strong>Eventos</strong><small>Não perca nada</small></div><ChevronRight size={15}/></Link>
      <Link href="/promocoes"><span className="shortcut-icon offers"><Ticket/></span><div><strong>Promoções</strong><small>Ofertas da casa</small></div><ChevronRight size={15}/></Link>
    </div>
    <section><div className="home-section-heading"><h2><Flame size={20} className="text-orange-400"/>O que está rolando</h2><Link href="/feed">Ver mais <ArrowRight size={15}/></Link></div>
      <div className="space-y-4">{posts.slice(0,visiblePosts).map(post=><PostCard key={post.id} post={post}/>)}</div>
      {!loading&&!posts.length&&<div className="home-feed-empty"><Flame size={24}/><p>As novidades da casa aparecem aqui.</p><Link href="/feed">Explorar o feed <ArrowRight size={14}/></Link></div>}
      {posts.length>visiblePosts&&<button className="home-load-more" onClick={()=>setVisiblePosts(value=>value+3)}>Ver mais publicações</button>}
    </section>
    <SponsoredCard placement="SIDEBAR"/>
    <DeAgoraCameraModal isOpen={camera} onClose={()=>setCamera(false)} onStoryCreated={story=>{setStories(previous=>[story,...previous]);setCamera(false);setStoryIndex(0);setViewer(true);}}/>
    <DeAgoraViewerModal isOpen={viewer} stories={stories} initialIndex={storyIndex} onClose={()=>setViewer(false)}/>
  </div>;
}

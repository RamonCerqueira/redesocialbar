'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, FileText, Ticket, Megaphone, CalendarDays, Settings, ShieldCheck, LogOut, ExternalLink, UtensilsCrossed, Plus, Trash2, ChevronUp, ChevronDown, Camera as CameraIcon, Pencil, GripVertical, Clock, Layers, Sparkles, Star, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { ImageField, ResourceConfig, ResourceEditor } from '@/components/admin/resource-editor';
import './admin.css';
import { TeamPanel } from '@/components/admin/team-panel';
import { User } from '@/lib/types';
import { CategoryModal, MenuCategoryInput } from '@/components/admin/category-modal';
import { MenuItemModal, MenuItemInput, MENU_TAG_LIBRARY } from '@/components/admin/menu-item-modal';

type Section='dashboard'|'posts'|'promotions'|'coupons'|'ads'|'menu'|'events'|'settings'|'moderation'|'team';
const navigation=[{id:'dashboard',label:'Visão geral',icon:LayoutDashboard},{id:'posts',label:'Publicações',icon:FileText},{id:'menu',label:'Cardápio digital',icon:UtensilsCrossed},{id:'promotions',label:'Promoções',icon:Ticket},{id:'coupons',label:'Cupons emitidos',icon:Ticket},{id:'ads',label:'Banners e anúncios',icon:Megaphone},{id:'events',label:'Agenda de eventos',icon:CalendarDays},{id:'moderation',label:'Moderação',icon:ShieldCheck},{id:'settings',label:'Ajustes',icon:Settings}] as const;
const configs:Partial<Record<Section,ResourceConfig>>={
  posts:{title:'Publicações oficiais',singular:'Publicação',route:'posts',archiveLabel:'Remover',fields:[
    {key:'content',label:'Texto da publicação',type:'textarea',required:true,max:5000},
    {key:'imageUrl',label:'Imagem da publicação',type:'image'},
    {key:'buttonText',label:'Texto do botão',max:40},{key:'buttonUrl',label:'Endereço do botão',type:'url'},
    {key:'isPinned',label:'Fixar no topo do feed',type:'checkbox'},
  ]},
  promotions:{title:'Promoções e lotes de cupons',singular:'Promoção',route:'promotions',fields:[
    {key:'title',label:'Nome da promoção',required:true,max:140},{key:'discountText',label:'Benefício (ex.: 20% de desconto)',required:true,max:80},
    {key:'description',label:'Descrição',type:'textarea',required:true},{key:'imageUrl',label:'Imagem da promoção',type:'image'},
    {key:'validUntil',label:'Válida até',type:'datetime-local',required:true},
    {key:'totalCoupons',label:'Quantidade total de cupons',type:'number',required:true,default:50},
    {key:'terms',label:'Regras de utilização',type:'textarea'},{key:'badge',label:'Etiqueta (ex.: Happy hour)',max:40},
    {key:'buttonText',label:'Texto do botão de resgate',required:true,default:'Resgatar cupom',max:40},
    {key:'isActive',label:'Disponível para novos resgates',type:'checkbox',default:true},
  ]},
  ads:{title:'Banners e anúncios',singular:'Banner',route:'ads',previewKind:'banner',fields:[
    {key:'type',label:'Posição',type:'select',default:'BANNER',options:[{value:'BANNER',label:'Destaque na página inicial'},{value:'SPONSORED_POST',label:'Anúncio no feed'},{value:'SIDEBAR',label:'Sugestão da casa'}]},
    {key:'title',label:'Título',required:true,max:50,hint:'Chamada curta e direta. Até 50 caracteres para não quebrar.'},
    {key:'description',label:'Texto de apoio',type:'textarea',max:140,hint:'1 frase persuasiva. Até 140 caracteres.'},
    {key:'imageUrl',label:'Imagem do banner',type:'image',required:true,imageSizes:{'BANNER':'1400 x 500 (2.8:1) · wide','SPONSORED_POST':'1080 x 1080 (1:1) · quadrado','SIDEBAR':'800 x 600 (4:3) · paisagem'}},
    {key:'buttonText',label:'Texto do botão',required:true,default:'Saiba mais',max:18,hint:'CTA curto. Ex.: Saiba mais, Garantir, Ver cardápio.'},
    {key:'targetUrl',label:'Endereço do botão',type:'url',required:true,hint:'Link de destino quando o usuário tocar no botão.'},
    {key:'sponsorName',label:'Nome do anunciante',required:true,default:'Pirambeira',max:24,hint:'Exibido acima do título em destaque.'},
    {key:'isActive',label:'Exibir no aplicativo',type:'checkbox',default:true},
  ]},
  events:{title:'Agenda cultural',singular:'Evento',route:'events',archiveLabel:'Cancelar',fields:[
    {key:'title',label:'Nome do evento',required:true,max:140},{key:'category',label:'Categoria',required:true,default:'MÚSICA AO VIVO'},
    {key:'description',label:'Descrição',type:'textarea',required:true},{key:'coverImageUrl',label:'Imagem do evento',type:'image'},
    {key:'date',label:'Data do evento',type:'datetime-local',required:true},{key:'startTime',label:'Horário de início',type:'time',required:true,default:'19:00'},
    {key:'isActive',label:'Evento ativo',type:'checkbox',default:true},
  ]},
};
function errorText(error:unknown){return error instanceof Error?error.message:'Não foi possível concluir a operação.';}

export default function AdminPage(){
  const {user,isLoading,logout}=useAuth();
  const [section,setSection]=useState<Section>('dashboard');
  const [restaurants,setRestaurants]=useState<{slug:string;name:string}[]>([]);
  const [slug,setSlug]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const allowed=user?.role==='RESTAURANT_ADMIN'||user?.role==='SUPERADMIN';
  async function loadRestaurants(){
    setLoading(true);setError('');
    try{const list=await apiRequest<{slug:string;name:string}[]>('/admin/restaurants');setRestaurants(list);setSlug(list[0]?.slug||'');}
    catch(error){setError(errorText(error));}finally{setLoading(false);}
  }
  useEffect(()=>{if(!isLoading&&allowed)void loadRestaurants();},[isLoading,allowed]);
  if(isLoading)return <div className="admin-gate">Verificando acesso…</div>;
  if(!allowed)return <div className="admin-gate"><div><h1>Painel do restaurante</h1><p>Entre com uma conta autorizada para gerenciar o estabelecimento.</p><Link className="admin-button" href="/login">Entrar</Link> <Link className="admin-button secondary" href="/">Voltar ao aplicativo</Link></div></div>;
  return <div className="admin-workspace">
    <aside className="admin-sidebar"><div className="admin-brand">Pirambeira<span style={{color:'#e4b363'}}>.</span><small>GESTÃO DO RESTAURANTE</small></div>
      <nav className="admin-nav" aria-label="Menu administrativo">{navigation.map(item=><button key={item.id} aria-current={section===item.id?'page':undefined} onClick={()=>setSection(item.id)}><item.icon size={17}/>{item.label}</button>)}{user?.role==='SUPERADMIN'&&user.email.toLowerCase()==='ramon@pirambeira.com'&&<button aria-current={section==='team'?'page':undefined} onClick={()=>setSection('team')}><ShieldCheck size={17}/>Equipe e acessos</button>}</nav>
      <footer><p>{user?.profile?.name}</p><p>{user?.email}</p><div className="admin-actions"><Link href="/" target="_blank"><ExternalLink size={14} style={{display:'inline'}}/> Abrir aplicativo</Link><button className="admin-button secondary" onClick={logout}><LogOut size={14}/>Sair</button></div></footer>
    </aside>
    <main className="admin-main"><header className="admin-topbar"><div><small>ESTABELECIMENTO / ADMINISTRAÇÃO</small><h1>{section==='team'?'Equipe e acessos':navigation.find(n=>n.id===section)?.label}</h1></div>
      <label className="admin-field">Restaurante<select aria-label="Restaurante" value={slug} onChange={e=>setSlug(e.target.value)} disabled={loading}>{restaurants.map(r=><option key={r.slug} value={r.slug}>{r.name}</option>)}</select></label>
    </header>
      {error&&<div role="alert" className="admin-message error">{error} <button onClick={()=>void loadRestaurants()}>Tentar novamente</button></div>}
      {loading?<p>Carregando estabelecimentos…</p>:!slug?<div className="admin-empty">Esta conta ainda não possui um restaurante gerenciável.</div>:<>
        {configs[section]&&<ResourceEditor key={slug+section} slug={slug} config={configs[section]!}/>}
        {section==='menu'&&<MenuPanel key={slug} slug={slug}/>}
        {section==='dashboard'&&<Dashboard key={slug} slug={slug}/>}
        {section==='team'&&user?.role==='SUPERADMIN'&&<TeamPanel key={slug} slug={slug} currentUser={user}/>}
        {section==='coupons'&&<Coupons key={slug} slug={slug}/>}
        {section==='settings'&&<SettingsPanel key={slug} slug={slug}/>}
        {section==='moderation'&&<Moderation key={slug} slug={slug} superadmin={user?.role==='SUPERADMIN'}/>}
      </>}
    </main>
  </div>;
}

type DashboardData={metrics:Record<string,number>;charts:{hourlyTraffic:{hour:string;patrons:number}[]}};
function Dashboard({slug}:{slug:string}){
  const [data,setData]=useState<DashboardData|null>(null);const [error,setError]=useState('');
  async function load(){try{setData(await apiRequest<DashboardData>('/admin/dashboard/'+slug));setError('');}catch(error){setError(errorText(error));}}
  useEffect(()=>{void load();const timer=setInterval(()=>void load(),60000);return()=>clearInterval(timer);},[slug]);
  if(!data)return <div className={error?'admin-message error':'admin-muted'}>{error||'Carregando indicadores…'}{error&&<button onClick={()=>void load()}>Tentar novamente</button>}</div>;
  const cards=[['activePatronsCount','Presentes agora'],['todayCheckInsCount','Check-ins hoje'],['postsCount','Publicações'],['redeemedCouponsCount','Cupons emitidos'],['usedCouponsCount','Cupons utilizados'],['eventsCount','Eventos na agenda']];
  const max=Math.max(1,...data.charts.hourlyTraffic.map(x=>x.patrons));
  return <>{error&&<p role="alert" className="admin-message error">{error} Os indicadores abaixo são da última atualização.</p>}<p className="admin-muted" style={{marginBottom:20}}>Dados do estabelecimento · atualização a cada minuto · horário de Salvador</p>
    <div className="admin-stats">{cards.map(([key,label])=><div key={key} className="admin-card admin-stat"><span>{label}</span><strong>{data.metrics[key]??0}</strong></div>)}</div>
    <section className="admin-card"><h2>Chegadas por horário</h2><p className="admin-muted">Check-ins registrados hoje. Cada barra representa novas entradas.</p>
      <div className="admin-chart">{data.charts.hourlyTraffic.map(x=><div className="admin-bar" key={x.hour} title={x.hour+': '+x.patrons+' check-ins'}><span>{x.patrons}</span><div style={{height:Math.max(2,x.patrons/max*120)}}/><span>{x.hour}</span></div>)}</div>
    </section>
  </>;
}

type Coupon={id:string;code:string;status:string;claimedAt:string;usedAt:string|null;promotion:{title:string;validUntil:string};user:{profile:{name:string}|null}};
function Coupons({slug}:{slug:string}){
  const [items,setItems]=useState<Coupon[]>([]);const [cursor,setCursor]=useState<string|null>(null);const [code,setCode]=useState('');const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
  async function load(next?:string){
    setBusy(true);
    try{const data=await apiRequest<{items:Coupon[];nextCursor:string|null}>('/admin/'+slug+'/coupons'+(next?'?cursor='+encodeURIComponent(next):''));setItems(prev=>next?[...prev,...data.items]:data.items);setCursor(data.nextCursor);setError('');}
    catch(error){setError(errorText(error));}finally{setBusy(false);}
  }
  useEffect(()=>{void load();},[slug]);
  async function validate(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');setNotice('');
    try{const result=await apiRequest<{customer:{name:string};promotion:{title:string}}>('/promotions/validate',{method:'POST',body:JSON.stringify({code,restaurantSlug:slug})});setNotice('Cupom validado: '+result.promotion.title+' · '+result.customer.name);setCode('');await load();}
    catch(error){setError(errorText(error));}finally{setBusy(false);}
  }
  return <>{error&&<p role="alert" className="admin-message error">{error}</p>}{notice&&<p role="status" className="admin-message">{notice}</p>}
    <section className="admin-card" style={{marginBottom:22}}><h2>Validar cupom no atendimento</h2><p className="admin-muted">A confirmação registra o uso e impede que o código seja utilizado novamente.</p><form onSubmit={validate} className="admin-actions"><input aria-label="Código do cupom" placeholder="PIRAMBA-…" required value={code} onChange={e=>setCode(e.target.value.toUpperCase())} style={{maxWidth:360}}/><button className="admin-button" disabled={busy}>{busy?'Aguarde…':'Confirmar utilização'}</button></form></section>
    <section className="admin-card"><div className="admin-toolbar"><h2>Histórico de emissão</h2><button className="admin-button secondary" onClick={()=>void load()} disabled={busy}>Atualizar</button></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Código</th><th>Promoção</th><th>Cliente</th><th>Status</th><th>Emissão</th><th>Utilização</th></tr></thead><tbody>{items.map(c=><tr key={c.id}><td><code>{c.code}</code></td><td>{c.promotion.title}</td><td>{c.user.profile?.name||'Cliente'}</td><td>{c.status==='USED'?'Utilizado':new Date(c.promotion.validUntil)<new Date()?'Expirado':'Disponível'}</td><td>{new Date(c.claimedAt).toLocaleString('pt-BR')}</td><td>{c.usedAt?new Date(c.usedAt).toLocaleString('pt-BR'):'—'}</td></tr>)}</tbody></table></div>
      {!items.length&&!busy&&<div className="admin-empty">Nenhum cupom emitido. Crie uma promoção para disponibilizar o primeiro lote.</div>}{cursor&&<button disabled={busy} className="admin-button secondary" onClick={()=>void load(cursor)}>Carregar mais</button>}
    </section>
  </>;
}

const settingFields=[['name','Nome do restaurante'],['tagline','Frase de apresentação'],['description','Descrição'],['address','Endereço'],['neighborhood','Bairro'],['city','Cidade'],['state','UF'],['phone','Telefone'],['instagram','Instagram']] as const;
const days=['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
function SettingsPanel({slug}:{slug:string}){
  const [values,setValues]=useState<Record<string,string>>({});const [hours,setHours]=useState<Record<string,string>>({});const [loaded,setLoaded]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);const [uploading,setUploading]=useState(false);
  async function load(){try{const data=await apiRequest<Record<string,unknown>>('/admin/'+slug+'/settings');setValues(Object.fromEntries([...settingFields.map(([key])=>key),'logoUrl','coverUrl'].map(key=>[key,String(data[key]||'')])));setHours((data.openingHours as Record<string,string>)||{});setLoaded(true);setError('');}catch(error){setError(errorText(error));}}
  useEffect(()=>{void load();},[slug]);
  async function save(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');setNotice('');try{await apiRequest('/admin/'+slug+'/settings',{method:'PUT',body:JSON.stringify({...values,openingHours:hours})});setNotice('Dados do restaurante atualizados.');}catch(error){setError(errorText(error));}finally{setBusy(false);}}
  if(!loaded)return <p role={error?'alert':undefined}>{error||'Carregando ajustes…'}{error&&<button onClick={()=>void load()}>Tentar novamente</button>}</p>;
  return <>{error&&<p role="alert" className="admin-message error">{error}</p>}{notice&&<p role="status" className="admin-message">{notice}</p>}
    <form onSubmit={save}><div className="admin-grid">
      <section className="admin-card admin-form"><h2>Dados do estabelecimento</h2>{settingFields.map(([key,label])=><label className="admin-field" key={key}>{label}{key==='description'?<textarea value={values[key]} maxLength={5000} onChange={e=>setValues({...values,[key]:e.target.value})}/>:<input required={key==='name'||key==='address'} maxLength={key==='state'?2:key==='name'?140:300} value={values[key]} onChange={e=>setValues({...values,[key]:e.target.value})}/>}</label>)}</section>
      <section className="admin-card admin-form"><h2>Identidade e atendimento</h2><ImageField label="Logotipo" value={values.logoUrl} onChange={logoUrl=>setValues(prev=>({...prev,logoUrl}))} onBusy={setUploading}/><ImageField label="Imagem de capa" value={values.coverUrl} onChange={coverUrl=>setValues(prev=>({...prev,coverUrl}))} onBusy={setUploading}/>
        <h2>Horários de funcionamento</h2>{days.map(day=><label className="admin-field" key={day}>{day}<input placeholder="Ex.: 17h às 23h ou Fechado" value={hours[day]||''} onChange={e=>setHours({...hours,[day]:e.target.value})}/></label>)}
      </section>
    </div><button className="admin-button" style={{marginTop:20}} disabled={busy||uploading}>{busy?'Salvando…':'Salvar ajustes'}</button></form>
    <PasswordForm/>
  </>;
}
function PasswordForm(){
  const {login}=useAuth();
  const [currentPassword,setCurrent]=useState('');const [newPassword,setNew]=useState('');const [notice,setNotice]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  async function save(event:React.FormEvent){event.preventDefault();setBusy(true);setNotice('');setError('');try{const session=await apiRequest<{token:string;user:User}>('/auth/password',{method:'PUT',body:JSON.stringify({currentPassword,newPassword})});login(session.token,session.user);setCurrent('');setNew('');setNotice('Senha alterada. As outras sessões foram encerradas.');}catch(error){setError(errorText(error));}finally{setBusy(false);}}
  return <section className="admin-card" style={{marginTop:24}}><h2>Senha da sua conta</h2>{notice&&<p role="status" className="admin-message">{notice}</p>}{error&&<p role="alert" className="admin-message error">{error}</p>}<form className="admin-form" onSubmit={save} style={{maxWidth:420}}><label className="admin-field">Senha atual<input type="password" required autoComplete="current-password" value={currentPassword} onChange={e=>setCurrent(e.target.value)}/></label><label className="admin-field">Nova senha<input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={newPassword} onChange={e=>setNew(e.target.value)}/></label><button disabled={busy} className="admin-button">{busy?'Salvando…':'Alterar senha'}</button></form></section>;
}
type Report={id:string;reason:string;notes:string;targetType:string;status:string;createdAt:string;post?:{content:string};comment?:{content:string};targetedUser?:{profile:{name:string}}};
function Moderation({slug,superadmin}:{slug:string;superadmin:boolean}){
  const [reports,setReports]=useState<Report[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);
  async function load(){setLoading(true);try{setReports(await apiRequest<Report[]>('/moderation/reports?restaurantSlug='+slug));setError('');}catch(error){setError(errorText(error));}finally{setLoading(false);}}
  useEffect(()=>{void load();},[slug]);
  async function resolve(id:string,action:string){if(!window.confirm('Confirmar esta ação de moderação?'))return;setBusy(true);try{await apiRequest('/moderation/reports/'+id+'/resolve',{method:'POST',body:JSON.stringify({action})});await load();}catch(error){setError(errorText(error));}finally{setBusy(false);}}
  return <>{error&&<p role="alert" className="admin-message error">{error} <button onClick={()=>void load()}>Tentar novamente</button></p>}<p className="admin-muted" style={{marginBottom:20}}>Denúncias do estabelecimento. A identidade de quem denunciou é preservada.</p>{loading?<p>Carregando…</p>:<div className="admin-list">{!reports.length&&!error&&<div className="admin-empty">Nenhuma denúncia neste restaurante.</div>}{reports.map(r=><article className="admin-card" key={r.id}><span className="admin-badge">{r.status}</span><h2>{r.reason}</h2><p className="admin-muted">{r.post?.content||r.comment?.content||r.targetedUser?.profile.name}</p>{r.notes&&<p>{r.notes}</p>}<small className="admin-muted">{new Date(r.createdAt).toLocaleString('pt-BR')}</small>{['PENDING','INVESTIGATING'].includes(r.status)&&<div className="admin-actions"><button disabled={busy} className="admin-button secondary" onClick={()=>void resolve(r.id,'DISMISS')}>Arquivar</button>{r.targetType!=='USER'&&<button disabled={busy} className="admin-button danger" onClick={()=>void resolve(r.id,'REMOVE_CONTENT')}>Remover conteúdo</button>}{superadmin&&<button disabled={busy} className="admin-button danger" onClick={()=>void resolve(r.id,'BAN_USER')}>Banir conta</button>}</div>}</article>)}</div>}</>;
}

type MenuItem = {
  name: string;
  description?: string;
  price: string;
  imageUrl?: string;
  portion?: string;
  prepTime?: string;
  tags?: string[];
  isChefPick?: boolean;
  isNew?: boolean;
  isPromo?: boolean;
  isWeeklyPick?: boolean;
  weeklyPickNote?: string;
  isActive?: boolean;
};
type MenuCategory = { name: string; description?: string; highlight?: boolean; items: MenuItem[] };

const DEFAULT_MENU: MenuCategory[] = [
  {
    name: 'Assinatura do Chef',
    description: 'Pratos especiais que contam a história da casa.',
    highlight: true,
    items: [
      {
        name: 'Peixada Baiana do Pirambeira',
        description: 'Peixe fresco do dia cozido no leite de coco com dendê, camarão seco, pimenta de cheiro e farofa de dendê. Receita de família.',
        price: 'R$ 98,00',
        portion: 'Serve 2 pessoas',
        prepTime: '40 min',
        tags: ['Compartilhar', 'Artesanal', 'Favorito da casa'],
        isChefPick: true,
        imageUrl: '',
      },
      {
        name: 'Acarajé do Pai',
        description: 'Bolinho de feijão fradinho frito em azeite de dendê, recheado com vatapá cremoso, caruru e camarão seco.',
        price: 'R$ 28,00 (2 un.)',
        portion: '2 unidades',
        prepTime: '15 min',
        tags: ['Sem glúten', 'Artesanal'],
        isChefPick: true,
        imageUrl: '',
      },
    ],
  },
  {
    name: 'Drinks e Bebidas',
    description: 'Assinaturas do barman e clássicos.',
    items: [
      {
        name: 'Caipirinha do Pirambeira',
        description: 'Limão taiti, cachaça artesanal do recôncavo, açúcar cristal, gelo em pedra e toque de laranja baiana.',
        price: 'R$ 22,00',
        portion: '400 ml',
        prepTime: '5 min',
        tags: ['Favorito da casa'],
        isNew: true,
        imageUrl: '',
      },
      {
        name: 'Chopp Pilsen 300ml',
        description: 'Bebida cremosa com colarinho alto e gelada. Tirada na hora.',
        price: 'R$ 14,00',
        portion: '300 ml',
        prepTime: '2 min',
        tags: [],
        imageUrl: '',
      },
    ],
  },
  {
    name: 'Petiscos',
    description: 'Para beliscar enquanto paquera e toma uma.',
    items: [
      {
        name: 'Bolinho de Bacalhau da Vovó',
        description: 'Seis unidades com recheio cremoso, casquinha crocante e azeitonas no tempero.',
        price: 'R$ 48,00',
        portion: '6 unidades · Serve 2',
        prepTime: '18 min',
        tags: ['Compartilhar'],
        imageUrl: '',
      },
      {
        name: 'Calabresa Acebolada',
        description: 'Linguiça calabresa defumada salteada com cebola roxa, pimenta biquinho e toque de vinagre doce.',
        price: 'R$ 42,00',
        portion: 'Porção grande',
        prepTime: '15 min',
        tags: ['Apimentado', 'Compartilhar'],
        isPromo: true,
        imageUrl: '',
      },
    ],
  },
  {
    name: 'Pratos Principais',
    items: [
      {
        name: 'Moqueca de Camarão',
        description: 'Camarões grandes no leite de coco e azeite de dendê, acompanha arroz branco, pirão e farofa.',
        price: 'R$ 128,00',
        portion: 'Serve 2',
        prepTime: '45 min',
        tags: ['Sem glúten', 'Compartilhar'],
        imageUrl: '',
      },
    ],
  },
];

function MenuPanel({slug}:{slug:string}){
  const [categories,setCategories]=useState<MenuCategory[]>([]);
  const [initial,setInitial]=useState<MenuCategory[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [baseSettings,setBaseSettings]=useState<Record<string,unknown>>({});
  const [openCats,setOpenCats]=useState<Record<number,boolean>>({});
  const [expandAll,setExpandAll]=useState(true);
  const [fullViewCats,setFullViewCats]=useState<Record<number,boolean>>({});
  const PREVIEW_PER_CAT = 6;

  // --- Estados dos modais ---
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catModalEditIdx, setCatModalEditIdx] = useState<number | null>(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemModalMode, setItemModalMode] = useState<'create' | 'edit'>('create');
  const [itemModalCatIdx, setItemModalCatIdx] = useState<number | null>(null);
  const [itemModalEditIdx, setItemModalEditIdx] = useState<number | null>(null);

  function isOpen(i:number){return openCats[i] ?? expandAll;}
  function toggle(i:number){setOpenCats(prev=>({...prev,[i]:!(prev[i] ?? expandAll)}));}
  function isFull(i:number){return !!fullViewCats[i];}
  function toggleFull(i:number){setFullViewCats(prev=>({...prev,[i]:!prev[i]}));}

  async function load(){
    setLoading(true);setError('');
    try{
      const data=await apiRequest<Record<string,unknown>>('/admin/'+slug+'/settings');
      setBaseSettings(data);
      const raw=data.menuCategories;
      const list:MenuCategory[]=Array.isArray(raw)?(raw as MenuCategory[]).map(c=>({
        name:String(c.name||''),
        description:c.description?String(c.description):'',
        highlight:!!c.highlight,
        items:Array.isArray(c.items)?c.items.map((it:any)=>({
          name:String(it.name||''),
          description:it.description?String(it.description):'',
          price:String(it.price||''),
          imageUrl:it.imageUrl?String(it.imageUrl):'',
          portion:it.portion?String(it.portion):'',
          prepTime:it.prepTime?String(it.prepTime):'',
          tags:Array.isArray(it.tags)?it.tags.map(String):[],
          isChefPick:!!it.isChefPick,
          isNew:!!it.isNew,
          isPromo:!!it.isPromo,
          isWeeklyPick:!!it.isWeeklyPick,
          weeklyPickNote:it.weeklyPickNote?String(it.weeklyPickNote):'',
        })):[]
      })):[];
      setCategories(list);setInitial(JSON.parse(JSON.stringify(list)));
    }catch(err){setError(errorText(err));}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[slug]);

  const dirty=JSON.stringify(categories)!==JSON.stringify(initial);
  const totalItems=categories.reduce((s,c)=>s+c.items.length,0);
  const weeklyPickCount=categories.flatMap(c=>c.items).filter(i=>i.isWeeklyPick).length;
  const hasWeeklyPick=weeklyPickCount>0;

  function upd(i:number,c:MenuCategory){setCategories(prev=>{const n=[...prev];n[i]=c;return n;});}
  function move(i:number,dir:-1|1){
    const j=i+dir;
    if(j<0||j>=categories.length)return;
    setCategories(prev=>{const n=[...prev];[n[i],n[j]]=[n[j],n[i]];return n;});
  }

  // --- Ações de Categoria ---
  function openNewCategory() {
    setCatModalEditIdx(null);
    setCatModalOpen(true);
  }
  function openEditCategory(i: number) {
    setCatModalEditIdx(i);
    setCatModalOpen(true);
  }
  function handleSaveCategory(data: MenuCategoryInput) {
    if (catModalEditIdx !== null) {
      const cat = categories[catModalEditIdx];
      upd(catModalEditIdx, { ...cat, ...data });
    } else {
      const newIdx = categories.length;
      setCategories(prev => [...prev, { name: data.name, description: data.description || '', highlight: !!data.highlight, items: [] }]);
      setOpenCats(prev => ({ ...prev, [newIdx]: true }));
    }
    setCatModalOpen(false);
    setCatModalEditIdx(null);
  }
  function removeCategory(i:number){
    const cat=categories[i];
    if(cat.items.length>0&&!window.confirm('Remover a categoria "'+cat.name+'" e seus '+cat.items.length+' itens?'))return;
    setCategories(prev=>prev.filter((_,idx)=>idx!==i));
  }

  // --- Ações de Item ---
  function moveItem(ci:number,ii:number,dir:-1|1){
    const j=ii+dir;
    const cat=categories[ci];
    if(j<0||j>=cat.items.length)return;
    upd(ci,{...cat,items:cat.items.map((it,idx)=>idx===ii?cat.items[j]:idx===j?cat.items[ii]:it)});
  }
  function openNewItem(ci: number) {
    setItemModalMode('create');
    setItemModalCatIdx(ci);
    setItemModalEditIdx(null);
    setItemModalOpen(true);
  }
  function openEditItem(ci: number, ii: number) {
    setItemModalMode('edit');
    setItemModalCatIdx(ci);
    setItemModalEditIdx(ii);
    setItemModalOpen(true);
  }
  function applyWeeklyPickExclusive(newCatIdx: number, newItemIdx: number | null) {
    setCategories(prev => prev.map((c, ci) => ({
      ...c,
      items: c.items.map((it, ii) => {
        const isTarget = ci === newCatIdx && (newItemIdx === null ? false : ii === newItemIdx);
        if (isTarget) return it;
        return { ...it, isWeeklyPick: false, weeklyPickNote: it.isWeeklyPick ? '' : it.weeklyPickNote };
      }),
    })));
  }
  function handleSaveItemOne(data: MenuItemInput) {
    if (itemModalCatIdx === null) return;
    const ci = itemModalCatIdx;
    const cat = categories[ci];

    if (itemModalMode === 'edit' && itemModalEditIdx !== null) {
      const ii = itemModalEditIdx;
      if (data.isWeeklyPick) applyWeeklyPickExclusive(ci, ii);
      // atualiza o item dentro da categoria já atualizada acima, se necessário
      setCategories(prev => prev.map((c, i) => {
        if (i !== ci) return c;
        return {
          ...c,
          items: c.items.map((it, j) => (j === ii ? { ...it, ...data } : it)),
        };
      }));
    } else {
      // create — adiciona no final
      const newItem: MenuItem = {
        name: data.name,
        description: data.description || '',
        price: data.price,
        imageUrl: data.imageUrl || '',
        portion: data.portion || '',
        prepTime: data.prepTime || '',
        tags: data.tags || [],
        isChefPick: data.isChefPick || false,
        isNew: data.isNew || false,
        isPromo: data.isPromo || false,
        isWeeklyPick: data.isWeeklyPick || false,
        weeklyPickNote: data.weeklyPickNote || '',
      };
      if (newItem.isWeeklyPick) applyWeeklyPickExclusive(ci, null); // aplica exclusividade nas categorias *outras*
      // adiciona o item (aplicando exclusividade dentro da própria categoria também)
      setCategories(prev => prev.map((c, i) => {
        if (i !== ci) return c;
        return {
          ...c,
          items: [
            ...c.items.map(it => newItem.isWeeklyPick ? { ...it, isWeeklyPick: false, weeklyPickNote: '' } : it),
            newItem,
          ],
        };
      }));
      setFullViewCats(prev => ({ ...prev, [ci]: true }));
    }
  }
  function handleSaveItemAndClose(data: MenuItemInput) {
    handleSaveItemOne(data);
    setItemModalOpen(false);
  }
  function removeItem(ci:number,ii:number){const cat=categories[ci];upd(ci,{...cat,items:cat.items.filter((_,idx)=>idx!==ii)});}

  function loadExamples(){
    if(categories.length>0&&!window.confirm('Substituir o cardápio atual pelos exemplos padrão?'))return;
    const seeded = JSON.parse(JSON.stringify(DEFAULT_MENU)) as MenuCategory[];
    if(seeded[0]?.items?.[0])seeded[0].items[0].isWeeklyPick=true;
    if(seeded[0]?.items?.[0])seeded[0].items[0].weeklyPickNote='Uma viagem pela Bahia em cada garfada — peixe fresco do dia, camarão seco do recôncavo e o dendê que só a casa sabe fazer.';
    setCategories(seeded);
    setExpandAll(true);
    setOpenCats({});
    setFullViewCats({});
  }
  function clearAll(){
    if(!window.confirm('Apagar todo o cardápio (categorias e itens)?'))return;
    setCategories([]);
  }

  async function save(event:React.FormEvent){
    event.preventDefault();setSaving(true);setError('');setNotice('');
    try{
      for(let i=0;i<categories.length;i++){
        const c=categories[i];
        if(!String(c.name||'').trim())throw new Error('Nome da categoria '+(i+1)+' está em branco.');
        for(let j=0;j<c.items.length;j++){
          const it=c.items[j];
          if(!String(it.name||'').trim())throw new Error('Item '+(j+1)+' da categoria "'+c.name+'" está sem nome.');
          if(!String(it.price||'').trim())throw new Error('Informe o preço de "'+it.name+'".');
        }
      }
      if(weeklyPickCount>1)throw new Error('Escolha apenas UM item como Destaque da Semana.');
      const payload:Record<string,unknown>={...baseSettings,menuCategories:categories};
      await apiRequest('/admin/'+slug+'/settings',{method:'PUT',body:JSON.stringify(payload)});
      setInitial(JSON.parse(JSON.stringify(categories)));
      setNotice('Cardápio premium salvo e já disponível no aplicativo. ✨');
    }catch(err){setError(errorText(err));}finally{setSaving(false);}
  }

  if(loading)return <p className="admin-muted">Carregando cardápio premium…</p>;

  // dados para o modal de item
  const activeCat = itemModalCatIdx !== null ? categories[itemModalCatIdx] : null;
  const activeItem = (itemModalMode === 'edit' && itemModalCatIdx !== null && itemModalEditIdx !== null)
    ? categories[itemModalCatIdx]?.items?.[itemModalEditIdx]
    : null;

  return (
    <>
    <form onSubmit={save} className="admin-menu premium-menu">
      {error&&<div role="alert" className="admin-message error">{error}</div>}
      {notice&&<div role="status" className="admin-message">{notice}</div>}
      <div className="admin-menu-hero">
        {/* BLOCO 1: TÍTULO + AÇÕES RÁPIDAS */}
        <div className="amh-head">
          <div className="amh-title-wrap">
            <div className="amh-title-row">
              <div className="amh-emoji-badge">🍽️</div>
              <div>
                <h2 className="amh-title">Cardápio Premium</h2>
                <p className="amh-subtitle">
                  Organize por categorias e adicione pratos rapidamente com os modais.
                  Clique em <strong>+ Categoria</strong> para criar uma seção nova,
                  depois em <strong>+ Adicionar prato</strong> para cadastrar vários em sequência.
                </p>
              </div>
            </div>
          </div>
          <div className="amh-actions">
            <div className="amh-actions-row amh-actions-top">
              <span className="amh-live">
                <span className="amh-live-dot"></span> Ao vivo
              </span>
              <div className="amh-inline-actions">
                <button type="button" className="amh-link-btn" onClick={()=>{setExpandAll(true);setOpenCats({});}}>Expandir tudo</button>
                <span className="amh-divider" />
                <button type="button" className="amh-link-btn" onClick={()=>{setExpandAll(false);setOpenCats({});}}>Recolher tudo</button>
              </div>
            </div>
            <div className="amh-actions-row amh-actions-bot">
              <button type="button" className="admin-button secondary" onClick={loadExamples} title="Carrega modelo inicial com Destaque da Semana.">
                Modelo inicial
              </button>
              {categories.length > 0 && (
                <button type="button" className="admin-button secondary" onClick={clearAll}>
                  Limpar tudo
                </button>
              )}
              <button type="button" className="admin-button" onClick={openNewCategory}>
                <Plus size={14}/> Nova categoria
              </button>
              <button
                type="submit"
                className={'admin-button ' + (dirty ? 'primary' : 'muted')}
                disabled={saving || !dirty}
              >
                {saving ? 'Salvando…' : dirty ? 'Salvar alterações' : 'Salvo ✓'}
              </button>
            </div>
          </div>
        </div>

        {/* BLOCO 2: MÉTRICAS (CARDS KPI) */}
        <div className="amh-kpis">
          {/* 1. Categorias */}
          <div className="kpi-card kpi-cat">
            <div className="kpi-icon" aria-hidden><Layers size={17}/></div>
            <div className="kpi-info">
              <small className="kpi-label">Categorias</small>
              <div className="kpi-value">{categories.length}</div>
              <small className="kpi-helper">seções criadas</small>
            </div>
          </div>

          {/* 2. Itens totais */}
          <div className="kpi-card kpi-items">
            <div className="kpi-icon" aria-hidden><UtensilsCrossed size={17}/></div>
            <div className="kpi-info">
              <small className="kpi-label">Pratos</small>
              <div className="kpi-value">{totalItems}</div>
              <small className="kpi-helper">no cardápio total</small>
            </div>
          </div>

          {/* 3. Com foto */}
          <div className={'kpi-card ' + (totalItems > 0 && categories.flatMap(c=>c.items).filter(i=>i.imageUrl).length === 0 ? 'kpi-warn' : 'kpi-photo')}>
            <div className="kpi-icon" aria-hidden><CameraIcon size={17}/></div>
            <div className="kpi-info">
              <small className="kpi-label">Com foto</small>
              <div className="kpi-value">
                {categories.flatMap(c=>c.items).filter(i=>i.imageUrl).length}
                <span className="kpi-of">/ {totalItems}</span>
              </div>
              <small className="kpi-helper">
                {totalItems === 0
                  ? 'aguardando pratos'
                  : categories.flatMap(c=>c.items).filter(i=>i.imageUrl).length === 0
                    ? 'todos sem foto — recomendo fotos!'
                    : `${Math.round(categories.flatMap(c=>c.items).filter(i=>i.imageUrl).length / totalItems * 100)}% de cobertura`}
              </small>
            </div>
          </div>

          {/* 4. Chef's Pick */}
          <div className="kpi-card kpi-chef">
            <div className="kpi-icon" aria-hidden><Sparkles size={17}/></div>
            <div className="kpi-info">
              <small className="kpi-label">Chef's Pick</small>
              <div className="kpi-value">{categories.flatMap(c=>c.items).filter(i=>i.isChefPick).length}</div>
              <small className="kpi-helper">selos de recomendação</small>
            </div>
          </div>

          {/* 5. Destaque da Semana */}
          <div className={'kpi-card ' + (hasWeeklyPick ? 'kpi-weekly' : 'kpi-danger')}>
            <div className="kpi-icon" aria-hidden>
              {hasWeeklyPick ? <Star size={17}/> : <AlertTriangle size={17}/>}
            </div>
            <div className="kpi-info">
              <small className="kpi-label">Destaque da semana</small>
              <div className="kpi-value">
                {weeklyPickCount}
                <span className="kpi-of">/ 1</span>
              </div>
              <small className="kpi-helper">
                {hasWeeklyPick
                  ? 'definido ✓'
                  : 'escolha 1 item para a hero page'}
              </small>
            </div>
          </div>
        </div>
      </div>

      {categories.length===0?(
        <div className="admin-card" style={{textAlign:'center',padding:'52px 28px'}}>
          <UtensilsCrossed size={44} style={{color:'#f59e0b',margin:'0 auto 16px',display:'block'}}/>
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:6}}>Comece seu cardápio premium</h2>
          <p className="admin-muted" style={{margin:'0 auto 22px',maxWidth:560}}>Crie uma categoria e, dentro dela, adicione quantos pratos quiser. O modal permanece aberto para você cadastrar vários itens em sequência — basta preencher e clicar em "Salvar e adicionar outro".</p>
          <div className="admin-actions" style={{justifyContent:'center'}}>
            <button type="button" className="admin-button secondary" onClick={loadExamples}>Usar modelo inicial</button>
            <button type="button" className="admin-button" onClick={openNewCategory}><Plus size={14}/>Criar primeira categoria</button>
          </div>
        </div>
      ):(
        <div className="admin-list" style={{gap:18}}>
          {categories.map((cat,ci)=>{
            const open = isOpen(ci);
            const all = isFull(ci);
            const shown = all ? cat.items : cat.items.slice(0, PREVIEW_PER_CAT);
            const hiddenN = cat.items.length - shown.length;
            return (
              <article className={'admin-card menu-cat clean'+(cat.highlight?' highlight':'')+(open?' open':' collapsed')} key={ci}>
                <header className="menu-cat-head clean">
                  <button type="button" className="cat-accordion clean" onClick={()=>toggle(ci)} title={open?'Recolher categoria':'Expandir categoria'}>
                    <div className="cat-chev-wrap">
                      <ChevronDown size={18} className={'cat-chev '+(open?'up':'')}/>
                    </div>
                    <div className="menu-cat-head-main clean" style={{flex:1,minWidth:0}}>
                      <div className="cat-display">
                        <div className="cat-grip">
                          <GripVertical size={14} />
                        </div>
                        <div className="cat-display-info">
                          <div className="cat-display-row1">
                            <h3 className="cat-name">{cat.name}</h3>
                            {cat.highlight && (
                              <span className="cat-highlight-chip">✦ Destaque</span>
                            )}
                          </div>
                          {cat.description && (
                            <p className="cat-description">{cat.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                  <div className="admin-actions cat-actions" style={{margin:0}}>
                    <button type="button" className="admin-button secondary tiny" title="Editar categoria" onClick={()=>openEditCategory(ci)}>
                      <Pencil size={13}/> Editar
                    </button>
                    <button type="button" className="admin-button secondary tiny" title="Mover para cima" onClick={()=>move(ci,-1)} disabled={ci===0}><ChevronUp size={14}/></button>
                    <button type="button" className="admin-button secondary tiny" title="Mover para baixo" onClick={()=>move(ci,1)} disabled={ci===categories.length-1}><ChevronDown size={14}/></button>
                    <button type="button" className="admin-button danger tiny" title="Remover categoria" onClick={()=>removeCategory(ci)}><Trash2 size={14}/></button>
                  </div>
                </header>
                <div className="cat-items-count">
                  <small className="admin-muted">{cat.items.length} {cat.items.length===1?'prato':'pratos'}{!open && cat.items.length>0?` · ${shown.length} visíveis`:""}</small>
                </div>

                {open && (
                  <>
                    {cat.items.length>0?(
                      <div className="menu-items grid-view">
                        {shown.map((it,iiReal)=>{
                          const ii = iiReal;
                          return (
                            <article className={'mic'+(it.isChefPick?' chefpick':'')+(it.isPromo?' promo':'')+(it.isWeeklyPick?' weeklypick':'')+(it.isActive===false?' inactive':'')} key={ii+'::'+it.name}>
                              {/* CABEÇALHO DE AÇÕES FLUTUANTES NO TOPO */}
                              <div className="mic-actions-top">
                                <button type="button" className="mic-act up" title="Mover para cima" onClick={()=>moveItem(ci,ii,-1)} disabled={ii===0}><ChevronUp size={13}/></button>
                                <button type="button" className="mic-act edit" title="Editar prato" onClick={()=>openEditItem(ci,ii)}><Pencil size={13}/></button>
                                <button type="button" className="mic-act down" title="Mover para baixo" onClick={()=>moveItem(ci,ii,1)} disabled={ii===cat.items.length-1}><ChevronDown size={13}/></button>
                                <button type="button" className="mic-act del" title="Remover prato" onClick={()=>removeItem(ci,ii)}><Trash2 size={13}/></button>
                              </div>

                              {/* FOTO + SELOS */}
                              <div className="mic-photo">
                                {it.imageUrl?
                                  <img src={it.imageUrl} alt={it.name}/>:
                                  <div className="mic-photo-empty">
                                    <CameraIcon size={22}/>
                                    <span>Sem foto</span>
                                  </div>
                                }
                                <div className="mic-corner-tl">
                                  {it.isWeeklyPick && <span className="mic-seal weekly">📅 Semana</span>}
                                  {it.isChefPick && <span className="mic-seal chef">✨ Chef</span>}
                                </div>
                                <div className="mic-corner-tr">
                                  {it.isNew && <span className="mic-seal new">🆕 Novo</span>}
                                  {it.isPromo && <span className="mic-seal promo">🔥 Promo</span>}
                                </div>
                              </div>

                              {/* CONTEÚDO */}
                              <div className="mic-body">
                                <div className="mic-title-row">
                                  <h4 className="mic-name">{it.name}</h4>
                                  <strong className="mic-price">{it.price}</strong>
                                </div>
                                {it.description && <p className="mic-desc">{it.description}</p>}
                                <div className="mic-meta">
                                  {it.portion && <span title="Porção"><UtensilsCrossed size={11}/> {it.portion}</span>}
                                  {it.prepTime && <span title="Tempo de preparo"><Clock size={11}/> {it.prepTime}</span>}
                                </div>
                                {Array.isArray(it.tags) && it.tags.length>0 && (
                                  <div className="mic-tags">
                                    {it.tags.slice(0,4).map(t=>{
                                      const def=MENU_TAG_LIBRARY.find(x=>x.key===t);
                                      return <span key={t} className="mic-tag" style={def?{background:def.color+'18',color:def.color,border:'1px solid '+def.color+'35'}:undefined}>{t}</span>;
                                    })}
                                    {it.tags.length>4 && <span className="mic-tag-more">+{it.tags.length-4}</span>}
                                  </div>
                                )}
                              </div>
                            </article>
                          );
                        })}

                        {hiddenN>0 && (
                          <div className="show-more-row full">
                            <button type="button" className="admin-button secondary" onClick={()=>toggleFull(ci)}>
                              Mostrar todos os {cat.items.length} pratos ({hiddenN} oculto{hiddenN===1?'':'s'})
                            </button>
                          </div>
                        )}
                        {all && cat.items.length>PREVIEW_PER_CAT && (
                          <div className="show-more-row full">
                            <button type="button" className="admin-button secondary tiny" onClick={()=>toggleFull(ci)}>
                              Voltar para visão resumida ({PREVIEW_PER_CAT} itens)
                            </button>
                          </div>
                        )}
                      </div>
                    ):(
                      <div className="admin-empty clean-empty" style={{padding:'28px 16px',marginTop:8}}>
                        <span>Nenhum prato nesta categoria ainda.</span>
                        <button type="button" className="admin-button secondary tiny" onClick={()=>openNewItem(ci)}>
                          <Plus size={12}/> Criar primeiro prato
                        </button>
                      </div>
                    )}
                    <div style={{marginTop:12}}>
                      <button type="button" className="admin-button" onClick={()=>openNewItem(ci)}><Plus size={14}/>Adicionar prato em "{cat.name}"</button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div className="admin-menu-sticky" aria-hidden={!dirty}>
        <div>
          <strong>{dirty?'Alterações não salvas':'Tudo salvo'}</strong>
          {dirty&&<span className="admin-muted" style={{marginLeft:8}}>— {categories.length} categorias · {totalItems} itens</span>}
        </div>
        <div className="admin-actions">
          <button type="button" className="admin-button secondary" onClick={()=>load()}>Descartar</button>
          <button type="submit" className="admin-button" disabled={saving||!dirty}>{saving?'Salvando…':'Salvar cardápio premium'}</button>
        </div>
      </div>
    </form>

    {/* ========== MODAIS ========== */}
    <CategoryModal
      isOpen={catModalOpen}
      onClose={() => { setCatModalOpen(false); setCatModalEditIdx(null); }}
      initial={catModalEditIdx !== null ? categories[catModalEditIdx] : null}
      title={catModalEditIdx !== null ? 'Editar categoria' : 'Nova categoria'}
      submitLabel={catModalEditIdx !== null ? 'Salvar alterações' : 'Criar categoria'}
      onSave={handleSaveCategory}
    />

    <MenuItemModal
      isOpen={itemModalOpen}
      onClose={() => { setItemModalOpen(false); setItemModalCatIdx(null); setItemModalEditIdx(null); }}
      initial={activeItem}
      mode={itemModalMode}
      categoryName={activeCat?.name || 'Categoria'}
      hasExistingWeeklyPick={hasWeeklyPick}
      onSaveOne={handleSaveItemOne}
      onSaveAndClose={handleSaveItemAndClose}
    />
    </>
  );
}

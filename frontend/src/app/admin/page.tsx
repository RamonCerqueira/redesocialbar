'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, FileText, Ticket, Megaphone, CalendarDays, Settings, ShieldCheck, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { ImageField, ResourceConfig, ResourceEditor } from '@/components/admin/resource-editor';
import './admin.css';

type Section='dashboard'|'posts'|'promotions'|'coupons'|'ads'|'events'|'settings'|'moderation';
const navigation=[{id:'dashboard',label:'Visão geral',icon:LayoutDashboard},{id:'posts',label:'Publicações',icon:FileText},{id:'promotions',label:'Promoções',icon:Ticket},{id:'coupons',label:'Cupons emitidos',icon:Ticket},{id:'ads',label:'Banners e anúncios',icon:Megaphone},{id:'events',label:'Agenda de eventos',icon:CalendarDays},{id:'moderation',label:'Moderação',icon:ShieldCheck},{id:'settings',label:'Ajustes',icon:Settings}] as const;
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
  ads:{title:'Banners e anúncios',singular:'Banner',route:'ads',fields:[
    {key:'title',label:'Título',required:true,max:140},{key:'description',label:'Texto de apoio',type:'textarea'},
    {key:'imageUrl',label:'Imagem do banner',type:'image',required:true},
    {key:'buttonText',label:'Texto do botão',required:true,default:'Saiba mais',max:40},{key:'targetUrl',label:'Endereço do botão',type:'url',required:true},
    {key:'sponsorName',label:'Nome do anunciante',required:true,default:'Pirambeira'},
    {key:'type',label:'Posição',type:'select',default:'BANNER',options:[{value:'BANNER',label:'Destaque na página inicial'},{value:'SPONSORED_POST',label:'Anúncio no feed'},{value:'SIDEBAR',label:'Sugestão da casa'}]},
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
      <nav className="admin-nav" aria-label="Menu administrativo">{navigation.map(item=><button key={item.id} aria-current={section===item.id?'page':undefined} onClick={()=>setSection(item.id)}><item.icon size={17}/>{item.label}</button>)}</nav>
      <footer><p>{user?.profile?.name}</p><p>{user?.email}</p><div className="admin-actions"><Link href="/" target="_blank"><ExternalLink size={14} style={{display:'inline'}}/> Abrir aplicativo</Link><button className="admin-button secondary" onClick={logout}><LogOut size={14}/>Sair</button></div></footer>
    </aside>
    <main className="admin-main"><header className="admin-topbar"><div><small>ESTABELECIMENTO / ADMINISTRAÇÃO</small><h1>{navigation.find(n=>n.id===section)?.label}</h1></div>
      <label className="admin-field">Restaurante<select aria-label="Restaurante" value={slug} onChange={e=>setSlug(e.target.value)} disabled={loading}>{restaurants.map(r=><option key={r.slug} value={r.slug}>{r.name}</option>)}</select></label>
    </header>
      {error&&<div role="alert" className="admin-message error">{error} <button onClick={()=>void loadRestaurants()}>Tentar novamente</button></div>}
      {loading?<p>Carregando estabelecimentos…</p>:!slug?<div className="admin-empty">Esta conta ainda não possui um restaurante gerenciável.</div>:<>
        {configs[section]&&<ResourceEditor key={slug+section} slug={slug} config={configs[section]!}/>}
        {section==='dashboard'&&<Dashboard key={slug} slug={slug}/>}
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
  const [currentPassword,setCurrent]=useState('');const [newPassword,setNew]=useState('');const [notice,setNotice]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  async function save(event:React.FormEvent){event.preventDefault();setBusy(true);setNotice('');setError('');try{await apiRequest('/auth/password',{method:'PUT',body:JSON.stringify({currentPassword,newPassword})});setCurrent('');setNew('');setNotice('Senha alterada.');}catch(error){setError(errorText(error));}finally{setBusy(false);}}
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

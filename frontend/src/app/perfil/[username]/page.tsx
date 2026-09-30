'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Camera, Grid3X3, Layers, LogOut, MapPin, Pencil, ShieldAlert, X } from 'lucide-react';
import { apiRequest, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ReportModal } from '@/components/report-modal';
import { LoadError } from '@/components/load-error';
import '../profile.css';

type Moment={id:string;content:string;createdAt:string;likesCount:number;media:string[]};
type Profile={id:string;name:string;username:string;bio:string;city:string;avatarUrl:string;interests:string[];isPrivate:boolean;isFollowing:boolean;activeCheckIn:{restaurantName:string}|null;counts:{posts:number;followers:number;following:number};recentPosts:Moment[]};
export default function UserProfilePage({params}:{params:Promise<{username:string}>}){
 const {username}=React.use(params);
 const {user,logout,isLoading:authLoading}=useAuth();
 const [profile,setProfile]=useState<Profile|null>(null);
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[missing,setMissing]=useState(false),[busy,setBusy]=useState(false),[showReport,setShowReport]=useState(false),[saved,setSaved]=useState(false);
 const [selected,setSelected]=useState<Moment|null>(null),[cursor,setCursor]=useState<string|null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 const isMe=user?.id===profile?.id;
 async function load(){setLoading(true);setError('');setMissing(false);try{const data=await apiRequest<Profile>(`/users/profile/${encodeURIComponent(username)}`);setProfile(data);setCursor(data.recentPosts.length<data.counts.posts?data.recentPosts.at(-1)?.id||null:null);}catch(error){setProfile(null);if(error instanceof ApiError&&error.status===404)setMissing(true);else setError(error instanceof Error?error.message:'Não foi possível carregar o perfil.');}finally{setLoading(false);}}
 useEffect(()=>{if(!authLoading)void load();},[username,user?.id,authLoading]);
 useEffect(()=>{setSaved(new URLSearchParams(window.location.search).get('saved')==='1');},[]);
 useEffect(()=>{if(!selected)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.showModal();return()=>{dialog.current?.close();document.body.style.overflow=previous;};},[selected]);
 async function follow(){if(!user){window.location.href='/login';return;}if(!profile||busy)return;setBusy(true);setError('');try{const data=await apiRequest<{following:boolean}>(`/users/${profile.id}/follow`,{method:'POST'});setProfile({...profile,isFollowing:data.following,counts:{...profile.counts,followers:Math.max(0,profile.counts.followers+(data.following?1:-1))}});}catch(error){setError(error instanceof Error?error.message:'Não foi possível seguir.');}finally{setBusy(false);}}
 async function more(){if(!cursor||busy||!profile)return;setBusy(true);setError('');try{const data=await apiRequest<{items:Moment[];nextCursor:string|null}>(`/users/profile/${encodeURIComponent(username)}/posts?cursor=${encodeURIComponent(cursor)}`);setProfile({...profile,recentPosts:[...profile.recentPosts,...data.items.filter(item=>!profile.recentPosts.some(p=>p.id===item.id))]});setCursor(data.nextCursor);}catch(error){setError(error instanceof Error?error.message:'Não foi possível carregar mais fotos.');}finally{setBusy(false);}}
 if(loading)return <p className="py-12 text-center text-sm text-neutral-400">Carregando perfil…</p>;
 if(missing)return <div className="profile-empty"><h1>Perfil indisponível</h1><p>Esse perfil não pode ser exibido.</p><Link className="profile-button secondary mt-4" href="/">Voltar ao início</Link></div>;
 if(!profile)return <LoadError message={error} retry={load}/>;
 return <div className="profile-page">
  <header className="profile-heading"><span className="profile-handle">@{profile.username}</span>{isMe?<button className="profile-icon" aria-label="Sair da conta" onClick={logout}><LogOut size={18}/></button>:<button className="profile-icon" aria-label="Denunciar perfil" onClick={()=>setShowReport(true)}><ShieldAlert size={18}/></button>}</header>
  {saved&&isMe&&<p role="status" className="profile-notice">Seu perfil foi atualizado.</p>}
  <div className="profile-identity">{profile.avatarUrl?<img className="profile-avatar" src={profile.avatarUrl} alt={`Foto de ${profile.name}`}/>:<div className="profile-avatar" aria-label="Perfil sem foto">{profile.name.slice(0,1).toUpperCase()}</div>}<div><h1>{profile.name}</h1>{profile.activeCheckIn&&<p className="profile-presence">● No {profile.activeCheckIn.restaurantName} agora</p>}{profile.city&&<p className="profile-city mt-2"><MapPin size={14}/>{profile.city}</p>}</div></div>
  {profile.bio&&<p className="profile-bio">{profile.bio}</p>}{!!profile.interests?.length&&<div className="profile-tags">{profile.interests.map(tag=><span key={tag}>{tag}</span>)}</div>}
  <div className="profile-stats"><div><strong>{profile.counts.posts}</strong><span>Publicações</span></div><div><strong>{profile.counts.followers}</strong><span>Seguidores</span></div><div><strong>{profile.counts.following}</strong><span>Seguindo</span></div></div>
  <div className="profile-actions">{isMe?<><Link className="profile-button secondary" href="/perfil/editar"><Pencil size={16}/>Editar perfil</Link><Link className="profile-button" href="/publicar"><Camera size={17}/>Publicar</Link></>:!profile.isPrivate&&<button className="profile-button" disabled={busy} onClick={()=>void follow()}>{profile.isFollowing?'Seguindo':'Seguir'}</button>}</div>
  {error&&<p role="alert" className="profile-error">{error}</p>}<h2 className="profile-grid-title"><Grid3X3 size={18}/>FOTOS E MOMENTOS</h2>
  {profile.isPrivate&&!isMe?<div className="profile-empty">As publicações deste perfil são privadas.</div>:profile.recentPosts.length?<><div className="profile-photo-grid">{profile.recentPosts.map(post=><button key={post.id} className="profile-tile" aria-label={`Abrir publicação: ${post.content.slice(0,70)||'Foto'}`} onClick={()=>setSelected(post)}>{post.media.length?<img src={post.media[0]} alt={post.content.slice(0,100)||'Foto publicada'} loading="lazy"/>:<span>{post.content}</span>}{post.media.length>1&&<Layers size={16}/>}</button>)}</div>{cursor&&<button className="profile-button secondary mt-4 w-full" disabled={busy} onClick={()=>void more()}>{busy?'Carregando…':'Carregar mais'}</button>}</>:<div className="profile-empty"><Camera className="mx-auto mb-3" size={26}/><p>{isMe?'Seu primeiro momento merece estar aqui.':'Ainda não há publicações por aqui.'}</p>{isMe&&<Link className="profile-button mt-4" href="/publicar">Compartilhar uma foto</Link>}</div>}
  <dialog className="profile-viewer" ref={dialog} aria-label="Publicação" onCancel={()=>setSelected(null)} onClose={()=>setSelected(null)} onClick={event=>{if(event.target===event.currentTarget)setSelected(null);}}>{selected&&<><header><strong>{profile.name}</strong><button aria-label="Fechar publicação" onClick={()=>setSelected(null)}><X size={22}/></button></header><div className="profile-viewer-images">{selected.media.map((url,index)=><img key={url} src={url} alt={`Foto ${index+1} da publicação`}/>)}</div>{selected.media.length>1&&<small>Deslize para ver as {selected.media.length} fotos.</small>}<p>{selected.content}</p><small>{selected.likesCount} curtidas · {new Date(selected.createdAt).toLocaleDateString('pt-BR')}</small></>}</dialog>
  <ReportModal isOpen={showReport} onClose={()=>setShowReport(false)} targetType="USER" targetId={profile.id}/>
 </div>;
}

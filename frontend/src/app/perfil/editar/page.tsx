'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, uploadImage } from '@/lib/api';
import '../profile.css';

export default function EditProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const initialized = useRef('');
  const [form,setForm]=useState({name:'',bio:'',city:'',avatarUrl:'',interests:'',showInFlirtRadar:true,invisibleMode:false,isPrivate:false,allowFlirtFrom:'EVERYONE'});
  const [photo,setPhoto]=useState<File|null>(null);
  const [preview,setPreview]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(isLoading)return;
    if(!user){router.replace('/login');return;}
    if(initialized.current===user.id)return;
    initialized.current=user.id;
    const p=user.profile;
    setForm({name:p.name||'',bio:p.bio||'',city:p.city||'',avatarUrl:p.avatarUrl||'',interests:(p.interests||[]).join(', '),showInFlirtRadar:p.showInFlirtRadar,invisibleMode:p.invisibleMode,isPrivate:!!p.isPrivate,allowFlirtFrom:p.allowFlirtFrom||'EVERYONE'});
  },[user,isLoading,router]);
  useEffect(()=>{if(!photo){setPreview('');return;}const url=URL.createObjectURL(photo);setPreview(url);return()=>URL.revokeObjectURL(url);},[photo]);
  function selectPhoto(file?:File){
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setError('Escolha uma foto JPEG, PNG ou WebP de até 5 MB.');return;}
    setPhoto(file);setError('');
  }
  async function save(event:FormEvent){
    event.preventDefault();if(busy||!user)return;setBusy(true);setError('');
    try{
      const interests=[...new Set(form.interests.split(',').map(s=>s.trim()).filter(Boolean))];
      if(interests.length>20||interests.some(s=>s.length>50))throw new Error('Use até 20 interesses, com no máximo 50 caracteres cada.');
      let avatarUrl=form.avatarUrl;
      if(photo){const dataUrl=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Não foi possível ler a foto.'));reader.readAsDataURL(photo);});avatarUrl=await uploadImage(dataUrl);setForm(value=>({...value,avatarUrl}));setPhoto(null);}
      await apiRequest('/users/profile',{method:'PUT',body:JSON.stringify({...form,name:form.name.trim(),bio:form.bio.trim(),city:form.city.trim(),interests,avatarUrl})});
      await refreshUser();router.push(`/perfil/${encodeURIComponent(user.profile.username)}?saved=1`);
    }catch(error){setError(error instanceof Error?error.message:'Não foi possível salvar seu perfil.');}finally{setBusy(false);}
  }
  if(isLoading||!user)return <p className="py-8 text-center">Carregando seu perfil…</p>;
  const back=`/perfil/${encodeURIComponent(user.profile.username)}`;
  return <div className="profile-page"><header className="profile-heading"><Link href={back} aria-label="Voltar ao meu perfil"><ArrowLeft size={20}/></Link><h1>Editar perfil</h1><span/></header>
    <form className="profile-form" onSubmit={save}><fieldset disabled={busy}>
      <div className="profile-avatar-editor">{preview||form.avatarUrl?<img className="profile-avatar" src={preview||form.avatarUrl} alt="Sua foto de perfil"/>:<div className="profile-avatar">{form.name.slice(0,1).toUpperCase()||'P'}</div>}
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label="Selecionar foto de perfil" onChange={event=>{selectPhoto(event.target.files?.[0]);event.target.value='';}}/>
      <div className="profile-actions"><button type="button" className="profile-button secondary" onClick={()=>fileInput.current?.click()}><Camera size={17}/>Alterar foto</button>{(photo||form.avatarUrl)&&<button type="button" className="profile-button secondary" onClick={()=>{setPhoto(null);setForm({...form,avatarUrl:''});}}>Remover foto</button>}</div><small>JPEG, PNG ou WebP · até 5 MB</small></div>
      <section><h2>Sobre você</h2><small>@{user.profile.username}</small>
      <label>Nome<input required maxLength={100} autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label>Bio<textarea maxLength={500} placeholder="Conte um pouco sobre você…" value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})}/><small>{form.bio.length}/500</small></label>
      <label>Cidade<input maxLength={120} autoComplete="address-level2" value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></label>
      <label>Interesses<input value={form.interests} maxLength={1000} placeholder="Samba, gastronomia, música ao vivo" onChange={e=>setForm({...form,interests:e.target.value})}/><small>Separe seus interesses por vírgulas.</small></label></section>
      <section><h2>Privacidade e encontros</h2>
      <label className="profile-toggle"><span>Ocultar minhas publicações<small>Somente você verá suas fotos e publicações no perfil. Não há aprovação de seguidores.</small></span><input type="checkbox" checked={form.isPrivate} onChange={e=>setForm({...form,isPrivate:e.target.checked})}/></label>
      <label className="profile-toggle"><span>Modo invisível<small>Ocultar sua presença na lista de pessoas no bar.</small></span><input type="checkbox" checked={form.invisibleMode} onChange={e=>setForm({...form,invisibleMode:e.target.checked})}/></label>
      <label className="profile-toggle"><span>Aparecer no radar da paquera</span><input type="checkbox" checked={form.showInFlirtRadar} onChange={e=>setForm({...form,showInFlirtRadar:e.target.checked})}/></label>
      <label>Receber paquera de<select value={form.allowFlirtFrom} onChange={e=>setForm({...form,allowFlirtFrom:e.target.value})}><option value="EVERYONE">Todos</option><option value="FOLLOWERS">Meus seguidores</option><option value="NONE">Ninguém</option></select></label></section>
      {error&&<p role="alert" className="profile-error">{error}</p>}
      <div className="profile-form-actions"><Link className="profile-button secondary" href={back}>Cancelar</Link><button type="submit" className="profile-button" disabled={busy}><Save size={18}/>{busy?'Salvando…':'Salvar perfil'}</button></div>
    </fieldset></form></div>;
}

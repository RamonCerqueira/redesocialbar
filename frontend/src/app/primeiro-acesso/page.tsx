'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { User } from '@/lib/types';

export default function FirstAccessPage() {
  const { user, isLoading, login, logout } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const destination = user?.role === 'USER' ? '/' : '/admin';

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace('/login');
    else if (!user.mustChangePassword) router.replace(destination);
  }, [isLoading, user, router, destination]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (password !== confirmation) { setError('As senhas precisam ser iguais.'); return; }
    if (password === 'Acesso@123') { setError('Escolha uma senha diferente da senha de primeiro acesso.'); return; }
    setBusy(true);
    try {
      const result = await apiRequest<{ token: string; user: User }>('/auth/first-access-password', { method: 'PUT', body: JSON.stringify({ newPassword: password }) });
      login(result.token, result.user);
      setPassword(''); setConfirmation('');
      router.replace(result.user.role === 'USER' ? '/' : '/admin');
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível salvar sua senha.'); }
    finally { setBusy(false); }
  }

  if (isLoading || !user || !user.mustChangePassword) return <p role="status" className="p-10 text-center text-stone-400">Verificando acesso…</p>;
  return <main className="min-h-dvh flex items-center justify-center px-5 py-12 bg-[#090b08]">
    <section className="w-full max-w-md rounded-[28px] border border-amber-300/15 bg-[#131610] p-7 sm:p-9">
      <img src="/LogoPirambeiraSemFundo.png" alt="Pirambeira" className="w-16 h-16 object-contain mb-6"/>
      <p className="text-[10px] tracking-[.2em] text-amber-300 mb-3 flex gap-2 items-center"><ShieldCheck size={15}/>PRIMEIRO ACESSO</p>
      <h1 className="text-3xl font-bold tracking-tight text-stone-100">Uma senha só sua.</h1>
      <p className="text-sm text-stone-400 mt-3 leading-relaxed">Para começar, substitua a senha inicial por uma senha pessoal. Você só precisa fazer isso uma vez.</p>
      <p className="text-sm text-stone-200 mt-4 break-all">{user.email}</p>
      <form onSubmit={submit} className="mt-7 space-y-5">
        <div><label htmlFor="new-password" className="block text-xs font-semibold mb-2">Nova senha</label><div className="relative">
          <input id="new-password" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={event=>setPassword(event.target.value)} aria-describedby="password-hint" className="w-full rounded-xl border border-white/15 bg-black/25 py-3 pl-4 pr-12 outline-none focus:border-amber-300"/>
          <button type="button" onClick={()=>setVisible(value=>!value)} aria-label={visible?'Ocultar senha':'Mostrar senha'} className="absolute right-0 top-0 h-full px-4 text-stone-400">{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button>
        </div><p id="password-hint" className="text-xs text-stone-500 mt-2">Use pelo menos 8 caracteres e evite a senha inicial.</p></div>
        <div><label htmlFor="confirm-password" className="block text-xs font-semibold mb-2">Confirme a nova senha</label><input id="confirm-password" type={visible?'text':'password'} autoComplete="new-password" required minLength={8} maxLength={72} value={confirmation} onChange={event=>setConfirmation(event.target.value)} className="w-full rounded-xl border border-white/15 bg-black/25 py-3 px-4 outline-none focus:border-amber-300"/></div>
        {error&&<p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
        <button disabled={busy} className="w-full flex items-center justify-center gap-3 rounded-xl bg-amber-300 text-stone-950 font-bold py-3.5 disabled:opacity-50">{busy?'Salvando…':'Criar senha e continuar'}<ArrowRight size={17}/></button>
      </form>
      <button type="button" disabled={busy} onClick={()=>{logout();router.replace('/login');}} className="mt-6 text-xs text-stone-400 underline">Sair e entrar com outra conta</button>
    </section>
  </main>;
}

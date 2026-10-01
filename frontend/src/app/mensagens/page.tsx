'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Conversation, AppNotification } from '@/lib/types';
export default function MessagesPage() {
  const [threads, setThreads] = useState<Conversation[]>([]);
  const [legacy, setLegacy] = useState<AppNotification[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([apiRequest<Conversation[]>('/chat/conversations'), apiRequest<AppNotification[]>('/notifications/story-replies')]).then(([c,n]) => { setThreads(c); setLegacy(n); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }, []);
  return <section className="space-y-4"><h1 className="text-2xl font-bold">Mensagens</h1><p className="text-sm text-stone-400">Suas conversas e respostas privadas ao De Agora.</p>{error && <p role="alert">{error}</p>}{loading && <p role="status">Carregando…</p>}{threads.map(c => <Link key={c.id} href={'/chat/' + c.id} className="block rounded-2xl border border-white/10 p-4"><p className="font-bold">{c.otherUser?.name || 'Conversa'}</p>{c.type.startsWith('STORY:') && <p className="text-xs text-amber-300">Resposta ao De Agora</p>}<p className="text-sm text-stone-400 line-clamp-2 mt-2">{c.lastMessage?.content}</p></Link>)}{legacy.map(n => <article id={n.id} key={n.id} className="rounded-2xl border border-white/10 p-4"><h2 className="font-bold">{n.title}</h2><p className="whitespace-pre-wrap break-words mt-2">{n.body}</p><p className="text-xs text-stone-400 mt-2">Resposta antiga — o sistema anterior não registrava a conversa nem o De Agora de origem.</p>{n.link?.startsWith('/perfil/') && <Link href={n.link} className="text-sm text-amber-300">Ver perfil</Link>}</article>)}{!loading && !error && !threads.length && !legacy.length && <p>Você ainda não tem mensagens.</p>}</section>;
}

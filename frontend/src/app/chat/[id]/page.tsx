'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { Message } from '@/lib/types';
import { LoadError } from '@/components/load-error';

interface Thread { messages: Message[]; otherUser?: { name: string }; story?: { mediaUrl: string; caption?: string; expiresAt: string } | null }
export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() { try { setThread(await apiRequest<Thread>(`/chat/conversations/${id}/messages`)); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Conversa indisponível.'); } }
  useEffect(() => { void load(); }, [id]);
  async function send(e: React.FormEvent) { e.preventDefault(); if (!text.trim() || busy) return; setBusy(true); try { await apiRequest(`/chat/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content: text.trim() }) }); setText(''); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível enviar.'); } finally { setBusy(false); } }
  return <section className="space-y-4"><Link href="/mensagens" className="text-amber-300">← Mensagens</Link><h1 className="text-xl font-bold">{thread?.otherUser?.name || 'Conversa privada'}</h1>{error && <LoadError message={error} retry={() => void load()} />}{thread?.story && <div className="rounded-2xl border border-white/10 p-3"><p className="text-xs text-stone-400 mb-2">Resposta ao De Agora</p><img src={thread.story.mediaUrl} alt="De Agora da conversa" className="max-h-64 w-full object-contain rounded-xl" /><p className="text-sm mt-2">{thread.story.caption}</p>{new Date(thread.story.expiresAt) < new Date() && <p className="text-xs text-stone-400 mt-2">Este De Agora já saiu da exibição pública. A conversa continua aqui.</p>}</div>}{!thread && !error && <p role="status">Carregando mensagens…</p>}<div className="space-y-3">{thread?.messages.map(m => <div key={m.id} className={'max-w-[90%] rounded-2xl p-4 ' + (m.isMine ? 'ml-auto bg-amber-400/15' : 'bg-white/5')}><p className="text-xs text-stone-400 mb-1">{m.senderName}</p><p className="whitespace-pre-wrap break-words">{m.content}</p><time className="text-[10px] text-stone-400">{new Date(m.createdAt).toLocaleString('pt-BR')}</time></div>)}</div>{thread && <form onSubmit={send} className="flex gap-2"><input aria-label="Mensagem" value={text} onChange={e => setText(e.target.value)} maxLength={1000} className="min-w-0 flex-1 rounded-xl bg-white/5 p-3" placeholder="Escreva uma mensagem…" /><button disabled={busy || !text.trim()} className="rounded-xl bg-amber-400 p-3 text-black font-bold">{busy ? 'Enviando…' : 'Enviar'}</button></form>}</section>;
}

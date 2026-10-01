'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import documents from '@/lib/legal-documents.json';
import { FullscreenDialog } from './fullscreen-dialog';
import { LegalCheckboxes, emptyLegalChoices } from './legal-checkboxes';
export function LegalReviewPrompt() {
  const { user } = useAuth(); const pathname = usePathname();
  const [open, setOpen] = useState(false); const [value, setValue] = useState(emptyLegalChoices); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const key = `legal-deferred:${user?.id}:${documents.version}`;
  useEffect(() => {
    let cancelled = false; setOpen(false);
    if (!user || user.mustChangePassword || ['/termos','/privacidade','/central-de-privacidade'].includes(pathname) || sessionStorage.getItem(key)) return;
    apiRequest<{ accepted: boolean; version: string }>('/legal/status').then(status => { if (!cancelled && status.version === documents.version && !status.accepted) setOpen(true); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, user?.mustChangePassword, pathname, key]);
  function defer() { sessionStorage.setItem(key, '1'); setOpen(false); }
  async function accept(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(''); try { await apiRequest('/legal/accept', { method: 'POST', body: JSON.stringify({ ...value, legalVersion: documents.version }) }); setOpen(false); } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível registrar.'); } finally { setBusy(false); } }
  if (!open) return null;
  return <FullscreenDialog title="Revisar documentos de demonstração" onClose={defer}><div className="h-full overflow-y-auto p-6 pt-12"><form onSubmit={accept} className="mx-auto max-w-md space-y-5"><h2 className="text-xl font-bold">Termos e privacidade — demonstração</h2><p className="text-sm text-amber-200">{documents.notice}</p><p className="text-sm">Seu cadastro anterior não foi marcado como aceito. Você pode revisar agora ou depois. Uma versão definitiva exigirá nova revisão.</p><LegalCheckboxes value={value} onChange={setValue} />{error && <p role="alert">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-amber-400 p-3 font-bold text-black">{busy ? 'Registrando…' : 'Registrar aceite de demonstração'}</button><button type="button" onClick={defer} className="w-full p-3 underline">Ver depois</button></form></div></FullscreenDialog>;
}


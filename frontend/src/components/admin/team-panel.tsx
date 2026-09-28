'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';

type TeamUser = { id: string; email: string; role: string; status: string; mustChangePassword: boolean; profile?: { name: string }; restaurantMembers: { restaurant: { name: string } }[] };
type Page = { items: TeamUser[]; nextCursor: string | null };

export function TeamPanel({ slug, currentUserId }: { slug: string; currentUserId: string }) {
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('RESTAURANT_ADMIN');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async (after?: string) => {
    setLoading(true);
    try {
      const result = await apiRequest<Page>('/admin/team' + (after ? '?cursor=' + encodeURIComponent(after) : ''));
      setUsers(previous => after ? [...previous, ...result.items] : result.items);
      setCursor(result.nextCursor);
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível carregar a equipe.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function create(event: React.FormEvent) {
    event.preventDefault(); setError(''); setNotice('');
    if (!email.trim().toLowerCase().endsWith('@pirambeira.com')) { setError('Informe um e-mail @pirambeira.com.'); return; }
    setBusy(true);
    try {
      await apiRequest('/admin/team', { method: 'POST', body: JSON.stringify({ name, email, role, restaurantSlug: slug }) });
      setName(''); setEmail('');
      setNotice('Conta criada. Senha de primeiro acesso: Acesso@123. A pessoa deverá criar uma nova senha ao entrar.');
      await load();
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível criar a conta.'); }
    finally { setBusy(false); }
  }
  async function reset(user: TeamUser) {
    if (!window.confirm(`Redefinir a senha de ${user.email}? As sessões abertas serão encerradas e a pessoa precisará criar uma nova senha ao entrar com Acesso@123.`)) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await apiRequest('/admin/team/' + user.id + '/reset-password', { method: 'POST' });
      setNotice('Senha redefinida para Acesso@123. A troca será obrigatória no próximo acesso.');
      await load();
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível redefinir a senha.'); }
    finally { setBusy(false); }
  }

  return <>
    <p className="admin-muted" style={{ marginBottom: 20 }}>Somente o superadministrador Ramon cadastra contas @pirambeira.com. A senha inicial é Acesso@123 e deve ser trocada antes de usar o sistema.</p>
    {error && <p role="alert" className="admin-message error">{error}</p>}
    {notice && <p role="status" className="admin-message">{notice}</p>}
    <section className="admin-card" style={{ marginBottom: 24 }}><h2>Cadastrar pessoa da equipe</h2>
      <form onSubmit={create} className="admin-form" style={{ maxWidth: 520 }}>
        <label className="admin-field">Nome<input required minLength={2} maxLength={100} autoComplete="off" value={name} onChange={event=>setName(event.target.value)}/></label>
        <label className="admin-field">E-mail institucional<input type="email" required maxLength={254} autoComplete="off" placeholder="nome@pirambeira.com" value={email} onChange={event=>setEmail(event.target.value)}/></label>
        <label className="admin-field">Acesso<select value={role} onChange={event=>setRole(event.target.value)}><option value="RESTAURANT_ADMIN">Administrador do restaurante selecionado</option><option value="USER">Usuário do aplicativo, sem acesso ao painel</option></select></label>
        <p className="admin-muted">O vínculo será criado no restaurante selecionado no topo do painel.</p>
        <button className="admin-button" disabled={busy}>{busy?'Salvando…':'Criar conta'}</button>
      </form>
    </section>
    <section className="admin-card"><div className="admin-toolbar"><h2>Contas institucionais</h2><button className="admin-button secondary" disabled={busy || loading} onClick={()=>void load()}>Atualizar</button></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Pessoa</th><th>Acesso</th><th>Restaurante</th><th>Primeiro acesso</th><th>Ações</th></tr></thead><tbody>
        {users.map(user=><tr key={user.id}><td>{user.profile?.name}<br/><small>{user.email}</small></td><td>{user.role==='SUPERADMIN'?'Superadministrador':user.role==='RESTAURANT_ADMIN'?'Administrador':'Usuário'}<br/><small>{user.status==='ACTIVE'?'Ativa':'Suspensa / bloqueada'}</small></td><td>{user.restaurantMembers.map(member=>member.restaurant.name).join(', ') || '—'}</td><td>{user.mustChangePassword?'Troca de senha pendente':'Concluído'}</td><td>{user.id!==currentUserId&&user.role!=='SUPERADMIN'&&<button className="admin-button secondary" disabled={busy} onClick={()=>void reset(user)}>Redefinir senha</button>}</td></tr>)}
      </tbody></table></div>
      {loading&&<p role="status" className="admin-muted">Carregando equipe…</p>}
      {cursor&&<button className="admin-button secondary" disabled={loading} onClick={()=>void load(cursor)}>Carregar mais</button>}
    </section>
  </>;
}

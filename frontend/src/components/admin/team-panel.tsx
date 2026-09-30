'use client';

import { useEffect, useState } from 'react';
import { Plus, UserPlus, Shield, Trash2, Pencil, Check, Search, X, Users } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { User } from '@/lib/types';
import { AdminModal, AdminModalFooter } from './admin-modal';

/** Papéis internos usados no painel do restaurante */
type RestaurantRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' | 'KITCHEN';

/** Tipo expandido: usuário convidado com dados específicos do time do restaurante */
type TeamMember = User & {
  /** Papel dentro do restaurante — vem do endpoint team, não do profile do User base */
  teamRole?: RestaurantRole;
  /** Status do convite enviado */
  inviteStatus?: 'PENDING' | 'ACTIVE' | 'REVOKED';
};

function roleLabel(role: RestaurantRole): string {
  return {
    OWNER: '👑 Dono',
    ADMIN: '⚙️ Administrador',
    MANAGER: '🧑‍💼 Gerente',
    STAFF: '🍽️ Atendente',
    KITCHEN: '👨‍🍳 Cozinha',
  }[role];
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : 'Não foi possível concluir a operação.';
}

type InputMember = {
  name: string;
  email: string;
  role: RestaurantRole;
};

const EMPTY: InputMember = { name: '', email: '', role: 'STAFF' };

function TeamMemberModal({
  isOpen,
  onClose,
  initial,
  onSaveOne,
  onSaveAndClose,
}: {
  isOpen: boolean;
  onClose: () => void;
  initial?: InputMember | null;
  onSaveOne: (m: InputMember) => Promise<void> | void;
  onSaveAndClose: (m: InputMember) => Promise<void> | void;
}) {
  const [form, setForm] = useState<InputMember>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initial ?? EMPTY);
      setErrors({});
      setJustSaved(false);
    }
  }, [isOpen, initial]);

  const isEdit = !!initial;

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!isEdit && !form.name.trim()) next.name = 'Informe o nome.';
    if (!form.email.trim()) next.email = 'Informe o e-mail.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'E-mail inválido.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function commit(): InputMember {
    return {
      ...(isEdit ? { name: form.name } : { name: form.name.trim() }),
      email: form.email.trim().toLowerCase(),
      role: form.role,
    };
  }

  function flashSaved() {
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1000);
  }

  async function handleSaveAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSaveOne(commit());
    setForm(EMPTY);
    setErrors({});
    flashSaved();
    requestAnimationFrame(() => {
      (document.getElementById('tm-name') as HTMLInputElement | null)?.focus();
    });
  }

  async function handleSaveAndClose() {
    if (!validate()) return;
    await onSaveAndClose(commit());
    onClose();
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar membro' : 'Novo membro da equipe'}
      subtitle={
        isEdit
          ? 'Atualize os dados e as permissões.'
          : 'Preencha e clique em "Salvar e adicionar outro" para cadastrar vários membros em sequência.'
      }
      badge={{ icon: Users, label: 'EQUIPE', variant: 'green' }}
      size="sm"
      onSubmit={handleSaveAndAdd}
      footer={
        <AdminModalFooter
          extraLeft={
            !isEdit && (
              <div className={'admin-modal-saved-flag ' + (justSaved ? 'show' : '')}>
                <Check size={12} /> Adicionado · pronto para o próximo
              </div>
            )
          }
          cancelLabel={isEdit ? 'Cancelar' : 'Fechar (terminar)'}
          onCancel={onClose}
          onSecondary={!isEdit ? handleSaveAndClose : undefined}
          secondaryLabel={!isEdit ? 'Salvar e fechar' : undefined}
          secondaryIcon={!isEdit ? Check : undefined}
          submitForm={!isEdit}
          onPrimary={isEdit ? handleSaveAndClose : undefined}
          primaryLabel={
            isEdit
              ? 'Salvar alterações'
              : (justSaved ? 'Adicionado ✓' : 'Salvar e adicionar outro')
          }
          primaryIcon={isEdit ? Check : Plus}
          primarySuccessFlash={justSaved}
        />
      }
    >
      <div className="admin-form" style={{ padding: '20px 24px 4px', gap: 16 }}>
        {!isEdit && (
          <label className="admin-field">
            <span>Nome completo *</span>
            <input
              id="tm-name"
              autoFocus
              placeholder="Ex.: Maria Souza"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
            {errors.name && <small className="admin-field-error">{errors.name}</small>}
          </label>
        )}
        <label className="admin-field">
          <span>E-mail *</span>
          <input
            id={isEdit ? 'tm-email' : undefined}
            {...(isEdit ? { autoFocus: true } : {})}
            type="email"
            placeholder="maria@restaurante.com"
            value={form.email}
            onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
          />
          {errors.email && <small className="admin-field-error">{errors.email}</small>}
        </label>
        <label className="admin-field">
          <span><Shield size={13} style={{ marginRight: 6, display: 'inline' }} />Função e permissões</span>
          <select
            value={form.role}
            onChange={e => setForm(prev => ({ ...prev, role: e.target.value as RestaurantRole }))}
          >
            <option value="STAFF">🍽️ Atendente — cupons, mesas e suporte</option>
            <option value="KITCHEN">👨‍🍳 Cozinha — visualiza pedidos</option>
            <option value="MANAGER">🧑‍💼 Gerente — pedidos, mesas e financeiro</option>
            <option value="ADMIN">⚙️ Administrador — tudo, exceto dono</option>
            <option value="OWNER">👑 Dono — controle total</option>
          </select>
        </label>
      </div>
    </AdminModal>
  );
}

export function TeamPanel({ slug, currentUser }: { slug: string; currentUser: User | null }) {
  const [rows, setRows] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError('');
    try {
      // Espera um array; pode ser User, pode incluir campos extras (teamRole, inviteStatus)
      const list = (await apiRequest<TeamMember[]>('/admin/' + encodeURIComponent(slug) + '/team')) || [];
      setRows(list);
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, [slug]);

  const editing = editingEmail ? rows.find(r => r.email === editingEmail) : undefined;
  const editingInput: InputMember | null = editing
    ? {
        name: editing.profile?.name || editing.email.split('@')[0],
        email: editing.email,
        role: (editing.teamRole || (editing.role === 'SUPERADMIN' ? 'OWNER' : 'ADMIN')) as RestaurantRole,
      }
    : null;

  async function submitInvite(email: string, role: RestaurantRole, name?: string) {
    setBusy(true); setError(''); setNotice('');
    try {
      const body: Record<string, unknown> = { email, role };
      if (name) body.name = name;
      await apiRequest('/admin/' + encodeURIComponent(slug) + '/invites', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setNotice('Convite enviado para ' + email + '.');
      await load();
    } catch (e) { setError(errorText(e)); throw e; }
    finally { setBusy(false); }
  }

  async function handleCreateOne(m: InputMember) {
    await submitInvite(m.email, m.role, m.name);
  }

  async function handleCreateAndClose(m: InputMember) {
    await submitInvite(m.email, m.role, m.name);
  }

  async function updateRole(email: string, role: RestaurantRole) {
    setBusy(true); setError('');
    try {
      await apiRequest('/admin/' + encodeURIComponent(slug) + '/team/' + encodeURIComponent(email), {
        method: 'PUT', body: JSON.stringify({ role }),
      });
      setNotice('Permissões atualizadas.');
      await load();
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }

  async function removeMember(email: string) {
    if (!window.confirm('Remover ' + email + ' da equipe?')) return;
    setBusy(true); setError('');
    try {
      await apiRequest('/admin/' + encodeURIComponent(slug) + '/team/' + encodeURIComponent(email), {
        method: 'DELETE',
      });
      await load();
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }

  function openCreate() {
    setEditingEmail(null);
    setModalOpen(true);
  }
  function openEdit(u: TeamMember) {
    setEditingEmail(u.email);
    setModalOpen(true);
  }

  function displayName(u: TeamMember): string {
    return u.profile?.name || u.email.split('@')[0];
  }
  function displayPhoto(u: TeamMember): string | undefined {
    return u.profile?.avatarUrl || undefined;
  }
  function memberRole(u: TeamMember): RestaurantRole {
    return u.teamRole || (u.role === 'SUPERADMIN' ? 'OWNER' : u.role === 'RESTAURANT_ADMIN' ? 'ADMIN' : 'STAFF');
  }

  const visible = rows.filter(r =>
    displayName(r).toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {error && <div role="alert" className="admin-message error">{error}</div>}
      {notice && !modalOpen && <div role="status" className="admin-message">{notice}</div>}

      <div className="admin-toolbar" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>👥 Equipe e acessos <span className="admin-muted">({rows.length})</span></h2>
        <div className="admin-actions" style={{ margin: 0 }}>
          <button className="admin-button" onClick={openCreate}>
            <UserPlus size={14} /> Convidar pessoa
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8a9790' }} />
        <input
          aria-label="Buscar equipe"
          placeholder="Buscar por nome ou e-mail…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 38 }}
        />
        {search && (
          <button
            type="button" onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: '#f0f3f1', border: 0, borderRadius: 999, width: 28, height: 28,
              display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#59645e',
            }}
          ><X size={14} /></button>
        )}
      </div>

      {loading
        ? <p className="admin-muted">Carregando equipe…</p>
        : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Membro</th>
                <th>Função</th>
                <th>Status</th>
                <th style={{ width: 120 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty-table">
                    {rows.length === 0
                      ? 'Equipe vazia. Clique em "Convidar pessoa" para começar.'
                      : 'Nenhum resultado para "' + search + '".'}
                  </td>
                </tr>
              )}
              {visible.map(u => {
                const role = memberRole(u);
                const isSelf = u.id === currentUser?.id;
                const isOwner = role === 'OWNER';
                const status = u.inviteStatus || (u.status === 'ACTIVE' ? 'ACTIVE' : u.status === 'SUSPENDED' ? 'REVOKED' : 'ACTIVE');
                return (
                  <tr key={u.email} className="admin-table-row">
                    <td data-label="Membro">
                      <div className="admin-table-avatar-wrap">
                        <div className="admin-avatar">
                          {displayPhoto(u)
                            ? <img src={displayPhoto(u)!} alt="" />
                            : <span>{displayName(u).slice(0, 1).toUpperCase()}</span>}
                        </div>
                        <div className="admin-avatar-info">
                          <strong>{displayName(u)}</strong>
                          <small className="admin-muted">{u.email}</small>
                        </div>
                      </div>
                    </td>
                    <td data-label="Função">
                      <select
                        className="admin-select-role"
                        value={role}
                        disabled={busy || isSelf || isOwner}
                        onChange={e => void updateRole(u.email, e.target.value as RestaurantRole)}
                        title={isSelf ? 'Não é possível alterar a própria função' : ''}
                      >
                        <option value="STAFF">🍽️ Atendente</option>
                        <option value="KITCHEN">👨‍🍳 Cozinha</option>
                        <option value="MANAGER">🧑‍💼 Gerente</option>
                        <option value="ADMIN">⚙️ Administrador</option>
                        <option value="OWNER">👑 Dono</option>
                      </select>
                      <div style={{ marginTop: 4 }}>
                        <small className="admin-muted">{roleLabel(role)}</small>
                      </div>
                    </td>
                    <td data-label="Status">
                      {status === 'PENDING'
                        ? <span className="admin-badge wait">Pendente</span>
                        : status === 'REVOKED'
                        ? <span className="admin-badge off">Revogado</span>
                        : <span className="admin-badge on">Ativo</span>}
                    </td>
                    <td data-label="Ações">
                      <div className="admin-actions" style={{ margin: 0, gap: 4, flexWrap: 'wrap' }}>
                        <button
                          className="admin-button secondary tiny"
                          onClick={() => openEdit(u)}
                          disabled={busy || isSelf}
                        >
                          <Pencil size={13} /> Editar
                        </button>
                        <button
                          className="admin-button danger tiny"
                          onClick={() => void removeMember(u.email)}
                          disabled={busy || isSelf || isOwner}
                        >
                          <Trash2 size={13} /> Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

      <TeamMemberModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEmail(null); }}
        initial={editingInput}
        onSaveOne={editing
          ? async (m) => { await updateRole(m.email, m.role); setModalOpen(false); }
          : handleCreateOne
        }
        onSaveAndClose={editing
          ? async (m) => { await updateRole(m.email, m.role); }
          : handleCreateAndClose
        }
      />
    </div>
  );
}

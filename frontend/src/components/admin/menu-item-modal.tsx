'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Plus, Trash2, Camera as CameraIcon, ChefHat, Sparkles, Tag, Clock, Users } from 'lucide-react';
import { AdminModal, AdminModalGrid, AdminModalFooter } from './admin-modal';

export type MenuItemInput = {
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
};

export const MENU_TAG_LIBRARY = [
  { key: 'Picante', color: '#dc2626' },
  { key: 'Apimentado', color: '#ea580c' },
  { key: 'Vegano', color: '#15803d' },
  { key: 'Vegetariano', color: '#16a34a' },
  { key: 'Sem glúten', color: '#0284c7' },
  { key: 'Sem lactose', color: '#7c3aed' },
  { key: 'Favorito da casa', color: '#ca8a04' },
  { key: 'Porção para 2', color: '#0e7490' },
  { key: 'Compartilhar', color: '#0891b2' },
  { key: 'Artesanal', color: '#b45309' },
];

const EMPTY_ITEM: MenuItemInput = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  portion: '',
  prepTime: '',
  tags: [],
  isChefPick: false,
  isNew: false,
  isPromo: false,
  isWeeklyPick: false,
  weeklyPickNote: '',
};

export interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: MenuItemInput | null;
  mode: 'create' | 'edit';
  categoryName: string;
  hasExistingWeeklyPick?: boolean;
  onSaveOne: (data: MenuItemInput) => void;
  onSaveAndClose?: (data: MenuItemInput) => void;
}

export function MenuItemModal({
  isOpen,
  onClose,
  initial = null,
  mode,
  categoryName,
  hasExistingWeeklyPick = false,
  onSaveOne,
  onSaveAndClose,
}: MenuItemModalProps) {
  const [form, setForm] = useState<MenuItemInput>(EMPTY_ITEM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [justSaved, setJustSaved] = useState(false);
  const savedFlash = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(initial ?? EMPTY_ITEM);
      setErrors({});
      setJustSaved(false);
    }
  }, [isOpen, initial]);

  useEffect(() => {
    return () => {
      if (savedFlash.current) window.clearTimeout(savedFlash.current);
    };
  }, []);

  if (!isOpen) return null;

  function update<K extends keyof MenuItemInput>(key: K, value: MenuItemInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[key as string];
        return copy;
      });
    }
  }

  function toggleTag(tag: string) {
    const list = Array.isArray(form.tags) ? [...form.tags] : [];
    const i = list.indexOf(tag);
    if (i >= 0) list.splice(i, 1);
    else list.push(tag);
    update('tags', list);
  }

  function handleImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => update('imageUrl', String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Informe o nome do prato.';
    if (!form.price.trim()) next.price = 'Informe o preço do prato.';
    if (form.isWeeklyPick && !form.weeklyPickNote?.trim()) {
      next.weeklyPickNote = 'Adicione uma nota do chef para o destaque da semana.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function clearForm() {
    setForm({
      name: '', description: '', price: '', imageUrl: '', portion: '', prepTime: '',
      tags: [], isChefPick: false, isNew: false, isPromo: false, isWeeklyPick: false, weeklyPickNote: '',
    });
    setErrors({});
  }

  function commit(data: MenuItemInput): MenuItemInput {
    return {
      name: data.name.trim(),
      description: data.description?.trim() || '',
      price: data.price.trim(),
      imageUrl: data.imageUrl || '',
      portion: data.portion?.trim() || '',
      prepTime: data.prepTime?.trim() || '',
      tags: (data.tags || []).filter(Boolean),
      isChefPick: !!data.isChefPick,
      isNew: !!data.isNew,
      isPromo: !!data.isPromo,
      isWeeklyPick: !!data.isWeeklyPick,
      weeklyPickNote: data.isWeeklyPick ? (data.weeklyPickNote?.trim() || '') : '',
    };
  }

  function flashSaved() {
    setJustSaved(true);
    if (savedFlash.current) window.clearTimeout(savedFlash.current);
    savedFlash.current = window.setTimeout(() => setJustSaved(false), 1200);
  }

  function handleSaveAndAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSaveOne(commit(form));
    flashSaved();
    clearForm();
    requestAnimationFrame(() => {
      (document.getElementById('mi-name') as HTMLInputElement | null)?.focus();
    });
  }

  function handleSaveAndClose() {
    if (!validate()) return;
    const data = commit(form);
    if (mode === 'edit') onSaveOne(data);
    else if (onSaveAndClose) onSaveAndClose(data);
    else onSaveOne(data);
    onClose();
  }

  const isEdit = mode === 'edit';
  const title = isEdit ? 'Editar prato' : 'Novo prato';
  const subtitle = isEdit
    ? 'Atualize os dados do prato existente.'
    : 'Preencha e clique em "Salvar e adicionar outro" para cadastrar vários pratos seguidos sem fechar a janela.';
  const primaryLabel = isEdit
    ? 'Salvar alterações'
    : (justSaved ? 'Adicionado ✓' : 'Salvar e adicionar outro');
  const primaryIcon = isEdit ? Check : Plus;

  const LeftCol = (
    <div className="admin-form" style={{ gap: 16 }}>
      <div className="admin-modal-field-row">
        <label className="admin-field">
          <span>Nome do prato <span style={{ color: '#b91c1c' }}>*</span></span>
          <input
            id="mi-name"
            autoFocus
            placeholder="Ex.: Peixada Baiana do Pirambeira"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            maxLength={80}
            style={{ fontWeight: 700 }}
          />
          {errors.name && <small className="admin-field-error">{errors.name}</small>}
        </label>
        <label className="admin-field" style={{ flex: '0 0 160px' }}>
          <span>Preço <span style={{ color: '#b91c1c' }}>*</span></span>
          <input
            placeholder="R$ 0,00"
            value={form.price}
            onChange={e => update('price', e.target.value)}
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontWeight: 800, textAlign: 'right', color: '#b45309',
            }}
          />
          {errors.price && <small className="admin-field-error">{errors.price}</small>}
        </label>
      </div>

      <label className="admin-field">
        <span>Descrição detalhada <em>(opcional)</em></span>
        <textarea
          rows={3}
          placeholder="Ingredientes, acompanhamentos, receita de família…"
          value={form.description || ''}
          onChange={e => update('description', e.target.value)}
          maxLength={500}
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#3f4540', fontWeight: 500 }}
        />
        <small className="admin-field-hint">Descrição persuasiva — até 500 caracteres.</small>
      </label>

      <div className="admin-modal-field-row">
        <label className="admin-field">
          <span><Users size={11} style={{ display: 'inline', marginRight: 4 }} /> Porção <em>(opcional)</em></span>
          <input placeholder="Ex.: Serve 2 pessoas" value={form.portion || ''} onChange={e => update('portion', e.target.value)} />
        </label>
        <label className="admin-field">
          <span><Clock size={11} style={{ display: 'inline', marginRight: 4 }} /> Tempo de preparo <em>(opcional)</em></span>
          <input placeholder="Ex.: 25 min" value={form.prepTime || ''} onChange={e => update('prepTime', e.target.value)} />
        </label>
      </div>

      <div className="admin-modal-image-block">
        <div className="admin-modal-image-preview">
          {form.imageUrl
            ? <img src={form.imageUrl} alt={form.name || 'Prato'} />
            : (
              <div className="admin-modal-image-placeholder">
                <CameraIcon size={20} />
                <span>Foto do prato</span>
                <small>Quadrada 1:1 · ≥ 800x800</small>
              </div>
            )}
        </div>
        <div className="admin-modal-image-actions">
          <input
            id="mi-image"
            type="file"
            accept="image/*"
            hidden
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleImage(f);
              e.currentTarget.value = '';
            }}
          />
          <label htmlFor="mi-image" className="admin-button secondary tiny">
            <CameraIcon size={12} /> Anexar foto
          </label>
          {form.imageUrl && (
            <button type="button" className="admin-button danger tiny" onClick={() => update('imageUrl', '')}>
              <Trash2 size={12} /> Remover
            </button>
          )}
        </div>
      </div>

      <div className="admin-modal-section">
        <div className="admin-modal-section-title"><Sparkles size={12} /><span>Selos premium</span></div>
        <div className="admin-modal-badges">
          <button type="button" className={'badgeb ' + (form.isChefPick ? 'on chef' : '')} onClick={() => update('isChefPick', !form.isChefPick)}>✨ Chef's Pick</button>
          <button type="button" className={'badgeb ' + (form.isNew ? 'on new' : '')} onClick={() => update('isNew', !form.isNew)}>🆕 Novo</button>
          <button type="button" className={'badgeb ' + (form.isPromo ? 'on promo' : '')} onClick={() => update('isPromo', !form.isPromo)}>🔥 Promo</button>
          <button
            type="button"
            className={'badgeb ' + (form.isWeeklyPick ? 'on weekly' : '')}
            title="Pode haver apenas UM Destaque da Semana."
            onClick={() => {
              if (!form.isWeeklyPick && hasExistingWeeklyPick) {
                if (!window.confirm('Já existe um Destaque da Semana. Deseja substituir?')) return;
              }
              update('isWeeklyPick', !form.isWeeklyPick);
            }}
          >📅 Destaque da semana</button>
        </div>
        {form.isWeeklyPick && (
          <label className="admin-field" style={{ marginTop: 12 }}>
            <span>Nota do chef <span style={{ color: '#b91c1c' }}>*</span></span>
            <textarea
              rows={2}
              placeholder='Ex.: "Selecionado especialmente esta semana pelo Chef Ciro."'
              value={form.weeklyPickNote || ''}
              onChange={e => update('weeklyPickNote', e.target.value)}
              maxLength={280}
            />
            {errors.weeklyPickNote && <small className="admin-field-error">{errors.weeklyPickNote}</small>}
            <small className="admin-field-hint">Aparece no destaque heróico da página pública.</small>
          </label>
        )}
      </div>

      <div className="admin-modal-section">
        <div className="admin-modal-section-title"><Tag size={12} /><span>Etiquetas (dietas + ocasião)</span></div>
        <div className="admin-modal-tags">
          {MENU_TAG_LIBRARY.map(t => {
            const on = Array.isArray(form.tags) && form.tags.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                className={'tagb ' + (on ? 'on' : '')}
                style={on ? { background: t.color, borderColor: t.color, color: '#fff' } : undefined}
                onClick={() => toggleTag(t.key)}
              >{t.key}</button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const RightCol = (
    <>
      <div className="admin-modal-preview-label">
        <span>Prévia em tempo real</span>
        <small>Como aparece no aplicativo</small>
      </div>
      <div
        className={
          'sp-preview-card ' +
          (form.isChefPick ? ' chef-preview' : '') +
          (form.isPromo ? ' promo-preview' : '') +
          (form.isWeeklyPick ? ' weekly-preview' : '')
        }
      >
        <div className="sp-preview-image" style={{ aspectRatio: '1/1', height: 180 }}>
          {form.imageUrl
            ? <img src={form.imageUrl} alt={form.name || 'Prato'} />
            : <div className="sp-preview-empty"><CameraIcon size={18} /><span>Sem foto</span></div>}
          {form.isWeeklyPick && <div className="weekly-ribbon preview">Semana</div>}
        </div>
        <div className="sp-preview-body" style={{ gap: 10 }}>
          <div className="sp-preview-badges">
            {form.isChefPick && <span className="sp-badge chef">✨ Chef's Pick</span>}
            {form.isNew && <span className="sp-badge new">🆕 Novo</span>}
            {form.isPromo && <span className="sp-badge promo">🔥 Promo</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff2e2', letterSpacing: '-.2px', lineHeight: 1.25 }}>
              {form.name || 'Nome do prato'}
            </h4>
            <strong style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 15, fontWeight: 800, color: '#f59e0b', flexShrink: 0 }}>
              {form.price || 'R$ —'}
            </strong>
          </div>
          <p style={{
            margin: 0, fontSize: 12, color: '#a8a29e', lineHeight: 1.5,
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
          }}>
            {form.description || 'Descrição sedutora do prato com ingredientes especiais.'}
          </p>
          {(form.portion || form.prepTime) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: '#78716c', fontWeight: 600 }}>
              {form.portion && <span>🍽️ {form.portion}</span>}
              {form.prepTime && <span>⏱️ {form.prepTime}</span>}
            </div>
          )}
          {Array.isArray(form.tags) && form.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 2 }}>
              {form.tags.map(t => {
                const found = MENU_TAG_LIBRARY.find(x => x.key === t);
                return (
                  <span
                    key={t}
                    className="sp-tag"
                    style={{
                      background: found?.color ? `${found.color}25` : 'rgba(255,255,255,.06)',
                      color: found?.color || '#a8a29e',
                      border: found?.color ? `1px solid ${found.color}40` : '1px solid rgba(255,255,255,.08)',
                    }}
                  >{t}</span>
                );
              })}
            </div>
          )}
          {form.isWeeklyPick && form.weeklyPickNote && (
            <div className="sp-weekly-note">
              <span>📝 Nota do chef</span>
              <p>{form.weeklyPickNote}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      badge={{ icon: ChefHat, label: categoryName.toUpperCase(), variant: 'green' }}
      size="xl"
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
          primaryLabel={primaryLabel}
          primaryIcon={primaryIcon}
          primarySuccessFlash={justSaved}
          onPrimary={isEdit ? handleSaveAndClose : undefined}
        />
      }
    >
      <AdminModalGrid left={LeftCol} right={RightCol} />
    </AdminModal>
  );
}

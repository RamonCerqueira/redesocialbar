'use client';

import { useEffect, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { AdminModal, AdminModalFooter } from './admin-modal';

export type MenuCategoryInput = {
  name: string;
  description?: string;
  highlight?: boolean;
};

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: MenuCategoryInput | null;
  onSave: (data: MenuCategoryInput) => void;
  submitLabel?: string;
  title?: string;
}

const DEFAULT_CATEGORY: MenuCategoryInput = {
  name: '',
  description: '',
  highlight: false,
};

export function CategoryModal({
  isOpen,
  onClose,
  initial = null,
  onSave,
  submitLabel = 'Salvar categoria',
  title = 'Nova categoria',
}: CategoryModalProps) {
  const [form, setForm] = useState<MenuCategoryInput>(DEFAULT_CATEGORY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setForm(initial ?? DEFAULT_CATEGORY);
      setErrors({});
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = 'Informe o nome da categoria.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      name: form.name.trim(),
      description: form.description?.trim() || '',
      highlight: !!form.highlight,
    });
  }

  function update<K extends keyof MenuCategoryInput>(key: K, value: MenuCategoryInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key as string]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[key as string];
        return copy;
      });
    }
  }

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Organize seus pratos por seções. Categorias com Destaque aparecem com moldura dourada."
      badge={{ icon: Sparkles, label: 'CATEGORIA', variant: 'amber' }}
      size="sm"
      onSubmit={handleSubmit}
      footer={
        <AdminModalFooter
          cancelLabel="Cancelar"
          onCancel={onClose}
          primaryLabel={submitLabel}
          primaryIcon={Check}
          submitForm
        />
      }
    >
      <div className="admin-form" style={{ padding: '20px 24px 4px', gap: 18 }}>
        <label className="admin-field">
          <span>
            Nome da categoria <span style={{ color: '#b91c1c' }}>*</span>
          </span>
          <input
            autoFocus
            placeholder="Ex.: Assinatura do Chef"
            value={form.name}
            onChange={e => update('name', e.target.value)}
            maxLength={60}
          />
          {errors.name && <small className="admin-field-error">{errors.name}</small>}
          <small className="admin-field-hint">Nomes curtos e atrativos — até 60 caracteres.</small>
        </label>

        <label className="admin-field">
          <span>Descrição curta <em>(opcional)</em></span>
          <input
            placeholder="Ex.: Pratos especiais que contam a história da casa."
            value={form.description || ''}
            onChange={e => update('description', e.target.value)}
            maxLength={140}
          />
          <small className="admin-field-hint">
            Aparece abaixo do título na página do cliente (até 140 caracteres).
          </small>
        </label>

        <div className="admin-modal-highlight-option">
          <label
            className={'admin-check-large ' + (form.highlight ? 'on' : '')}
            style={{
              borderColor: form.highlight ? 'rgba(245,158,11,.55)' : undefined,
              background: form.highlight ? 'linear-gradient(135deg, #fff6e5, #ffeec2)' : undefined,
            }}
          >
            <input
              type="checkbox"
              checked={!!form.highlight}
              onChange={e => update('highlight', e.target.checked)}
            />
            <div>
              <strong style={{ color: form.highlight ? '#92400e' : '#18232e' }}>
                ✦ Categoria destaque
              </strong>
              <small style={{ color: form.highlight ? '#b45309' : '#6e7c73' }}>
                Moldura dourada, posicionamento prioritário e sombra premium na página pública.
              </small>
            </div>
          </label>
        </div>
      </div>
    </AdminModal>
  );
}

'use client';
import { useEffect, useMemo, useState, useRef } from 'react';
import { apiRequest, uploadImage } from '@/lib/api';
import { Pencil, Plus, Trash2, Check, Megaphone, FileText, Ticket, Calendar, Search, X } from 'lucide-react';
import { AdminModal, AdminModalGrid, AdminModalFooter } from './admin-modal';

export type Field = {
  key: string;
  label: string;
  type?: 'text'|'textarea'|'number'|'datetime-local'|'image'|'checkbox'|'select'|'url'|'time';
  required?: boolean;
  default?: string|number|boolean;
  options?: { value: string; label: string }[];
  max?: number;
  hint?: string;
  imageSizes?: Record<string,string>;
};
export type ResourceConfig = {
  title: string;
  singular: string;
  route: string;
  fields: Field[];
  archiveLabel?: string;
  previewKind?: string;
};
type Row = { id: string; [key: string]: unknown };
type Values = Record<string,string|number|boolean>;
function initial(fields: Field[]): Values {
  return Object.fromEntries(fields.map(f => [f.key, f.default ?? (f.type === 'checkbox' ? false : '')]));
}
function dateInput(value: unknown) {
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
}
function message(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir a operação.';
}
function charCount(value: unknown, max?: number) {
  const len = String(value ?? '').length;
  if (!max) return null;
  return { len, max, warn: len > max, pct: Math.min(100, Math.round((len/max)*100)) };
}

const BADGE_ICON = {
  posts: FileText,
  promotions: Ticket,
  ads: Megaphone,
  events: Calendar,
} as const;
const BADGE_VARIANT: Record<string, 'amber'|'green'|'rose'|'blue'> = {
  posts: 'blue',
  promotions: 'amber',
  ads: 'amber',
  events: 'green',
};

export function ImageField({
  label, value, onChange, onBusy, sizeText, typeLabel
}: {
  label:string; value:string; onChange:(url:string)=>void; onBusy:(busy:boolean)=>void;
  sizeText?: string; typeLabel?: string;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dims, setDims] = useState<{w:number;h:number}|null>(null);
  async function upload(file?: File) {
    if (!file) return;
    setError(''); setDims(null);
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5*1024*1024) {
      setError('Envie JPEG, PNG ou WebP de até 5 MB.');
      return;
    }
    setBusy(true); onBusy(true);
    try {
      const data = await new Promise<string>((resolve,reject) => {
        const reader=new FileReader();
        reader.onload=()=>resolve(String(reader.result));
        reader.onerror=()=>reject(new Error('Não foi possível ler a imagem.'));
        reader.readAsDataURL(file);
      });
      const d = await new Promise<{w:number;h:number}>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = data;
      });
      setDims(d);
      onChange(await uploadImage(data));
    } catch(err) { setError(message(err)); }
    finally { setBusy(false); onBusy(false); }
  }
  useEffect(() => {
    if (!value) { setDims(null); return; }
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setDims({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { if (!cancelled) setDims(null); };
    img.src = value;
    return () => { cancelled = true; };
  }, [value]);
  return (
    <div className="admin-field">
      <label>
        {label}
        <input aria-label={label} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}} />
      </label>
      <small className="admin-muted">
        {busy ? 'Carregando imagem…' : 'JPEG, PNG ou WebP · até 5 MB'}
        {sizeText && <> · <span className="admin-image-size">Tamanho recomendado para {typeLabel || 'este formato'}: <strong>{sizeText}</strong></span></>}
      </small>
      {value && (
        <div className="admin-image-preview-block">
          <img className="admin-preview" src={value} alt="Prévia da imagem selecionada" />
          {dims && dims.w > 0 && (
            <small className={'admin-image-dims'+(
              (typeLabel==='Destaque na página inicial' && (dims.w < 1200 || dims.w/dims.h < 2.4 || dims.w/dims.h > 3.2)) ||
              (typeLabel==='Anúncio no feed' && (dims.w < 800 || Math.abs(dims.w/dims.h - 1) > 0.1)) ||
              (typeLabel==='Sugestão da casa' && (dims.w < 600 || dims.w/dims.h < 1.1 || dims.w/dims.h > 1.6))
                ? ' warn' : ''
            )}>
              Dimensões atuais: <strong>{dims.w} × {dims.h}</strong>
              {((typeLabel==='Destaque na página inicial' && (dims.w < 1200 || dims.w/dims.h < 2.4 || dims.w/dims.h > 3.2)) && ' · proporção recomendada ~2.8:1 (wide)') ||
               ((typeLabel==='Anúncio no feed' && (dims.w < 800 || Math.abs(dims.w/dims.h - 1) > 0.1)) && ' · proporção recomendada 1:1 (quadrado)') ||
               ((typeLabel==='Sugestão da casa' && (dims.w < 600 || dims.w/dims.h < 1.1 || dims.w/dims.h > 1.6)) && ' · proporção recomendada 4:3 (paisagem)')}
            </small>
          )}
          <button type="button" className="admin-button secondary" onClick={()=>{onChange(''); setDims(null);}}>Remover imagem</button>
        </div>
      )}
      {error && <p role="alert" className="admin-message error">{error}</p>}
    </div>
  );
}

function BannerPreview({ values, typeLabel }: { values: Values; typeLabel: string }) {
  const title = String(values.title || 'Título do banner');
  const description = values.description ? String(values.description) : undefined;
  const image = String(values.imageUrl || '');
  const sponsor = String(values.sponsorName || 'Pirambeira');
  const btn = String(values.buttonText || 'Saiba mais');
  const ratio =
    values.type === 'SPONSORED_POST' ? '1/1' :
    values.type === 'SIDEBAR' ? '4/3' : '2.8/1';
  const maxH =
    values.type === 'SPONSORED_POST' ? '320px' :
    values.type === 'SIDEBAR' ? '240px' : '200px';
  return (
    <div className="admin-preview-panel">
      <div className="admin-preview-heading">
        <h3>Prévia no aplicativo</h3>
        <small>{typeLabel}</small>
      </div>
      <div className="admin-phone-frame">
        <div className="admin-phone-notch" />
        <div className="admin-phone-screen">
          <article className="sp-preview-card">
            <div className="sp-preview-image" style={{ aspectRatio: ratio, maxHeight: maxH }}>
              {image
                ? <img src={image} alt={title} />
                : <div className="sp-preview-empty">Imagem do banner aparecerá aqui</div>}
            </div>
            <div className="sp-preview-body">
              <span className="sp-preview-sponsor">{sponsor}</span>
              <h4>{title}</h4>
              {description && <p>{description}</p>}
              <a className="sp-preview-button" aria-disabled="true">{btn}</a>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

export function ResourceEditor({ slug, config }: { slug:string; config:ResourceConfig }) {
  const [rows,setRows]=useState<Row[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [search,setSearch]=useState('');
  const endpoint='/admin/'+encodeURIComponent(slug)+'/'+config.route;

  // estado do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<Values>(() => initial(config.fields));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<number | null>(null);

  const typeField = config.fields.find(f => f.type==='select');
  const imageField = config.fields.find(f => f.type==='image');
  const currentType = String(values[typeField?.key || 'type'] || 'BANNER');
  const currentTypeLabel = useMemo(() => {
    if (!typeField) return '';
    return typeField.options?.find(o => o.value === currentType)?.label || '';
  }, [typeField, currentType]);
  const currentSizeText = imageField?.imageSizes?.[currentType];
  const isBannerEditor = config.previewKind === 'banner';
  const BadgeIcon = (BADGE_ICON as Record<string, any>)[config.route] || FileText;
  const badgeVariant = BADGE_VARIANT[config.route] || 'amber';

  async function load() {
    setLoading(true); setError('');
    try { setRows(await apiRequest<Row[]>(endpoint)); }
    catch(err) { setError(message(err)); }
    finally { setLoading(false); }
  }
  useEffect(()=>{void load();},[endpoint]);

  useEffect(() => {
    return () => { if (savedTimer.current) window.clearTimeout(savedTimer.current); };
  }, []);

  function openCreate() {
    setEditingId(null);
    setValues(initial(config.fields));
    setFormErrors({});
    setModalOpen(true);
  }
  function openEdit(row: Row) {
    const next = initial(config.fields);
    for (const f of config.fields) {
      let value = row[f.key];
      if (f.key === 'imageUrl' && config.route === 'posts') value = (row.media as {url:string}[] | undefined)?.[0]?.url;
      next[f.key] = f.type === 'datetime-local'
        ? dateInput(value)
        : (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? value : next[f.key]);
    }
    setEditingId(row.id);
    setValues(next);
    setFormErrors({});
    setModalOpen(true);
  }
  function flashSaved() {
    setJustSaved(true);
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setJustSaved(false), 1000);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    for (const f of config.fields) {
      if (f.required && !String(values[f.key] ?? '').trim()) {
        next[f.key] = 'Preencha: ' + f.label;
      }
      if (f.max && String(values[f.key] ?? '').length > f.max) {
        next[f.key] = f.label + ' tem limite de ' + f.max + ' caracteres.';
      }
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  }

  function buildBody(): Record<string, unknown> {
    const body: Record<string, unknown> = { ...values };
    for (const f of config.fields) {
      if (f.type === 'datetime-local') body[f.key] = new Date(String(values[f.key])).toISOString();
      if (f.type === 'number') body[f.key] = Number(values[f.key]);
    }
    if (config.route === 'posts') { body.mediaUrls = values.imageUrl ? [values.imageUrl] : []; delete body.imageUrl; }
    return body;
  }

  async function handleSaveAndAdd(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!validate()) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const body = buildBody();
      await apiRequest(endpoint + (editingId ? '/' + editingId : ''), { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(body) });
      await load();
      setNotice(config.singular + ' salvo com sucesso.');
      if (editingId) {
        setModalOpen(false);
      } else {
        setValues(initial(config.fields));
        setFormErrors({});
        flashSaved();
        requestAnimationFrame(() => {
          const first = document.querySelector<HTMLInputElement>('.resource-first-input');
          first?.focus();
        });
      }
    } catch (err) { setError(message(err)); }
    finally { setSaving(false); }
  }

  async function handleSaveAndClose() {
    if (!validate()) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const body = buildBody();
      await apiRequest(endpoint + (editingId ? '/' + editingId : ''), { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(body) });
      await load();
      setNotice(config.singular + ' salvo com sucesso.');
      setModalOpen(false);
    } catch (err) { setError(message(err)); }
    finally { setSaving(false); }
  }

  async function archive(row: Row) {
    if (!window.confirm((config.archiveLabel || 'Desativar') + ' este registro?')) return;
    setSaving(true); setError(''); setNotice('');
    try {
      await apiRequest(endpoint + '/' + row.id, { method: 'DELETE' });
      if (editingId === row.id) setModalOpen(false);
      await load();
      setNotice('Registro atualizado.');
    } catch (err) { setError(message(err)); }
    finally { setSaving(false); }
  }

  const visible = rows.filter(r => String(r.title || r.content || '').toLowerCase().includes(search.toLowerCase()));
  const isEdit = !!editingId;
  const modalTitle = isEdit ? 'Editar ' + config.singular.toLowerCase() : 'Novo ' + config.singular.toLowerCase();

  /* -------- RENDER -------- */
  const FormContent = (
    <div className="admin-form" style={{ padding: '20px 24px 4px', gap: 16 }}>
      {config.fields.map((field, idx) => renderField(
        field, values,
        (v) => {
          setValues(prev => ({ ...prev, [field.key]: v }));
          if (formErrors[field.key]) {
            setFormErrors(prev => { const copy = { ...prev }; delete copy[field.key]; return copy; });
          }
        },
        setUploading,
        currentTypeLabel,
        currentSizeText,
        idx === 0,
        formErrors[field.key],
      ))}
    </div>
  );

  const PreviewContent = isBannerEditor
    ? (
      <>
        <BannerPreview values={values} typeLabel={currentTypeLabel} />
      </>
    )
    : (
      <div className="admin-resource-live-card">
        <div className="admin-modal-preview-label">
          <span>Resumo</span>
          <small>Como está ficando o registro</small>
        </div>
        <div className="admin-res-card">
          <div className="admin-res-card-title">
            {String(values.title || values.content || ('Sem título — ' + config.singular.toLowerCase())).slice(0, 120) || 'Sem conteúdo'}
          </div>
          {values.description && (
            <p className="admin-res-card-desc">
              {String(values.description).slice(0, 160)}
            </p>
          )}
          {values.totalCoupons !== undefined && (
            <div className="admin-res-card-meta">
              <span>🎟️ {Number(values.totalCoupons)} cupons no lote</span>
              {values.validUntil && <span>📅 Até {new Date(String(values.validUntil)).toLocaleDateString('pt-BR')}</span>}
            </div>
          )}
          {values.date && (
            <div className="admin-res-card-meta">
              <span>📅 {new Date(String(values.date)).toLocaleDateString('pt-BR')}</span>
              {values.startTime && <span>🕖 {String(values.startTime)}</span>}
              {values.category && <span>🏷️ {String(values.category)}</span>}
            </div>
          )}
          {(values.isActive !== false) && <span className="admin-res-card-badge on">Publicado</span>}
          {(values.isActive === false) && <span className="admin-res-card-badge off">Desativado</span>}
          {(values.isPinned) && <span className="admin-res-card-badge pin">📌 Fixado</span>}
        </div>
      </div>
    );

  return (
    <>
      {error && <div role="alert" className="admin-message error">{error} <button onClick={() => void load()}>Tentar novamente</button></div>}
      {notice && !modalOpen && <div role="status" className="admin-message">{notice}</div>}

      <div className="admin-toolbar" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{config.title} <span className="admin-muted">({rows.length})</span></h2>
        <div className="admin-actions" style={{ margin: 0, gap: 8 }}>
          <button className="admin-button" onClick={openCreate}>
            <Plus size={14} /> {config.singular} novo
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#8a9790' }} />
        <input
          aria-label="Buscar registros"
          placeholder="Buscar por texto…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 38 }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: '#f0f3f1', border: 0, borderRadius: 999, width: 28, height: 28,
              display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#59645e',
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {loading
        ? <p className="admin-muted">Carregando…</p>
        : (
          <div className="admin-grid-list">
            {visible.length === 0 && (
              <div className="admin-empty" style={{ gridColumn: '1 / -1' }}>
                {rows.length === 0
                  ? <>Nenhum registro ainda. Clique em "{config.singular} novo" para começar.</>
                  : <>Nenhum resultado para "{search}".</>}
              </div>
            )}
            {visible.map(row => {
              const image = String(row.imageUrl || row.coverImageUrl || (row.media as {url:string}[] | undefined)?.[0]?.url || '');
              const isOff = row.isActive === false;
              return (
                <article key={row.id} className={'admin-grid-card ' + (isOff ? 'inactive' : '')}>
                  {image && (
                    <div className="admin-grid-card-img">
                      <img src={image} alt="" />
                    </div>
                  )}
                  <div className="admin-grid-card-body">
                    <div className="admin-grid-card-head">
                      <span className={'admin-badge' + (isOff ? ' off' : '')}>
                        {isOff ? 'Desativado' : (row.isPinned ? '📌 Fixado' : 'Publicado')}
                      </span>
                    </div>
                    <h3 className="admin-grid-card-title">
                      {String(row.title || row.content || '').slice(0, 140) || 'Sem título'}
                    </h3>
                    {Boolean(row.description) && (
                      <p className="admin-grid-card-desc">{String(row.description).slice(0, 140)}</p>
                    )}
                    {row.totalCoupons !== undefined && (
                      <div className="admin-grid-card-meta">
                        🎟️ {Number(row.redeemedCount)} / {Number(row.totalCoupons)} cupons
                      </div>
                    )}
                    {Boolean(row.date) && (
                      <div className="admin-grid-card-meta">
                        📅 {new Date(String(row.date)).toLocaleDateString('pt-BR')} · {String(row.startTime || '')}
                      </div>
                    )}
                    {Boolean(row.buttonText) && (
                      <div className="admin-grid-card-meta">🔘 Botão: {String(row.buttonText)}</div>
                    )}
                  </div>
                  <div className="admin-grid-card-actions">
                    <button className="admin-button secondary tiny" onClick={() => openEdit(row)}>
                      <Pencil size={13} /> Editar
                    </button>
                    {!isOff && (
                      <button className="admin-button danger tiny" onClick={() => void archive(row)} disabled={saving}>
                        <Trash2 size={13} /> {config.archiveLabel || 'Desativar'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

      {/* ======= MODAL ======= */}
      <AdminModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        subtitle={
          isEdit
            ? 'Atualize os dados e salve.'
            : `Clique em "Salvar e adicionar outro" para criar vários ${config.singular.toLowerCase()}s em sequência sem fechar a janela.`
        }
        badge={{ icon: BadgeIcon, label: config.singular.toUpperCase(), variant: badgeVariant }}
        size={isBannerEditor ? 'xl' : 'lg'}
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
            onCancel={() => setModalOpen(false)}
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
            primaryDisabled={saving || uploading}
            primarySuccessFlash={justSaved}
          />
        }
      >
        {error && <div role="alert" className="admin-message error" style={{ margin: '12px 24px 0' }}>{error}</div>}
        {notice && <div role="status" className="admin-message" style={{ margin: '12px 24px 0' }}>{notice}</div>}

        <AdminModalGrid
          left={FormContent}
          right={PreviewContent}
          rightSticky
        />
      </AdminModal>
    </>
  );
}

function renderField(
  field: Field,
  values: Values,
  change: (v:string|number|boolean)=>void,
  setUploading: (v:boolean)=>void,
  currentTypeLabel?: string,
  currentSizeText?: string,
  isFirst?: boolean,
  err?: string,
) {
  const value = values[field.key];
  const count = charCount(value, field.max);
  if (field.type === 'image') {
    return (
      <div key={field.key} className={isFirst ? 'resource-first-input-wrap' : ''}>
        <ImageField
          label={field.label + (field.required ? ' *' : '')}
          value={String(value || '')}
          onChange={change}
          onBusy={setUploading}
          sizeText={currentSizeText || Object.values(field.imageSizes || {})[0]}
          typeLabel={currentTypeLabel}
        />
        {err && <small className="admin-field-error" style={{ marginTop: 6, display: 'block' }}>{err}</small>}
      </div>
    );
  }
  if (field.type === 'checkbox') {
    return (
      <div key={field.key}>
        <label className="admin-check">
          <input type="checkbox" checked={Boolean(value)} onChange={e => change(e.target.checked)} />
          {field.label}
        </label>
        {field.hint && <small className="admin-field-hint">{field.hint}</small>}
        {err && <small className="admin-field-error" style={{ marginTop: 6, display: 'block' }}>{err}</small>}
      </div>
    );
  }
  return (
    <label className="admin-field" key={field.key}>
      <span className="admin-field-label-row">
        <span>{field.label}{field.required ? ' *' : ''}</span>
        {count && <span className={'admin-counter' + (count.warn ? ' warn' : '')}>{count.len}/{count.max}</span>}
      </span>
      {field.hint && <small className="admin-field-hint">{field.hint}</small>}
      {field.type === 'textarea'
        ? (
          <textarea
            className={isFirst ? 'resource-first-input' : ''}
            required={field.required} maxLength={field.max || 3000}
            value={String(value)} onChange={e => change(e.target.value)}
          />
        )
        : field.type === 'select'
          ? (
            <select
              className={isFirst ? 'resource-first-input' : ''}
              value={String(value)} onChange={e => change(e.target.value)}
            >
              {field.options?.map(o => <option value={o.value} key={o.value}>{o.label}</option>)}
            </select>
          )
          : (
            <input
              className={isFirst ? 'resource-first-input' : ''}
              type={field.type || 'text'}
              required={field.required}
              min={field.type === 'number' ? 1 : undefined}
              max={field.type === 'number' ? 100000 : undefined}
              maxLength={field.max || 300}
              value={String(value)}
              onChange={e => change(e.target.value)}
            />
          )
      }
      {count && <div className="admin-counter-bar"><div style={{ width: count.pct + '%', background: count.warn ? '#b91c1c' : '#225d43' }} /></div>}
      {err && <small className="admin-field-error">{err}</small>}
    </label>
  );
}

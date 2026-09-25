'use client';
import { useEffect, useState } from 'react';
import { apiRequest, uploadImage } from '@/lib/api';

export type Field = { key: string; label: string; type?: 'text'|'textarea'|'number'|'datetime-local'|'image'|'checkbox'|'select'|'url'|'time'; required?: boolean; default?: string|number|boolean; options?: { value: string; label: string }[]; max?: number };
export type ResourceConfig = { title: string; singular: string; route: string; fields: Field[]; archiveLabel?: string };
type Row = { id: string; [key: string]: unknown };
type Values = Record<string,string|number|boolean>;
function initial(fields: Field[]): Values { return Object.fromEntries(fields.map(f => [f.key, f.default ?? (f.type === 'checkbox' ? false : '')])); }
function dateInput(value: unknown) { const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16); }
function message(error: unknown) { return error instanceof Error ? error.message : 'Não foi possível concluir a operação.'; }

export function ImageField({ label, value, onChange, onBusy }: { label:string; value:string; onChange:(url:string)=>void; onBusy:(busy:boolean)=>void }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function upload(file?: File) {
    if (!file) return;
    setError('');
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5*1024*1024) { setError('Envie JPEG, PNG ou WebP de até 5 MB.'); return; }
    setBusy(true); onBusy(true);
    try {
      const data = await new Promise<string>((resolve,reject) => { const reader=new FileReader(); reader.onload=()=>resolve(String(reader.result)); reader.onerror=()=>reject(new Error('Não foi possível ler a imagem.')); reader.readAsDataURL(file); });
      onChange(await uploadImage(data));
    } catch(error) { setError(message(error)); }
    finally { setBusy(false); onBusy(false); }
  }
  return <div className="admin-field"><label>{label}<input aria-label={label} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}} /></label>
    <small className="admin-muted">{busy ? 'Carregando imagem…' : 'JPEG, PNG ou WebP · até 5 MB'}</small>
    {value && <><img className="admin-preview" src={value} alt="Prévia da imagem selecionada" /><button type="button" className="admin-button secondary" onClick={()=>onChange('')}>Remover imagem</button></>}
    {error && <p role="alert" className="admin-message error">{error}</p>}
  </div>;
}

export function ResourceEditor({ slug, config }: { slug:string; config:ResourceConfig }) {
  const [rows,setRows]=useState<Row[]>([]);
  const [values,setValues]=useState<Values>(()=>initial(config.fields));
  const [editing,setEditing]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [search,setSearch]=useState('');
  const endpoint='/admin/'+encodeURIComponent(slug)+'/'+config.route;
  async function load() {
    setLoading(true); setError('');
    try { setRows(await apiRequest<Row[]>(endpoint)); }
    catch(error) { setError(message(error)); }
    finally { setLoading(false); }
  }
  useEffect(()=>{void load();},[endpoint]);
  function reset() { setEditing(null);setValues(initial(config.fields)); }
  function edit(row:Row) {
    const next=initial(config.fields);
    for(const f of config.fields) {
      let value=row[f.key];
      if(f.key==='imageUrl' && config.route==='posts') value=(row.media as {url:string}[] | undefined)?.[0]?.url;
      next[f.key]=f.type==='datetime-local' ? dateInput(value) : (typeof value==='string'||typeof value==='number'||typeof value==='boolean' ? value : next[f.key]);
    }
    setEditing(row.id);setValues(next);setError('');setNotice('');
    document.getElementById('resource-editor')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function save(event:React.FormEvent) {
    event.preventDefault();setSaving(true);setError('');setNotice('');
    try {
      const body:Record<string,unknown>={...values};
      for(const f of config.fields) {
        if(f.type==='datetime-local') body[f.key]=new Date(String(values[f.key])).toISOString();
        if(f.type==='number') body[f.key]=Number(values[f.key]);
        if(f.required && !String(values[f.key] ?? '').trim()) throw new Error('Preencha: '+f.label);
      }
      if(config.route==='posts') {body.mediaUrls=values.imageUrl ? [values.imageUrl] : [];delete body.imageUrl;}
      await apiRequest(endpoint+(editing?'/'+editing:''),{method:editing?'PUT':'POST',body:JSON.stringify(body)});
      reset();await load();setNotice(config.singular+' salvo com sucesso.');
    } catch(error) {setError(message(error));}
    finally {setSaving(false);}
  }
  async function archive(row:Row) {
    if(!window.confirm((config.archiveLabel || 'Desativar')+' este registro?')) return;
    setSaving(true);setError('');setNotice('');
    try {await apiRequest(endpoint+'/'+row.id,{method:'DELETE'});if(editing===row.id) reset();await load();setNotice('Registro atualizado.');}
    catch(error){setError(message(error));}finally{setSaving(false);}
  }
  const visible=rows.filter(r=>String(r.title || r.content || '').toLowerCase().includes(search.toLowerCase()));
  return <>
    {error && <div role="alert" className="admin-message error">{error} <button onClick={()=>void load()}>Tentar novamente</button></div>}
    {notice && <div role="status" className="admin-message">{notice}</div>}
    <div className="admin-grid">
      <section><div className="admin-toolbar"><h2>{config.title} <span className="admin-muted">({rows.length})</span></h2><button className="admin-button secondary" onClick={reset}>Novo</button></div>
        <input aria-label="Buscar registros" placeholder="Buscar por texto…" value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:16}} />
        {loading?<p className="admin-muted">Carregando…</p>:<div className="admin-list">
          {visible.length===0 && <div className="admin-empty">Nenhum registro encontrado. Use o formulário para criar o primeiro.</div>}
          {visible.map(row=>{
            const image=String(row.imageUrl || row.coverImageUrl || (row.media as {url:string}[]|undefined)?.[0]?.url || '');
            return <article className="admin-card admin-item" key={row.id}>
              {image && <img src={image} alt="" />}
              <div className="admin-item-body"><span className={'admin-badge'+(row.isActive===false?' off':'')}>{row.isActive===false?'Desativado':'Publicado'}</span>
                <h3>{String(row.title || row.content || '').slice(0,180)}</h3>
                {row.description ? <p>{String(row.description).slice(0,160)}</p>:null}
                {row.totalCoupons!==undefined && <p>{Number(row.redeemedCount)} emitidos de {Number(row.totalCoupons)} · validade {new Date(String(row.validUntil)).toLocaleString('pt-BR')}</p>}
                {row.date ? <p>{new Date(String(row.date)).toLocaleDateString('pt-BR')} às {String(row.startTime)}</p>:null}
                {row.buttonText ? <p>Botão: {String(row.buttonText)}</p>:null}
                <div className="admin-actions"><button disabled={saving} className="admin-button secondary" onClick={()=>edit(row)}>Editar</button>
                  {row.isActive!==false && <button disabled={saving} className="admin-button danger" onClick={()=>void archive(row)}>{config.archiveLabel || 'Desativar'}</button>}
                </div>
              </div>
            </article>;
          })}
        </div>}
      </section>
      <section id="resource-editor" className="admin-card"><h2>{editing?'Editar':'Criar'} {config.singular.toLowerCase()}</h2><p className="admin-muted" style={{marginBottom:20}}>As alterações salvas aparecem no aplicativo.</p>
        <form onSubmit={save} className="admin-form">
          {config.fields.map(field=>{
            const value=values[field.key];
            const change=(v:string|number|boolean)=>setValues(prev=>({...prev,[field.key]:v}));
            if(field.type==='image') return <ImageField key={field.key} label={field.label} value={String(value || '')} onChange={change} onBusy={setUploading} />;
            if(field.type==='checkbox') return <label className="admin-check" key={field.key}><input type="checkbox" checked={Boolean(value)} onChange={e=>change(e.target.checked)} />{field.label}</label>;
            return <label className="admin-field" key={field.key}>{field.label}{field.required?' *':''}
              {field.type==='textarea'?<textarea required={field.required} maxLength={field.max || 3000} value={String(value)} onChange={e=>change(e.target.value)} />:
              field.type==='select'?<select value={String(value)} onChange={e=>change(e.target.value)}>{field.options?.map(o=><option value={o.value} key={o.value}>{o.label}</option>)}</select>:
              <input type={field.type || 'text'} required={field.required} min={field.type==='number'?1:undefined} max={field.type==='number'?100000:undefined} maxLength={field.max || 300} value={String(value)} onChange={e=>change(e.target.value)} />}
            </label>;
          })}
          <div className="admin-actions"><button disabled={saving||uploading} type="submit" className="admin-button">{saving?'Salvando…':editing?'Salvar alterações':'Publicar'}</button>{editing&&<button type="button" className="admin-button secondary" onClick={reset}>Cancelar edição</button>}</div>
        </form>
      </section>
    </div>
  </>;
}

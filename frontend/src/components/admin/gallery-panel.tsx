'use client';

import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import { ImageField } from './resource-editor';

export function GalleryPanel({ slug }: { slug: string }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    apiRequest<{ galleryPhotos?: string[] }>(`/admin/${slug}/settings`).then(data => { if (active) { setPhotos(data.galleryPhotos || []); setLoaded(true); } }).catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [slug]);
  async function save() {
    setBusy(true); setError(''); setNotice('');
    try {
      const data = await apiRequest<{ galleryPhotos: string[] }>(`/admin/${slug}/gallery`, { method: 'PUT', body: JSON.stringify({ photos }) });
      setPhotos(data.galleryPhotos); setNotice('Galeria publicada no aplicativo.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível salvar a galeria.'); }
    finally { setBusy(false); }
  }
  function move(index: number, direction: number) {
    setPhotos(previous => { const next = [...previous]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; return next; });
    setNotice('');
  }
  return <section className="admin-card admin-form" style={{ marginTop: 24 }}>
    <h2>Galeria de fotos do restaurante</h2>
    <p className="admin-muted">Fotos circulares acima do cardápio, sem legendas. Até 20 imagens. As alterações aparecem no app após salvar.</p>
    {error && <p role="alert" className="admin-message error">{error}</p>}{notice && <p role="status" className="admin-message">{notice}</p>}
    {loaded ? <>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, minWidth: 0 }}>
        {photos.length < 20 && <ImageField label="Adicionar foto à galeria" value="" onBusy={setUploading} onChange={url => { if (url) { setPhotos(previous => [...previous, url].slice(0, 20)); setNotice(''); } }}/>} 
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginTop: 16 }}>
          {photos.map((url, index) => <div key={`${url}-${index}`} style={{ minWidth: 0 }}>
            <img src={url} alt={`Foto ${index + 1} da galeria`} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12 }}/>
            <div className="admin-actions" style={{ marginTop: 8 }}>
              <button type="button" className="admin-button secondary tiny" disabled={!index} aria-label={`Mover foto ${index + 1} para antes`} onClick={() => move(index, -1)}>←</button>
              <button type="button" className="admin-button secondary tiny" disabled={index === photos.length - 1} aria-label={`Mover foto ${index + 1} para depois`} onClick={() => move(index, 1)}>→</button>
              <button type="button" className="admin-button danger tiny" aria-label={`Remover foto ${index + 1}`} onClick={() => { setPhotos(previous => previous.filter((_, photoIndex) => photoIndex !== index)); setNotice(''); }}>Remover</button>
            </div>
          </div>)}
        </div>
      </fieldset>
      <button type="button" disabled={busy || uploading} className="admin-button" onClick={() => void save()}>{busy ? 'Salvando…' : 'Salvar galeria'}</button>
    </> : !error && <p>Carregando galeria…</p>}
  </section>;
}

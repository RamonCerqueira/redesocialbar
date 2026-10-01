'use client';

import { useEffect, useState } from 'react';
import { Loader2, Send, X } from 'lucide-react';
import { apiRequest, uploadImage } from '@/lib/api';
import { Story } from '@/lib/types';
import { CameraCapture } from './camera-capture';
import { PhotoEditor } from './photo-editor';
import { FullscreenDialog } from './fullscreen-dialog';

interface DeAgoraCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryCreated: (story: Story) => void;
}

export function DeAgoraCameraModal({ isOpen, onClose, onStoryCreated }: DeAgoraCameraModalProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isOpen) { setSource(null); setEditing(false); setPhoto(null); setCaption(''); setError(''); }
  }, [isOpen]);

  async function publish() {
    if (!photo || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const mediaUrl = await uploadImage(photo);
      const story = await apiRequest<Story>('/stories', {
        method: 'POST',
        body: JSON.stringify({ mediaUrl, mediaType: 'IMAGE', caption: caption.trim() || undefined, restaurantSlug: 'pirambeira' }),
      });
      onStoryCreated(story);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível publicar. Tente novamente.');
    } finally { setSubmitting(false); }
  }

  if (!isOpen) return null;
  if (editing && source) return <PhotoEditor source={source} aspectRatio={9 / 16} onCancel={() => { setEditing(false); if (!photo) setSource(null); }} onConfirm={adjusted => { setPhoto(adjusted); setEditing(false); }} />;
  if (!photo) return <CameraCapture title="De Agora • Piramba" onCapture={captured => { setSource(captured); setPhoto(captured); setEditing(false); }} onClose={onClose} />;
  return <FullscreenDialog title="Prévia do De Agora" onClose={() => { if (!submitting) onClose(); }}>
    <div className="camera-screen">
      <img src={photo} alt="Foto para publicar no De Agora" className="camera-video camera-preview-image" />
      <div className="camera-shade" />
      <header className="camera-topbar">
        <button type="button" autoFocus disabled={submitting} className="camera-icon-button" aria-label="Fechar prévia" onClick={onClose}><X size={23} /></button>
        <span className="camera-title">De Agora • Piramba</span>
        <button type="button" disabled={submitting} className="text-xs font-semibold text-amber-300" onClick={() => setPhoto(null)}>Tirar outra</button>
      </header>
      <div className="camera-preview-controls">
        <button type="button" disabled={submitting} className="photo-editor-option mb-3" onClick={() => setEditing(true)}>Ajustar foto</button>
        <label className="block text-xs text-amber-300 mb-2" htmlFor="de-agora-caption">Conta o que está rolando</label>
        <input id="de-agora-caption" value={caption} disabled={submitting} onChange={event => setCaption(event.target.value)} maxLength={140} placeholder="Legenda do momento (opcional)" className="w-full rounded-2xl border border-white/20 bg-black/60 p-3 text-sm text-white" />
        {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
        <button type="button" disabled={submitting} onClick={() => { void publish(); }} className="mt-3 w-full min-h-12 rounded-2xl bg-amber-400 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 size={19} className="animate-spin" /> : <Send size={19} />}
          {submitting ? 'Publicando...' : 'Postar no De Agora'}
        </button>
      </div>
    </div>
  </FullscreenDialog>;
}

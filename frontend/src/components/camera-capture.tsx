'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Image as ImageIcon, Loader2, RotateCcw, X } from 'lucide-react';
import { FullscreenDialog } from './fullscreen-dialog';
import { capturePhoto, photoFromFile } from '@/lib/camera-photo';
import { PhotoEditor } from './photo-editor';

type Facing = 'environment' | 'user';

export function CameraCapture({ title, onCapture, onClose }: { title: string; onCapture: (photo: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const nativeRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [facing, setFacing] = useState<Facing>('environment');
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  function stop() {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }
  function attachVideo(video: HTMLVideoElement | null) {
    videoRef.current = video;
    if (video && streamRef.current && video.srcObject !== streamRef.current) {
      video.srcObject = streamRef.current;
      void video.play().catch(() => { /* loadedmetadata retries once the video is ready */ });
    }
  }

  useEffect(() => {
    const request = ++requestRef.current;
    stop();
    setReady(false);
    setStarting(true);
    setError('');
    if (captured) { setStarting(false); return; }
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Use a câmera do celular ou a galeria neste navegador.');
        const constraints: MediaTrackConstraints[] = [
          { facingMode: { exact: facing }, width: { ideal: 1280 } },
          { facingMode: { ideal: facing } },
          {},
        ];
        let stream: MediaStream | null = null;
        for (const video of constraints) {
          try { stream = await navigator.mediaDevices.getUserMedia({ video, audio: false }); break; }
          catch (cause) {
            if (cause instanceof DOMException && !['OverconstrainedError', 'NotFoundError'].includes(cause.name)) throw cause;
          }
          if (request !== requestRef.current) return;
        }
        if (!stream) throw new Error('Nenhuma câmera disponível. Use a câmera do celular ou a galeria.');
        // Close/switch can happen while the permission prompt is pending.
        if (request !== requestRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
        const track = stream.getVideoTracks()[0];
        const capabilities = (track.getCapabilities?.() || {}) as MediaTrackCapabilities & { zoom?: { min: number; max: number } };
        if (capabilities.zoom) {
          const zoom = Math.max(capabilities.zoom.min, Math.min(1, capabilities.zoom.max));
          try { await track.applyConstraints({ advanced: [{ zoom } as MediaTrackConstraintSet & { zoom: number }] }); } catch { /* Device may expose but not implement zoom constraints. */ }
        }
        if (request !== requestRef.current) { stream.getTracks().forEach(item => item.stop()); return; }
        streamRef.current = stream;
        attachVideo(videoRef.current);
      } catch (cause) {
        if (request !== requestRef.current) return;
        setError(cause instanceof DOMException && cause.name === 'NotAllowedError'
          ? 'Permita o acesso à câmera nas configurações do navegador ou use a câmera do celular.'
          : cause instanceof DOMException && cause.name === 'NotReadableError'
            ? 'A câmera está ocupada. Feche outros aplicativos e tente novamente.'
            : cause instanceof Error ? cause.message : 'Não foi possível abrir a câmera.');
        setStarting(false);
      }
    }
    void start();
    return () => { ++requestRef.current; stop(); };
  }, [facing, retry, captured]);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const request = ++requestRef.current;
    stop();
    setReady(false);
    setStarting(false);
    setReading(true);
    try {
      const photo = await photoFromFile(file);
      if (request === requestRef.current) setCaptured(photo);
    } catch (cause) {
      if (request === requestRef.current) setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a foto.');
    } finally {
      if (request === requestRef.current) setReading(false);
    }
  }

  function takePhoto() {
    if (!ready || !videoRef.current) return;
    try {
      const photo = capturePhoto(videoRef.current, facing === 'user');
      ++requestRef.current;
      stop();
      setCaptured(photo);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível tirar a foto.'); }
  }

  if (editing && captured) return <PhotoEditor source={captured} allowOriginal onCancel={() => setEditing(false)} onConfirm={photo => { setCaptured(photo); setEditing(false); }} />;
  return <FullscreenDialog title={title} onClose={onClose}>
    <div className="camera-screen">
      <div className="camera-viewfinder">
      {captured ? <img src={captured} alt="Foto capturada" className="camera-video camera-preview-image" /> : <video ref={attachVideo} autoPlay playsInline muted className={'camera-video camera-preview-image ' + (facing === 'user' ? 'camera-video-mirrored' : '')}
        onLoadedMetadata={event => { void event.currentTarget.play().catch(() => { setError('Toque em Tentar novamente para iniciar a câmera.'); setStarting(false); }); }}
        onPlaying={() => { setReady(true); setStarting(false); }} />}
      </div>
      <div className="camera-shade" />
      <input ref={nativeRef} type="file" accept="image/*" capture={facing} hidden onChange={event => { void selectFile(event); }} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={event => { void selectFile(event); }} />
      <header className="camera-topbar">
        <button type="button" autoFocus className="camera-icon-button" aria-label="Fechar câmera" onClick={onClose}><X size={23} /></button>
        <span className="camera-title">{title}</span>
        {!captured ? <button type="button" className="camera-icon-button" aria-label="Inverter câmera" disabled={starting || reading} onClick={() => setFacing(value => value === 'user' ? 'environment' : 'user')}><RotateCcw size={23} /></button> : <span className="w-11" />}
      </header>
      {(starting || reading) && <div className="camera-status" role="status"><Loader2 className="animate-spin" /><p>{reading ? 'Preparando sua foto...' : 'Iniciando câmera...'}</p></div>}
      {error && !reading && <div className="camera-status" role="alert"><p>{error}</p><button type="button" className="camera-retry" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button><button type="button" className="camera-retry" onClick={() => nativeRef.current?.click()}>Usar câmera do celular</button></div>}
      {captured ? <footer className="camera-confirm-controls">
        <div className="flex justify-center gap-3 mb-4"><button type="button" className="photo-editor-option" onClick={() => setCaptured(null)}>Tirar outra</button><button type="button" className="photo-editor-option" onClick={() => setEditing(true)}>Ajustar foto</button></div>
        <button type="button" className="w-full min-h-12 rounded-2xl bg-amber-400 text-black font-bold" onClick={() => onCapture(captured)}>Usar foto</button>
      </footer> : <footer className="camera-controls">
        <button type="button" className="camera-secondary" disabled={reading} onClick={() => galleryRef.current?.click()}><ImageIcon size={24} /><span>Galeria</span></button>
        <button type="button" className="camera-shutter" aria-label="Tirar foto" disabled={!ready || reading} onClick={takePhoto}><span /></button>
        <button type="button" className="camera-secondary" disabled={reading} onClick={() => nativeRef.current?.click()}><Camera size={24} /><span>Câmera do celular</span></button>
      </footer>}
    </div>
  </FullscreenDialog>;
}

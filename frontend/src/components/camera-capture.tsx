'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Camera, Image as ImageIcon, Loader2, RotateCcw, X } from 'lucide-react';
import { FullscreenDialog } from './fullscreen-dialog';
import { capturePhoto, photoFromFile } from '@/lib/camera-photo';

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
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Use a câmera do celular ou a galeria neste navegador.');
        const constraints: MediaTrackConstraints[] = [
          { facingMode: { exact: facing }, width: { ideal: 1080 }, height: { ideal: 1920 } },
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
  }, [facing, retry]);

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
      if (request === requestRef.current) onCapture(photo);
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
      onCapture(photo);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível tirar a foto.'); }
  }

  return <FullscreenDialog title={title} onClose={onClose}>
    <div className="camera-screen">
      <video ref={attachVideo} autoPlay playsInline muted className={'camera-video ' + (facing === 'user' ? 'camera-video-mirrored' : '')}
        onLoadedMetadata={event => { void event.currentTarget.play().catch(() => { setError('Toque em Tentar novamente para iniciar a câmera.'); setStarting(false); }); }}
        onPlaying={() => { setReady(true); setStarting(false); }} />
      <div className="camera-shade" />
      <input ref={nativeRef} type="file" accept="image/*" capture={facing} hidden onChange={event => { void selectFile(event); }} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={event => { void selectFile(event); }} />
      <header className="camera-topbar">
        <button type="button" autoFocus className="camera-icon-button" aria-label="Fechar câmera" onClick={onClose}><X size={23} /></button>
        <span className="camera-title">{title}</span>
        <button type="button" className="camera-icon-button" aria-label="Inverter câmera" disabled={starting || reading} onClick={() => setFacing(value => value === 'user' ? 'environment' : 'user')}><RotateCcw size={23} /></button>
      </header>
      {(starting || reading) && <div className="camera-status" role="status"><Loader2 className="animate-spin" /><p>{reading ? 'Preparando sua foto...' : 'Iniciando câmera...'}</p></div>}
      {error && !reading && <div className="camera-status" role="alert"><p>{error}</p><button type="button" className="camera-retry" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button><button type="button" className="camera-retry" onClick={() => nativeRef.current?.click()}>Usar câmera do celular</button></div>}
      <footer className="camera-controls">
        <button type="button" className="camera-secondary" disabled={reading} onClick={() => galleryRef.current?.click()}><ImageIcon size={24} /><span>Galeria</span></button>
        <button type="button" className="camera-shutter" aria-label="Tirar foto" disabled={!ready || reading} onClick={takePhoto}><span /></button>
        <button type="button" className="camera-secondary" disabled={reading} onClick={() => nativeRef.current?.click()}><Camera size={24} /><span>Câmera do celular</span></button>
      </footer>
    </div>
  </FullscreenDialog>;
}

'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { Check, X } from 'lucide-react';
import { FullscreenDialog } from './fullscreen-dialog';

export function PhotoEditor({ source, aspectRatio, circular = false, allowOriginal = false, onConfirm, onCancel }: {
  source: string; aspectRatio?: number; circular?: boolean; allowOriginal?: boolean;
  onConfirm: (photo: string) => void; onCancel: () => void;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [original, setOriginal] = useState(!aspectRatio);
  const [error, setError] = useState('');
  const ratio = original && natural.width ? natural.width / natural.height : aspectRatio || 1;
  // Contain is the default: a face near an edge is never silently cropped.
  const imageRatio = natural.width / natural.height || ratio;
  const widthPercent = imageRatio > ratio ? 100 : imageRatio / ratio * 100;
  function reset() { setZoom(1); setPosition({ x: 0, y: 0 }); }
  function move(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame) return;
    setPosition({
      x: Math.max(-0.5, Math.min(0.5, drag.startX + (event.clientX - drag.x) / frame.clientWidth)),
      y: Math.max(-0.5, Math.min(0.5, drag.startY + (event.clientY - drag.y) / frame.clientHeight)),
    });
  }
  function confirm() {
    const image = imageRef.current;
    const frame = frameRef.current;
    if (!image || !frame || !natural.width) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(1600 * Math.min(1, ratio));
      canvas.height = Math.round(canvas.width / ratio);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Não foi possível ajustar a foto.');
      context.fillStyle = '#080706';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const fit = Math.min(canvas.width / natural.width, canvas.height / natural.height) * zoom;
      const width = natural.width * fit;
      const height = natural.height * fit;
      context.drawImage(image, (canvas.width - width) / 2 + position.x * canvas.width, (canvas.height - height) / 2 + position.y * canvas.height, width, height);
      onConfirm(canvas.toDataURL('image/jpeg', 0.85));
    } catch { setError('Não foi possível ajustar esta imagem. Escolha uma foto da sua galeria.'); }
  }

  return <FullscreenDialog title="Ajustar foto" onClose={onCancel}>
    <div className="photo-editor">
      <header className="camera-topbar"><button type="button" autoFocus className="camera-icon-button" aria-label="Cancelar ajuste" onClick={onCancel}><X size={23} /></button><span className="camera-title">Ajustar foto</span><span className="w-11" /></header>
      <div className="photo-editor-workspace">
        <p className="text-xs text-stone-300 mb-3 text-center">Arraste para enquadrar. Use o zoom para ajustar.</p>
        <div ref={frameRef} className="photo-editor-frame" style={{ aspectRatio: ratio, width: `min(88vw, 430px, ${44 * ratio}dvh)` }}
          tabIndex={0} role="group" aria-label="Enquadramento da foto. Use as setas para mover."
          onKeyDown={event => { if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); setPosition(p => ({ x: Math.max(-.5, Math.min(.5, p.x + (event.key === 'ArrowLeft' ? -.02 : event.key === 'ArrowRight' ? .02 : 0))), y: Math.max(-.5, Math.min(.5, p.y + (event.key === 'ArrowUp' ? -.02 : event.key === 'ArrowDown' ? .02 : 0))) })); }}
          onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); dragRef.current = { x: event.clientX, y: event.clientY, startX: position.x, startY: position.y }; }}
          onPointerMove={move} onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}>
          <img ref={imageRef} src={source} crossOrigin="anonymous" alt="Prévia do enquadramento" draggable={false} className="photo-editor-image"
            onLoad={event => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
            onError={() => setError('Não foi possível abrir a imagem. Escolha uma foto da galeria.')}
            style={{ width: `${widthPercent * zoom}%`, left: `${50 + position.x * 100}%`, top: `${50 + position.y * 100}%` }} />
          <div className={circular ? 'photo-editor-circle' : 'photo-editor-grid'} aria-hidden="true" />
        </div>
      </div>
      <div className="photo-editor-controls">
        <label htmlFor="photo-zoom" className="flex items-center justify-between text-xs text-stone-300 mb-2"><span>Zoom</span><span>{zoom.toFixed(1)}×</span></label>
        <input id="photo-zoom" aria-label="Zoom da foto" className="w-full accent-amber-400" type="range" min="1" max="4" step="0.01" value={zoom} onChange={event => setZoom(Number(event.target.value))} />
        <div className="flex flex-wrap gap-2 my-4">
          <button type="button" className="photo-editor-option" onClick={reset}>Manter foto inteira</button>
          <button type="button" className="photo-editor-option" onClick={() => { setZoom(Math.min(4, Math.max(imageRatio / ratio, ratio / imageRatio))); setPosition({ x: 0, y: 0 }); }}>Preencher quadro</button>
          {allowOriginal && aspectRatio && <button type="button" className="photo-editor-option" onClick={() => { setOriginal(value => !value); reset(); }}>{original ? 'Formato da publicação' : 'Formato original'}</button>}
        </div>
        {error && <p role="alert" className="text-sm text-rose-300 mb-3">{error}</p>}
        <button type="button" onClick={confirm} disabled={!natural.width || !!error} className="w-full min-h-12 rounded-2xl bg-amber-400 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-40"><Check size={20} />Usar esta foto</button>
      </div>
    </div>
  </FullscreenDialog>;
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export function RestaurantGallery({ photos }: { photos: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!selected) return;
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, [selected]);
  if (!photos.length) return null;
  return <>
    <div className="flex gap-3 py-[18px] overflow-x-auto" aria-label="Fotos do restaurante">
      {photos.map((url, index) => <button key={`${url}-${index}`} type="button" aria-label={`Ampliar foto ${index + 1} do restaurante`} onClick={() => setSelected(url)} className="w-[64px] h-[64px] shrink-0 rounded-full p-[3px] border border-amber-400 focus-visible:outline-2 focus-visible:outline-amber-300">
        <img src={url} alt="" loading="lazy" className="w-full h-full rounded-full object-cover"/>
      </button>)}
    </div>
    <dialog ref={dialog} aria-label="Foto do restaurante ampliada" onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) setSelected(null); }} className="m-auto w-[calc(100%-24px)] max-w-3xl max-h-[92dvh] p-0 rounded-2xl bg-black border border-amber-500/30 backdrop:bg-black/90">
      {selected && <div className="relative"><button autoFocus type="button" onClick={() => setSelected(null)} aria-label="Fechar foto" className="absolute right-3 top-3 z-10 w-11 h-11 rounded-full bg-black/70 text-white grid place-items-center"><X size={22}/></button><img src={selected} alt="Foto do restaurante ampliada" className="w-full max-h-[90dvh] object-contain"/></div>}
    </dialog>
  </>;
}

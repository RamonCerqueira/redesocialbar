'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function FullscreenDialog({ children, title, onClose }: { children: ReactNode; title: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // The browser's top layer escapes transformed page ancestors and covers navigation.
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [mounted]);

  if (!mounted) return null;
  return createPortal(
    <dialog ref={dialogRef} aria-label={title} className="camera-dialog" onCancel={event => { event.preventDefault(); closeRef.current(); }}>
      {children}
    </dialog>,
    document.body,
  );
}

'use client';

import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';

export interface InfoModalHighlight {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  text: string;
}

export interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  badge?: {
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    variant?: 'rose' | 'amber' | 'emerald' | 'blue';
  };
  title: string;
  subtitle?: string;
  description: string | React.ReactNode;
  highlights?: InfoModalHighlight[];
  confirmLabel?: string;
  onConfirm?: () => void;
}

export function InfoModal({
  isOpen,
  onClose,
  badge,
  title,
  subtitle,
  description,
  highlights = [],
  confirmLabel = 'Entendi',
  onConfirm,
}: InfoModalProps) {
  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getBadgeColors = (variant = 'rose') => {
    switch (variant) {
      case 'amber':
        return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
      case 'emerald':
        return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
      case 'blue':
        return 'text-blue-400 bg-blue-500/15 border-blue-500/30';
      case 'rose':
      default:
        return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#120F0D] border border-rose-500/30 p-6 sm:p-7 shadow-2xl space-y-4 overflow-hidden glow-rose"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background spot */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Badge + Close Button */}
        <div className="flex items-center justify-between">
          {badge ? (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${getBadgeColors(
                badge.variant
              )}`}
            >
              {badge.icon && <badge.icon className="w-3.5 h-3.5" />}
              <span>{badge.label}</span>
            </div>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#1C1714] text-[#A89F96] hover:text-[#FBF8F5] hover:bg-[#251F1B] transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <h2 className="font-display font-black text-xl sm:text-2xl text-[#FBF8F5] tracking-tight leading-snug">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-rose-300/90 font-semibold">{subtitle}</p>
          )}
        </div>

        {/* Main description */}
        <div className="text-xs sm:text-sm text-[#C4BCB3] leading-relaxed font-normal">
          {typeof description === 'string' ? <p>{description}</p> : description}
        </div>

        {/* Highlights / Security pills */}
        {highlights.length > 0 && (
          <div className="pt-2 border-t border-[#2C221A] space-y-2">
            {highlights.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-[#18130F] border border-[#261E18]"
              >
                {item.icon ? (
                  <item.icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                )}
                <div className="text-[11px] text-[#D1C9C1] leading-tight">
                  {item.title && (
                    <strong className="text-emerald-300 font-bold block mb-0.5">
                      {item.title}
                    </strong>
                  )}
                  <span>{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-display font-extrabold text-xs uppercase tracking-wider shadow-lg glow-rose active:scale-95 transition-all cursor-pointer text-center"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

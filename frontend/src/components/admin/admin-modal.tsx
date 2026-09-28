'use client';

import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

export type AdminModalSize = 'sm' | 'md' | 'lg' | 'xl';
export type AdminModalBadgeVariant = 'amber' | 'green' | 'rose' | 'blue' | 'emerald';

export interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: {
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    variant?: AdminModalBadgeVariant;
  };
  size?: AdminModalSize;
  children: ReactNode;
  footer?: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  formRef?: React.RefObject<HTMLFormElement>;
  closeOnBackdrop?: boolean;
  ariaLabelledBy?: string;
}

export const AdminModalGrid: React.FC<{ left: ReactNode; right: ReactNode; rightSticky?: boolean }> = ({ left, right, rightSticky = true }) => (
  <div className="admin-modal-grid">
    <div className="admin-modal-col">{left}</div>
    <div className={'admin-modal-col ' + (rightSticky ? 'sticky-col' : '')}>{right}</div>
  </div>
);

const BADGE_CLASSES: Record<AdminModalBadgeVariant, string> = {
  amber:   'bg-gradient-to-br-[#fff6e5_#ffe8c2]',
  green:   'bg-gradient-to-br-[#eaf7ef_#d1f1dd]',
  emerald: 'bg-gradient-to-br-[#eaf7ef_#d1f1dd]',
  rose:    'bg-gradient-to-br-[#fdece9_#fadcd6]',
  blue:    'bg-gradient-to-br-[#e7f3ff_#d1e6ff]',
};
const BADGE_TEXT: Record<AdminModalBadgeVariant, string> = {
  amber:   '#92400e',
  green:   '#166534',
  emerald: '#166534',
  rose:    '#991b1b',
  blue:    '#1e40af',
};
const BADGE_BORDER: Record<AdminModalBadgeVariant, string> = {
  amber:   'rgba(245,158,11,.45)',
  green:   'rgba(22,101,52,.3)',
  emerald: 'rgba(22,101,52,.3)',
  rose:    'rgba(239,68,68,.35)',
  blue:    'rgba(59,130,246,.4)',
};

const SIZE_CLASS: Record<AdminModalSize, string> = {
  sm: 'admin-modal-sm',
  md: '',
  lg: 'admin-modal-large',
  xl: 'admin-modal-xl',
};

export function AdminModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  size = 'md',
  children,
  footer,
  onSubmit,
  formRef,
  closeOnBackdrop = true,
  ariaLabelledBy,
}: AdminModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const titleId = ariaLabelledBy || 'am-' + title.replace(/\s+/g, '-').slice(0, 40);
  const variant: AdminModalBadgeVariant = badge?.variant || 'amber';

  const Wrapper = onSubmit ? 'form' : 'div';

  return (
    <div
      className="admin-modal-overlay"
      onClick={() => closeOnBackdrop && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={'admin-modal-shell ' + SIZE_CLASS[size]}
        onClick={e => e.stopPropagation()}
      >
        <header className="admin-modal-head">
          <div className="admin-modal-title-block">
            {badge && (
              <div
                className="admin-modal-badge"
                style={{
                  background: `linear-gradient(135deg, ${
                    variant === 'amber' ? '#fff6e5,#ffe8c2' :
                    variant === 'rose'  ? '#fdece9,#fadcd6' :
                    variant === 'blue'  ? '#e7f3ff,#d1e6ff' :
                                           '#eaf7ef,#d1f1dd'
                  })`,
                  color: BADGE_TEXT[variant],
                  border: `1px solid ${BADGE_BORDER[variant]}`,
                }}
              >
                {badge.icon && <badge.icon size={12} />}
                <span>{badge.label}</span>
              </div>
            )}
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p className="admin-modal-sub">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={17} />
          </button>
        </header>

        {/* @ts-expect-error: Wrapper é form ou div dinamicamente */}
        <Wrapper
          {...(onSubmit ? { onSubmit, ref: formRef } : {})}
          className="admin-modal-body"
        >
          {children}
          {footer && <div className="admin-modal-foot-outer">{footer}</div>}
        </Wrapper>
      </div>
    </div>
  );
}

/* ---------------- Footer padrão com 1, 2 ou 3 botões ---------------- */

export interface AdminModalFooterProps {
  onCancel?: () => void;
  cancelLabel?: string;
  onSecondary?: () => void;
  secondaryLabel?: string;
  secondaryDisabled?: boolean;
  secondaryIcon?: React.ComponentType<{ size?: number }>;
  onPrimary?: () => void;
  primaryLabel: string;
  primaryDisabled?: boolean;
  primaryIcon?: React.ComponentType<{ size?: number }>;
  primarySuccessFlash?: boolean;
  extraLeft?: ReactNode;
  submitForm?: boolean;
}

export function AdminModalFooter({
  onCancel,
  cancelLabel = 'Cancelar',
  onSecondary,
  secondaryLabel,
  secondaryDisabled,
  secondaryIcon: SecondaryIcon,
  onPrimary,
  primaryLabel,
  primaryDisabled,
  primaryIcon: PrimaryIcon,
  primarySuccessFlash,
  extraLeft,
  submitForm,
}: AdminModalFooterProps) {
  return (
    <div className="admin-modal-foot">
      <div className="admin-modal-foot-left">
        {extraLeft}
      </div>
      <div className="admin-modal-foot-buttons">
        {onCancel && (
          <button
            type="button"
            className="admin-button secondary"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
        )}
        {onSecondary && secondaryLabel && (
          <button
            type="button"
            className="admin-button secondary"
            onClick={onSecondary}
            disabled={secondaryDisabled}
          >
            {SecondaryIcon && <SecondaryIcon size={14} />}
            {secondaryLabel}
          </button>
        )}
        <button
          type={submitForm ? 'submit' : 'button'}
          className={'admin-button ' + (primarySuccessFlash ? 'success-flash' : '')}
          onClick={!submitForm ? onPrimary : undefined}
          disabled={primaryDisabled}
        >
          {PrimaryIcon && <PrimaryIcon size={14} />}
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocalization } from '../../contexts/LocalizationContext';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

/** Racine dédiée pour éviter les conflits de placement avec d’autres nœuds sous `body`. */
let confirmationPortalHost: HTMLDivElement | null = null;
function getConfirmationPortalHost(): HTMLDivElement {
  if (typeof document === 'undefined') {
    throw new Error('document indisponible');
  }
  if (!confirmationPortalHost || !document.body.contains(confirmationPortalHost)) {
    confirmationPortalHost = document.createElement('div');
    confirmationPortalHost.setAttribute('data-coya-confirmation-root', 'true');
    document.body.appendChild(confirmationPortalHost);
  }
  return confirmationPortalHost;
}

interface ConfirmationModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmButtonClass?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'primary';
  children?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  confirmLabel,
  cancelLabel,
  confirmButtonClass,
  isLoading = false,
  variant = 'danger',
  children,
}) => {
  const { t } = useLocalization();
  const [portalEl] = useState<HTMLDivElement | null>(() => {
    if (typeof document === 'undefined') return null;
    try {
      return getConfirmationPortalHost();
    } catch {
      return null;
    }
  });
  const effectiveConfirmClass = confirmButtonClass ?? (variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-coya-primary hover:opacity-90');
  const effectiveConfirmText = confirmLabel ?? confirmText ?? t('confirm_delete');
  const effectiveCancelText = cancelLabel ?? cancelText ?? t('cancel');
  const confirmVariant = variant === 'danger' ? 'danger' : 'primary';

  const modal = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 font-coya" role="presentation">
      <Card
        className="w-full max-w-md border-white/10 bg-white/10 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.30)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="p-6">
          <div className="flex items-start">
            <div className="relative mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 sm:mx-0 sm:h-10 sm:w-10">
              <div
                className={`absolute inset-0 m-auto h-8 w-8 animate-spin rounded-full border-b-2 border-red-200 transition-opacity ${isLoading ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
                aria-hidden={!isLoading}
              />
              <i
                className={`fas fa-exclamation-triangle text-red-200 transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                aria-hidden={isLoading}
              />
            </div>
            <div className="ml-4 min-w-0 flex-1 text-left">
              <h3 id="confirm-modal-title" className="text-lg font-semibold leading-6 text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm text-white/70">{isLoading ? 'Suppression en cours…' : message}</p>
              {children}
            </div>
          </div>
        </CardContent>
        <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            {effectiveCancelText}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
            className={effectiveConfirmClass}
          >
            {effectiveConfirmText}
          </Button>
        </div>
      </Card>
    </div>
  );

  if (typeof document === 'undefined' || !portalEl) return modal;
  return createPortal(modal, portalEl);
};

export default ConfirmationModal;


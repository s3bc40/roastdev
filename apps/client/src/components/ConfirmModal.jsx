import { useEffect } from 'react';

/**
 * Generic confirmation modal.
 *
 * Props:
 *   title      — heading text
 *   message    — body text explaining the consequence
 *   confirmLabel — label for the destructive button (default "Confirm")
 *   onConfirm  — called when the user accepts
 *   onCancel   — called when the user dismisses
 *
 * Accessibility notes:
 *   • role="dialog" + aria-modal="true" tells screen readers this is a modal
 *   • aria-labelledby points to the heading so the dialog has a name
 *   • Escape key closes without confirming — expected keyboard behaviour
 *   • Clicking the backdrop also cancels
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}) {
  // Close on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel} role="presentation">
      <div
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="modal-title">
          {title}
        </h2>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn-ghost btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-danger-outline" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

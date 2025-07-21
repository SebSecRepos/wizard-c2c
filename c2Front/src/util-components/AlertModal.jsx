import { FaExclamationTriangle } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import './AlertModal.css';

export default function AlertModal({
  visible,
  onClose,
  onConfirm,
  title = "¿Estás seguro?",
  description = "Esta acción no se puede deshacer.",
  confirmText = "Confirmar",
  cancelText = "Cancelar"
}) {
  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : '';
  }, [visible]);

  if (!visible) return null;

  return createPortal(
    <div className="alert-modal-overlay">
      <div className="alert-modal">
        <div className="alert-modal-header">
          <FaExclamationTriangle className="alert-modal-icon" />
          <h2 className="alert-modal-title">{title}</h2>
        </div>
        <p className="alert-modal-description">{description}</p>
        <div className="alert-modal-actions">
          <button className="alert-btn-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button
            className="alert-btn-confirm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
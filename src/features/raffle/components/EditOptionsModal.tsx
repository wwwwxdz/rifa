import React, { useEffect, useState } from "react";
import type { WheelOption } from "../../../types/raffle";
import "./EditOptionsModal.scss";

interface EditOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: WheelOption[];
  editValues: Record<string, string>;
  onEditChange: (id: string, value: string) => void;
  onDeleteOption: (id: string) => void;
  onAddOption: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDeleteAll: () => void;
  onReset: () => void;
}

export const EditOptionsModal: React.FC<EditOptionsModalProps> = ({
  isOpen,
  onClose,
  options,
  editValues,
  onEditChange,
  onDeleteOption,
  onAddOption,
  onSave,
  onCancel,
  onDeleteAll,
  onReset,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]); // Removed isVisible from dependency to avoid loop, logic handles it

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isVisible && !isOpen) return null;

  return (
    <div className={`edit-modal-wrapper ${isClosing ? "closing" : ""}`}>
      <div className="edit-page">
        <header className="edit-header">
          <button className="close-btn" onClick={onClose} aria-label="Cerrar">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <h2>Editar Opciones</h2>
          <div className="header-spacer" />
        </header>

        <div className="edit-modal-body-content">
          <div className="sticky-actions-container">
            <div className="edit-action-buttons">
              <button
                className="delete-all-btn"
                onClick={onDeleteAll}
                disabled={options.length === 0}
              >
                Eliminar todos
              </button>
              <button className="reset-btn" onClick={onReset}>
                Resetear
              </button>
            </div>

            <button className="add-option-modal-btn" onClick={onAddOption}>
              + Agregar opción
            </button>
          </div>

          <div className="edit-options-list">
            {options.map((option) => (
              <div key={option.id} className="edit-option-item">
                <div
                  className="option-color-indicator"
                  style={{ backgroundColor: option.color }}
                />
                <input
                  type="text"
                  value={editValues[option.id] ?? option.label}
                  onChange={(e) => onEditChange(option.id, e.target.value)}
                  placeholder="Nombre de la opción"
                />
                <button
                  className="delete-option-btn"
                  onClick={() => onDeleteOption(option.id)}
                  aria-label="Eliminar opción"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            {options.length === 0 && (
              <p className="empty-options-msg">No hay opciones. Añade una.</p>
            )}
          </div>
        </div>

        <div className="edit-modal-actions sticky-footer">
          <button className="cancel-btn" onClick={onCancel}>
            Cancelar
          </button>
          <button className="save-btn" onClick={onSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

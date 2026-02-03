import React from "react";
import "./Modal.scss";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseIcon?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  showCloseIcon = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="custom-modal-overlay" onClick={onClose}>
      <div
        className={`custom-modal-content ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseIcon) && (
          <div className="custom-modal-header">
            {title && <h3>{title}</h3>}
            {showCloseIcon && (
              <button className="close-icon-btn" onClick={onClose}>
                ✕
              </button>
            )}
          </div>
        )}
        <div className="custom-modal-body">{children}</div>
      </div>
    </div>
  );
};

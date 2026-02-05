import { useState, useEffect } from "react";
import {
  useSettings,
  BACKGROUND_MUSIC_OPTIONS,
  DECISION_SOUND_OPTIONS,
  EFFECT_OPTIONS,
} from "../../context";
import "./Options.scss";
import { WinningConfigModal } from "../../features/settings/components/WinningConfigModal";
import { ConfirmModal } from "../../components/ui/ConfirmModal/ConfirmModal";

interface SelectModalProps {
  title: string;
  options: { value: string; label: string }[];
  currentValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

const SelectModal = ({
  title,
  options,
  currentValue,
  onSelect,
  onClose,
}: SelectModalProps) => (
  <div className="sub-modal-wrapper">
    <div className="sub-modal-page">
      <header className="sub-modal-header">
        <button className="back-btn" onClick={onClose} aria-label="Volver">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h3>{title}</h3>
        <div style={{ width: 48 }} />
      </header>

      <main className="sub-modal-content">
        <div className="select-options">
          {options.map((option) => (
            <button
              key={option.value}
              className={`select-option ${currentValue === option.value ? "selected" : ""}`}
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <span>{option.label}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          ))}
        </div>
      </main>
    </div>
  </div>
);

interface SliderModalProps {
  title: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  onClose: () => void;
}

const SliderModal = ({
  title,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  onClose,
}: SliderModalProps) => (
  <div className="sub-modal-wrapper">
    <div className="sub-modal-page">
      <header className="sub-modal-header">
        <button className="back-btn" onClick={onClose} aria-label="Volver">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h3>{title}</h3>
        <div style={{ width: 48 }} />
      </header>

      <main className="sub-modal-content">
        <div className="slider-container" style={{ marginTop: "40px" }}>
          <span className="slider-value">
            {value}
            {unit}
          </span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="slider-input"
            style={{ marginTop: "20px" }}
          />
        </div>
      </main>

      <footer className="sub-modal-footer">
        <button className="action-btn" onClick={onClose}>
          Aceptar
        </button>
      </footer>
    </div>
  </div>
);

type ModalType =
  | "spinDuration"
  | "backgroundMusic"
  | "decisionSound"
  | "effect"
  | "effectFrequency"
  | "winningConfig"
  | null;

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetOptions: () => void;
}

export const OptionsModal = ({
  isOpen,
  onClose,
  onResetOptions,
}: OptionsModalProps) => {
  const { settings, updateSetting, resetToDefaults } = useSettings();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const getOptionLabel = (
    options: { value: string; label: string }[],
    value: string,
  ) => {
    return options.find((opt) => opt.value === value)?.label || value;
  };

  if (!isOpen) return null;

  return (
    <div className="options-modal-wrapper">
      <div className="options-page">
        <header className="options-header">
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
          <h1>Configuración</h1>
          <div className="header-spacer" />
        </header>

        <main className="options-content">
          {/* Ajustes actuales de la ruleta */}
          <section className="options-section">
            <p className="section-label">Ajustes actuales de la ruleta</p>

            {/* Tiempo de giro */}
            <button
              className="option-item clickable"
              onClick={() => setActiveModal("spinDuration")}
            >
              <div className="option-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="option-label">Tiempo de giro</span>
              <span className="option-value">{settings.spinDuration} seg.</span>
            </button>

            {/* Música de fondo */}
            <button
              className="option-item clickable"
              onClick={() => setActiveModal("backgroundMusic")}
            >
              <div className="option-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <span className="option-label">Música de fondo</span>
              <span className="option-value">
                {getOptionLabel(
                  BACKGROUND_MUSIC_OPTIONS,
                  settings.backgroundMusic,
                )}
              </span>
            </button>

            {/* Sonido de decisión */}
            <button
              className="option-item clickable"
              onClick={() => setActiveModal("decisionSound")}
            >
              <div className="option-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </div>
              <span className="option-label">Sonido de decisión</span>
              <span className="option-value">
                {getOptionLabel(DECISION_SOUND_OPTIONS, settings.decisionSound)}
              </span>
            </button>

            {/* Efecto */}
            <button
              className="option-item clickable"
              onClick={() => setActiveModal("effect")}
            >
              <div className="option-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="option-label">Efecto</span>
              <span className="option-value">
                {getOptionLabel(EFFECT_OPTIONS, settings.effect)}
              </span>
            </button>

            {/* Frecuencia de efecto */}
            <button
              className="option-item clickable"
              onClick={() => setActiveModal("effectFrequency")}
            >
              <div className="option-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <span className="option-label">Frecuencia de efecto</span>
              <span className="option-value">{settings.effectFrequency}%</span>
            </button>

            {/* Eliminar ganador automáticamente */}
            <div className="option-item-group">
              <div className="option-item">
                <div className="option-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span className="option-label">
                  Eliminar ganador automáticamente
                </span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.removeOnceChosen}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setActiveModal("winningConfig");
                      } else {
                        updateSetting("removeOnceChosen", false);
                        // Resetear contadores al desactivar para evitar bugs al reactivar
                        localStorage.removeItem("rifa-round-count");
                        window.dispatchEvent(new Event("rifa-reset-counts"));
                      }
                    }}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              {settings.removeOnceChosen && (
                <button
                  className="config-sub-btn"
                  onClick={() => setActiveModal("winningConfig")}
                  style={{
                    marginLeft: "52px",
                    marginTop: "-10px",
                    marginBottom: "10px",
                    fontSize: "0.85rem",
                    color: "#3498db",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  ⚙️ Configurar
                </button>
              )}
            </div>

            {/* Pulsa para detener */}
            <div className="option-item">
              <div className="option-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <span className="option-label">Pulsa para detener</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.tapToStop}
                  onChange={(e) => updateSetting("tapToStop", e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </section>

          {/* Predeterminado */}
          <section className="options-section">
            <p className="section-label">Predeterminado</p>

            <button
              className="option-item clickable"
              onClick={() => setShowResetConfirm(true)}
            >
              <div className="option-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </div>
              <span className="option-label">Ajustes predeterminados</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="chevron-icon"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            {/* Restablecer nombres */}
            <button
              className="option-item clickable"
              onClick={() => {
                onResetOptions();
                onClose();
              }}
            >
              <div className="option-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
              </div>
              <span className="option-label">Restablecer nombres</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="chevron-icon"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </section>

          {/* Otros ajustes */}
          <section className="options-section">
            <button className="option-item clickable">
              <div className="option-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <span className="option-label">Ayuda</span>
            </button>

            <div className="option-item">
              <div className="option-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </div>
              <span className="option-label">Modo oscuro</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => updateSetting("darkMode", e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </section>
        </main>

        {/* Modales */}
        {activeModal === "spinDuration" && (
          <SliderModal
            title="Tiempo de giro"
            value={settings.spinDuration}
            min={1}
            max={20}
            step={1}
            unit=" seg."
            onChange={(value) => updateSetting("spinDuration", value)}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === "backgroundMusic" && (
          <SelectModal
            title="Música de fondo"
            options={BACKGROUND_MUSIC_OPTIONS}
            currentValue={settings.backgroundMusic}
            onSelect={(value) => updateSetting("backgroundMusic", value)}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === "decisionSound" && (
          <SelectModal
            title="Sonido de decisión"
            options={DECISION_SOUND_OPTIONS}
            currentValue={settings.decisionSound}
            onSelect={(value) => updateSetting("decisionSound", value)}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === "effect" && (
          <SelectModal
            title="Efecto"
            options={EFFECT_OPTIONS}
            currentValue={settings.effect}
            onSelect={(value) => updateSetting("effect", value)}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === "effectFrequency" && (
          <SliderModal
            title="Frecuencia de efecto"
            value={settings.effectFrequency}
            min={0}
            max={100}
            step={5}
            unit="%"
            onChange={(value) => updateSetting("effectFrequency", value)}
            onClose={() => setActiveModal(null)}
          />
        )}

        {activeModal === "winningConfig" && (
          <WinningConfigModal
            initialCondition={settings.winningCondition}
            initialN={settings.winningN}
            onSave={(condition, n) => {
              updateSetting("winningCondition", condition);
              updateSetting("winningN", n);
              updateSetting("removeOnceChosen", true);

              // Resetear contadores al cambiar configuración (CORREGIDO)
              localStorage.removeItem("rifa-round-count");
              window.dispatchEvent(new Event("rifa-reset-counts"));

              setActiveModal(null);
            }}
            onCancel={() => setActiveModal(null)}
          />
        )}

        {/* Modal de confirmación reset */}
        {showResetConfirm && (
          <ConfirmModal
            isOpen={showResetConfirm}
            title="¿Restablecer ajustes?"
            message="Esto restaurará todos los ajustes a sus valores predeterminados."
            onConfirm={() => {
              resetToDefaults();
              setShowResetConfirm(false);
            }}
            onCancel={() => setShowResetConfirm(false)}
            variant="danger"
          />
        )}
      </div>
    </div>
  );
};

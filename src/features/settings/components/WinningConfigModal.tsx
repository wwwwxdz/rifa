import React, { useState } from "react";
import "./WinningConfigModal.scss";

interface WinningConfigModalProps {
  initialCondition: "immediate" | "after_n_times";
  initialN: number;
  onSave: (condition: "immediate" | "after_n_times", n: number) => void;
  onCancel: () => void;
}

export const WinningConfigModal: React.FC<WinningConfigModalProps> = ({
  initialCondition,
  initialN,
  onSave,
  onCancel,
}) => {
  const [condition, setCondition] = useState<"immediate" | "after_n_times">(
    initialCondition,
  );
  //inputValue para el input permisivo
  const [inputValue, setInputValue] = useState(initialN.toString());
  const [n, setN] = useState(initialN);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInputValue(newVal);

    const parsed = parseInt(newVal);
    if (!isNaN(parsed) && parsed >= 2) {
      setN(parsed);
    }
  };

  const handleBlur = () => {
    let val = parseInt(inputValue);
    if (isNaN(val) || val < 2) val = 2;
    setN(val);
    setInputValue(val.toString());
  };

  const handleSave = () => {
    let val = parseInt(inputValue);
    if (isNaN(val) || val < 2) val = 2;
    onSave(condition, val);
  };

  return (
    <div className="winning-config-modal-wrapper">
      <div className="winning-config-page">
        <header className="winning-config-header">
          <button className="close-btn" onClick={onCancel} aria-label="Cerrar">
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
          <h2>Configurar Ganador</h2>
          <div className="header-spacer" />
        </header>

        <main className="winning-config-body">
          <div className="winning-config-options">
            <label className="radio-option">
              <input
                type="radio"
                name="winningCondition"
                checked={condition === "immediate"}
                onChange={() => setCondition("immediate")}
              />
              <div className="radio-content">
                <span className="radio-title">Ganar inmediatamente</span>
                <span className="radio-desc">
                  El jugador gana la primera vez que sale.
                </span>
              </div>
            </label>

            <label className="radio-option">
              <input
                type="radio"
                name="winningCondition"
                checked={condition === "after_n_times"}
                onChange={() => setCondition("after_n_times")}
              />
              <div className="radio-content">
                <span className="radio-title">Ganar en el sorteo número N</span>
                <span className="radio-desc">
                  Los primeros N-1 sorteados serán eliminados. El N-ésimo será
                  el ganador.
                </span>
              </div>
            </label>
          </div>

          {condition === "after_n_times" && (
            <div className="n-times-input-container">
              <label>Número de veces (N):</label>
              <input
                type="number"
                min="2"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
              />
              <p className="helper-text">
                El jugador será ganador recién en el sorteo número{" "}
                <strong>{n}</strong>
              </p>
            </div>
          )}
        </main>

        <footer className="winning-config-footer">
          <button className="cancel-btn" onClick={onCancel}>
            Cancelar
          </button>
          <button className="save-btn" onClick={handleSave}>
            Guardar
          </button>
        </footer>
      </div>
    </div>
  );
};

import { useState, useEffect } from "react";

import type { WheelOption } from "../../../types/raffle";
import "./RiggedRaffleModal.scss";

interface RiggedRaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: WheelOption[];
  onSaveRig: (round: number, optionId: string) => void;
  onClearRig: (round: number) => void;
  riggedOutcomes: Record<number, string>; // round -> optionId
}

export const RiggedRaffleModal = ({
  isOpen,
  onClose,
  options,
  onSaveRig,
  onClearRig,
  riggedOutcomes,
}: RiggedRaffleModalProps) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [targetRound, setTargetRound] = useState<number | string>(1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Sincronizar selectedOptionId cuando options cambia o el modal se abre
  useEffect(() => {
    if (options.length > 0) {
      // Si el ID actual no existe en las opciones, usar el primero
      const currentExists = options.some((opt) => opt.id === selectedOptionId);
      if (!currentExists || !selectedOptionId) {
        setSelectedOptionId(options[0].id);
      }
    }
  }, [options, selectedOptionId, isOpen]);

  const handleRig = () => {
    const roundNumber =
      typeof targetRound === "string" ? parseInt(targetRound) : targetRound;

    if (selectedOptionId && !isNaN(roundNumber) && roundNumber > 0) {
      const player = options.find((o) => o.id === selectedOptionId);
      console.log(
        `%c ✍️ CONFIGURACIÓN: Programando a "${player?.label}" para ganar en la Ronda ${roundNumber}`,
        "color: #FFEB3B; font-weight: bold; background: #333; padding: 2px; border-radius: 4px;",
      );
      onSaveRig(roundNumber, selectedOptionId);
    }
  };

  if (!isVisible && !isOpen) return null;

  return (
    <div className={`rigged-modal-wrapper ${isOpen ? "open" : "closing"}`}>
      <div className="rigged-page">
        <header className="rigged-header-bar">
          <button className="back-btn" onClick={onClose} aria-label="Cerrar">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="title-container">
            <span className="secret-icon">🕵️‍♂️</span>
            <h2>Panel de Control</h2>
          </div>
          <div style={{ width: 48 }} />
        </header>

        <div className="rigged-content">
          <div className="rigged-section">
            <div className="input-group">
              <label>Jugador Objetivo</label>
              <select
                value={selectedOptionId}
                onChange={(e) => setSelectedOptionId(e.target.value)}
                className="rig-select"
              >
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Ronda #</label>
              <input
                type="number"
                min="1"
                value={targetRound}
                onChange={(e) => {
                  const val = e.target.value;
                  setTargetRound(val === "" ? "" : parseInt(val));
                }}
                className="rig-input"
              />
            </div>

            <button className="rig-btn" onClick={handleRig}>
              Programar Resultado
            </button>
          </div>

          <div className="rigged-list">
            <h3>Resultados Programados</h3>
            {Object.entries(riggedOutcomes).length === 0 ? (
              <p className="empty-msg">No hay trucos activos</p>
            ) : (
              <ul>
                {Object.entries(riggedOutcomes).map(([round, optionId]) => {
                  const player = options.find((o) => o.id === optionId);
                  return (
                    <li key={round} className="rigged-item">
                      <span>
                        <strong>Ronda {round}:</strong>{" "}
                        {player?.label || "Desconocido"}
                      </span>
                      <button
                        className="delete-rig-btn"
                        onClick={() => {
                          console.log(`%c 🗑️ TRUCO ELIMINADO para la Ronda ${round}`, 'color: #f44336; font-weight: bold;');
                          onClearRig(parseInt(round));
                        }}
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";
import "./Confetti.scss";

interface ConfettiProps {
  isActive: boolean;
  duration?: number; // ms
}

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  color: string;
  size: number;
  duration: number;
}

const COLORS = [
  "#ff6b6b", // coral
  "#4ecdc4", // teal
  "#ffe66d", // yellow
  "#a8e6cf", // mint
  "#dda0dd", // plum
  "#87ceeb", // sky blue
  "#ffd700", // gold
  "#ff69b4", // hot pink
];

export const Confetti = ({ isActive, duration = 4000 }: ConfettiProps) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      // Generar piezas de confeti
      const newPieces: ConfettiPiece[] = [];
      const count = 80; // Número de piezas

      for (let i = 0; i < count; i++) {
        newPieces.push({
          id: i,
          left: Math.random() * 100, // Posición horizontal %
          delay: Math.random() * 1.5, // Delay de inicio (s)
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 8 + Math.random() * 8, // Tamaño variable
          duration: 2.5 + Math.random() * 2, // Duración de caída
        });
      }

      setPieces(newPieces);

      // Limpiar después de la duración
      const timer = setTimeout(() => {
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [isActive, duration]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <div className="confetti-container">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            backgroundColor: piece.color,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
          }}
        />
      ))}
    </div>
  );
};

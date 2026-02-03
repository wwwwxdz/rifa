import React from "react";
import "./WinnerToast.scss";

interface Announcement {
  text: string;
  type: "winner" | "eliminated";
  subtext?: string;
}

interface WinnerToastProps {
  announcement: Announcement | null;
  isVisible: boolean;
}

export const WinnerToast: React.FC<WinnerToastProps> = ({
  announcement,
  isVisible,
}) => {
  if (!announcement || !isVisible) return null;

  return (
    <div className={`winner-display ${announcement.type}`}>
      <p className="announcement-title">
        {announcement.type === "winner"
          ? "🎉 ¡GANADOR! 🎉"
          : "❌ JUGADOR ELIMINADO"}
      </p>
      <strong className="announcement-name">{announcement.text}</strong>
      {announcement.subtext && (
        <p className="announcement-subtext">{announcement.subtext}</p>
      )}
    </div>
  );
};

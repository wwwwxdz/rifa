import { useState, useRef, useCallback, useEffect } from "react";

import { useSettings } from "../../context";
import "./RaffleWheel.scss";

const DEFAULT_COLORS = [
  "#EF5350", // Coral Red
  "#F7DC6F", // Yellow
  "#81C784", // Light Green
  "#64B5F6", // Light Blue
  "#BA68C8", // Purple
  "#FFB74D", // Orange
  "#4DB6AC", // Teal
  "#F06292", // Pink
];

const generateId = () => Math.random().toString(36).substring(2, 9);
import type { WheelOption } from "../../types/raffle";
import { WinnerToast } from "../../components/ui/WinnerToast/WinnerToast";
import { EditOptionsModal } from "../../features/raffle/components/EditOptionsModal";
import { useRaffleAudio } from "../../hooks/useRaffleAudio";
import { Confetti } from "../../components/ui/Confetti/Confetti";
import { ConfirmModal } from "../../components/ui/ConfirmModal/ConfirmModal";
import { RiggedRaffleModal } from "../../features/raffle/components/RiggedRaffleModal";
import { OptionsModal } from "../Options";

const STORAGE_KEY = "rifa-wheel-options";
const ROUND_COUNT_KEY = "rifa-round-count";
const RIGGED_STORAGE_KEY = "rifa-rigged-outcomes";

const getDefaultOptions = (): WheelOption[] => [
  { id: generateId(), label: "Opción 1", color: DEFAULT_COLORS[0] },
  { id: generateId(), label: "Opción 2", color: DEFAULT_COLORS[1] },
  { id: generateId(), label: "Opción 3", color: DEFAULT_COLORS[2] },
];

const loadOptionsFromStorage = (): WheelOption[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Si hay error al parsear, usar opciones por defecto
  }
  return getDefaultOptions();
};

export const RaffleWheel = () => {
  const { settings, updateSetting } = useSettings();
  const [options, setOptions] = useState<WheelOption[]>(loadOptionsFromStorage);

  // Referencia mutable para settings para acceder al valor más reciente dentro de callbacks/timeouts
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Contador global de rondas para la lógica "Ganar en el sorteo N"
  const [currentRoundCount, setCurrentRoundCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(ROUND_COUNT_KEY);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const { playTick, playWin, playEliminated, tryStartMusic, playApplause } =
    useRaffleAudio();
  const tickTimeoutRef = useRef<number | null>(null);

  // Estado para mostrar confeti de celebración
  const [showConfetti, setShowConfetti] = useState(false);

  // Estado para mostrar modal de confirmación de reset
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  // LOGICA DE TRUCAJE (RIGGING)
  const [isRigModalOpen, setIsRigModalOpen] = useState(false);
  const [riggedOutcomes, setRiggedOutcomes] = useState<Record<number, string>>(
    () => {
      try {
        const saved = localStorage.getItem(RIGGED_STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    },
  );

  // Persistir trucos
  useEffect(() => {
    localStorage.setItem(RIGGED_STORAGE_KEY, JSON.stringify(riggedOutcomes));
  }, [riggedOutcomes]);

  // Estado para el control de volumen persistente
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const volumeControlRef = useRef<HTMLDivElement>(null);

  // Cerrar volumen al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        volumeControlRef.current &&
        !volumeControlRef.current.contains(event.target as Node)
      ) {
        setIsVolumeOpen(false);
      }
    };

    if (isVolumeOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isVolumeOpen]);

  // Handler simplificado para activar panel de control (5 toques)
  const rigTapCountRef = useRef(0);
  const rigTapTimeoutRef = useRef<number | null>(null);

  const handleRigTrigger = useCallback(() => {
    rigTapCountRef.current += 1;

    // Resetear contador si pasa mucho tiempo (1 segundo)
    if (rigTapTimeoutRef.current) clearTimeout(rigTapTimeoutRef.current);
    rigTapTimeoutRef.current = window.setTimeout(() => {
      rigTapCountRef.current = 0;
    }, 1000);

    // Activar al llegar a 5 toques
    if (rigTapCountRef.current >= 5) {
      setIsRigModalOpen(true);
      rigTapCountRef.current = 0;
      if (rigTapTimeoutRef.current) clearTimeout(rigTapTimeoutRef.current);
    }
  }, []);

  const handleSaveRig = (round: number, optionId: string) => {
    setRiggedOutcomes((prev) => ({ ...prev, [round]: optionId }));
    // No cerramos el modal para permitir ver que se añadió
  };

  const handleClearRig = (round: number) => {
    setRiggedOutcomes((prev) => {
      const next = { ...prev };
      delete next[round];
      return next;
    });
  };

  // Limpiar ticks al desmontar
  useEffect(() => {
    return () => {
      if (tickTimeoutRef.current) clearTimeout(tickTimeoutRef.current);
    };
  }, []);

  // Estado de anuncio (Ganador o Eliminado)
  const [announcement, setAnnouncement] = useState<{
    text: string;
    type: "winner" | "eliminated";
    subtext?: string;
  } | null>(null);

  const [isStopping, setIsStopping] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const spinTimeoutRef = useRef<number | null>(null);
  const optionsRef = useRef<WheelOption[]>(options);

  // Mantener la referencia de options actualizada
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Guardar opciones en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  }, [options]);

  // Guardar contador global en localStorage
  useEffect(() => {
    localStorage.setItem(ROUND_COUNT_KEY, currentRoundCount.toString());
  }, [currentRoundCount]);

  // Listener para resetear contadores desde Options
  useEffect(() => {
    const handleResetCounts = () => {
      setCurrentRoundCount(0);
      localStorage.removeItem(ROUND_COUNT_KEY);
    };
    window.addEventListener("rifa-reset-counts", handleResetCounts);
    return () =>
      window.removeEventListener("rifa-reset-counts", handleResetCounts);
  }, []);

  const handleAddOption = useCallback(() => {
    const colorIndex = options.length % DEFAULT_COLORS.length;
    const newId = generateId();
    const newLabel = `Opción ${options.length + 1}`;

    const newOption: WheelOption = {
      id: newId,
      label: newLabel,
      color: DEFAULT_COLORS[colorIndex],
    };
    setOptions((prev) => [...prev, newOption]);

    if (isEditing) {
      setEditValues((prev) => ({
        ...prev,
        [newId]: newLabel,
      }));
    }
  }, [options.length, isEditing]);

  const handleStartEdit = useCallback(() => {
    const initialValues: Record<string, string> = {};
    options.forEach((opt) => {
      initialValues[opt.id] = opt.label;
    });
    setEditValues(initialValues);
    setIsEditing(true);
  }, [options]);

  const handleSaveEdit = useCallback(() => {
    setOptions((prev) =>
      prev.map((opt) => ({
        ...opt,
        label: editValues[opt.id] || opt.label,
      })),
    );
    setIsEditing(false);
  }, [editValues]);

  const handleCancelEdit = useCallback(() => {
    setEditValues({});
    setIsEditing(false);
  }, []);

  const handleDeleteOption = useCallback((id: string) => {
    setOptions((prev) => prev.filter((opt) => opt.id !== id));
    setEditValues((prev) => {
      const newValues = { ...prev };
      delete newValues[id];
      return newValues;
    });
    // Limpiar trucos asociados a esta opción eliminada
    setRiggedOutcomes((prev) => {
      const next = { ...prev };
      Object.entries(next).forEach(([round, optionId]) => {
        if (optionId === id) {
          delete next[parseInt(round)];
        }
      });
      return next;
    });
  }, []);

  const handleDeleteAll = useCallback(() => {
    setOptions([]);
    setEditValues({});
    setCurrentRoundCount(0);
    localStorage.removeItem(ROUND_COUNT_KEY);
    setRiggedOutcomes({});
    localStorage.removeItem(RIGGED_STORAGE_KEY);
  }, []);

  const handleReset = useCallback(() => {
    const defaults = getDefaultOptions();
    setOptions(defaults);
    const initialValues: Record<string, string> = {};
    defaults.forEach((opt) => {
      initialValues[opt.id] = opt.label;
    });
    setEditValues(initialValues);
    setCurrentRoundCount(0);
    localStorage.removeItem(ROUND_COUNT_KEY);
    setRiggedOutcomes({});
    localStorage.removeItem(RIGGED_STORAGE_KEY);
  }, []);

  // Función para calcular y anunciar ganador
  const calculateAndAnnounceWinner = useCallback(
    (finalRotation: number, forcedWinnerId?: string) => {
      const currentOptions = optionsRef.current;
      const currentSettings = settingsRef.current;

      if (currentOptions.length === 0) return;

      let selectedOption: WheelOption | undefined;
      let winnerIndex = -1;

      if (forcedWinnerId) {
        // Usar el ganador decidido al inicio del giro
        winnerIndex = currentOptions.findIndex((o) => o.id === forcedWinnerId);
        selectedOption = currentOptions[winnerIndex];
      }

      // Fallback si no hay ID o no se encontró
      if (!selectedOption) {
        const numSegments = currentOptions.length;
        const segmentAngle = 360 / numSegments;
        let normalizedRotation = finalRotation % 360;
        if (normalizedRotation < 0) normalizedRotation += 360;
        const adjustedAngle = (360 - normalizedRotation + 360) % 360;
        winnerIndex = Math.floor(adjustedAngle / segmentAngle) % numSegments;
        selectedOption = currentOptions[winnerIndex];
      }

      setIsSpinning(false);
      setIsStopping(false);
      if (tickTimeoutRef.current) clearTimeout(tickTimeoutRef.current);

      if (currentSettings.winningCondition === "after_n_times") {
        const nextCount = currentRoundCount + 1;
        setCurrentRoundCount(
          nextCount >= currentSettings.winningN ? 0 : nextCount,
        );

        if (nextCount >= currentSettings.winningN) {
          // GANADOR FINAL
          setAnnouncement({
            text: selectedOption.label,
            type: "winner",
            subtext: `Ganador del sorteo #${nextCount}`,
          });
          playWin();
          playApplause();
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);

          // Limpiar TODOS los trucos al terminar el ciclo N
          console.log(
            "%c 🧹 CICLO FINALIZADO: Limpiando todos los trucos.",
            "color: #9c27b0;",
          );
          setRiggedOutcomes({});
          localStorage.removeItem(RIGGED_STORAGE_KEY);
        } else {
          // ELIMINADO
          setAnnouncement({
            text: selectedOption.label,
            type: "eliminated",
            subtext: `Sorteo ${nextCount}/${currentSettings.winningN}: Eliminado`,
          });
          console.log(
            `%c ❌ ELIMINACIÓN: ${selectedOption.label} sale en el sorteo ${nextCount}`,
            "color: #f44336; font-weight: bold;",
          );
          playEliminated();

          // Limpiar solo el truco de ESTA ronda para que no se repita
          setRiggedOutcomes((prev) => {
            const next = { ...prev };
            delete next[nextCount];
            delete (next as any)[nextCount.toString()];
            return next;
          });
        }

        const shouldRemove =
          currentSettings.winningCondition === "after_n_times" ||
          currentSettings.removeOnceChosen;

        if (shouldRemove) {
          const idToRemove = selectedOption.id;
          const labelToRemove = selectedOption.label;

          setOptions((prev) => {
            const filtered = prev.filter((o) => o.id !== idToRemove);
            console.log(
              `%c ♻️ ACTUALIZANDO: "${labelToRemove}" removido. Quedan ${filtered.length} jugadores.`,
              "color: #9c27b0; font-weight: bold;",
            );
            if (filtered.length > 0) {
              console.log(
                "   - En el bombo: " + filtered.map((o) => o.label).join(", "),
              );
            }
            return filtered;
          });
        }
      } else {
        // Modo Normal
        const roundThatJustFinished = currentRoundCount + 1;
        setCurrentRoundCount((prev) => prev + 1);

        setAnnouncement({
          text: selectedOption.label,
          type: "winner",
        });
        playWin();
        playApplause();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);

        // SOLO limpiar el truco de la ronda que acaba de pasar
        console.log(
          `%c 🧹 Limpiando truco usado en Ronda ${roundThatJustFinished}`,
          "color: #9c27b0;",
        );
        setRiggedOutcomes((prev) => {
          const next = { ...prev };
          delete next[roundThatJustFinished];
          delete (next as any)[roundThatJustFinished.toString()];
          return next;
        });

        if (currentSettings.removeOnceChosen) {
          const idToRemove = selectedOption.id;
          const labelToRemove = selectedOption.label;

          setOptions((prev) => {
            const filtered = prev.filter((o) => o.id !== idToRemove);
            console.log(
              `%c ♻️ MODO NORMAL: "${labelToRemove}" removido. Quedan ${filtered.length} jugadores.`,
              "color: #9c27b0; font-weight: bold;",
            );
            return filtered;
          });
        }
      }
    },
    [currentRoundCount, playWin, playEliminated, playApplause],
  );

  // Manejar el request de STOP del usuario (Parada en Seco)
  // Manejar el request de STOP del usuario (Parada en Seco SIN Resultado)
  const handleStopRequest = useCallback(() => {
    if (!isSpinning || !settings.tapToStop || !wheelRef.current) return;

    // 1. Cancelar timeouts de la animación y ticks
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    if (tickTimeoutRef.current) clearTimeout(tickTimeoutRef.current);

    // 2. Obtener la rotación visual actual del DOM
    const computedStyle = window.getComputedStyle(wheelRef.current);
    const matrix = new DOMMatrix(computedStyle.transform);

    // Calcular ángulo en grados desde la matriz (atan2(b, a))
    let currentAngle = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);

    // Normalizar a 0-360
    if (currentAngle < 0) currentAngle += 360;

    // 3. "Congelar" la rueda en el estado actual
    setRotation(currentAngle);

    // 4. Detener todo SIN anunciar ganador (Abortar)
    setIsSpinning(false);
    setIsStopping(false);
    setAnnouncement(null);
  }, [isSpinning, settings.tapToStop]);

  // Handler para resetear solo el contador de rondas (N veces)
  const handleResetRoundCount = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const confirmResetRoundCount = useCallback(() => {
    setCurrentRoundCount(0);
    localStorage.removeItem(ROUND_COUNT_KEY);
    setShowResetConfirm(false);
  }, []);

  const handleSpin = useCallback(() => {
    // Si ya está girando y se permite parar
    if (isSpinning) {
      if (settings.tapToStop && !isStopping) {
        handleStopRequest();
      }
      return;
    }

    if (options.length < 1) return;

    // Intentar iniciar la música de fondo (requiere interacción del usuario)
    tryStartMusic();

    // Reiniciar estados
    setIsSpinning(true);
    setIsStopping(false);
    setAnnouncement(null);

    // IMPORTANTE: Un pequeño timeout para asegurar que el renderizado procese
    // el estado isSpinning antes de iniciar la animación pesada si fuera necesario,
    // pero aquí lo crítico es el setTimeout del final.

    // Configuración de giro
    const spinDuration = settings.spinDuration * 1000;
    const minSpins = 10;
    const maxSpins = 15;
    const spins = minSpins + Math.random() * (maxSpins - minSpins);
    let extraDegrees = 0;

    // 4. Determinar Ganador (Decisión antes del giro)
    let winnerIndex = -1;
    const nextRoundNumber = currentRoundCount + 1;

    console.log(
      `%c 🔍 COMPROBANDO RONDA ${nextRoundNumber} `,
      "background: #222; color: #bada55; font-size: 12px; font-weight: bold; padding: 4px; border-radius: 4px;",
    );

    // A. ¿Hay un resultado trucado para ESTA ronda?
    const riggedWinnerId =
      (riggedOutcomes as any)[nextRoundNumber] ||
      (riggedOutcomes as any)[nextRoundNumber.toString()];

    // Mostrar estado de todos los jugadores actuales
    console.log(
      `%c 👥 Jugadores en el bombo (${options.length}):`,
      "color: #888; font-style: italic;",
    );
    options.forEach((o, i) => {
      const reservedRound = Object.entries(riggedOutcomes).find(
        ([_, id]) => id === o.id,
      )?.[0];
      const isTarget = o.id === riggedWinnerId;

      let status = "";
      if (isTarget) status = `%c🎯 [DESTINADO A SALIR AHORA]`;
      else if (reservedRound)
        status = `%c🛡️ [RESERVADO PARA RONDA ${reservedRound}]`;
      else status = `%c🎲 [DISPONIBLE PARA EL AZAR]`;

      const color = isTarget
        ? "color: #ffeb3b; font-weight: bold;"
        : reservedRound
          ? "color: #90caf9;"
          : "color: #a5d6a7;";
      console.log(`   ${i + 1}. ${o.label} ${status}`, color);
    });

    if (riggedWinnerId) {
      winnerIndex = options.findIndex((o) => o.id === riggedWinnerId);
      if (winnerIndex !== -1) {
        console.log(
          `%c 🎯 TRUCO ACTIVADO: Forzando salida de "${options[winnerIndex].label}" en esta Ronda ${nextRoundNumber}`,
          "background: #e91e63; color: white; font-weight: bold; padding: 2px;",
        );
      } else {
        console.warn(
          `%c ⚠️ TRUCO FALLIDO: La opción con ID ${riggedWinnerId} ya no está en la rueda.`,
          "color: #ff9900;",
        );
      }
    }

    // B. Si no hay truco o no era válido, elegir Ganador Aleatorio
    if (winnerIndex === -1) {
      console.log(
        "%c 🎲 Decidiendo por AZAR SEGURO...",
        "color: #03a9f4; font-weight: bold;",
      );

      // PROTEGER a quienes tienen trucos futuros
      const reservedEntries = Object.entries(riggedOutcomes).filter(
        ([r]) => parseInt(r) > nextRoundNumber,
      );

      const reservedIds = new Set();
      const validReservedEntries: [string, string][] = [];

      reservedEntries.forEach(([r, id]) => {
        const p = options.find((o) => o.id === id);
        if (p) {
          reservedIds.add(id);
          validReservedEntries.push([r, id]);
        }
      });

      if (validReservedEntries.length > 0) {
        console.log(
          `%c 🛡️ FILTRADO: Protegiendo a ${validReservedEntries.length} jugadores para rondas futuras.`,
          "color: #7986cb;",
        );
      }

      // Opciones que no están reservadas para el futuro
      const safeOptions = options.filter((o) => !reservedIds.has(o.id));

      if (safeOptions.length > 0) {
        const chosen =
          safeOptions[Math.floor(Math.random() * safeOptions.length)];
        winnerIndex = options.findIndex((o) => o.id === chosen.id);
        console.log(
          `%c ✅ Seleccionado aleatoriamente entre los ${safeOptions.length} jugadores "seguros".`,
          "color: #4caf50;",
        );
      } else {
        console.log(
          "%c ⚠️ CRÍTICO: No hay jugadores seguros. Forzando selección entre todos.",
          "color: #f44336; font-weight: bold;",
        );
        winnerIndex = Math.floor(Math.random() * options.length);
      }
    }

    const winnerId = options[winnerIndex].id;
    console.log(
      `%c 🏁 RESULTADO DEFINIDO PARA RONDA ${nextRoundNumber}:`,
      "background: #2196F3; color: white; font-weight: bold; padding: 4px; border-radius: 4px;",
    );
    console.log(
      `%c >> "${options[winnerIndex].label}" será el elegido <<`,
      "color: #2196F3; font-size: 14px; font-weight: bold; text-decoration: underline;",
    );

    // 5. Calcular ángulo final basado en el winnerIndex decidido
    const numSegments = options.length;
    const segmentAngle = 360 / numSegments;
    const targetAdjustedAngle = (winnerIndex + 0.5) * segmentAngle;
    const targetRotationMod360 = (360 - targetAdjustedAngle + 360) % 360;
    const currentRotationMod360 = ((rotation % 360) + 360) % 360;

    let neededDelta = targetRotationMod360 - currentRotationMod360;
    while (neededDelta < 0) neededDelta += 360;

    // Jitter (±35% del segmento)
    const jitter = (Math.random() - 0.5) * (segmentAngle * 0.35);
    extraDegrees = neededDelta + jitter;

    const totalRotation = Math.floor(spins) * 360 + extraDegrees;
    const newRotation = rotation + totalRotation;

    // Actualizar rotación para iniciar animación CSS
    setRotation(newRotation);

    // Iniciar loop de sonidos de tick
    let tickDelay = Math.max(20, 150 - settings.effectFrequency);
    const tickLoop = () => {
      playTick();
      tickDelay *= 1.05;
      if (tickDelay < 800) {
        tickTimeoutRef.current = window.setTimeout(tickLoop, tickDelay);
      }
    };
    tickLoop();

    // PROGRAMAR EL FIN DEL GIRO
    spinTimeoutRef.current = window.setTimeout(() => {
      calculateAndAnnounceWinner(newRotation, winnerId);
    }, spinDuration + 50);
  }, [
    isSpinning,
    isStopping,
    options,
    rotation,
    settings.spinDuration,
    settings.tapToStop,
    settings.effectFrequency,
    handleStopRequest,
    calculateAndAnnounceWinner,
    currentRoundCount,
    riggedOutcomes,
    tryStartMusic,
    playTick,
  ]);

  const handleEditChange = (id: string, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Crear los segmentos del SVG
  const createWheelSegments = () => {
    if (options.length === 0) return null;

    // Caso especial: Solo queda 1 opción. El arco de 360° no se dibuja bien en SVG.
    if (options.length === 1) {
      const opt = options[0];
      return (
        <g key={opt.id}>
          <circle
            cx="150"
            cy="150"
            r="148"
            fill={opt.color}
            stroke="#2c3e50"
            strokeWidth="2"
          />
          <text
            x="150"
            y="100"
            fill="white"
            fontSize="18"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              textShadow: "1px 1px 4px rgba(0,0,0,0.6)",
              pointerEvents: "none",
            }}
          >
            {opt.label}
          </text>
        </g>
      );
    }

    const segments = [];
    const segmentAngle = 360 / options.length;

    for (let i = 0; i < options.length; i++) {
      const startAngle = i * segmentAngle - 90;
      const endAngle = startAngle + segmentAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const radius = 150;
      const centerX = 150;
      const centerY = 150;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArcFlag = segmentAngle > 180 ? 1 : 0;

      const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      const textAngle = startRad + (segmentAngle * Math.PI) / 360;
      const textRadius = radius * 0.65;
      const textX = centerX + textRadius * Math.cos(textAngle);
      const textY = centerY + textRadius * Math.sin(textAngle);

      const textRotation = startAngle + segmentAngle / 2;

      segments.push(
        <g key={options[i].id}>
          <path
            d={pathData}
            fill={options[i].color}
            stroke="#2c3e50"
            strokeWidth="2"
          />
          <text
            x={textX}
            y={textY}
            fill="white"
            fontSize="14"
            fontWeight="600"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
            style={{
              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
              pointerEvents: "none",
            }}
          >
            {options[i].label}
          </text>
        </g>,
      );
    }

    return segments;
  };

  // Duración dinámica según configuración
  const spinDurationStyle = {
    "--spin-duration": `${settings.spinDuration}s`,
    transition: isSpinning ? undefined : "none",
  } as React.CSSProperties;

  return (
    <div className="raffle-modal-wrapper">
      <div className="raffle-page">
        {/* Efecto de Confeti para celebración */}
        <Confetti isActive={showConfetti} duration={5000} />

        {/* Header */}
        <header className="raffle-header">
          <button
            className="header-btn settings-btn"
            onClick={() => setIsOptionsOpen(true)}
            aria-label="Configuraciones"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          <div className="raffle-selector" onClick={handleRigTrigger}>
            <span>Rifa</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>

          <div className="header-actions">
            {/* Botón Reset Counter (Solo visible en modo N veces) */}
            {settings.removeOnceChosen &&
              settings.winningCondition === "after_n_times" && (
                <button
                  className="header-btn reset-count-btn"
                  onClick={handleResetRoundCount}
                  aria-label="Reiniciar contador"
                  title="Reiniciar contador de sorteos"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M2.5 2v6h6M2.66 15.57a10 10 0 1 0 .57-8.38" />
                  </svg>
                </button>
              )}

            <button
              className="header-btn add-btn"
              onClick={handleAddOption}
              aria-label="Agregar opción"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Wheel Container */}
        <main className="wheel-container">
          {settings.removeOnceChosen &&
            settings.winningCondition === "after_n_times" && (
              <div className="game-status-badge">
                <span className="status-round">
                  Sorteo <strong>{currentRoundCount + 1}</strong> /{" "}
                  {settings.winningN}
                </span>
                {currentRoundCount + 1 >= settings.winningN ? (
                  <span className="status-next-action winner">
                    🏆 EL PRÓXIMO GANA
                  </span>
                ) : (
                  <span className="status-next-action elim">
                    ❌ EL PRÓXIMO SALE
                  </span>
                )}
              </div>
            )}

          <div className="wheel-design-wrapper">
            {/* Pointer */}
            <div className="wheel-pointer">
              <svg viewBox="0 0 40 50" fill="white">
                <polygon points="20,50 0,0 40,0" />
              </svg>
            </div>

            {/* Wheel */}
            <div
              className={`wheel ${isSpinning ? "spinning" : ""}`}
              ref={wheelRef}
              style={{
                transform: `rotate(${rotation}deg)`,
                ...spinDurationStyle,
              }}
            >
              <svg viewBox="0 0 300 300" className="wheel-svg">
                {createWheelSegments()}
                <circle
                  cx="150"
                  cy="150"
                  r="148"
                  fill="none"
                  stroke="#2c3e50"
                  strokeWidth="4"
                />
              </svg>
            </div>

            {/* Start Button */}
            <button
              className={`start-btn ${isStopping ? "stopping" : ""} ${isSpinning && !settings.tapToStop ? "spinning-locked" : ""}`}
              onClick={handleSpin}
              disabled={
                options.length < 1 ||
                isStopping ||
                (isSpinning && !settings.tapToStop)
              }
            >
              {isSpinning && settings.tapToStop && !isStopping
                ? "STOP"
                : "START"}
            </button>
          </div>

          {/* Announcement Display (Winner/Eliminated) */}
          <WinnerToast announcement={announcement} isVisible={!isSpinning} />
        </main>

        {/* Footer */}
        <footer className="raffle-footer">
          {/* Control de Volumen con Slider Vertical */}
          <div className="volume-control-wrapper" ref={volumeControlRef}>
            {isVolumeOpen && (
              <div className="volume-slider-popup show">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.volume}
                  onChange={(e) =>
                    updateSetting("volume", parseInt(e.target.value))
                  }
                  className="vertical-slider"
                />
              </div>
            )}
            <button
              className={`footer-btn volume-btn ${isVolumeOpen ? "active" : ""}`}
              onClick={() => setIsVolumeOpen(!isVolumeOpen)}
              aria-label="Volumen"
            >
              {settings.volume === 0 ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : settings.volume < 50 ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
          </div>

          <button
            className="footer-btn edit-btn"
            onClick={handleStartEdit}
            aria-label="Editar"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </footer>

        {/* MODALS */}

        {/* Edit Options Modal */}
        <EditOptionsModal
          isOpen={isEditing}
          onClose={handleCancelEdit}
          options={options}
          editValues={editValues}
          onEditChange={handleEditChange}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
          onDeleteOption={handleDeleteOption}
          onDeleteAll={handleDeleteAll}
          onReset={handleReset}
          onAddOption={handleAddOption}
        />

        {/* Round Count Reset Confirmation Modal */}
        {showResetConfirm && (
          <ConfirmModal
            isOpen={showResetConfirm}
            title="¿Reiniciar ronda?"
            message={`Esto reiniciará el contador de rondas a 0. El modo "Ganar tras ${settings.winningN} veces" comenzará desde el principio.`}
            onConfirm={confirmResetRoundCount}
            onCancel={() => setShowResetConfirm(false)}
            variant="warning"
          />
        )}

        {/* Rigged Raffle Modal (Secret) */}
        <RiggedRaffleModal
          isOpen={isRigModalOpen}
          onClose={() => setIsRigModalOpen(false)}
          options={options}
          riggedOutcomes={riggedOutcomes}
          onSaveRig={handleSaveRig}
          onClearRig={handleClearRig}
        />

        {/* Options Modal */}
        <OptionsModal
          isOpen={isOptionsOpen}
          onClose={() => setIsOptionsOpen(false)}
        />
      </div>
    </div>
  );
};

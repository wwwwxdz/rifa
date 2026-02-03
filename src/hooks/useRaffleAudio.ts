import { useEffect, useRef, useCallback } from "react";
import { useSettings } from "../context";

// URLs de Música de Fondo (loop)
const MUSIC_URLS: Record<string, string> = {
  drum_roll_1: "https://upload.wikimedia.org/wikipedia/commons/1/12/Drums_short_roll.ogg",
  drum_roll_2: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Snare_Drum_Roll.ogg",
  suspense_1: "https://upload.wikimedia.org/wikipedia/commons/0/04/Suspense_Sting.ogg",
  suspense_2: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Tension_building_sting.ogg",
  carnival: "https://upload.wikimedia.org/wikipedia/commons/8/85/Circus_Music_Short.ogg",
};

// URLs de Sonidos de Decisión (one-shot)
const DECISION_SOUND_URLS: Record<string, string> = {
  sfx_cymbal_1: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Cymbal_crash.ogg",
  sfx_cymbal_2: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Cymbal_clash.ogg",
  sfx_bell: "https://upload.wikimedia.org/wikipedia/commons/4/44/Boxing_bell.ogg",
  sfx_tada: "https://upload.wikimedia.org/wikipedia/commons/d/db/Tada-sound.ogg",
  sfx_applause: "https://upload.wikimedia.org/wikipedia/commons/e/e6/Applause-3.ogg",
};

export const useRaffleAudio = () => {
  const { settings } = useSettings();
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const decisionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar Audio Context
  useEffect(() => {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass();
    }

    // Cleanup
    return () => {
      bgMusicRef.current?.pause();
      bgMusicRef.current = null;
      decisionAudioRef.current?.pause();
      decisionAudioRef.current = null;
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close().catch(() => { });
      }
    };
  }, []);

  // Manejar cambio de pista de música
  useEffect(() => {
    if (!settings.backgroundMusic || settings.backgroundMusic === "none") {
      bgMusicRef.current?.pause();
      return;
    }

    const url = MUSIC_URLS[settings.backgroundMusic];
    if (url) {
      if (!bgMusicRef.current) {
        bgMusicRef.current = new Audio(url);
        bgMusicRef.current.loop = true;
      } else if (!bgMusicRef.current.src.includes(url.split("/").pop() || "")) {
        bgMusicRef.current.src = url;
      }

      bgMusicRef.current.volume = (settings.volume ?? 50) / 100;

      bgMusicRef.current.play().catch(() => {
        // Autoplay blocked - will play on user interaction
      });
    }
  }, [settings.backgroundMusic]);

  // Manejar cambio de volumen en tiempo real
  useEffect(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.volume = (settings.volume ?? 50) / 100;
    }
  }, [settings.volume]);

  // Generar Tick (sintético vía Web Audio API)
  const playTick = useCallback(() => {
    if (!settings.effect || settings.effect === "none") return;
    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (ctx.state === "suspended") ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

    const vol = (settings.volume ?? 50) / 100;
    gain.gain.setValueAtTime(vol * 0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, [settings.effect, settings.volume]);

  // Reproducir sonido de decisión (archivo de audio real)
  const playDecisionSound = useCallback(() => {
    if (!settings.decisionSound || settings.decisionSound === "none") return;

    const url = DECISION_SOUND_URLS[settings.decisionSound];
    if (!url) return;

    // Crear nuevo audio para cada reproducción (permite superponer)
    const audio = new Audio(url);
    audio.volume = (settings.volume ?? 50) / 100;
    audio.play().catch(() => { });
  }, [settings.decisionSound, settings.volume]);

  // Generar Win - Usa sonido de decisión configurado o fallback sintético
  const playWin = useCallback(() => {
    if (settings.decisionSound && settings.decisionSound !== "none") {
      playDecisionSound();
      return;
    }

    // Fallback: sonido sintético de victoria
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const volume = (settings.volume ?? 50) / 100;
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc.frequency.value = freq;

      const startTime = now + i * 0.12;
      const duration = 0.1;

      gain.gain.setValueAtTime(volume * 0.3, startTime);
      gain.gain.linearRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }, [settings.decisionSound, settings.volume, playDecisionSound]);

  // Generar Eliminado (sintético - tono descendente triste)
  const playEliminated = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const volume = (settings.volume ?? 50) / 100;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.4);

    gain.gain.setValueAtTime(volume * 0.3, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.4);

    osc.start(now);
    osc.stop(now + 0.4);
  }, [settings.volume]);

  // Función para intentar iniciar la música (llamar desde evento de usuario)
  const tryStartMusic = useCallback(() => {
    if (!settings.backgroundMusic || settings.backgroundMusic === "none")
      return;

    const url = MUSIC_URLS[settings.backgroundMusic];
    if (!url) return;

    if (!bgMusicRef.current) {
      bgMusicRef.current = new Audio(url);
      bgMusicRef.current.loop = true;
    } else if (!bgMusicRef.current.src.includes(url.split("/").pop() || "")) {
      bgMusicRef.current.src = url;
    }

    bgMusicRef.current.volume = (settings.volume ?? 50) / 100;

    bgMusicRef.current.play().catch(() => {
      // Still blocked, will try again on next user interaction
    });
  }, [settings.backgroundMusic, settings.volume]);

  // Reproducir aplausos (para celebración de victoria)
  const playApplause = useCallback(() => {
    const audio = new Audio(DECISION_SOUND_URLS.sfx_applause);
    audio.volume = (settings.volume ?? 50) / 100;
    audio.play().catch(() => { });
  }, [settings.volume]);

  return { playTick, playWin, playEliminated, tryStartMusic, playApplause };
};

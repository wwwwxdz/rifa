import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// Tipos
export interface Settings {
  // Ajustes de la ruleta
  spinDuration: number; // segundos
  backgroundMusic: string;
  decisionSound: string;
  effect: string;
  effectFrequency: number; // porcentaje
  removeOnceChosen: boolean;
  tapToStop: boolean;

  // Condición de victoria
  winningCondition: "immediate" | "after_n_times";
  winningN: number;

  // Generales
  darkMode: boolean;
  passwordProtection: boolean;
  language: string;
  volume: number; // 0-100
}

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetToDefaults: () => void;
}

// Valores por defecto
const DEFAULT_SETTINGS: Settings = {
  spinDuration: 5,
  backgroundMusic: "drum_roll_1",
  decisionSound: "sfx_cymbal_1",
  effect: "change_1_before",
  effectFrequency: 0,
  removeOnceChosen: true,
  tapToStop: false,
  winningCondition: "immediate",
  winningN: 2,
  darkMode: true,
  passwordProtection: false,
  language: "es",
  volume: 50,
};

// Opciones disponibles
export const BACKGROUND_MUSIC_OPTIONS = [
  { value: "none", label: "Sin música" },
  { value: "drum_roll_1", label: "Redoble de tambores 1" },
  { value: "drum_roll_2", label: "Redoble de tambores 2" },
  { value: "suspense_1", label: "Suspenso 1" },
  { value: "suspense_2", label: "Suspenso 2" },
  { value: "carnival", label: "Carnaval" },
];

export const DECISION_SOUND_OPTIONS = [
  { value: "none", label: "Sin sonido" },
  { value: "sfx_cymbal_1", label: "SFX 1 Cimbal" },
  { value: "sfx_cymbal_2", label: "SFX 2 Cimbal" },
  { value: "sfx_bell", label: "Campana" },
  { value: "sfx_tada", label: "Fanfarria" },
  { value: "sfx_applause", label: "Aplausos" },
];

export const EFFECT_OPTIONS = [
  { value: "none", label: "Sin efecto" },
  { value: "change_1_before", label: "Cambio (1 antes)" },
  { value: "change_2_before", label: "Cambio (2 antes)" },
  { value: "flash", label: "Destello" },
  { value: "shake", label: "Temblor" },
];

export const LANGUAGE_OPTIONS = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];

// Contexto
const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

// Provider
interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<Settings>(() => {
    // Intentar cargar configuraciones guardadas
    const saved = localStorage.getItem("rifa-settings");
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };
        localStorage.setItem("rifa-settings", JSON.stringify(newSettings));
        return newSettings;
      });
    },
    [],
  );

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem("rifa-settings", JSON.stringify(DEFAULT_SETTINGS));
  }, []);

  return (
    <SettingsContext.Provider
      value={{ settings, updateSetting, resetToDefaults }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

// Hook
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

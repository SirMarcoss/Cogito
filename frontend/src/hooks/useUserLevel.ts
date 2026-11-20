import { useCallback, useState } from "react";
import type { LivelloCompetenza } from "../types/api";

export const COGITO_USER_LEVEL_KEY = "cogito_user_level";

const VALID_LEVELS: readonly LivelloCompetenza[] = [
  "bambino",
  "ragazzo",
  "adulto",
  "esperto",
];

function isValidLevel(value: string | null): value is LivelloCompetenza {
  return value !== null && (VALID_LEVELS as readonly string[]).includes(value);
}

function readStoredLevel(): LivelloCompetenza | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem(COGITO_USER_LEVEL_KEY);
    return isValidLevel(stored) ? stored : null;
  } catch {
    return null;
  }
}

export interface UseUserLevelResult {
  level: LivelloCompetenza | null;
  hasSelectedLevel: boolean;
  setLevel: (nextLevel: LivelloCompetenza) => void;
  clearLevel: () => void;
}

/**
 * Gestisce il livello di narrazione senza login tramite `localStorage["cogito_user_level"]`.
 */
export function useUserLevel(): UseUserLevelResult {
  const [level, setLevelState] = useState<LivelloCompetenza | null>(() => readStoredLevel());

  const setLevel = useCallback((nextLevel: LivelloCompetenza) => {
    setLevelState(nextLevel);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(COGITO_USER_LEVEL_KEY, nextLevel);
    } catch {
      // Ignora errori di quota/storage in modalità privata restrittiva.
    }
  }, []);

  const clearLevel = useCallback(() => {
    setLevelState(null);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(COGITO_USER_LEVEL_KEY);
    } catch {
      // Nessuna azione necessaria se localStorage non è accessibile.
    }
  }, []);

  return {
    level,
    hasSelectedLevel: level !== null,
    setLevel,
    clearLevel,
  };
}

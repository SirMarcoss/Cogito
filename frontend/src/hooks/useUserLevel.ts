import { useCallback, useState } from "react";
import type { LivelloCompetenza } from "../types/api";

export const USER_LEVEL_STORAGE_KEY = "cogito_user_level";
const LEVEL_CONFIRMED_KEY = "cogito_level_confirmed_v2";

const VALID_LEVELS: readonly LivelloCompetenza[] = [
  "bambino",
  "ragazzo",
  "adulto",
  "esperto",
];

function readStoredState(): {
  level: LivelloCompetenza;
  hasSavedLevel: boolean;
} {
  try {
    const confirmed = window.localStorage.getItem(LEVEL_CONFIRMED_KEY) === "1";
    const raw = window.localStorage.getItem(USER_LEVEL_STORAGE_KEY);
    if (confirmed && raw && (VALID_LEVELS as readonly string[]).includes(raw)) {
      return { level: raw as LivelloCompetenza, hasSavedLevel: true };
    }
  } catch {
    // Ignore storage read errors in restricted contexts
  }
  return { level: "adulto", hasSavedLevel: false };
}

export function useUserLevel() {
  const [state, setState] = useState(() => readStoredState());

  const setLevel = useCallback((nextLevel: LivelloCompetenza) => {
    setState({ level: nextLevel, hasSavedLevel: true });
    try {
      window.localStorage.setItem(USER_LEVEL_STORAGE_KEY, nextLevel);
      window.localStorage.setItem(LEVEL_CONFIRMED_KEY, "1");
    } catch {
      // Non-fatal if storage is disabled
    }
  }, []);

  return {
    level: state.level,
    hasSavedLevel: state.hasSavedLevel,
    setLevel,
  };
}

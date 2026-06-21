// Save and load game state from local storage

import { GameSettings, GameState } from './types';
import { createInitialGameState } from './state';

const SAVE_KEY = 'it-whispers-save';
const SETTINGS_KEY = 'it-whispers-settings';

function readVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(Math.max(value, 0), 1)
    : fallback;
}

/**
 * Merges a loaded save with the current initial-state defaults so that
 * new fields added in later chapters are always present, even on old saves.
 */
function migrateGameState(saved: GameState): GameState {
  const defaults = createInitialGameState();
  return {
    ...defaults,
    ...saved,
    resources: { ...defaults.resources, ...saved.resources },
    tools: { ...defaults.tools, ...saved.tools },
    player: { ...defaults.player, ...saved.player },
    flags: { ...saved.flags },
    progress: { ...saved.progress },
    lightSystem: { ...defaults.lightSystem, ...saved.lightSystem },
    repetition: { ...defaults.repetition, ...saved.repetition },
    settings: { ...defaults.settings, ...saved.settings },
    meta: { ...defaults.meta, ...saved.meta },
  };
}

export function saveGame(state: GameState): void {
  try {
    const updatedState = {
      ...state,
      meta: {
        ...state.meta,
        lastSaved: Date.now(),
      },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(updatedState));
  } catch (error) {
    console.error('Failed to save game:', error);
  }
}

export function loadGame(): GameState | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as GameState;
    return migrateGameState(parsed);
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function loadSettings(): GameSettings {
  const defaults = createInitialGameState().settings;
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return defaults;
    const parsed = JSON.parse(saved) as Partial<GameSettings>;
    return {
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : defaults.sound,
      music: typeof parsed.music === 'boolean' ? parsed.music : defaults.music,
      musicVolume: readVolume(parsed.musicVolume, defaults.musicVolume),
      effectsVolume: readVolume(parsed.effectsVolume, defaults.effectsVolume),
      textSpeed:
        parsed.textSpeed === 'instant' || parsed.textSpeed === 'normal' || parsed.textSpeed === 'slow'
          ? parsed.textSpeed
          : defaults.textSpeed,
      reducedMotion:
        typeof parsed.reducedMotion === 'boolean' ? parsed.reducedMotion : defaults.reducedMotion,
    };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Save and load game state from local storage

import { GameState } from './types';
import { createInitialGameState } from './state';

const SAVE_KEY = 'it-whispers-save';

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

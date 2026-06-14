// Game state management and initial state creation

import { GameState, NightPhase } from './types';

export function createInitialGameState(): GameState {
  return {
    chapter: 'Chapter 1',
    currentLocation: 'First Grave',
    timeOfNightMinutes: 1080, // 18:00 (18 * 60)
    nightPhase: 'Dusk',
    eventLog: [],
    resources: {
      candle: 0,
      wax: 0,
      matches: 0,
      oil: 0,
      salt: 0,
      ironNails: 0,
      rations: 0,
      cloth: 0,
      boneTokens: 0,
      namesKnownCount: 0,
      // Chapter 2
      rag: 0,
      twine: 0,
      crackedLantern: 0,
      handSpade: 0,
      cemeteryMap: 0,
      keeperNote: 0,
      // Chapter 3
      markerFragment: 0,
      secondNameFragment: 0,
      clothStrip: 0,
      buriedLedgerPage: 0,
      // Chapter 4
      graveChalk: 0,
      graveRubbings: 0,
      blackSalt: 0,
      keeperThread: 0,
      unwrittenLedgerPage: 0,
      stitchedLedgerPage: 0,
      livingNameTrace: 0,
      livingNameAnchor: 0,
      thresholdAsh: 0,
      niraFirstSound: 0,
    },
    tools: {
      hasLantern: false,
      hasShovel: false,
      hasLedger: false,
      hasKeeperKey: false,
      hasRustyKnife: false,
      hasBellCharm: false,
    },
    player: {
      courage: 5,
      maxCourage: 5,
      wounds: 0,
      maxWounds: 3,
      isAlive: true,
      endingId: null,
    },
    flags: {},
    progress: {},
    graves: {},
    combat: {
      inCombat: false,
      enemyId: null,
      enemyHealth: 0,
      enemyType: null,
      playerGuarding: false,
      combatTurn: 0,
      canFlee: true,
    },
    lightSystem: {
      lightLevel: 0,
      candleStability: 0,
      candleTurnsRemaining: 0,
      lanternOilRemaining: 0,
    },
    repetition: {
      whisperLevel: 0,
      deadAttention: 0,
      firstGraveListenCount: 0,
      searchGroundCount: 0,
      firstGraveMarkerProgress: 0,
      shedSearchProgress: 0,
      shedSecurity: 0,
      ledgerReadProgress: 0,
      ch3DigProgress: 0,
      ch3GatheringProgress: 0,
      blankStoneTraceProgress: 0,
      namelessRowListenCount: 0,
      blackSaltWardStrength: 0,
      uncarvedPlotInspectCount: 0,
      ashBasinSearchCount: 0,
      livingTraceListenCount: 0,
      niraHouseInspectCount: 0,
      niraDoorListenCount: 0,
      niraMemoryListenCount: 0,
    },
    settings: {
      sound: true,
      music: true,
      textSpeed: 'normal',
      reducedMotion: false,
    },
    meta: {
      lastSaved: 0,
      gameVersion: '1.0.0',
    },
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateNightPhase(minutes: number): NightPhase {
  const hour = Math.floor(minutes / 60);

  if (hour >= 18 && hour < 20) return 'Dusk';
  if (hour >= 20 && hour < 22) return 'Dark';
  if (hour >= 22 || hour < 1) return 'Deep Night';
  if (hour >= 1 && hour < 3) return 'Witching Hour';
  if (hour >= 3 && hour < 4) return 'Dead Hour';
  if (hour >= 4 && hour < 6) return 'Thinning Dark';
  return 'Dawn';
}

export function advanceTime(state: GameState, minutesToAdd: number): GameState {
  const newMinutes = state.timeOfNightMinutes + minutesToAdd;
  const normalizedMinutes = newMinutes % 1440; // Wrap at 24 hours

  return {
    ...state,
    timeOfNightMinutes: normalizedMinutes,
    nightPhase: calculateNightPhase(normalizedMinutes),
  };
}

export function formatGameTime(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export function addLogEntry(
  state: GameState,
  text: string,
  type: 'story' | 'action' | 'whisper' | 'danger' | 'resource' = 'story'
): GameState {
  const entry = {
    id: `${Date.now()}-${Math.random()}`,
    text,
    timestamp: Date.now(),
    type,
  };

  // Keep log to last 60 entries
  const trimmed =
    state.eventLog.length >= 60 ? state.eventLog.slice(state.eventLog.length - 59) : state.eventLog;
  return { ...state, eventLog: [...trimmed, entry] };
}

/**
 * Called after every completed action.
 * Handles candle decay and atmospheric pressure events.
 */
export function tickAfterAction(state: GameState): GameState {
  let s = { ...state };

  // ── Increment total action counter ──────────────────────────
  const totalActions = (s.progress['totalActions'] ?? 0) + 1;
  s.progress = { ...s.progress, totalActions };

  // ── Candle decay ────────────────────────────────────────────
  if (s.lightSystem.lightLevel > 0 && s.lightSystem.candleTurnsRemaining > 0) {
    const remaining = s.lightSystem.candleTurnsRemaining - 1;
    s.lightSystem = { ...s.lightSystem, candleTurnsRemaining: remaining };

    const lanternBurning = s.lightSystem.lightLevel === 3;

    if (!lanternBurning && remaining === 3) {
      s = addLogEntry(s, 'the candle bends low.', 'story');
    } else if (!lanternBurning && remaining === 1) {
      s = addLogEntry(s, 'the flame gutters.', 'danger');
    } else if (remaining <= 0) {
      s.lightSystem = {
        ...s.lightSystem,
        lightLevel: 0,
        candleStability: 0,
        candleTurnsRemaining: 0,
      };
      if (lanternBurning) {
        s = addLogEntry(s, 'the lantern oil is spent. the shed goes dark.', 'danger');
      } else {
        s = addLogEntry(s, 'the candle dies. the graves sound closer.', 'danger');
      }
    }
  }

  // ── Pressure events every 5 actions ─────────────────────────
  const lastPressureAt = s.progress['lastPressureAt'] ?? 0;
  if (totalActions - lastPressureAt >= 5) {
    s.progress = { ...s.progress, lastPressureAt: totalActions };
    const pressureLine = pickPressureEvent(s);
    if (pressureLine) {
      s = addLogEntry(s, pressureLine, 'whisper');
    }
  }

  return s;
}

function pickPressureEvent(state: GameState): string | null {
  const { repetition, lightSystem, player, flags } = state;
  const totalActions = state.progress['totalActions'] ?? 0;

  // Chapter 2 shed pressure lines
  if (flags['chapter2Active'] && !flags['chapter2Complete']) {
    if (repetition.deadAttention >= 5) {
      return 'the shed walls settle. something outside is no longer moving.';
    }
    if (flags['hasHeardEastRowWhisper'] && !flags['chapter2Complete']) {
      return 'the word from beyond the east row has not repeated. it does not need to.';
    }
    if (state.progress['shedListenCount'] && state.progress['shedListenCount'] >= 1) {
      return 'the floorboards do not knock again. but you remember the pattern.';
    }
  }

  if (repetition.whisperLevel >= 4) {
    return 'more graves begin to whisper. not words. practice.';
  }
  if (repetition.deadAttention >= 4) {
    return 'something in the cemetery turns its attention toward you.';
  }
  if (lightSystem.lightLevel === 1 && lightSystem.candleTurnsRemaining <= 4) {
    return 'the flame leans toward a grave that has no wind.';
  }
  if (lightSystem.lightLevel === 0 && totalActions >= 6) {
    return 'the dark is no longer empty.';
  }
  if (player.courage <= 2) {
    return 'your hands shake before the graves speak.';
  }
  return null;
}

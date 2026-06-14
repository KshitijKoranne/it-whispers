// Chapter 1: The First Grave — Action Definitions

import { GameAction, GameState } from './types';
import { advanceTime, addLogEntry, clamp } from './state';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function flag(state: GameState, key: string): boolean {
  return state.flags[key] === true;
}

function setFlag(state: GameState, key: string, value: boolean): GameState {
  return { ...state, flags: { ...state.flags, [key]: value } };
}

function notComplete(state: GameState): boolean {
  return !flag(state, 'chapter1Complete');
}

/** True when in Chapter 2 (shed entered, not yet complete) */
function inChapter2(state: GameState): boolean {
  return flag(state, 'chapter2Active') && !flag(state, 'chapter2Complete');
}

/** True in any chapter where the candle / light system is active */
function inAnyActiveChapter(state: GameState): boolean {
  return notComplete(state) || inChapter2(state) || inChapter3(state);
}

// ─── 1. LISTEN ───────────────────────────────────────────────────────────────

const listenAction: GameAction = {
  id: 'listen',
  label: 'listen',
  cooldownSeconds: 2,
  inGameMinutesPassed: 5,
  repeatable: true,
  visible: notComplete,
  onExecute: (state) => {
    const count = state.repetition.firstGraveListenCount;
    let newState = advanceTime({ ...state }, 5);

    // Vary text by listen count
    let text: string;
    switch (count) {
      case 0:
        text = '"not loud," something whispers.\n"it hears loud things."';
        break;
      case 1:
        text =
          'the whisper moves beneath the soil, following your hand.\n"small breaths," it says. "small steps."';
        break;
      case 2:
        text =
          'more graves answer, but not in words.\nfor a moment, the cemetery sounds like it is practicing your name.';
        break;
      case 3:
        text = '"find what they left of me," the grave says.\n"stone remembers badly."';
        break;
      case 4:
        text = 'under the whisper, you hear three hard sounds.\nE.\nL.\nI.';
        break;
      default:
        text =
          'the first grave has said all it can without light.\nother graves begin to listen back.';
    }

    newState = addLogEntry(newState, text, 'whisper');

    // Update repetition counters
    const newListenCount = count + 1;
    const newWhisperLevel = newState.repetition.whisperLevel + 1;
    const newDeadAttention =
      newListenCount % 2 === 0
        ? newState.repetition.deadAttention + 1
        : newState.repetition.deadAttention;

    newState.repetition = {
      ...newState.repetition,
      firstGraveListenCount: newListenCount,
      whisperLevel: newWhisperLevel,
      deadAttention: newDeadAttention,
    };

    // Courage drain in darkness after repeated listens
    if (newState.lightSystem.lightLevel === 0 && newListenCount >= 3 && newListenCount % 3 === 0) {
      const newCourage = clamp(newState.player.courage - 1, 0, newState.player.maxCourage);
      newState.player = { ...newState.player, courage: newCourage };
      if (newCourage < newState.player.maxCourage) {
        newState = addLogEntry(newState, 'the dark presses closer.', 'danger');
      }
    }

    return { newState, logText: text };
  },
};

// ─── 2. SEARCH GROUND ────────────────────────────────────────────────────────

const searchGroundAction: GameAction = {
  id: 'search-ground',
  label: 'search ground',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => notComplete(state) && state.repetition.firstGraveListenCount >= 1,
  onExecute: (state) => {
    const count = state.repetition.searchGroundCount;
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    let entryType: 'resource' | 'action' | 'story' = 'action';

    if (count === 0) {
      text = 'your fingers find soft wax pressed into the mud.\na small lump. still usable.';
      entryType = 'resource';
      newState.resources = { ...newState.resources, wax: newState.resources.wax + 1 };
      newState = setFlag(newState, 'hasFoundWax', true);
    } else if (count === 1) {
      text = 'pressed into the dirt: three matches, damp, but usable.';
      entryType = 'resource';
      newState.resources = { ...newState.resources, matches: newState.resources.matches + 1 };
      newState = setFlag(newState, 'hasFoundMatches', true);
    } else if (count === 2) {
      text = 'a candle. half-melted, but still good.\nsomeone left it here.';
      entryType = 'resource';
      newState.resources = { ...newState.resources, candle: newState.resources.candle + 1 };
      newState = setFlag(newState, 'hasFoundCandle', true);
    } else if (count === 3) {
      text = 'you find a bent iron nail near the cracked stone.\nit is cold enough to hurt.';
      entryType = 'resource';
      newState.resources = { ...newState.resources, ironNails: newState.resources.ironNails + 1 };
    } else {
      text = 'nothing else. just cold earth and old stones.';
      // Rare atmospheric event in darkness
      if (newState.lightSystem.lightLevel === 0 && count >= 4 && count % 2 === 0) {
        text += '\nsomething under the grass curls away from your hand.';
      }
    }

    newState = addLogEntry(newState, text, entryType);
    newState.repetition = {
      ...newState.repetition,
      searchGroundCount: count + 1,
    };

    return { newState, logText: text };
  },
};

// ─── 3. INSPECT GRAVE ────────────────────────────────────────────────────────

const inspectGraveAction: GameAction = {
  id: 'inspect-grave',
  label: 'inspect grave',
  cooldownSeconds: 3,
  inGameMinutesPassed: 10,
  // repeatable: player may first touch the stone in darkness, then revisit
  // by candlelight to actually read the letters — one more press is fine.
  repeatable: true,
  visible: (state) => notComplete(state) && state.repetition.firstGraveListenCount >= 2,
  isDisabled: (state) => flag(state, 'hasInspectedFirstGrave'),
  getDisabledReason: () => 'already examined.',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);

    if (newState.lightSystem.lightLevel === 0) {
      // ── Darkness: physical touch only, no readable letters ──
      // The player can feel the stone but cannot read writing in darkness.
      const text =
        'your fingers find the grave marker.\nthe stone is split down the middle, cold and damp.\nyour thumb traces shallow carved marks — grooves worn deep by whoever cut them.\nsomething is written here.\nthe dark makes it unreadable.';
      newState = addLogEntry(newState, text, 'story');
      // Mark a partial dark-inspection flag so we know they touched the stone,
      // but do NOT set hasInspectedFirstGrave — they haven't read it yet.
      newState = setFlag(newState, 'hasInspectedGraveInDark', true);
      return { newState, logText: text };
    }

    // ── Candlelight: can read the letters ──
    const text =
      'the grave marker is split down the middle.\nmost of the name has worn away.\nonly three letters remain.\nE L I';
    newState = addLogEntry(newState, text, 'story');
    newState = setFlag(newState, 'hasInspectedFirstGrave', true);
    return { newState, logText: text };
  },
};

// ─── 4. LIGHT CANDLE ─────────────────────────────────────────────────────────

const lightCandleAction: GameAction = {
  id: 'light-candle',
  label: 'light candle',
  cooldownSeconds: 3,
  inGameMinutesPassed: 5,
  repeatable: false,
  visible: (state) =>
    notComplete(state) &&
    state.resources.candle >= 1 &&
    state.resources.matches >= 1 &&
    state.lightSystem.lightLevel === 0 &&
    !flag(state, 'hasLitFirstCandle'),
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 5);
    const text =
      'the match complains against the box.\nthen flame.\nthe candle catches.\nthe nearest whisper pulls away from the light.';
    newState = addLogEntry(newState, text, 'story');

    // Consume the candle stub; matches are reusable — do not remove them
    newState.resources = {
      ...newState.resources,
      candle: newState.resources.candle - 1,
    };
    newState.lightSystem = {
      ...newState.lightSystem,
      lightLevel: 1,
      candleStability: 1,
      candleTurnsRemaining: 6,
    };
    newState.repetition = {
      ...newState.repetition,
      whisperLevel: clamp(newState.repetition.whisperLevel - 1, 0, 999),
    };
    newState = setFlag(newState, 'hasLitFirstCandle', true);

    return { newState, logText: text };
  },
};

// ─── 4b. RELIGHT CANDLE ──────────────────────────────────────────────────────

const relightCandleAction: GameAction = {
  id: 'relight-candle',
  label: 'relight candle',
  cooldownSeconds: 2,
  inGameMinutesPassed: 5,
  repeatable: true,
  // Works in Chapter 1 and Chapter 2; not needed when lantern is already burning
  visible: (state) =>
    inAnyActiveChapter(state) &&
    flag(state, 'hasLitFirstCandle') &&
    state.lightSystem.lightLevel === 0 &&
    state.resources.matches >= 1,
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 5);
    const text = 'you strike another match.\nthe candle wakes reluctantly.';
    newState = addLogEntry(newState, text, 'story');

    // Matches are reusable — do not consume them; the candle stub is already placed
    newState.lightSystem = {
      ...newState.lightSystem,
      lightLevel: 1,
      candleStability: 1,
      candleTurnsRemaining: 4,
    };
    newState.repetition = {
      ...newState.repetition,
      whisperLevel: clamp(newState.repetition.whisperLevel - 1, 0, 999),
    };

    return { newState, logText: text };
  },
};

// ─── 5. STEADY CANDLE ────────────────────────────────────────────────────────

const steadyCandleAction: GameAction = {
  id: 'steady-candle',
  label: 'steady candle',
  cooldownSeconds: 2,
  inGameMinutesPassed: 5,
  repeatable: true,
  visible: (state) =>
    inAnyActiveChapter(state) &&
    state.lightSystem.lightLevel >= 1 &&
    state.lightSystem.lightLevel < 3 && // not needed when lantern is burning
    state.resources.wax >= 1,
  onExecute: (state) => {
    const timesUsed = state.progress['steadyCandleCount'] ?? 0;
    let newState = advanceTime({ ...state }, 5);

    let text: string;
    if (timesUsed === 0) {
      text = 'you press wax around the candle base.\nthe flame stands straighter.';
    } else if (timesUsed === 1) {
      text = 'the candle drinks the wax greedily.\nfor a few breaths, the graves are quiet.';
    } else {
      text = 'you feed the small flame.\nit gives back a smaller courage.';
    }

    newState = addLogEntry(newState, text, 'story');

    const newStability = clamp(newState.lightSystem.candleStability + 1, 0, 2);
    const newTurns = clamp(newState.lightSystem.candleTurnsRemaining + 3, 0, 8);
    const newLevel = newStability >= 2 ? 2 : newState.lightSystem.lightLevel;

    newState.resources = { ...newState.resources, wax: newState.resources.wax - 1 };
    newState.lightSystem = {
      ...newState.lightSystem,
      candleStability: newStability,
      candleTurnsRemaining: newTurns,
      lightLevel: newLevel,
    };
    newState.repetition = {
      ...newState.repetition,
      whisperLevel: clamp(newState.repetition.whisperLevel - 1, 0, 999),
    };
    newState.progress = { ...newState.progress, steadyCandleCount: timesUsed + 1 };

    return { newState, logText: text };
  },
};

// ─── 6. CLEAN MARKER ─────────────────────────────────────────────────────────

const cleanMarkerAction: GameAction = {
  id: 'clean-marker',
  label: 'clean marker',
  cooldownSeconds: 3,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => notComplete(state) && flag(state, 'hasInspectedFirstGrave'),
  isDisabled: (state) =>
    state.lightSystem.lightLevel < 1 || state.repetition.firstGraveMarkerProgress >= 4,
  getDisabledReason: (state) => {
    if (state.lightSystem.lightLevel < 1) return 'too dark to read the stone.';
    return 'the name is as clear as it will be.';
  },
  onExecute: (state) => {
    const progress = state.repetition.firstGraveMarkerProgress;
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    switch (progress) {
      case 0:
        text = 'you scrape mud from the split marker.\nE L I';
        break;
      case 1:
        text = 'beneath the moss, another mark appears.\nA.';
        break;
      case 2:
        text = 'the stone cuts your thumb.\nthe blood runs into an old letter.\nS.';
        break;
      case 3:
        text = 'the name is almost whole.\nELIAS.';
        break;
      default:
        return { newState: state, logText: '' };
    }

    newState = addLogEntry(newState, text, 'story');
    const newProgress = progress + 1;
    newState.repetition = {
      ...newState.repetition,
      firstGraveMarkerProgress: newProgress,
    };

    if (newProgress >= 4) {
      newState = setFlag(newState, 'hasDiscoveredPartialName', true);
    }

    return { newState, logText: text };
  },
};

// ─── 7. SPEAK PARTIAL NAME ───────────────────────────────────────────────────

const speakPartialNameAction: GameAction = {
  id: 'speak-partial-name',
  label: 'speak partial name',
  cooldownSeconds: 3,
  inGameMinutesPassed: 10,
  repeatable: false,
  visible: (state) => notComplete(state) && flag(state, 'hasDiscoveredPartialName'),
  isDisabled: (state) => flag(state, 'hasSpokenPartialName'),
  getDisabledReason: () => 'you have already spoken it.',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);
    const text =
      '"elias," you say.\nthe cracked grave exhales soil.\n"not enough," it whispers.\n"but more than i had."\n"find the keeper\'s shed."\n"do not give the first dead yours."';
    newState = addLogEntry(newState, text, 'whisper');

    newState.repetition = {
      ...newState.repetition,
      whisperLevel: clamp(newState.repetition.whisperLevel - 1, 0, 999),
    };
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage + 1, 0, newState.player.maxCourage),
    };
    newState = setFlag(newState, 'hasSpokenPartialName', true);

    return { newState, logText: text };
  },
};

// ─── 8. LOOK AROUND ──────────────────────────────────────────────────────────

const lookAroundAction: GameAction = {
  id: 'look-around',
  label: 'look around',
  cooldownSeconds: 3,
  inGameMinutesPassed: 10,
  repeatable: false,
  visible: (state) =>
    notComplete(state) &&
    (flag(state, 'hasLitFirstCandle') || flag(state, 'hasDiscoveredPartialName')),
  isDisabled: (state) => flag(state, 'hasLookedAround'),
  getDisabledReason: () => 'you know what surrounds you.',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);
    const text =
      'rows of stones lean in the dark.\na path runs north.\na small shed waits beside a dead tree.\nbehind you, iron gates stand shut.';
    newState = addLogEntry(newState, text, 'story');
    newState = setFlag(newState, 'hasLookedAround', true);
    return { newState, logText: text };
  },
};

// ─── 9. STAY QUIET ───────────────────────────────────────────────────────────

const stayQuietAction: GameAction = {
  id: 'stay-quiet',
  label: 'stay quiet',
  cooldownSeconds: 2,
  inGameMinutesPassed: 5,
  repeatable: true,
  visible: (state) => notComplete(state) && state.repetition.firstGraveListenCount >= 3,
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 5);
    const text = 'you hold your breath.\nafter a while, only one grave is whispering again.';
    newState = addLogEntry(newState, text, 'action');
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage + 1, 0, newState.player.maxCourage),
    };
    newState.repetition = {
      ...newState.repetition,
      whisperLevel: clamp(newState.repetition.whisperLevel - 1, 0, 999),
      deadAttention: clamp(newState.repetition.deadAttention - 1, 0, 999),
    };
    return { newState, logText: text };
  },
};

// ─── 10. GO TO GATE ──────────────────────────────────────────────────────────

const goToGateAction: GameAction = {
  id: 'go-to-gate',
  label: 'go to gate',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  visible: (state) => notComplete(state) && flag(state, 'hasLookedAround'),
  isDisabled: (state) => flag(state, 'hasVisitedGate') || state.lightSystem.lightLevel < 1,
  getDisabledReason: (state) => {
    if (state.lightSystem.lightLevel < 1) return 'too dark to find the path.';
    return 'already seen.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    newState.currentLocation = 'Cemetery Gate';
    const text =
      'the gate is locked with a chain thick as bone.\nbeyond it, there is no road.\nonly dark.\nsomething has scratched words into the iron:\nDO NOT ANSWER ALL OF THEM.';
    newState = addLogEntry(newState, text, 'story');
    newState = setFlag(newState, 'hasVisitedGate', true);
    return { newState, logText: text };
  },
};

// ─── 11. RETURN TO FIRST GRAVE ───────────────────────────────────────────────

const returnToFirstGraveAction: GameAction = {
  id: 'return-to-first-grave',
  label: 'return to first grave',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: false,
  visible: (state) =>
    notComplete(state) &&
    flag(state, 'hasVisitedGate') &&
    state.currentLocation === 'Cemetery Gate',
  isDisabled: (state) => flag(state, 'hasReturnedFromGate'),
  getDisabledReason: () => 'already returned.',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);
    newState.currentLocation = 'First Grave';
    const text =
      'the cracked grave waits where you left it.\n"you read the gate," it says.\n"good."\n"then you know some of us are not asking."';
    newState = addLogEntry(newState, text, 'whisper');
    newState = setFlag(newState, 'hasReturnedFromGate', true);
    return { newState, logText: text };
  },
};

// ─── 12. GO TO SHED DOOR ─────────────────────────────────────────────────────

function shedDoorThresholdsMet(state: GameState): boolean {
  return (
    state.repetition.firstGraveListenCount >= 5 &&
    state.repetition.searchGroundCount >= 3 &&
    flag(state, 'hasLitFirstCandle') &&
    state.repetition.firstGraveMarkerProgress >= 4 &&
    flag(state, 'hasDiscoveredPartialName') &&
    flag(state, 'hasSpokenPartialName') &&
    flag(state, 'hasVisitedGate') &&
    flag(state, 'hasReturnedFromGate') &&
    state.player.courage >= 1
  );
}

function shedDoorDisabledReason(state: GameState): string {
  if (state.repetition.firstGraveListenCount < 5) return 'the grave has not said enough yet.';
  if (state.repetition.searchGroundCount < 3) return 'you have not searched enough.';
  if (!flag(state, 'hasLitFirstCandle')) return 'you have not found enough light.';
  if (state.repetition.firstGraveMarkerProgress < 4) return 'the marker still hides its name.';
  if (!flag(state, 'hasDiscoveredPartialName')) return 'the name is not yet known.';
  if (!flag(state, 'hasSpokenPartialName')) return 'the grave has not been answered.';
  if (!flag(state, 'hasVisitedGate')) return 'the gate has not been checked.';
  if (!flag(state, 'hasReturnedFromGate')) return 'you have not returned from the gate.';
  if (state.player.courage < 1) return 'your hands will not stop shaking.';
  return 'not yet.';
}

const goToShedDoorAction: GameAction = {
  id: 'go-to-shed-door',
  label: 'go to shed door',
  cooldownSeconds: 6,
  inGameMinutesPassed: 20,
  repeatable: false,
  visible: (state) => notComplete(state) && flag(state, 'hasLookedAround'),
  isDisabled: (state) => !shedDoorThresholdsMet(state),
  getDisabledReason: shedDoorDisabledReason,
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 20);
    newState.currentLocation = "Keeper's Shed Door";

    const text =
      'the path to the shed is shorter than it looked.\nits door hangs crooked.\nthe lock is old.\na sound waits on the other side.\nnot movement.\nbreathing.';
    newState = addLogEntry(newState, text, 'story');
    newState = addLogEntry(
      newState,
      "Chapter 1 complete.\nThe First Grave has almost remembered.\nThe keeper's shed waits.",
      'action'
    );

    newState = setFlag(newState, 'hasReachedShedDoor', true);
    newState = setFlag(newState, 'chapter1Complete', true);
    newState.chapter = 'Chapter 1 — Complete';

    return { newState, logText: text };
  },
};

// ─── 13. ENTER SHED ──────────────────────────────────────────────────────────
// Real Chapter 2 entry — enabled when Chapter 1 is complete

const enterShedAction: GameAction = {
  id: 'enter-shed',
  label: 'enter shed',
  cooldownSeconds: 4,
  inGameMinutesPassed: 15,
  repeatable: false,
  visible: (state) =>
    flag(state, 'hasReachedShedDoor') && !flag(state, 'chapter2Active') && !flag(state, 'chapter2Complete'),
  isDisabled: (state) => !flag(state, 'chapter1Complete') || flag(state, 'chapter2Active'),
  getDisabledReason: (state) => {
    if (!flag(state, 'chapter1Complete')) return 'Chapter 2 will begin here.';
    return 'already inside.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    newState.currentLocation = "Keeper's Shed";
    newState.chapter = 'Chapter 2';
    newState = setFlag(newState, 'chapter2Active', true);
    const text =
      'the shed door gives after the third push.\ninside, the air smells of wet paper, old tools, and something buried too long.';
    newState = addLogEntry(newState, text, 'story');
    return { newState, logText: text };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CHAPTER 2 — THE KEEPER'S SHED
// ─────────────────────────────────────────────────────────────────────────────

function ch2Prog(state: GameState, key: string): number {
  return state.progress[key] ?? 0;
}

// ─── CH2-1. HOLD CANDLE UP ───────────────────────────────────────────────────

const holdCandleUpAction: GameAction = {
  id: 'hold-candle-up',
  label: 'hold candle up',
  cooldownSeconds: 3,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: inChapter2,
  isDisabled: (state) => state.lightSystem.lightLevel < 1,
  getDisabledReason: () => 'no light to raise.',
  onExecute: (state) => {
    const count = ch2Prog(state, 'holdShedLightCount');
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    if (count === 0) {
      text =
        'you raise the candle.\nshapes lean out of the dark: shelves, hooks, a chair with one broken leg.';
    } else if (count === 1) {
      text = 'the flame finds a workbench.\ntools lie arranged with too much care.';
    } else if (count === 2) {
      text = 'at the back of the shed, a desk waits beneath a sheet of dust.';
    } else {
      text = 'the shed reveals no new shadows.\nyou know its corners now.';
    }

    newState = addLogEntry(newState, text, 'story');
    newState.progress = { ...newState.progress, holdShedLightCount: count + 1 };
    return { newState, logText: text };
  },
};

// ─── CH2-2. SEARCH SHELVES ───────────────────────────────────────────────────

const searchShelvesAction: GameAction = {
  id: 'search-shelves',
  label: 'search shelves',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => inChapter2(state) && ch2Prog(state, 'holdShedLightCount') >= 1,
  isDisabled: (state) => state.lightSystem.lightLevel < 1 || ch2Prog(state, 'searchShedShelvesCount') >= 4,
  getDisabledReason: (state) => {
    if (state.lightSystem.lightLevel < 1) return 'too dark to search the shelves.';
    return 'the shelves have given everything they had.';
  },
  onExecute: (state) => {
    const count = ch2Prog(state, 'searchShedShelvesCount');
    let newState = advanceTime({ ...state }, 10);
    let entryType: 'resource' | 'action' | 'story' = 'resource';

    let text: string;
    if (count === 0) {
      text =
        'your hand closes around a small tin.\ninside, oil. enough for a lantern, if you had one.';
      newState.resources = { ...newState.resources, oil: newState.resources.oil + 1 };
    } else if (count === 1) {
      text = 'behind a rusted hook, a cloth rag hangs on a nail.\nstiff with old dust, but whole.';
      newState.resources = { ...newState.resources, rag: newState.resources.rag + 1 };
    } else if (count === 2) {
      text =
        'coiled on the lowest shelf: a length of twine.\ndrawn into a deliberate knot and then untied again.';
      newState.resources = { ...newState.resources, twine: newState.resources.twine + 1 };
    } else if (count === 3) {
      text =
        'wedged into the back corner: a cracked lantern.\nthe glass is smoked, the hinge bent, but the chamber holds.';
      newState.resources = {
        ...newState.resources,
        crackedLantern: newState.resources.crackedLantern + 1,
      };
      newState = setFlag(newState, 'hasCrackedLantern', true);
    } else {
      text = 'the shelves hold nothing else.\ndust and old absence.';
      entryType = 'action';
    }

    newState = addLogEntry(newState, text, entryType);
    newState.progress = { ...newState.progress, searchShedShelvesCount: count + 1 };
    return { newState, logText: text };
  },
};

// ─── CH2-3. INSPECT WORKBENCH ────────────────────────────────────────────────

const inspectWorkbenchAction: GameAction = {
  id: 'inspect-workbench',
  label: 'inspect workbench',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => inChapter2(state) && ch2Prog(state, 'holdShedLightCount') >= 2,
  isDisabled: (state) => state.lightSystem.lightLevel < 1 || ch2Prog(state, 'inspectWorkbenchCount') >= 3,
  getDisabledReason: (state) => {
    if (state.lightSystem.lightLevel < 1) return 'too dark to inspect the workbench.';
    return 'nothing left to find on the workbench.';
  },
  onExecute: (state) => {
    const count = ch2Prog(state, 'inspectWorkbenchCount');
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    let entryType: 'resource' | 'story' = 'story';
    if (count === 0) {
      text = 'the tools are rusted but placed with purpose.\nsomeone was careful here, once.';
    } else if (count === 1) {
      text =
        'beneath the other tools, a hand spade.\nthe handle is worn smooth from use.\nyou take it.';
      newState.resources = {
        ...newState.resources,
        handSpade: newState.resources.handSpade + 1,
      };
      newState = setFlag(newState, 'hasHandSpade', true);
      entryType = 'resource';
    } else if (count === 2) {
      text = 'scattered in a tin: iron nails.\nthick, old, bent at the tips.\nyou take a handful.';
      newState.resources = {
        ...newState.resources,
        ironNails: newState.resources.ironNails + 2,
      };
      entryType = 'resource';
    } else {
      text = 'the workbench holds nothing more.';
    }

    newState = addLogEntry(newState, text, entryType);
    newState.progress = { ...newState.progress, inspectWorkbenchCount: count + 1 };
    return { newState, logText: text };
  },
};

// ─── CH2-4. CLEAN LANTERN ────────────────────────────────────────────────────

const cleanLanternAction: GameAction = {
  id: 'clean-lantern',
  label: 'clean lantern',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) =>
    inChapter2(state) && state.resources.rag >= 1 && state.resources.crackedLantern >= 1,
  isDisabled: (state) => ch2Prog(state, 'cleanLanternProgress') >= 3,
  getDisabledReason: () => 'the lantern is as clean as it will get.',
  onExecute: (state) => {
    const progress = ch2Prog(state, 'cleanLanternProgress');
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    if (progress === 0) {
      text = 'you press the rag against the glass.\nsmoke stains come away in black curls.';
    } else if (progress === 1) {
      text = 'the hinge gives slightly under your thumb.\nyou work grease from the old metal.';
    } else {
      text =
        'the chamber clears.\nyou hold it up. the crack runs thin but the seal holds.\nit is ready for oil.';
      newState = setFlag(newState, 'lanternCleaned', true);
    }

    newState = addLogEntry(newState, text, 'action');
    newState.progress = { ...newState.progress, cleanLanternProgress: progress + 1 };
    return { newState, logText: text };
  },
};

// ─── CH2-5. FILL LANTERN ─────────────────────────────────────────────────────

const fillLanternAction: GameAction = {
  id: 'fill-lantern',
  label: 'fill lantern',
  cooldownSeconds: 3,
  inGameMinutesPassed: 10,
  repeatable: false,
  visible: (state) =>
    inChapter2(state) &&
    state.resources.crackedLantern >= 1 &&
    state.resources.oil >= 1 &&
    ch2Prog(state, 'cleanLanternProgress') >= 3,
  isDisabled: (state) => flag(state, 'lanternReady'),
  getDisabledReason: () => 'the lantern is already filled.',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);
    const text = 'you pour the oil slowly.\nthe lantern drinks without a sound.';
    newState = addLogEntry(newState, text, 'story');
    newState.resources = { ...newState.resources, oil: newState.resources.oil - 1 };
    newState = setFlag(newState, 'lanternReady', true);
    return { newState, logText: text };
  },
};

// ─── CH2-6. LIGHT LANTERN ────────────────────────────────────────────────────

const lightLanternAction: GameAction = {
  id: 'light-lantern',
  label: 'light lantern',
  cooldownSeconds: 3,
  inGameMinutesPassed: 5,
  repeatable: false,
  visible: (state) =>
    inChapter2(state) && flag(state, 'lanternReady') && state.resources.matches >= 1,
  isDisabled: (state) => flag(state, 'lanternLit'),
  getDisabledReason: () => 'the lantern is already burning.',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 5);
    const text =
      'the match flares.\nbehind the glass, the lantern catches.\nthe shed becomes smaller.\nthe dark does not.';
    newState = addLogEntry(newState, text, 'story');
    // Matches are reusable — do not consume them
    newState.lightSystem = {
      ...newState.lightSystem,
      lightLevel: 3,
      candleStability: 2,
      candleTurnsRemaining: 50, // lantern is stable — not a soft-lock vector
    };
    newState = setFlag(newState, 'lanternLit', true);
    return { newState, logText: text };
  },
};

// ─── CH2-7. INSPECT DESK ─────────────────────────────────────────────────────

const inspectDeskAction: GameAction = {
  id: 'inspect-desk',
  label: 'inspect desk',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => inChapter2(state) && ch2Prog(state, 'holdShedLightCount') >= 3,
  isDisabled: (state) => state.lightSystem.lightLevel < 1 || ch2Prog(state, 'inspectDeskCount') >= 2,
  getDisabledReason: (state) => {
    if (state.lightSystem.lightLevel < 1) return 'too dark to inspect the desk.';
    return 'you have seen all the desk shows from the outside.';
  },
  onExecute: (state) => {
    const count = ch2Prog(state, 'inspectDeskCount');
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    if (count === 0) {
      text =
        'on the desk: a thick ledger, bound in cracked cloth.\nthe cover is unmarked.\nit has been opened many times.';
      newState = setFlag(newState, 'hasFoundLedger', true);
    } else {
      text =
        'beneath the ledger: a drawer.\nthe handle is missing.\nthe wood around the gap is scratched deep.';
      newState = setFlag(newState, 'hasFoundLockedDrawer', true);
    }

    newState = addLogEntry(newState, text, 'story');
    newState.progress = { ...newState.progress, inspectDeskCount: count + 1 };
    return { newState, logText: text };
  },
};

// ─── CH2-8. READ LEDGER ──────────────────────────────────────────────────────

const readLedgerAction: GameAction = {
  id: 'read-ledger',
  label: 'read ledger',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => inChapter2(state) && flag(state, 'hasFoundLedger'),
  isDisabled: (state) => state.lightSystem.lightLevel < 1 || ch2Prog(state, 'ledgerReadCount') >= 5,
  getDisabledReason: (state) => {
    if (state.lightSystem.lightLevel < 1) return 'too dark to read the ledger.';
    return 'you have read everything the ledger will show.';
  },
  onExecute: (state) => {
    const count = ch2Prog(state, 'ledgerReadCount');
    let newState = advanceTime({ ...state }, 10);
    let entryType: 'story' | 'whisper' = 'story';

    let text: string;
    if (count === 0) {
      text =
        'the keeper recorded graves by name.\nnot by number. not by date.\nonly names, written in a careful hand.';
    } else if (count === 1) {
      text =
        'several names have been scratched out.\nnot crossed — scratched.\nthe stone beneath is worn through.';
    } else if (count === 2) {
      text =
        'ELIAS appears more than once.\nonce in the main rows.\nonce in a column headed "returned."';
      newState = setFlag(newState, 'hasReadEliasLedger', true);
      entryType = 'whisper';
    } else if (count === 3) {
      text =
        'a note in the keeper\'s hand, glued to the back page:\n"if the name answers, do not answer back."';
      entryType = 'whisper';
    } else if (count === 4) {
      text =
        'the last entry. a page near the rear:\n"fresh soil beyond the east row.\nnot dug by me."';
      newState = setFlag(newState, 'hasFoundFreshSoilNote', true);
      entryType = 'whisper';
    } else {
      text = 'the ledger gives nothing more.';
    }

    newState = addLogEntry(newState, text, entryType);
    newState.progress = { ...newState.progress, ledgerReadCount: count + 1 };
    return { newState, logText: text };
  },
};

// ─── CH2-9. FORCE DRAWER ─────────────────────────────────────────────────────

const forceDrawerAction: GameAction = {
  id: 'force-drawer',
  label: 'force drawer',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: true,
  visible: (state) => inChapter2(state) && flag(state, 'hasFoundLockedDrawer'),
  isDisabled: (state) => state.resources.handSpade < 1 || flag(state, 'drawerOpened'),
  getDisabledReason: (state) => {
    if (state.resources.handSpade < 1) return 'you need the hand spade to force it.';
    return 'the drawer is open.';
  },
  onExecute: (state) => {
    const count = ch2Prog(state, 'forceDrawerCount');
    let newState = advanceTime({ ...state }, 15);

    let text: string;
    if (count === 0) {
      text =
        'you lever the spade into the gap.\nthe wood groans. the drawer shifts slightly, then holds.';
    } else {
      text =
        'the drawer gives with a sound like something exhaling.\ninside: a folded map. a folded note.';
      newState.resources = {
        ...newState.resources,
        cemeteryMap: newState.resources.cemeteryMap + 1,
        keeperNote: newState.resources.keeperNote + 1,
      };
      newState = setFlag(newState, 'drawerOpened', true);
      newState = setFlag(newState, 'hasCemeteryMap', true);
    }

    newState = addLogEntry(newState, text, 'action');
    newState.progress = { ...newState.progress, forceDrawerCount: count + 1 };
    return { newState, logText: text };
  },
};

// ─── CH2-10. STUDY MAP ───────────────────────────────────────────────────────

const studyMapAction: GameAction = {
  id: 'study-map',
  label: 'study map',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => inChapter2(state) && state.resources.cemeteryMap >= 1,
  isDisabled: (state) => state.lightSystem.lightLevel < 1 || ch2Prog(state, 'mapStudyCount') >= 3,
  getDisabledReason: (state) => {
    if (state.lightSystem.lightLevel < 1) return 'too dark to read the map.';
    return 'you know every path the map shows.';
  },
  onExecute: (state) => {
    const count = ch2Prog(state, 'mapStudyCount');
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    if (count === 0) {
      text =
        'the map shows the older rows.\nnames written in a small hand.\nthe ink is faded but legible.';
    } else if (count === 1) {
      text =
        'you trace the east row.\nthe stones there are older than the others.\nthe keeper drew a line that stops before the end.';
    } else if (count === 2) {
      text =
        'beyond the drawn line, a mark.\nnot a grave symbol — a circle, drawn twice over.\nfresh soil. it has been there long enough to be on the map, but not long enough to be forgotten.';
      newState = setFlag(newState, 'hasMarkedFreshSoilPath', true);
    } else {
      text = 'the map shows no more than it already has.';
    }

    newState = addLogEntry(newState, text, 'story');
    newState.progress = { ...newState.progress, mapStudyCount: count + 1 };
    return { newState, logText: text };
  },
};

// ─── CH2-11. READ KEEPER NOTE ────────────────────────────────────────────────

const readKeeperNoteAction: GameAction = {
  id: 'read-keeper-note',
  label: 'read keeper note',
  cooldownSeconds: 3,
  inGameMinutesPassed: 10,
  repeatable: false,
  visible: (state) => inChapter2(state) && flag(state, 'drawerOpened'),
  isDisabled: (state) => state.lightSystem.lightLevel < 1 || flag(state, 'hasReadKeeperNote'),
  getDisabledReason: (state) => {
    if (state.lightSystem.lightLevel < 1) return 'too dark to read the note.';
    return 'already read.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);
    const text = '"names are not lost here.\nthey wait under the tongue."';
    newState = addLogEntry(newState, text, 'whisper');
    newState = setFlag(newState, 'hasReadKeeperNote', true);
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage - 1, 0, newState.player.maxCourage),
    };
    newState.repetition = {
      ...newState.repetition,
      whisperLevel: newState.repetition.whisperLevel + 1,
    };
    return { newState, logText: text };
  },
};

// ─── CH2-12. STAND STILL AND LISTEN ─────────────────────────────────────────

const standStillListenAction: GameAction = {
  id: 'stand-still-listen',
  label: 'stand still and listen',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: true,
  visible: (state) => inChapter2(state) && flag(state, 'hasReadKeeperNote'),
  isDisabled: (state) => ch2Prog(state, 'shedListenCount') >= 3,
  getDisabledReason: () => 'you have heard enough to know where to go.',
  onExecute: (state) => {
    const count = ch2Prog(state, 'shedListenCount');
    let newState = advanceTime({ ...state }, 15);

    let text: string;
    if (count === 0) {
      text =
        'you hold your breath.\nsomething knocks beneath the floorboards.\nnot random. deliberate.';
    } else if (count === 1) {
      text = 'the knock comes again.\nthis time from outside the shed.\nfurther. east.';
    } else {
      text = 'from somewhere beyond the east row, the dark forms a single word.\nELIAS.';
      newState = setFlag(newState, 'hasHeardEastRowWhisper', true);
    }

    newState = addLogEntry(newState, text, 'whisper');
    // Each listen increases pressure
    newState.repetition = {
      ...newState.repetition,
      deadAttention: newState.repetition.deadAttention + 1,
      whisperLevel: newState.repetition.whisperLevel + 1,
    };
    newState.progress = { ...newState.progress, shedListenCount: count + 1 };
    return { newState, logText: text };
  },
};

// ─── CH2-13. PREPARE TO LEAVE ────────────────────────────────────────────────

function chapter2ThresholdsMet(state: GameState): boolean {
  return (
    flag(state, 'lanternLit') &&
    state.resources.handSpade >= 1 &&
    ch2Prog(state, 'ledgerReadCount') >= 5 &&
    flag(state, 'drawerOpened') &&
    state.resources.cemeteryMap >= 1 &&
    ch2Prog(state, 'mapStudyCount') >= 3 &&
    flag(state, 'hasMarkedFreshSoilPath') &&
    flag(state, 'hasHeardEastRowWhisper') &&
    state.player.courage >= 1
  );
}

function chapter2DisabledReason(state: GameState): string {
  if (!flag(state, 'lanternLit')) return 'the lantern must be burning before you leave.';
  if (state.resources.handSpade < 1) return 'you will need the hand spade.';
  if (ch2Prog(state, 'ledgerReadCount') < 5) return 'the ledger has not been fully read.';
  if (!flag(state, 'drawerOpened')) return 'the drawer has not been opened.';
  if (state.resources.cemeteryMap < 1) return 'you do not have the cemetery map.';
  if (ch2Prog(state, 'mapStudyCount') < 3) return 'you have not finished studying the map.';
  if (!flag(state, 'hasMarkedFreshSoilPath')) return 'the path to the fresh soil is not marked.';
  if (!flag(state, 'hasHeardEastRowWhisper')) return 'you have not listened long enough.';
  if (state.player.courage < 1) return 'your hands will not stop shaking.';
  return 'not ready.';
}

const prepareToLeaveAction: GameAction = {
  id: 'prepare-to-leave',
  label: 'prepare to leave',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  visible: inChapter2,
  isDisabled: (state) => !chapter2ThresholdsMet(state),
  getDisabledReason: chapter2DisabledReason,
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    newState.currentLocation = 'Fresh Soil Path';
    newState.chapter = 'Chapter 2 — Complete';
    newState = setFlag(newState, 'chapter2Complete', true);

    const closing =
      'you take the spade.\nthe map folds along old creases, as if it remembers your hands.\noutside, beyond the east row, the soil is darker than the night around it.';
    newState = addLogEntry(newState, closing, 'story');
    return { newState, logText: closing };
  },
};

// ─── CH2-14. FOLLOW FRESH SOIL (Real Chapter 3 entry) ───────────────────────

const followFreshSoilAction: GameAction = {
  id: 'follow-fresh-soil',
  label: 'follow the fresh soil',
  cooldownSeconds: 5,
  inGameMinutesPassed: 20,
  repeatable: false,
  visible: (state) => flag(state, 'chapter2Complete') && !flag(state, 'chapter3Active'),
  isDisabled: () => false,
  getDisabledReason: () => '',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 20);
    newState.currentLocation = 'East Row — Fresh Soil';
    newState.chapter = 'Chapter 3';
    newState = setFlag(newState, 'chapter3Active', true);
    const text =
      'the path narrows between the older stones.\nthe soil here is darker than the rest.\nturned recently, and left without a marker.\nthe ledger said the name was here.\nyou believe it now.';
    newState = addLogEntry(newState, text, 'story');
    return { newState, logText: text };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CHAPTER 3 — FRESH SOIL
// ─────────────────────────────────────────────────────────────────────────────

function inChapter3(state: GameState): boolean {
  return flag(state, 'chapter3Active') && !flag(state, 'firstArcComplete');
}

function ch3Prog(state: GameState, key: string): number {
  return state.progress[key] ?? 0;
}

function inChapter4(state: GameState): boolean {
  return flag(state, 'chapter4Active') && !flag(state, 'chapter4Complete');
}

function inChapter5(state: GameState): boolean {
  return flag(state, 'chapter5Active') && !flag(state, 'chapter5Complete');
}

// ─── CH3-1. INSPECT FRESH SOIL ───────────────────────────────────────────────

const inspectFreshSoilAction: GameAction = {
  id: 'inspect-fresh-soil',
  label: 'inspect fresh soil',
  cooldownSeconds: 3,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: inChapter3,
  isDisabled: (state) => ch3Prog(state, 'inspectFreshSoilCount') >= 3,
  getDisabledReason: () => 'you have learned what the soil will show.',
  onExecute: (state) => {
    const count = ch3Prog(state, 'inspectFreshSoilCount');
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    if (count === 0) {
      text =
        'the earth is loose.\nnot old. not settled.\nsomeone dug here within the month and filled it back without care.\nno marker. no stone.';
    } else if (count === 1) {
      text =
        'you press your hand into the turned soil.\nit gives too easily.\nthere is something rigid beneath.\nnot deep.';
    } else {
      text =
        'the ledger said fresh soil.\nit did not say buried stone.\nbut that is what is here.\nsomething split, and buried in two pieces.';
      newState = setFlag(newState, 'knowsSomethingBuried', true);
    }

    newState = addLogEntry(newState, text, 'story');
    newState.progress = { ...newState.progress, inspectFreshSoilCount: count + 1 };
    return { newState, logText: text };
  },
};

// ─── CH3-2. SEARCH NEARBY ────────────────────────────────────────────────────

const searchNearbyAction: GameAction = {
  id: 'search-nearby',
  label: 'search nearby',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: inChapter3,
  isDisabled: (state) => ch3Prog(state, 'searchNearbyCount') >= 2,
  getDisabledReason: () => 'nothing more to find nearby.',
  onExecute: (state) => {
    const count = ch3Prog(state, 'searchNearbyCount');
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    let entryType: 'resource' | 'story' = 'story';
    if (count === 0) {
      text =
        'snagged on the root of an old stone:\na strip of cloth.\nstiff with mud and age, but whole.\nyou take it.';
      if (!flag(newState, 'foundClothStrip')) {
        newState.resources = {
          ...newState.resources,
          clothStrip: newState.resources.clothStrip + 1,
        };
        newState = setFlag(newState, 'foundClothStrip', true);
      }
      entryType = 'resource';
    } else {
      text =
        'pressed into the soil near the edge of the disturbed earth:\na page, folded many times.\nthe paper is damp, the ink still legible.\na ledger page, torn from near the back.';
      if (!flag(newState, 'foundBuriedLedgerPage')) {
        newState.resources = {
          ...newState.resources,
          buriedLedgerPage: newState.resources.buriedLedgerPage + 1,
        };
        newState = setFlag(newState, 'foundBuriedLedgerPage', true);
      }
      entryType = 'resource';
    }

    newState = addLogEntry(newState, text, entryType);
    newState.progress = { ...newState.progress, searchNearbyCount: count + 1 };
    return { newState, logText: text };
  },
};

// ─── CH3-3. DIG ──────────────────────────────────────────────────────────────

const digAction: GameAction = {
  id: 'dig',
  label: 'dig',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: true,
  visible: (state) => inChapter3(state) && state.resources.handSpade >= 1,
  isDisabled: (state) => {
    if (ch3Prog(state, 'inspectFreshSoilCount') < 1) return true; // must inspect first
    if (state.lightSystem.lightLevel < 1) return true; // need light to see what you're uncovering
    if (ch3Prog(state, 'digProgress') >= 4) return true; // both fragments uncovered
    return false;
  },
  getDisabledReason: (state) => {
    if (ch3Prog(state, 'inspectFreshSoilCount') < 1) return 'inspect the soil first.';
    if (state.lightSystem.lightLevel < 1) return 'too dark to dig safely.';
    return 'both fragments are uncovered.';
  },
  onExecute: (state) => {
    const progress = ch3Prog(state, 'digProgress');
    let newState = advanceTime({ ...state }, 15);

    let text: string;
    let entryType: 'resource' | 'action' = 'action';
    if (progress === 0) {
      text = 'you press the spade into the loose earth.\nit gives without sound.';
    } else if (progress === 1) {
      text =
        'deeper.\nthe soil changes color.\ndarker below, as if the ground here is older than it should be.';
    } else if (progress === 2) {
      text =
        'the spade strikes something solid.\nnot wood. stone.\nflat, pale, cracked down the center.\na grave marker, split in two, and buried face-down.';
      newState = setFlag(newState, 'foundFirstFragment', true);
      if (!flag(newState, 'firstFragmentPickedUp')) {
        newState.resources = {
          ...newState.resources,
          markerFragment: newState.resources.markerFragment + 1,
        };
        newState = setFlag(newState, 'firstFragmentPickedUp', true);
      }
      entryType = 'resource';
    } else {
      text =
        "you dig further along the split.\nthe second piece is here, a hand's width from the first.\nyou lift it free.\nit is heavier than it looks.";
      newState = setFlag(newState, 'foundSecondFragment', true);
      if (!flag(newState, 'secondFragmentPickedUp')) {
        newState.resources = {
          ...newState.resources,
          secondNameFragment: newState.resources.secondNameFragment + 1,
        };
        newState = setFlag(newState, 'secondFragmentPickedUp', true);
      }
      entryType = 'resource';
    }

    newState = addLogEntry(newState, text, entryType);
    newState.progress = { ...newState.progress, digProgress: progress + 1 };
    newState.repetition = {
      ...newState.repetition,
      deadAttention: newState.repetition.deadAttention + 1,
    };
    return { newState, logText: text };
  },
};

// ─── CH3-4. HOLD LIGHT OVER MARKER ──────────────────────────────────────────

const holdLightOverMarkerAction: GameAction = {
  id: 'hold-light-over-marker',
  label: 'hold light over marker',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => inChapter3(state) && flag(state, 'foundFirstFragment'),
  isDisabled: (state) =>
    state.lightSystem.lightLevel < 2 ||
    (ch3Prog(state, 'readMarkerProgress') >= 1 && !flag(state, 'foundSecondFragment')) ||
    ch3Prog(state, 'readMarkerProgress') >= 3,
  getDisabledReason: (state) => {
    if (state.lightSystem.lightLevel < 2) return 'the light is too weak to read the stone.';
    if (ch3Prog(state, 'readMarkerProgress') >= 1 && !flag(state, 'foundSecondFragment'))
      return 'the second fragment is still buried.';
    return 'you have read all the marker shows.';
  },
  onExecute: (state) => {
    const progress = ch3Prog(state, 'readMarkerProgress');
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    if (progress === 0) {
      text =
        'you raise the lantern over the first fragment.\nthree letters, worn but present:\nELI';
    } else if (progress === 1) {
      text =
        'you angle the flame over the second fragment.\nthe stone is muddier.\nyou can make out two letters:\nAS';
      newState = setFlag(newState, 'knowsSecondFragment', true);
    } else {
      text =
        'you hold both fragments side by side in the light.\nthe break runs exactly between the two.\ntogether they read:\nELIAS.\nthe name from the first grave.\nthe name from the ledger.\nit was never lost.\nit was split.';
      newState = setFlag(newState, 'knowsFullName', true);
    }

    newState = addLogEntry(newState, text, 'whisper');
    newState.progress = { ...newState.progress, readMarkerProgress: progress + 1 };
    return { newState, logText: text };
  },
};

// ─── CH3-5. CLEAN MARKER FRAGMENT ────────────────────────────────────────────

const cleanMarkerFragmentAction: GameAction = {
  id: 'clean-marker-fragment',
  label: 'clean marker fragment',
  cooldownSeconds: 3,
  inGameMinutesPassed: 10,
  repeatable: false,
  visible: (state) =>
    inChapter3(state) && flag(state, 'foundSecondFragment') && state.resources.clothStrip >= 1,
  isDisabled: (state) => state.lightSystem.lightLevel < 1 || flag(state, 'secondFragmentCleaned'),
  getDisabledReason: (state) => {
    if (state.lightSystem.lightLevel < 1) return 'too dark to read the stone.';
    return 'already cleaned.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);
    const text =
      'you press the cloth strip against the second fragment.\nmud and old soil come away.\nthe letters are clear now:\nAS.\nno doubt.';
    newState = addLogEntry(newState, text, 'action');
    newState = setFlag(newState, 'secondFragmentCleaned', true);
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage + 1, 0, newState.player.maxCourage),
    };
    return { newState, logText: text };
  },
};

// ─── CH3-6. READ BURIED LEDGER PAGE ─────────────────────────────────────────

const readBuriedLedgerPageAction: GameAction = {
  id: 'read-buried-ledger-page',
  label: 'read buried ledger page',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => inChapter3(state) && flag(state, 'foundBuriedLedgerPage'),
  isDisabled: (state) =>
    state.lightSystem.lightLevel < 1 || ch3Prog(state, 'buriedLedgerReadCount') >= 2,
  getDisabledReason: (state) => {
    if (state.lightSystem.lightLevel < 1) return 'too dark to read the page.';
    return 'you have read all the page shows.';
  },
  onExecute: (state) => {
    const count = ch3Prog(state, 'buriedLedgerReadCount');
    let newState = advanceTime({ ...state }, 10);
    let entryType: 'story' | 'whisper' = 'story';

    let text: string;
    if (count === 0) {
      text =
        'the ledger page is torn from near the back.\nthe keeper\'s handwriting.\none entry:\n"ELIAS — removed from primary rows.\nmarker split per custom.\nburied east, two pieces."';
      newState = setFlag(newState, 'understoodSplitCustom', true);
    } else {
      text =
        'at the bottom of the page, a second note:\n"do not speak the halves separately.\nspeak the whole name only when both fragments are held."\n"or do not speak it."\n"the choice belongs to the one who digs."';
      newState = setFlag(newState, 'knowsTheFinalChoice', true);
      entryType = 'whisper';
    }

    newState = addLogEntry(newState, text, entryType);
    newState.progress = { ...newState.progress, buriedLedgerReadCount: count + 1 };
    return { newState, logText: text };
  },
};

// ─── CH3-7. LISTEN AT SOIL ───────────────────────────────────────────────────

const listenAtSoilAction: GameAction = {
  id: 'listen-at-soil',
  label: 'listen at the soil',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: true,
  visible: (state) => inChapter3(state) && flag(state, 'knowsFullName'),
  isDisabled: (state) => ch3Prog(state, 'listenAtSoilCount') >= 4,
  getDisabledReason: () => 'you have heard enough to know what waits.',
  onExecute: (state) => {
    const count = ch3Prog(state, 'listenAtSoilCount');
    let newState = advanceTime({ ...state }, 15);

    let text: string;
    if (count === 0) {
      text =
        'you press close to the broken soil.\nsomething beneath moves, but not like a living thing.\nlike a word, practicing itself.';
    } else if (count === 1) {
      text = '"eli—"\nit stops.\nit does not know the second half is above ground now.';
    } else if (count === 2) {
      text =
        'the sound comes again.\nboth halves, almost together:\n"eli — as —"\na breath between them.\nnot one name. two parts of one.';
    } else {
      text =
        'it stops reaching.\nit waits.\nit has felt the fragments above it.\nit knows you have them both.\nthe choice belongs to you.';
      newState = setFlag(newState, 'finalChoiceReady', true);
    }

    newState = addLogEntry(newState, text, 'whisper');
    newState.progress = { ...newState.progress, listenAtSoilCount: count + 1 };
    newState.repetition = {
      ...newState.repetition,
      deadAttention: newState.repetition.deadAttention + 1,
      whisperLevel: newState.repetition.whisperLevel + 1,
    };
    return { newState, logText: text };
  },
};

// ─── CH3-8. SPEAK THE WHOLE NAME ─────────────────────────────────────────────

const speakWholeNameAction: GameAction = {
  id: 'speak-the-whole-name',
  label: 'speak the whole name',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  // Requires: soil + fragments + ledger page fully read + whisper confirmed + courage
  visible: (state) =>
    inChapter3(state) &&
    flag(state, 'finalChoiceReady') &&
    flag(state, 'knowsTheFinalChoice') &&
    state.player.courage >= 1,
  isDisabled: (state) => flag(state, 'firstArcComplete'),
  getDisabledReason: () => 'you have already chosen.',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    const text =
      '"elias," you say.\nboth halves at once.\nthe ground beneath the split soil exhales.\nthe two stone fragments grow cold in your hands.\nfrom below, something that was waiting a long time becomes still.\nnot gone.\nstill.\nas if it finally fits inside its own name.\n\nthe whispers in the east row do not return.\nthe first arc is complete.';
    newState = addLogEntry(newState, text, 'whisper');
    newState = setFlag(newState, 'spokeEliasName', true);
    newState = setFlag(newState, 'firstArcComplete', true);
    newState.chapter = 'Chapter 3 — Complete';
    newState.progress = { ...newState.progress, endingChoice: 1 }; // 1 = answered
    const newCourage = clamp(newState.player.courage + 2, 0, newState.player.maxCourage);
    newState.player = { ...newState.player, courage: newCourage };
    return { newState, logText: text };
  },
};

// ─── CH3-9. BURY THE NAME AGAIN ──────────────────────────────────────────────

const buryNameAgainAction: GameAction = {
  id: 'bury-name-again',
  label: 'bury the name again',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  // Requires: soil + both fragments + player understands WHY the name was split and that the choice is theirs
  visible: (state) =>
    inChapter3(state) &&
    flag(state, 'finalChoiceReady') &&
    flag(state, 'understoodSplitCustom') &&
    flag(state, 'knowsTheFinalChoice'),
  isDisabled: (state) => flag(state, 'firstArcComplete'),
  getDisabledReason: () => 'you have already chosen.',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    const text =
      'you set the two fragments back into the pit, face-down.\nELI in the earth.\nAS beside it.\nyou push the soil over both pieces.\nthe ledger page goes in after.\nwhat was split remains split.\nfrom below, nothing.\nnot even the half-sound.\n\nthe east row goes quiet.\nthe first arc is complete.';
    newState = addLogEntry(newState, text, 'action');
    newState = setFlag(newState, 'buriedEliasFragments', true);
    newState = setFlag(newState, 'firstArcComplete', true);
    newState.chapter = 'Chapter 3 — Complete';
    newState.progress = { ...newState.progress, endingChoice: 2 }; // 2 = buried
    const newCourage = clamp(newState.player.courage + 1, 0, newState.player.maxCourage);
    newState.player = { ...newState.player, courage: newCourage };
    return { newState, logText: text };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CHAPTER 4 — THE NAMELESS ROW
// ─────────────────────────────────────────────────────────────────────────────

const walkToNamelessRowAction: GameAction = {
  id: 'walk-to-nameless-row',
  label: 'walk to the nameless row',
  cooldownSeconds: 5,
  inGameMinutesPassed: 20,
  repeatable: false,
  visible: (state) => flag(state, 'firstArcComplete') && !flag(state, 'chapter4Active'),
  isDisabled: () => false,
  getDisabledReason: () => '',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 20);
    newState.currentLocation = 'Nameless Row';
    newState.chapter = 'Chapter 4';
    newState = setFlag(newState, 'chapter4Active', true);

    const answered = flag(state, 'spokeEliasName');
    const text = answered
      ? 'you leave the fresh soil behind.\nwhere the east row bends, the stones stop carrying names.\nnot worn away. never carved.\nthe lantern shows a shallow bowl set into the path.\ninside it: pale grave chalk, dry as bone.\n\nElias is quiet now.\nthe nameless are not.'
      : 'you leave the fresh soil behind.\nwhere the east row bends, the stones stop carrying names.\nnot worn away. never carved.\nthe lantern shows a shallow bowl set into the path.\ninside it: pale grave chalk, dry as bone.\n\nbehind you, the earth you closed remains quiet.\nahead, the nameless row waits without asking.';

    newState.resources = {
      ...newState.resources,
      graveChalk: newState.resources.graveChalk + 1,
    };
    newState = addLogEntry(newState, text, 'story');
    newState = addLogEntry(newState, 'you take the grave chalk.', 'resource');
    return { newState, logText: text };
  },
};

const traceBlankStoneAction: GameAction = {
  id: 'trace-blank-stone',
  label: 'trace a blank stone',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => inChapter4(state) && !flag(state, 'chapter4MiddleActive'),
  isDisabled: (state) => state.resources.graveChalk < 1 || state.repetition.blankStoneTraceProgress >= 3,
  getDisabledReason: (state) => {
    if (state.resources.graveChalk < 1) return 'you need something pale enough to catch the grooves.';
    return 'the row has shown its first pattern.';
  },
  onExecute: (state) => {
    const progress = state.repetition.blankStoneTraceProgress;
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    if (progress === 0) {
      text =
        'you drag the chalk across the nearest blank stone.\nfor a moment, the surface resists.\nthen shallow grooves appear where no name was carved.\na rubbing forms beneath your hand.';
      newState.resources = {
        ...newState.resources,
        graveRubbings: newState.resources.graveRubbings + 1,
      };
    } else if (progress === 1) {
      text =
        'the second stone takes the chalk more easily.\nnot letters. spacing.\nmarks where letters should have been.\nwhoever erased these graves did it before the chisel touched them.';
      newState.resources = {
        ...newState.resources,
        graveRubbings: newState.resources.graveRubbings + 1,
      };
    } else {
      text =
        'the third rubbing is different.\nthree blank stones share one hidden stroke, split across them like a name cut into pieces.\nthis row is not empty.\nit is waiting to be assembled.';
      newState = setFlag(newState, 'understandsNamelessRowPattern', true);
    }

    newState = addLogEntry(newState, text, progress < 2 ? 'resource' : 'whisper');
    newState.repetition = {
      ...newState.repetition,
      blankStoneTraceProgress: progress + 1,
      whisperLevel: newState.repetition.whisperLevel + 1,
    };
    return { newState, logText: text };
  },
};

const listenToNamelessRowAction: GameAction = {
  id: 'listen-to-nameless-row',
  label: 'listen to the nameless row',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => inChapter4(state) && !flag(state, 'chapter4MiddleActive'),
  isDisabled: (state) => state.repetition.namelessRowListenCount >= 2,
  getDisabledReason: () => 'the row has gone quiet enough to work.',
  onExecute: (state) => {
    const count = state.repetition.namelessRowListenCount;
    let newState = advanceTime({ ...state }, 10);

    const text =
      count === 0
        ? 'you listen between the blank stones.\nthere are no names here.\nonly spaces where names should lean.\na thin tapping passes from grave to grave, counting without numbers.'
        : 'the tapping returns.\nthree stones. one pause. three stones again.\nnot a voice.\na measure.\nthe row is telling you how to join what was divided.';

    newState = addLogEntry(newState, text, 'whisper');
    newState.repetition = {
      ...newState.repetition,
      namelessRowListenCount: count + 1,
      whisperLevel: newState.repetition.whisperLevel + 1,
    };

    if (count === 1) {
      newState = setFlag(newState, 'understandsNamelessMeasure', true);
    }

    return { newState, logText: text };
  },
};

const assembleFirstRubbingsAction: GameAction = {
  id: 'assemble-first-rubbings',
  label: 'assemble the rubbings',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: false,
  visible: (state) =>
    inChapter4(state) &&
    !flag(state, 'chapter4MiddleActive') &&
    flag(state, 'understandsNamelessRowPattern') &&
    state.resources.graveRubbings >= 2,
  isDisabled: (state) => !flag(state, 'understandsNamelessMeasure') || flag(state, 'assembledFirstNamelessName'),
  getDisabledReason: (state) => {
    if (!flag(state, 'understandsNamelessMeasure')) return 'the rubbings have shape, but no measure.';
    return 'the first hidden name is assembled.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);
    const text =
      'you lay the rubbings across the path.\nchalk dust joins what the stones refused to hold.\nthree hidden strokes become letters.\nM A R A.\n\nthe name sits there without a grave to belong to.\nit is not asking to be spoken.\nit is asking whether it should exist.';

    newState = addLogEntry(newState, text, 'whisper');
    newState = setFlag(newState, 'assembledFirstNamelessName', true);
    newState.resources = {
      ...newState.resources,
      namesKnownCount: newState.resources.namesKnownCount + 1,
    };
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage - 1, 0, newState.player.maxCourage),
    };

    return { newState, logText: text };
  },
};

const markNamelessStoneAction: GameAction = {
  id: 'mark-nameless-stone',
  label: 'mark the nameless stone',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  visible: (state) =>
    inChapter4(state) &&
    !flag(state, 'chapter4MiddleActive') &&
    flag(state, 'assembledFirstNamelessName') &&
    !flag(state, 'chapter4FirstChoiceMade'),
  isDisabled: (state) => state.resources.graveChalk < 1 || flag(state, 'chapter4FirstChoiceMade'),
  getDisabledReason: (state) => {
    if (state.resources.graveChalk < 1) return 'the chalk is gone.';
    return 'the first nameless choice has been made.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    const text =
      'you write MARA on the blank stone.\nthe chalk does not sit on the surface.\nit sinks in.\nfor one breath, the row remembers a woman no ledger kept.\nthen black salt beads along the base of the stone.\n\nthe name is restored.\nsomething else has noticed.';

    newState = addLogEntry(newState, text, 'whisper');
    newState = setFlag(newState, 'markedMaraName', true);
    newState = setFlag(newState, 'chapter4FirstChoiceMade', true);
    newState.resources = {
      ...newState.resources,
      blackSalt: newState.resources.blackSalt + 1,
    };
    newState.repetition = {
      ...newState.repetition,
      deadAttention: newState.repetition.deadAttention + 2,
      whisperLevel: newState.repetition.whisperLevel + 1,
    };
    return { newState, logText: text };
  },
};

const leaveStoneUnmarkedAction: GameAction = {
  id: 'leave-stone-unmarked',
  label: 'leave the stone unmarked',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  visible: (state) =>
    inChapter4(state) &&
    !flag(state, 'chapter4MiddleActive') &&
    flag(state, 'assembledFirstNamelessName') &&
    !flag(state, 'chapter4FirstChoiceMade'),
  isDisabled: (state) => flag(state, 'chapter4FirstChoiceMade'),
  getDisabledReason: () => 'the first nameless choice has been made.',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    const text =
      'you fold the rubbings and do not mark the stone.\nMARA remains a shape in your hands, not a sound in the row.\nthe blank grave settles.\nnot pleased.\nnot angry.\nallowed.\n\nblack salt gathers where the chalk touched your fingers.';

    newState = addLogEntry(newState, text, 'action');
    newState = setFlag(newState, 'leftMaraUnmarked', true);
    newState = setFlag(newState, 'chapter4FirstChoiceMade', true);
    newState.resources = {
      ...newState.resources,
      blackSalt: newState.resources.blackSalt + 1,
    };
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage + 1, 0, newState.player.maxCourage),
    };
    newState.repetition = {
      ...newState.repetition,
      deadAttention: clamp(newState.repetition.deadAttention - 1, 0, 999),
    };
    return { newState, logText: text };
  },
};

const ringStoneWithBlackSaltAction: GameAction = {
  id: 'ring-stone-with-black-salt',
  label: 'ring the stone with black salt',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: false,
  visible: (state) =>
    inChapter4(state) && flag(state, 'chapter4FirstChoiceMade') && !flag(state, 'chapter4MiddleActive'),
  isDisabled: (state) => state.resources.blackSalt < 1 || flag(state, 'blackSaltWardPlaced'),
  getDisabledReason: (state) => {
    if (state.resources.blackSalt < 1) return 'you have no black salt.';
    return 'the first ward is already set.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);
    const text =
      'you pour black salt in a thin ring around the chosen stone.\nit does not scatter.\neach grain finds the next, making a dark circle the row refuses to cross.\nfor the first time since the east row, the silence has an edge.';

    newState = addLogEntry(newState, text, 'action');
    newState = setFlag(newState, 'blackSaltWardPlaced', true);
    newState.resources = {
      ...newState.resources,
      blackSalt: newState.resources.blackSalt - 1,
    };
    newState.repetition = {
      ...newState.repetition,
      blackSaltWardStrength: newState.repetition.blackSaltWardStrength + 1,
      deadAttention: clamp(newState.repetition.deadAttention - 2, 0, 999),
      whisperLevel: clamp(newState.repetition.whisperLevel - 1, 0, 999),
    };
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage + 1, 0, newState.player.maxCourage),
    };
    return { newState, logText: text };
  },
};

const cleanseMarkedNameAction: GameAction = {
  id: 'cleanse-marked-name',
  label: 'cleanse the marked name',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  visible: (state) => inChapter4(state) && flag(state, 'markedMaraName') && !flag(state, 'chapter4MiddleActive'),
  isDisabled: (state) => state.resources.blackSalt < 1 || flag(state, 'maraNameCleansed'),
  getDisabledReason: (state) => {
    if (state.resources.blackSalt < 1) return 'you have no black salt.';
    return 'MARA has already been cleansed.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    const text =
      'you press black salt into the letters MARA.\nthe name smokes without heat.\nthe chalk lifts from the stone in four pale threads, then burns away before it reaches your hand.\n\nthe row forgets her again.\nbut this time, it remembers you did it.';

    newState = addLogEntry(newState, text, 'danger');
    newState = setFlag(newState, 'maraNameCleansed', true);
    newState.resources = {
      ...newState.resources,
      blackSalt: newState.resources.blackSalt - 1,
      namesKnownCount: clamp(newState.resources.namesKnownCount - 1, 0, 999),
    };
    newState.repetition = {
      ...newState.repetition,
      deadAttention: newState.repetition.deadAttention + 3,
      whisperLevel: newState.repetition.whisperLevel + 2,
    };
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage - 1, 0, newState.player.maxCourage),
    };
    return { newState, logText: text };
  },
};

const followSaltLineAction: GameAction = {
  id: 'follow-the-salt-line',
  label: 'follow the salt line',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  visible: (state) =>
    inChapter4(state) &&
    (flag(state, 'blackSaltWardPlaced') || flag(state, 'maraNameCleansed')) &&
    !flag(state, 'chapter4MiddleActive'),
  isDisabled: () => false,
  getDisabledReason: () => '',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    newState.currentLocation = 'Uncarved Plot';
    newState = setFlag(newState, 'chapter4MiddleActive', true);

    const text = flag(state, 'maraNameCleansed')
      ? 'where MARA vanished, the black salt leaves a trail.\nnot grains. burns.\nsmall dark holes in the path, each one pointing deeper into the row.\nyou follow them to a plot with no stones at all.\nonly shallow rectangles in the grass, waiting for markers that were never cut.'
      : 'the black salt ring pulls a thread from the path.\na thin dark line, impossible to see until the lantern catches it.\nyou follow it past the blank stones to a plot with no stones at all.\nonly shallow rectangles in the grass, waiting for markers that were never cut.';

    newState = addLogEntry(newState, text, 'story');
    return { newState, logText: text };
  },
};

const inspectUncarvedPlotAction: GameAction = {
  id: 'inspect-uncarved-plot',
  label: 'inspect the uncarved plot',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => inChapter4(state) && flag(state, 'chapter4MiddleActive'),
  isDisabled: (state) => state.repetition.uncarvedPlotInspectCount >= 3,
  getDisabledReason: () => 'the plot has shown what it can without the basin.',
  onExecute: (state) => {
    const count = state.repetition.uncarvedPlotInspectCount;
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    if (count === 0) {
      text =
        'the ground is divided into rectangles.\nnot graves. not yet.\nplaces measured before the dead arrived.';
    } else if (count === 1) {
      text =
        'at the head of each empty place, the soil is pressed flat.\nno stone was removed.\nno stone was ever set.\nsomeone prepared absences here.';
    } else {
      text =
        'you kneel between the empty plots.\nthe pattern matches the nameless row, but earlier.\nthese were not forgotten dead.\nthey were names kept aside before burial.';
      newState = setFlag(newState, 'understandsPreparedAbsences', true);
    }

    newState = addLogEntry(newState, text, count === 2 ? 'whisper' : 'story');
    newState.repetition = {
      ...newState.repetition,
      uncarvedPlotInspectCount: count + 1,
      whisperLevel: count === 2 ? newState.repetition.whisperLevel + 1 : newState.repetition.whisperLevel,
    };
    return { newState, logText: text };
  },
};

const searchAshBasinAction: GameAction = {
  id: 'search-the-ash-basin',
  label: 'search the ash basin',
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => inChapter4(state) && flag(state, 'chapter4MiddleActive'),
  isDisabled: (state) =>
    !flag(state, 'understandsPreparedAbsences') || state.repetition.ashBasinSearchCount >= 2,
  getDisabledReason: (state) => {
    if (!flag(state, 'understandsPreparedAbsences')) return 'the empty plot does not make sense yet.';
    return 'the basin holds only cold ash now.';
  },
  onExecute: (state) => {
    const count = state.repetition.ashBasinSearchCount;
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    if (count === 0) {
      text =
        'beneath a slab of grass, your fingers find a shallow iron basin.\ninside: white ash and one length of black thread, knotted at both ends.\nyou take the thread.';
      newState.resources = {
        ...newState.resources,
        keeperThread: newState.resources.keeperThread + 1,
      };
      newState = setFlag(newState, 'foundKeeperThread', true);
    } else {
      text =
        'under the ash, a page has survived by refusing to burn.\nthere are ledger lines, but no written names.\nonly spaces, measured and waiting.';
      newState.resources = {
        ...newState.resources,
        unwrittenLedgerPage: newState.resources.unwrittenLedgerPage + 1,
      };
      newState = setFlag(newState, 'foundUnwrittenLedgerPage', true);
      newState = setFlag(newState, 'chapter4MiddleClueReady', true);
    }

    newState = addLogEntry(newState, text, 'resource');
    newState.repetition = {
      ...newState.repetition,
      ashBasinSearchCount: count + 1,
    };
    return { newState, logText: text };
  },
};

const bindUnwrittenPageAction: GameAction = {
  id: 'bind-unwritten-page',
  label: 'bind the unwritten page',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  visible: (state) => inChapter4(state) && flag(state, 'chapter4MiddleClueReady'),
  isDisabled: (state) =>
    state.resources.keeperThread < 1 ||
    state.resources.unwrittenLedgerPage < 1 ||
    flag(state, 'stitchedUnwrittenLedgerPage'),
  getDisabledReason: (state) => {
    if (flag(state, 'stitchedUnwrittenLedgerPage')) return 'the unwritten page is already bound.';
    if (state.resources.keeperThread < 1) return 'the page needs keeper thread.';
    return 'there is no unwritten page to bind.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    const text =
      'you lay the black thread across the blank ledger lines.\nthe knots tighten by themselves.\nink rises where the thread crosses the paper, not writing names, but leaving spaces for them.\n\none space is already measured for a living throat.\nthe ledger is not recording the dead.\nit is reserving them.';

    newState = addLogEntry(newState, text, 'whisper');
    newState = setFlag(newState, 'stitchedUnwrittenLedgerPage', true);
    newState = setFlag(newState, 'understandsLedgerPrewritesNames', true);
    newState.resources = {
      ...newState.resources,
      keeperThread: newState.resources.keeperThread - 1,
      unwrittenLedgerPage: newState.resources.unwrittenLedgerPage - 1,
      stitchedLedgerPage: newState.resources.stitchedLedgerPage + 1,
    };
    newState.progress = {
      ...newState.progress,
      reservedLivingNamesKnown: (newState.progress['reservedLivingNamesKnown'] ?? 0) + 1,
    };
    newState.repetition = {
      ...newState.repetition,
      whisperLevel: newState.repetition.whisperLevel + 2,
      deadAttention: newState.repetition.deadAttention + 1,
    };
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage - 1, 0, newState.player.maxCourage),
    };

    return { newState, logText: text };
  },
};

const readStitchedPageAction: GameAction = {
  id: 'read-stitched-page',
  label: 'read the stitched page',
  cooldownSeconds: 5,
  inGameMinutesPassed: 10,
  repeatable: false,
  visible: (state) => inChapter4(state) && flag(state, 'stitchedUnwrittenLedgerPage'),
  isDisabled: (state) => state.resources.stitchedLedgerPage < 1 || flag(state, 'readStitchedLedgerPage'),
  getDisabledReason: (state) => {
    if (flag(state, 'readStitchedLedgerPage')) return 'the stitched page has no more ink to give.';
    return 'there is no stitched page to read.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);
    const text =
      'you hold the stitched page close to the lantern.\nwhere the black thread crosses the first blank line, a name rises backward through the paper.\nN I R A.\n\nnot buried.\nnot dead.\nreserved.\n\nsomewhere beyond the row, a living throat forgets how to make its own name.';

    newState = addLogEntry(newState, text, 'danger');
    newState = setFlag(newState, 'readStitchedLedgerPage', true);
    newState = setFlag(newState, 'revealedNiraLivingName', true);
    newState.resources = {
      ...newState.resources,
      livingNameTrace: newState.resources.livingNameTrace + 1,
    };
    newState.progress = {
      ...newState.progress,
      reservedLivingNamesKnown: Math.max(newState.progress['reservedLivingNamesKnown'] ?? 0, 1),
    };
    newState.repetition = {
      ...newState.repetition,
      deadAttention: newState.repetition.deadAttention + 2,
      whisperLevel: newState.repetition.whisperLevel + 1,
    };
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage - 1, 0, newState.player.maxCourage),
    };

    return { newState, logText: text };
  },
};

const listenToLivingTraceAction: GameAction = {
  id: 'listen-to-living-trace',
  label: 'listen to the living trace',
  cooldownSeconds: 5,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) =>
    inChapter4(state) &&
    flag(state, 'revealedNiraLivingName') &&
    !flag(state, 'niraTraceHeard'),
  isDisabled: (state) =>
    state.resources.livingNameTrace < 1 || state.repetition.livingTraceListenCount >= 2,
  getDisabledReason: (state) => {
    if (state.resources.livingNameTrace < 1) return 'there is no living trace to follow.';
    return 'the living trace has given its direction.';
  },
  onExecute: (state) => {
    const count = state.repetition.livingTraceListenCount;
    let newState = advanceTime({ ...state }, 10);

    const text =
      count === 0
        ? 'you hold still with NIRA written backward in your thoughts.\nthe trace does not whisper like the dead.\nit beats.\nsmall. frightened. alive.'
        : 'the living trace pulls toward the cemetery boundary.\nnot toward a grave.\nnot toward the shed.\ntoward the old service path beyond the wall, where someone living is already being measured for absence.';

    newState = addLogEntry(newState, text, count === 0 ? 'whisper' : 'danger');
    newState.repetition = {
      ...newState.repetition,
      livingTraceListenCount: count + 1,
      whisperLevel: newState.repetition.whisperLevel + 1,
    };

    if (count === 1) {
      newState = setFlag(newState, 'niraTraceHeard', true);
    }

    return { newState, logText: text };
  },
};

const anchorLivingTraceAction: GameAction = {
  id: 'anchor-the-living-trace',
  label: 'anchor the living trace',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  visible: (state) => inChapter4(state) && flag(state, 'niraTraceHeard'),
  isDisabled: (state) =>
    state.resources.stitchedLedgerPage < 1 ||
    state.resources.livingNameTrace < 1 ||
    flag(state, 'niraTraceAnchored'),
  getDisabledReason: (state) => {
    if (flag(state, 'niraTraceAnchored')) return 'Nira has already been anchored against the ledger.';
    if (state.resources.stitchedLedgerPage < 1) return 'the stitched page must hold the trace.';
    return 'there is no living trace to anchor.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    const branchLine = flag(state, 'maraNameCleansed')
      ? 'the place where MARA burned away answers with heat under your palm.'
      : flag(state, 'leftMaraUnmarked')
        ? 'the folded MARA rubbings twitch once, then lie still.'
        : 'the warded stone behind you keeps its black-salt circle.';
    const text = `${branchLine}\nyou press the stitched page flat and set the living trace across its first blank line.\nthe ink tries to pull NIRA deeper.\nyou pin it with the only thing the ledger cannot fake: the rhythm of a living name refusing to become an entry.`;

    newState = addLogEntry(newState, text, 'whisper');
    newState = setFlag(newState, 'niraTraceAnchored', true);
    newState.resources = {
      ...newState.resources,
      livingNameAnchor: newState.resources.livingNameAnchor + 1,
    };
    newState.repetition = {
      ...newState.repetition,
      deadAttention: newState.repetition.deadAttention + 1,
    };
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage + 1, 0, newState.player.maxCourage),
    };

    return { newState, logText: text };
  },
};

const followLivingTraceAction: GameAction = {
  id: 'follow-the-living-trace',
  label: 'follow the living trace',
  cooldownSeconds: 5,
  inGameMinutesPassed: 20,
  repeatable: false,
  visible: (state) => inChapter4(state) && flag(state, 'niraTraceAnchored'),
  isDisabled: (state) => state.resources.livingNameAnchor < 1 || flag(state, 'chapter4Complete'),
  getDisabledReason: (state) => {
    if (flag(state, 'chapter4Complete')) return 'you have already left the nameless row.';
    return 'Nira is not anchored strongly enough to follow.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 20);
    const text =
      'you follow the anchored trace between plots that were prepared before their dead arrived.\nat the cemetery boundary, the wall has no gate.\nonly a service path, half-swallowed by nettles, leading toward a house whose windows are still lit.\n\nChapter 4 complete.\nNira is alive.\nThe ledger has already made room for her.';

    newState.currentLocation = 'Cemetery Boundary';
    newState.chapter = 'Chapter 4 — Complete';
    newState = setFlag(newState, 'chapter4Complete', true);
    newState = setFlag(newState, 'chapter5Unlocked', true);
    newState = addLogEntry(newState, text, 'story');

    return { newState, logText: text };
  },
};

const takeServicePathAction: GameAction = {
  id: 'take-the-service-path',
  label: 'take the service path',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  visible: (state) => flag(state, 'chapter4Complete') && !flag(state, 'chapter5Active'),
  isDisabled: (state) => !flag(state, 'chapter5Unlocked') || state.resources.livingNameAnchor < 1,
  getDisabledReason: (state) => {
    if (!flag(state, 'chapter5Unlocked')) return 'the boundary path is not known yet.';
    return 'Nira needs an anchor before the cemetery can be left.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    const text =
      'the cemetery does not end cleanly.\nit thins.\ngrass becomes road-dust. headstones become fenceposts. whispers become the low voice of a sleeping town.\n\nAhead, the lit house waits with Nira inside it.\nChapter 5 begins.';

    newState.currentLocation = "Nira's House";
    newState.chapter = 'Chapter 5';
    newState = setFlag(newState, 'chapter5Active', true);
    newState = addLogEntry(newState, text, 'story');
    return { newState, logText: text };
  },
};

const inspectNirasHouseAction: GameAction = {
  id: 'inspect-niras-house',
  label: "inspect Nira's house",
  cooldownSeconds: 4,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: inChapter5,
  isDisabled: (state) => state.repetition.niraHouseInspectCount >= 2,
  getDisabledReason: () => 'the house has shown what it can from outside.',
  onExecute: (state) => {
    const count = state.repetition.niraHouseInspectCount;
    let newState = advanceTime({ ...state }, 10);

    let text: string;
    let entryType: 'story' | 'resource' = 'story';
    if (count === 0) {
      text =
        "Nira's house is narrow and awake.\none upstairs window burns yellow.\nno figure crosses it, but the curtain moves once, against the wind.";
      newState = setFlag(newState, 'sawNiraWindow', true);
    } else {
      text =
        'the doorstep is dusted with pale ash.\nnot fireplace ash.\nthe same white ash that hid the unwritten page, scattered here in a careful line.\nyou gather enough to mark the threshold again.';
      newState.resources = {
        ...newState.resources,
        thresholdAsh: newState.resources.thresholdAsh + 1,
      };
      newState = setFlag(newState, 'foundNiraThresholdAsh', true);
      entryType = 'resource';
    }

    newState = addLogEntry(newState, text, entryType);
    newState.repetition = {
      ...newState.repetition,
      niraHouseInspectCount: count + 1,
    };
    return { newState, logText: text };
  },
};

const listenAtNirasDoorAction: GameAction = {
  id: 'listen-at-niras-door',
  label: "listen at Nira's door",
  cooldownSeconds: 5,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) => inChapter5(state) && flag(state, 'sawNiraWindow'),
  isDisabled: (state) => state.repetition.niraDoorListenCount >= 2,
  getDisabledReason: () => 'you know enough to answer carefully.',
  onExecute: (state) => {
    const count = state.repetition.niraDoorListenCount;
    let newState = advanceTime({ ...state }, 10);

    const text =
      count === 0
        ? 'you set your ear near the door.\ninside, someone breathes in small broken counts.\nthen a whisper that is not the cemetery says: "who keeps taking the first sound?"'
        : 'the voice inside tries again.\n"i know my name starts with..."\nsilence cuts the sentence clean.\nthe living trace in your hand goes cold.\nNira is still here, but the ledger is learning her mouth.';

    newState = addLogEntry(newState, text, 'whisper');
    newState.repetition = {
      ...newState.repetition,
      niraDoorListenCount: count + 1,
      whisperLevel: newState.repetition.whisperLevel + 1,
    };

    if (count === 1) {
      newState = setFlag(newState, 'heardNiraInside', true);
    }

    return { newState, logText: text };
  },
};

const dustNirasThresholdAction: GameAction = {
  id: 'dust-niras-threshold',
  label: "dust Nira's threshold",
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  visible: (state) => inChapter5(state) && flag(state, 'heardNiraInside'),
  isDisabled: (state) =>
    state.resources.livingNameAnchor < 1 ||
    state.resources.thresholdAsh < 1 ||
    flag(state, 'niraThresholdWarded'),
  getDisabledReason: (state) => {
    if (flag(state, 'niraThresholdWarded')) return "Nira's threshold is already warded.";
    if (state.resources.livingNameAnchor < 1) return 'the living-name anchor is needed here.';
    return 'the threshold ash has not been found.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    const text =
      'you mix the threshold ash with the pressure of the living-name anchor.\nthe ash darkens where it touches the doorframe.\nfor one breath, NIRA appears there in negative space, a name made by what the ledger cannot cross.';

    newState = addLogEntry(newState, text, 'action');
    newState = setFlag(newState, 'niraThresholdWarded', true);
    newState.resources = {
      ...newState.resources,
      thresholdAsh: newState.resources.thresholdAsh - 1,
    };
    newState.repetition = {
      ...newState.repetition,
      deadAttention: clamp(newState.repetition.deadAttention - 1, 0, 999),
    };
    return { newState, logText: text };
  },
};

const callNiraSoftlyAction: GameAction = {
  id: 'call-nira-softly',
  label: 'call Nira softly',
  cooldownSeconds: 5,
  inGameMinutesPassed: 10,
  repeatable: false,
  visible: (state) => inChapter5(state) && flag(state, 'niraThresholdWarded'),
  isDisabled: (state) => flag(state, 'niraAnsweredFromInside'),
  getDisabledReason: () => 'Nira has heard you.',
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);
    const text =
      '"Nira," you say, soft enough that the cemetery cannot wear it.\ninside, the breathing stops.\nthen a hand touches the other side of the door.\n"i remember that," she says.\n"please do not say it loudly."\n\nChapter 5 has found its living voice.';

    newState = addLogEntry(newState, text, 'whisper');
    newState = setFlag(newState, 'niraAnsweredFromInside', true);
    newState = setFlag(newState, 'chapter5FirstContact', true);
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage + 1, 0, newState.player.maxCourage),
    };
    return { newState, logText: text };
  },
};

const askNiraWhatSheRemembersAction: GameAction = {
  id: 'ask-nira-what-she-remembers',
  label: 'ask what Nira remembers',
  cooldownSeconds: 5,
  inGameMinutesPassed: 10,
  repeatable: true,
  visible: (state) =>
    inChapter5(state) && flag(state, 'chapter5FirstContact') && !flag(state, 'niraDoorOpened'),
  isDisabled: (state) => state.repetition.niraMemoryListenCount >= 2,
  getDisabledReason: () => 'Nira has told you where the loss begins.',
  onExecute: (state) => {
    const count = state.repetition.niraMemoryListenCount;
    let newState = advanceTime({ ...state }, 10);

    const text =
      count === 0
        ? '"i remember my mother calling from the well," Nira says through the door.\n"i remember running before she finished."\n"now every memory starts after the first sound."'
        : '"there is a shape before the rest," she whispers.\n"like my name begins behind my teeth and the ledger catches it there."\ninside the stitched page, the first blank line tightens around a missing sound.';

    newState = addLogEntry(newState, text, 'whisper');
    newState.repetition = {
      ...newState.repetition,
      niraMemoryListenCount: count + 1,
      whisperLevel: newState.repetition.whisperLevel + 1,
    };

    if (count === 1) {
      newState = setFlag(newState, 'niraFirstSoundMissing', true);
    }

    return { newState, logText: text };
  },
};

const slideStitchedPageUnderDoorAction: GameAction = {
  id: 'slide-stitched-page-under-door',
  label: 'slide the stitched page under the door',
  cooldownSeconds: 5,
  inGameMinutesPassed: 15,
  repeatable: false,
  visible: (state) => inChapter5(state) && flag(state, 'niraFirstSoundMissing'),
  isDisabled: (state) =>
    state.resources.stitchedLedgerPage < 1 ||
    state.resources.livingNameAnchor < 1 ||
    flag(state, 'niraFirstSoundReturned'),
  getDisabledReason: (state) => {
    if (flag(state, 'niraFirstSoundReturned')) return "Nira's first sound has been returned.";
    if (state.resources.stitchedLedgerPage < 1) return 'the stitched page is needed to catch the theft.';
    return 'the living-name anchor is needed to hold the sound.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 15);
    const text =
      'you slide the stitched page beneath the door.\nfrom inside, Nira lays one finger on the blank line.\nthe ink jerks toward her, then stops against the living-name anchor.\n\nA first sound lifts out of the paper.\nsmall as a caught breath.\nN.';

    newState = addLogEntry(newState, text, 'resource');
    newState = setFlag(newState, 'niraFirstSoundReturned', true);
    newState.resources = {
      ...newState.resources,
      niraFirstSound: newState.resources.niraFirstSound + 1,
    };
    newState.repetition = {
      ...newState.repetition,
      deadAttention: newState.repetition.deadAttention + 2,
      whisperLevel: newState.repetition.whisperLevel + 1,
    };
    return { newState, logText: text };
  },
};

const teachNiraQuietNameAction: GameAction = {
  id: 'teach-nira-the-quiet-name',
  label: 'teach Nira the quiet name',
  cooldownSeconds: 5,
  inGameMinutesPassed: 10,
  repeatable: false,
  visible: (state) => inChapter5(state) && flag(state, 'niraFirstSoundReturned'),
  isDisabled: (state) => state.resources.niraFirstSound < 1 || flag(state, 'niraQuietNameKnown'),
  getDisabledReason: (state) => {
    if (flag(state, 'niraQuietNameKnown')) return 'Nira knows how to hold her name quietly.';
    return 'the first sound has not been returned.';
  },
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);
    const text =
      'you do not say the whole name.\nyou teach her the first sound as a door teaches a knock: close, quiet, held in wood.\nNira repeats it without giving it to the night.\n"N," she says.\nthen, softer, "Nira."';

    newState = addLogEntry(newState, text, 'whisper');
    newState = setFlag(newState, 'niraQuietNameKnown', true);
    newState.player = {
      ...newState.player,
      courage: clamp(newState.player.courage + 1, 0, newState.player.maxCourage),
    };
    return { newState, logText: text };
  },
};

const enterNirasHouseAction: GameAction = {
  id: 'enter-niras-house',
  label: "enter Nira's house",
  cooldownSeconds: 5,
  inGameMinutesPassed: 10,
  repeatable: false,
  visible: (state) => inChapter5(state) && flag(state, 'niraQuietNameKnown') && !flag(state, 'niraDoorOpened'),
  isDisabled: (state) => flag(state, 'niraDoorOpened'),
  getDisabledReason: () => "Nira's door is already open.",
  onExecute: (state) => {
    let newState = advanceTime({ ...state }, 10);
    const text =
      'the lock turns from the inside.\nNira opens the door only wide enough for you and the lantern.\nbehind her, the house smells of boiled nettles, cold iron, and ink.\n\nThe cemetery is no longer the only place where names can be taken.';

    newState.currentLocation = "Nira's Kitchen";
    newState = setFlag(newState, 'niraDoorOpened', true);
    newState = setFlag(newState, 'chapter5HouseEntered', true);
    newState = addLogEntry(newState, text, 'story');
    return { newState, logText: text };
  },
};

// ─── Action Registry (ordered) ────────────────────────────────────────────────

const ACTION_LIST: GameAction[] = [
  // Chapter 1
  listenAction,
  searchGroundAction,
  inspectGraveAction,
  lightCandleAction,
  relightCandleAction,
  steadyCandleAction,
  cleanMarkerAction,
  speakPartialNameAction,
  lookAroundAction,
  stayQuietAction,
  goToGateAction,
  returnToFirstGraveAction,
  goToShedDoorAction,
  // Chapter 1→2 transition
  enterShedAction,
  // Chapter 2
  holdCandleUpAction,
  searchShelvesAction,
  inspectWorkbenchAction,
  cleanLanternAction,
  fillLanternAction,
  lightLanternAction,
  inspectDeskAction,
  readLedgerAction,
  forceDrawerAction,
  studyMapAction,
  readKeeperNoteAction,
  standStillListenAction,
  prepareToLeaveAction,
  // Chapter 2→3 transition
  followFreshSoilAction,
  // Chapter 3
  inspectFreshSoilAction,
  searchNearbyAction,
  digAction,
  holdLightOverMarkerAction,
  cleanMarkerFragmentAction,
  readBuriedLedgerPageAction,
  listenAtSoilAction,
  speakWholeNameAction,
  buryNameAgainAction,
  // Chapter 4
  walkToNamelessRowAction,
  traceBlankStoneAction,
  listenToNamelessRowAction,
  assembleFirstRubbingsAction,
  markNamelessStoneAction,
  leaveStoneUnmarkedAction,
  ringStoneWithBlackSaltAction,
  cleanseMarkedNameAction,
  followSaltLineAction,
  inspectUncarvedPlotAction,
  searchAshBasinAction,
  bindUnwrittenPageAction,
  readStitchedPageAction,
  listenToLivingTraceAction,
  anchorLivingTraceAction,
  followLivingTraceAction,
  // Chapter 4→5 transition
  takeServicePathAction,
  // Chapter 5
  inspectNirasHouseAction,
  listenAtNirasDoorAction,
  dustNirasThresholdAction,
  callNiraSoftlyAction,
  askNiraWhatSheRemembersAction,
  slideStitchedPageUnderDoorAction,
  teachNiraQuietNameAction,
  enterNirasHouseAction,
];

export const gameActions: Record<string, GameAction> = Object.fromEntries(
  ACTION_LIST.map((a) => [a.id, a])
);

export function getVisibleActions(state: GameState): GameAction[] {
  return ACTION_LIST.filter((a) => a.visible(state));
}

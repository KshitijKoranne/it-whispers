import { describe, expect, it } from 'vitest';
import { getVisibleActions } from './actions';
import { filterInitialReleaseActions, isInitialReleaseComplete } from './initial-release';
import { createInitialGameState } from './state';
import { GameState } from './types';

function completeFirstArc(overrides: Partial<GameState> = {}): GameState {
  const initial = createInitialGameState();
  return {
    ...initial,
    chapter: 'Chapter 3 — Complete',
    currentLocation: 'East Row — Fresh Soil',
    flags: {
      chapter3Active: true,
      firstArcComplete: true,
      spokeEliasName: true,
    },
    progress: {
      endingChoice: 1,
    },
    resources: {
      ...initial.resources,
      handSpade: 1,
      markerFragment: 1,
      secondNameFragment: 1,
      buriedLedgerPage: 1,
    },
    ...overrides,
  };
}

function findAction(state: GameState, id: string) {
  const action = getVisibleActions(state).find((candidate) => candidate.id === id);
  expect(action).toBeDefined();
  return action!;
}

function enterChapter4(): GameState {
  return findAction(completeFirstArc(), 'walk-to-nameless-row').onExecute(completeFirstArc()).newState;
}

function traceFirstPattern(state: GameState): GameState {
  const trace = findAction(state, 'trace-blank-stone');
  const firstTrace = trace.onExecute(state).newState;
  const secondTrace = trace.onExecute(firstTrace).newState;
  return trace.onExecute(secondTrace).newState;
}

function hearNamelessMeasure(state: GameState): GameState {
  const listen = findAction(state, 'listen-to-nameless-row');
  const firstListen = listen.onExecute(state).newState;
  return listen.onExecute(firstListen).newState;
}

function assembleFirstName(): GameState {
  const ready = hearNamelessMeasure(traceFirstPattern(enterChapter4()));
  return findAction(ready, 'assemble-first-rubbings').onExecute(ready).newState;
}

function markMara(): GameState {
  const assembled = assembleFirstName();
  return findAction(assembled, 'mark-nameless-stone').onExecute(assembled).newState;
}

function leaveMaraUnmarked(): GameState {
  const assembled = assembleFirstName();
  return findAction(assembled, 'leave-stone-unmarked').onExecute(assembled).newState;
}

function wardMarkedStone(): GameState {
  const marked = markMara();
  return findAction(marked, 'ring-stone-with-black-salt').onExecute(marked).newState;
}

function cleanseMara(): GameState {
  const marked = markMara();
  return findAction(marked, 'cleanse-marked-name').onExecute(marked).newState;
}

function enterUncarvedPlot(fromState = wardMarkedStone()): GameState {
  return findAction(fromState, 'follow-the-salt-line').onExecute(fromState).newState;
}

function inspectPreparedAbsences(state: GameState): GameState {
  const inspect = findAction(state, 'inspect-uncarved-plot');
  return inspect.onExecute(inspect.onExecute(inspect.onExecute(state).newState).newState).newState;
}

function collectAshBasinClues(state = inspectPreparedAbsences(enterUncarvedPlot())): GameState {
  const search = findAction(state, 'search-the-ash-basin');
  return search.onExecute(search.onExecute(state).newState).newState;
}

function bindUnwrittenPage(state = collectAshBasinClues()): GameState {
  return findAction(state, 'bind-unwritten-page').onExecute(state).newState;
}

function readStitchedPage(state = bindUnwrittenPage()): GameState {
  return findAction(state, 'read-stitched-page').onExecute(state).newState;
}

function hearLivingTrace(state = readStitchedPage()): GameState {
  const listen = findAction(state, 'listen-to-living-trace');
  const firstListen = listen.onExecute(state).newState;
  return listen.onExecute(firstListen).newState;
}

function anchorLivingTrace(state = hearLivingTrace()): GameState {
  return findAction(state, 'anchor-the-living-trace').onExecute(state).newState;
}

function completeChapter4(state = anchorLivingTrace()): GameState {
  return findAction(state, 'follow-the-living-trace').onExecute(state).newState;
}

function enterChapter5(state = completeChapter4()): GameState {
  return findAction(state, 'take-the-service-path').onExecute(state).newState;
}

function inspectNirasHouse(state = enterChapter5()): GameState {
  const inspect = findAction(state, 'inspect-niras-house');
  const firstInspect = inspect.onExecute(state).newState;
  return inspect.onExecute(firstInspect).newState;
}

function hearNiraInside(state = inspectNirasHouse()): GameState {
  const listen = findAction(state, 'listen-at-niras-door');
  const firstListen = listen.onExecute(state).newState;
  return listen.onExecute(firstListen).newState;
}

function wardNirasThreshold(state = hearNiraInside()): GameState {
  return findAction(state, 'dust-niras-threshold').onExecute(state).newState;
}

function makeFirstContactWithNira(state = wardNirasThreshold()): GameState {
  return findAction(state, 'call-nira-softly').onExecute(state).newState;
}

function learnNirasMissingSound(state = makeFirstContactWithNira()): GameState {
  const ask = findAction(state, 'ask-nira-what-she-remembers');
  const firstAsk = ask.onExecute(state).newState;
  return ask.onExecute(firstAsk).newState;
}

function returnNirasFirstSound(state = learnNirasMissingSound()): GameState {
  return findAction(state, 'slide-stitched-page-under-door').onExecute(state).newState;
}

function teachNirasQuietName(state = returnNirasFirstSound()): GameState {
  return findAction(state, 'teach-nira-the-quiet-name').onExecute(state).newState;
}

function enterNirasKitchen(state = teachNirasQuietName()): GameState {
  return findAction(state, 'enter-niras-house').onExecute(state).newState;
}

function inspectNirasKitchen(state = enterNirasKitchen()): GameState {
  const inspect = findAction(state, 'inspect-niras-kitchen');
  const firstInspect = inspect.onExecute(state).newState;
  return inspect.onExecute(firstInspect).newState;
}

function hearNirasInsideAccount(state = enterNirasKitchen()): GameState {
  const talk = findAction(state, 'talk-to-nira-inside');
  const firstTalk = talk.onExecute(state).newState;
  return talk.onExecute(firstTalk).newState;
}

function findHearthCinder(state = inspectNirasKitchen()): GameState {
  const search = findAction(state, 'search-the-cold-hearth');
  const firstSearch = search.onExecute(state).newState;
  return search.onExecute(firstSearch).newState;
}

function enterChapter3(): GameState {
  const chapter2Complete = {
    ...completeFirstArc(),
    chapter: 'Chapter 2 — Complete',
    currentLocation: 'Fresh Soil Path',
    flags: {
      chapter2Active: true,
      chapter2Complete: true,
    },
    resources: {
      ...completeFirstArc().resources,
      handSpade: 1,
    },
    lightSystem: {
      ...completeFirstArc().lightSystem,
      lightLevel: 3,
      candleTurnsRemaining: 50,
    },
  };
  return findAction(chapter2Complete, 'follow-fresh-soil').onExecute(chapter2Complete).newState;
}

function uncoverFirstFragment(): GameState {
  const entered = enterChapter3();
  const inspected = findAction(entered, 'inspect-fresh-soil').onExecute(entered).newState;
  const dig = findAction(inspected, 'dig');
  const firstDig = dig.onExecute(inspected).newState;
  const secondDig = dig.onExecute(firstDig).newState;
  return dig.onExecute(secondDig).newState;
}

function uncoverBothFragments(): GameState {
  const firstFragment = uncoverFirstFragment();
  return findAction(firstFragment, 'dig').onExecute(firstFragment).newState;
}

function readFullMarkerName(): GameState {
  const bothFragments = uncoverBothFragments();
  const readMarker = findAction(bothFragments, 'hold-light-over-marker');
  const firstRead = readMarker.onExecute(bothFragments).newState;
  const secondRead = readMarker.onExecute(firstRead).newState;
  return readMarker.onExecute(secondRead).newState;
}

function findBuriedLedgerPage(): GameState {
  const entered = readFullMarkerName();
  const search = findAction(entered, 'search-nearby');
  const foundCloth = search.onExecute(entered).newState;
  return search.onExecute(foundCloth).newState;
}

function listenUntilFinalChoiceReady(state = readFullMarkerName()): GameState {
  const listen = findAction(state, 'listen-at-soil');
  const firstListen = listen.onExecute(state).newState;
  const secondListen = listen.onExecute(firstListen).newState;
  const thirdListen = listen.onExecute(secondListen).newState;
  return listen.onExecute(thirdListen).newState;
}

function chapter1ReadyForShed(overrides: Partial<GameState> = {}): GameState {
  const initial = createInitialGameState();
  return {
    ...initial,
    flags: {
      hasLookedAround: true,
      hasLitFirstCandle: true,
      hasDiscoveredPartialName: true,
      hasVisitedGate: true,
      hasReturnedFromGate: true,
    },
    repetition: {
      ...initial.repetition,
      firstGraveListenCount: 5,
      searchGroundCount: 3,
      firstGraveMarkerProgress: 4,
    },
    player: {
      ...initial.player,
      courage: 5,
    },
    ...overrides,
  };
}

function chapter2State(overrides: Partial<GameState> = {}): GameState {
  const initial = createInitialGameState();
  return {
    ...initial,
    chapter: 'Chapter 2',
    currentLocation: "Keeper's Shed",
    flags: {
      chapter2Active: true,
    },
    lightSystem: {
      ...initial.lightSystem,
      lightLevel: 1,
      candleTurnsRemaining: 4,
    },
    ...overrides,
  };
}

describe('Chapter 4 transition', () => {
  it('does not complete chapter 1 until the partial name has been spoken', () => {
    const discoveredButUnspoken = chapter1ReadyForShed();
    const goToShed = findAction(discoveredButUnspoken, 'go-to-shed-door');

    expect(goToShed.isDisabled?.(discoveredButUnspoken)).toBe(true);
    expect(goToShed.getDisabledReason?.(discoveredButUnspoken)).toBe(
      'the grave has not been answered.'
    );

    const spoken = {
      ...discoveredButUnspoken,
      flags: { ...discoveredButUnspoken.flags, hasSpokenPartialName: true },
    };

    expect(goToShed.isDisabled?.(spoken)).toBe(false);
  });

  it('hides the shed entry action after chapter 2 begins', () => {
    const atShedDoor = {
      ...chapter1ReadyForShed({ flags: { ...chapter1ReadyForShed().flags, hasSpokenPartialName: true } }),
      chapter: 'Chapter 1 — Complete',
      flags: {
        ...chapter1ReadyForShed().flags,
        hasSpokenPartialName: true,
        hasReachedShedDoor: true,
        chapter1Complete: true,
      },
    };

    const entered = findAction(atShedDoor, 'enter-shed').onExecute(atShedDoor).newState;

    expect(getVisibleActions(entered).some((action) => action.id === 'enter-shed')).toBe(false);
  });

  it('keeps Chapter 2 shed discovery actions visible but disabled in darkness', () => {
    const darkShed = chapter2State({
      progress: {
        holdShedLightCount: 3,
      },
      lightSystem: {
        ...createInitialGameState().lightSystem,
        lightLevel: 0,
      },
    });

    const shelves = findAction(darkShed, 'search-shelves');
    const workbench = findAction(darkShed, 'inspect-workbench');
    const desk = findAction(darkShed, 'inspect-desk');

    expect(shelves.isDisabled?.(darkShed)).toBe(true);
    expect(shelves.getDisabledReason?.(darkShed)).toBe('too dark to search the shelves.');
    expect(workbench.isDisabled?.(darkShed)).toBe(true);
    expect(workbench.getDisabledReason?.(darkShed)).toBe('too dark to inspect the workbench.');
    expect(desk.isDisabled?.(darkShed)).toBe(true);
    expect(desk.getDisabledReason?.(darkShed)).toBe('too dark to inspect the desk.');
  });

  it('requires the hand spade to force the shed drawer', () => {
    const nailsOnly = chapter2State({
      flags: {
        chapter2Active: true,
        hasFoundLockedDrawer: true,
      },
      resources: {
        ...createInitialGameState().resources,
        ironNails: 2,
      },
    });
    const forceDrawer = findAction(nailsOnly, 'force-drawer');

    expect(forceDrawer.isDisabled?.(nailsOnly)).toBe(true);
    expect(forceDrawer.getDisabledReason?.(nailsOnly)).toBe('you need the hand spade to force it.');

    const withSpade = {
      ...nailsOnly,
      resources: { ...nailsOnly.resources, handSpade: 1 },
    };

    expect(forceDrawer.isDisabled?.(withSpade)).toBe(false);
  });

  it('does not show candle upkeep during the Chapter 2 to Chapter 3 transition', () => {
    const transition = chapter2State({
      chapter: 'Chapter 2 — Complete',
      flags: {
        chapter1Complete: true,
        chapter2Active: true,
        chapter2Complete: true,
        hasLitFirstCandle: true,
      },
      resources: {
        ...createInitialGameState().resources,
        matches: 1,
        wax: 1,
      },
      lightSystem: {
        ...createInitialGameState().lightSystem,
        lightLevel: 1,
      },
    });

    expect(getVisibleActions({ ...transition, lightSystem: { ...transition.lightSystem, lightLevel: 0 } }).some(
      (action) => action.id === 'relight-candle'
    )).toBe(false);
    expect(getVisibleActions(transition).some((action) => action.id === 'steady-candle')).toBe(false);
    expect(getVisibleActions(transition).some((action) => action.id === 'follow-fresh-soil')).toBe(true);
  });

  it('unlocks the nameless row after the first arc is complete', () => {
    const state = completeFirstArc();

    const action = getVisibleActions(state).find(
      (candidate) => candidate.id === 'walk-to-nameless-row'
    );

    expect(action).toBeDefined();
    expect(action?.isDisabled?.(state)).toBe(false);
  });

  it('caps the initial release after the first three chapters', () => {
    const state = completeFirstArc();
    const allVisibleIds = getVisibleActions(state).map((action) => action.id);
    const releaseVisibleIds = filterInitialReleaseActions(state, getVisibleActions(state)).map(
      (action) => action.id
    );

    expect(isInitialReleaseComplete(state)).toBe(true);
    expect(allVisibleIds).toContain('walk-to-nameless-row');
    expect(releaseVisibleIds).not.toContain('walk-to-nameless-row');
  });

  it('does not cap content before the first arc is complete', () => {
    const state = enterChapter3();

    expect(isInitialReleaseComplete(state)).toBe(false);
    expect(filterInitialReleaseActions(state, getVisibleActions(state))).toEqual(getVisibleActions(state));
  });

  it('moves the player into chapter 4 and grants grave chalk', () => {
    const state = completeFirstArc();
    const action = getVisibleActions(state).find(
      (candidate) => candidate.id === 'walk-to-nameless-row'
    );

    const { newState } = action!.onExecute(state);

    expect(newState.chapter).toBe('Chapter 4');
    expect(newState.currentLocation).toBe('Nameless Row');
    expect(newState.flags.chapter4Active).toBe(true);
    expect(newState.resources.graveChalk).toBe(1);
    expect(newState.eventLog.at(-1)?.text).toBe('you take the grave chalk.');
  });

  it('lets chapter 4 tracing create rubbings and reveal the row pattern', () => {
    const entered = enterChapter4();

    const trace = getVisibleActions(entered).find((candidate) => candidate.id === 'trace-blank-stone');
    expect(trace).toBeDefined();

    const firstTrace = trace!.onExecute(entered).newState;
    const secondTrace = trace!.onExecute(firstTrace).newState;
    const thirdTrace = trace!.onExecute(secondTrace).newState;

    expect(firstTrace.resources.graveRubbings).toBe(1);
    expect(secondTrace.resources.graveRubbings).toBe(2);
    expect(thirdTrace.flags.understandsNamelessRowPattern).toBe(true);
    expect(thirdTrace.repetition.blankStoneTraceProgress).toBe(3);
    expect(trace!.isDisabled?.(thirdTrace)).toBe(true);
  });

  it('requires both rubbings and measure before assembling the first hidden name', () => {
    const patterned = traceFirstPattern(enterChapter4());
    const assembleBeforeListening = findAction(patterned, 'assemble-first-rubbings');

    expect(assembleBeforeListening.isDisabled?.(patterned)).toBe(true);
    expect(assembleBeforeListening.getDisabledReason?.(patterned)).toBe(
      'the rubbings have shape, but no measure.'
    );

    const ready = hearNamelessMeasure(patterned);
    const assemble = findAction(ready, 'assemble-first-rubbings');
    const assembled = assemble.onExecute(ready).newState;

    expect(assembled.flags.assembledFirstNamelessName).toBe(true);
    expect(assembled.resources.namesKnownCount).toBe(1);
    expect(assembled.player.courage).toBe(4);
  });

  it('lets the player mark the first nameless stone and creates black salt with attention', () => {
    const marked = markMara();

    expect(marked.flags.markedMaraName).toBe(true);
    expect(marked.flags.chapter4FirstChoiceMade).toBe(true);
    expect(marked.resources.blackSalt).toBe(1);
    expect(marked.repetition.deadAttention).toBe(2);
  });

  it('hides both first nameless choice actions once one choice has been made', () => {
    const marked = markMara();
    const left = leaveMaraUnmarked();

    expect(getVisibleActions(marked).some((action) => action.id === 'mark-nameless-stone')).toBe(false);
    expect(getVisibleActions(marked).some((action) => action.id === 'leave-stone-unmarked')).toBe(false);
    expect(getVisibleActions(marked).some((action) => action.id === 'ring-stone-with-black-salt')).toBe(true);

    expect(getVisibleActions(left).some((action) => action.id === 'mark-nameless-stone')).toBe(false);
    expect(getVisibleActions(left).some((action) => action.id === 'leave-stone-unmarked')).toBe(false);
    expect(getVisibleActions(left).some((action) => action.id === 'ring-stone-with-black-salt')).toBe(true);
  });

  it('lets the player leave the first nameless stone unmarked and creates a quieter branch', () => {
    const preChoice = assembleFirstName();

    const leave = findAction(preChoice, 'leave-stone-unmarked');
    const left = leave.onExecute({
      ...preChoice,
      repetition: { ...preChoice.repetition, deadAttention: 3 },
      player: { ...preChoice.player, courage: 4 },
    }).newState;

    expect(left.flags.leftMaraUnmarked).toBe(true);
    expect(left.flags.chapter4FirstChoiceMade).toBe(true);
    expect(left.resources.blackSalt).toBe(1);
    expect(left.repetition.deadAttention).toBe(2);
    expect(left.player.courage).toBe(5);
  });

  it('spends black salt to ward the chosen stone and reduce pressure', () => {
    const marked = {
      ...markMara(),
      repetition: {
        ...markMara().repetition,
        deadAttention: 5,
        whisperLevel: 4,
      },
      player: {
        ...markMara().player,
        courage: 3,
      },
    };

    const ward = findAction(marked, 'ring-stone-with-black-salt');
    const warded = ward.onExecute(marked).newState;

    expect(warded.flags.blackSaltWardPlaced).toBe(true);
    expect(warded.resources.blackSalt).toBe(0);
    expect(warded.repetition.blackSaltWardStrength).toBe(1);
    expect(warded.repetition.deadAttention).toBe(3);
    expect(warded.repetition.whisperLevel).toBe(3);
    expect(warded.player.courage).toBe(4);
    expect(ward.isDisabled?.(warded)).toBe(true);
  });

  it('lets marked-name players cleanse the name at a higher danger cost', () => {
    const cleansed = cleanseMara();

    expect(cleansed.flags.maraNameCleansed).toBe(true);
    expect(cleansed.resources.blackSalt).toBe(0);
    expect(cleansed.resources.namesKnownCount).toBe(0);
    expect(cleansed.repetition.deadAttention).toBe(5);
    expect(cleansed.repetition.whisperLevel).toBe(8);
    expect(cleansed.player.courage).toBe(3);
  });

  it('does not offer name cleansing when Mara was left unmarked', () => {
    const unmarked = leaveMaraUnmarked();

    expect(getVisibleActions(unmarked).some((action) => action.id === 'cleanse-marked-name')).toBe(false);
    expect(getVisibleActions(unmarked).some((action) => action.id === 'ring-stone-with-black-salt')).toBe(true);
  });

  it('unlocks the uncarved plot after a black salt ward', () => {
    const warded = wardMarkedStone();
    const follow = findAction(warded, 'follow-the-salt-line');
    const uncarved = follow.onExecute(warded).newState;

    expect(uncarved.currentLocation).toBe('Uncarved Plot');
    expect(uncarved.flags.chapter4MiddleActive).toBe(true);
    expect(getVisibleActions(uncarved).some((action) => action.id === 'inspect-uncarved-plot')).toBe(true);
  });

  it('hides nameless row actions after moving into the uncarved plot', () => {
    const uncarved = enterUncarvedPlot();
    const visibleIds = getVisibleActions(uncarved).map((action) => action.id);

    expect(visibleIds).not.toContain('trace-blank-stone');
    expect(visibleIds).not.toContain('listen-to-nameless-row');
    expect(visibleIds).not.toContain('assemble-first-rubbings');
    expect(visibleIds).not.toContain('mark-nameless-stone');
    expect(visibleIds).not.toContain('leave-stone-unmarked');
    expect(visibleIds).not.toContain('ring-stone-with-black-salt');
    expect(visibleIds).not.toContain('cleanse-marked-name');
    expect(visibleIds).toContain('inspect-uncarved-plot');
    expect(visibleIds).toContain('search-the-ash-basin');
  });

  it('also unlocks the uncarved plot after cleansing MARA', () => {
    const cleansed = cleanseMara();
    const uncarved = findAction(cleansed, 'follow-the-salt-line').onExecute(cleansed).newState;

    expect(uncarved.currentLocation).toBe('Uncarved Plot');
    expect(uncarved.flags.chapter4MiddleActive).toBe(true);
  });

  it('does not let the buried marker reveal the second half before the second fragment is uncovered', () => {
    const firstFragment = uncoverFirstFragment();
    const readMarker = findAction(firstFragment, 'hold-light-over-marker');
    const firstRead = readMarker.onExecute(firstFragment).newState;

    expect(firstRead.flags.knowsSecondFragment).not.toBe(true);
    expect(readMarker.isDisabled?.(firstRead)).toBe(true);
    expect(readMarker.getDisabledReason?.(firstRead)).toBe('the second fragment is still buried.');
  });

  it('keeps the bury ending hidden until the final-choice note is read', () => {
    const pageFound = findBuriedLedgerPage();
    const firstPageRead = findAction(pageFound, 'read-buried-ledger-page').onExecute(pageFound).newState;
    const finalChoiceReady = listenUntilFinalChoiceReady(firstPageRead);

    expect(finalChoiceReady.flags.understoodSplitCustom).toBe(true);
    expect(finalChoiceReady.flags.knowsTheFinalChoice).not.toBe(true);
    expect(getVisibleActions(finalChoiceReady).some((action) => action.id === 'bury-name-again')).toBe(false);

    const secondPageRead = findAction(firstPageRead, 'read-buried-ledger-page').onExecute(firstPageRead).newState;
    const fullyReady = listenUntilFinalChoiceReady(secondPageRead);

    expect(fullyReady.flags.knowsTheFinalChoice).toBe(true);
    expect(getVisibleActions(fullyReady).some((action) => action.id === 'bury-name-again')).toBe(true);
  });

  it('requires understanding the uncarved plot before searching the ash basin', () => {
    const uncarved = enterUncarvedPlot();
    const searchBeforeInspecting = findAction(uncarved, 'search-the-ash-basin');

    expect(searchBeforeInspecting.isDisabled?.(uncarved)).toBe(true);
    expect(searchBeforeInspecting.getDisabledReason?.(uncarved)).toBe(
      'the empty plot does not make sense yet.'
    );

    const inspect = findAction(uncarved, 'inspect-uncarved-plot');
    const firstInspect = inspect.onExecute(uncarved).newState;
    const secondInspect = inspect.onExecute(firstInspect).newState;
    const thirdInspect = inspect.onExecute(secondInspect).newState;

    expect(thirdInspect.flags.understandsPreparedAbsences).toBe(true);
    expect(thirdInspect.repetition.uncarvedPlotInspectCount).toBe(3);
  });

  it('finds keeper thread and the unwritten ledger page in the ash basin', () => {
    const uncarved = enterUncarvedPlot();
    const inspected = inspectPreparedAbsences(uncarved);
    const search = findAction(inspected, 'search-the-ash-basin');

    const foundThread = search.onExecute(inspected).newState;
    const foundPage = search.onExecute(foundThread).newState;

    expect(foundThread.resources.keeperThread).toBe(1);
    expect(foundThread.flags.foundKeeperThread).toBe(true);
    expect(foundPage.resources.unwrittenLedgerPage).toBe(1);
    expect(foundPage.flags.foundUnwrittenLedgerPage).toBe(true);
    expect(foundPage.flags.chapter4MiddleClueReady).toBe(true);
    expect(search.isDisabled?.(foundPage)).toBe(true);
  });

  it('only offers binding after both ash basin clues are found', () => {
    const uncarved = enterUncarvedPlot();
    expect(getVisibleActions(uncarved).some((action) => action.id === 'bind-unwritten-page')).toBe(false);

    const inspected = inspectPreparedAbsences(uncarved);
    const foundThread = findAction(inspected, 'search-the-ash-basin').onExecute(inspected).newState;
    expect(getVisibleActions(foundThread).some((action) => action.id === 'bind-unwritten-page')).toBe(false);

    const ready = collectAshBasinClues(inspected);
    const bind = findAction(ready, 'bind-unwritten-page');

    expect(bind.isDisabled?.(ready)).toBe(false);
  });

  it('binds the unwritten page into the first reserved living-name clue', () => {
    const ready = collectAshBasinClues();
    const bind = findAction(ready, 'bind-unwritten-page');
    const bound = bind.onExecute(ready).newState;

    expect(bound.flags.stitchedUnwrittenLedgerPage).toBe(true);
    expect(bound.flags.understandsLedgerPrewritesNames).toBe(true);
    expect(bound.resources.keeperThread).toBe(0);
    expect(bound.resources.unwrittenLedgerPage).toBe(0);
    expect(bound.resources.stitchedLedgerPage).toBe(1);
    expect(bound.progress.reservedLivingNamesKnown).toBe(1);
    expect(bound.repetition.deadAttention).toBe(ready.repetition.deadAttention + 1);
    expect(bound.repetition.whisperLevel).toBe(ready.repetition.whisperLevel + 2);
    expect(bound.player.courage).toBe(ready.player.courage - 1);
    expect(bind.isDisabled?.(bound)).toBe(true);
  });

  it('only offers the stitched page reading after the page has been bound', () => {
    const ready = collectAshBasinClues();
    expect(getVisibleActions(ready).some((action) => action.id === 'read-stitched-page')).toBe(false);

    const bound = bindUnwrittenPage(ready);
    const read = findAction(bound, 'read-stitched-page');

    expect(read.isDisabled?.(bound)).toBe(false);
  });

  it('reveals the first reserved living name and creates a living-name trace', () => {
    const bound = bindUnwrittenPage();
    const read = findAction(bound, 'read-stitched-page');
    const revealed = read.onExecute(bound).newState;

    expect(revealed.flags.readStitchedLedgerPage).toBe(true);
    expect(revealed.flags.revealedNiraLivingName).toBe(true);
    expect(revealed.resources.stitchedLedgerPage).toBe(1);
    expect(revealed.resources.livingNameTrace).toBe(1);
    expect(revealed.progress.reservedLivingNamesKnown).toBe(1);
    expect(revealed.repetition.deadAttention).toBe(bound.repetition.deadAttention + 2);
    expect(revealed.repetition.whisperLevel).toBe(bound.repetition.whisperLevel + 1);
    expect(revealed.player.courage).toBe(bound.player.courage - 1);
    expect(read.isDisabled?.(revealed)).toBe(true);
  });

  it('does not offer the Chapter 4 ending bridge before Nira is revealed', () => {
    const bound = bindUnwrittenPage();
    const visibleIds = getVisibleActions(bound).map((action) => action.id);

    expect(visibleIds).not.toContain('listen-to-living-trace');
    expect(visibleIds).not.toContain('anchor-the-living-trace');
    expect(visibleIds).not.toContain('follow-the-living-trace');
    expect(visibleIds).not.toContain('take-the-service-path');
  });

  it('requires listening to the living trace before it can be anchored', () => {
    const revealed = readStitchedPage();
    const listen = findAction(revealed, 'listen-to-living-trace');

    const firstListen = listen.onExecute(revealed).newState;
    expect(firstListen.flags.niraTraceHeard).not.toBe(true);
    expect(getVisibleActions(firstListen).some((action) => action.id === 'anchor-the-living-trace')).toBe(false);

    const secondListen = listen.onExecute(firstListen).newState;
    const anchor = findAction(secondListen, 'anchor-the-living-trace');

    expect(secondListen.flags.niraTraceHeard).toBe(true);
    expect(secondListen.repetition.livingTraceListenCount).toBe(2);
    expect(anchor.isDisabled?.(secondListen)).toBe(false);
  });

  it('anchors Nira without spending the stitched page or living trace', () => {
    const heard = hearLivingTrace();
    const anchor = findAction(heard, 'anchor-the-living-trace');
    const anchored = anchor.onExecute(heard).newState;

    expect(anchored.flags.niraTraceAnchored).toBe(true);
    expect(anchored.resources.stitchedLedgerPage).toBe(1);
    expect(anchored.resources.livingNameTrace).toBe(1);
    expect(anchored.resources.livingNameAnchor).toBe(1);
    expect(anchored.player.courage).toBe(Math.min(heard.player.courage + 1, heard.player.maxCourage));
    expect(anchor.isDisabled?.(anchored)).toBe(true);
  });

  it('does not unlock Chapter 5 until Chapter 4 is completed through the living trace', () => {
    const anchored = anchorLivingTrace();

    expect(getVisibleActions(anchored).some((action) => action.id === 'take-the-service-path')).toBe(false);

    const follow = findAction(anchored, 'follow-the-living-trace');
    const completed = follow.onExecute(anchored).newState;

    expect(completed.chapter).toBe('Chapter 4 — Complete');
    expect(completed.currentLocation).toBe('Cemetery Boundary');
    expect(completed.flags.chapter4Complete).toBe(true);
    expect(completed.flags.chapter5Unlocked).toBe(true);
    expect(getVisibleActions(completed).some((action) => action.id === 'take-the-service-path')).toBe(true);
  });

  it('starts Chapter 5 only from the anchored cemetery boundary path', () => {
    const completed = completeChapter4();
    const enter = findAction(completed, 'take-the-service-path');
    const chapter5 = enter.onExecute(completed).newState;

    expect(chapter5.chapter).toBe('Chapter 5');
    expect(chapter5.currentLocation).toBe("Nira's House");
    expect(chapter5.flags.chapter5Active).toBe(true);
    expect(getVisibleActions(chapter5).some((action) => action.id === 'take-the-service-path')).toBe(false);
  });

  it('starts Chapter 5 at Nira house with only inspection available first', () => {
    const chapter5 = enterChapter5();
    const visibleIds = getVisibleActions(chapter5).map((action) => action.id);

    expect(visibleIds).toContain('inspect-niras-house');
    expect(visibleIds).not.toContain('listen-at-niras-door');
    expect(visibleIds).not.toContain('dust-niras-threshold');
    expect(visibleIds).not.toContain('call-nira-softly');
  });

  it('unlocks Nira door listening only after the house window is seen', () => {
    const chapter5 = enterChapter5();
    const inspect = findAction(chapter5, 'inspect-niras-house');
    const firstInspect = inspect.onExecute(chapter5).newState;

    expect(firstInspect.flags.sawNiraWindow).toBe(true);
    expect(getVisibleActions(firstInspect).some((action) => action.id === 'listen-at-niras-door')).toBe(true);

    const secondInspect = inspect.onExecute(firstInspect).newState;
    expect(secondInspect.resources.thresholdAsh).toBe(1);
    expect(secondInspect.flags.foundNiraThresholdAsh).toBe(true);
    expect(inspect.isDisabled?.(secondInspect)).toBe(true);
  });

  it('requires hearing Nira inside before the threshold can be warded', () => {
    const inspected = inspectNirasHouse();
    const visibleIds = getVisibleActions(inspected).map((action) => action.id);

    expect(visibleIds).toContain('listen-at-niras-door');
    expect(visibleIds).not.toContain('dust-niras-threshold');

    const heard = hearNiraInside(inspected);
    const ward = findAction(heard, 'dust-niras-threshold');

    expect(heard.flags.heardNiraInside).toBe(true);
    expect(heard.repetition.niraDoorListenCount).toBe(2);
    expect(ward.isDisabled?.(heard)).toBe(false);
  });

  it('does not ward Nira threshold without the living-name anchor and threshold ash', () => {
    const heard = hearNiraInside();
    const ward = findAction(heard, 'dust-niras-threshold');

    const noAsh = {
      ...heard,
      resources: { ...heard.resources, thresholdAsh: 0 },
    };
    expect(ward.isDisabled?.(noAsh)).toBe(true);
    expect(ward.getDisabledReason?.(noAsh)).toBe('the threshold ash has not been found.');

    const noAnchor = {
      ...heard,
      resources: { ...heard.resources, livingNameAnchor: 0 },
    };
    expect(ward.isDisabled?.(noAnchor)).toBe(true);
    expect(ward.getDisabledReason?.(noAnchor)).toBe('the living-name anchor is needed here.');
  });

  it('wards the threshold before Nira can safely answer', () => {
    const heard = hearNiraInside();
    expect(getVisibleActions(heard).some((action) => action.id === 'call-nira-softly')).toBe(false);

    const warded = wardNirasThreshold(heard);
    expect(warded.flags.niraThresholdWarded).toBe(true);
    expect(warded.resources.thresholdAsh).toBe(0);
    expect(getVisibleActions(warded).some((action) => action.id === 'call-nira-softly')).toBe(true);
  });

  it('makes first contact with Nira after the threshold is warded', () => {
    const warded = wardNirasThreshold();
    const call = findAction(warded, 'call-nira-softly');
    const answered = call.onExecute(warded).newState;

    expect(answered.flags.niraAnsweredFromInside).toBe(true);
    expect(answered.flags.chapter5FirstContact).toBe(true);
    expect(answered.player.courage).toBe(Math.min(warded.player.courage + 1, warded.player.maxCourage));
    expect(call.isDisabled?.(answered)).toBe(true);
  });

  it('offers a new non-disabled action after first contact with Nira', () => {
    const contacted = makeFirstContactWithNira();
    const ask = findAction(contacted, 'ask-nira-what-she-remembers');

    expect(ask.isDisabled?.(contacted)).toBe(false);
    expect(getVisibleActions(contacted).some((action) => action.id === 'enter-niras-house')).toBe(false);
  });

  it('requires hearing what Nira lost before using the stitched page', () => {
    const contacted = makeFirstContactWithNira();
    expect(getVisibleActions(contacted).some((action) => action.id === 'slide-stitched-page-under-door')).toBe(false);

    const ask = findAction(contacted, 'ask-nira-what-she-remembers');
    const firstAsk = ask.onExecute(contacted).newState;
    expect(firstAsk.flags.niraFirstSoundMissing).not.toBe(true);
    expect(getVisibleActions(firstAsk).some((action) => action.id === 'slide-stitched-page-under-door')).toBe(false);

    const secondAsk = ask.onExecute(firstAsk).newState;
    expect(secondAsk.flags.niraFirstSoundMissing).toBe(true);
    expect(secondAsk.repetition.niraMemoryListenCount).toBe(2);
    expect(getVisibleActions(secondAsk).some((action) => action.id === 'slide-stitched-page-under-door')).toBe(true);
  });

  it('returns Nira first sound without spending the bridge artifacts', () => {
    const ready = learnNirasMissingSound();
    const slide = findAction(ready, 'slide-stitched-page-under-door');
    const returned = slide.onExecute(ready).newState;

    expect(returned.flags.niraFirstSoundReturned).toBe(true);
    expect(returned.resources.niraFirstSound).toBe(1);
    expect(returned.resources.stitchedLedgerPage).toBe(1);
    expect(returned.resources.livingNameTrace).toBe(1);
    expect(returned.resources.livingNameAnchor).toBe(1);
    expect(slide.isDisabled?.(returned)).toBe(true);
  });

  it('does not return Nira first sound without the stitched page or anchor', () => {
    const ready = learnNirasMissingSound();
    const slide = findAction(ready, 'slide-stitched-page-under-door');

    const noPage = {
      ...ready,
      resources: { ...ready.resources, stitchedLedgerPage: 0 },
    };
    expect(slide.isDisabled?.(noPage)).toBe(true);
    expect(slide.getDisabledReason?.(noPage)).toBe('the stitched page is needed to catch the theft.');

    const noAnchor = {
      ...ready,
      resources: { ...ready.resources, livingNameAnchor: 0 },
    };
    expect(slide.isDisabled?.(noAnchor)).toBe(true);
    expect(slide.getDisabledReason?.(noAnchor)).toBe('the living-name anchor is needed to hold the sound.');
  });

  it('teaches Nira the quiet name before the door can open', () => {
    const returned = returnNirasFirstSound();
    expect(getVisibleActions(returned).some((action) => action.id === 'enter-niras-house')).toBe(false);

    const teach = findAction(returned, 'teach-nira-the-quiet-name');
    const taught = teach.onExecute(returned).newState;

    expect(taught.flags.niraQuietNameKnown).toBe(true);
    expect(getVisibleActions(taught).some((action) => action.id === 'enter-niras-house')).toBe(true);
  });

  it('enters Nira house only after her quiet name is known', () => {
    const taught = teachNirasQuietName();
    const enter = findAction(taught, 'enter-niras-house');
    const inside = enter.onExecute(taught).newState;

    expect(inside.currentLocation).toBe("Nira's Kitchen");
    expect(inside.flags.niraDoorOpened).toBe(true);
    expect(inside.flags.chapter5HouseEntered).toBe(true);
    expect(getVisibleActions(inside).some((action) => action.id === 'enter-niras-house')).toBe(false);
  });

  it('starts the Nira kitchen interior and hides exterior door actions', () => {
    const inside = enterNirasKitchen();
    const visibleIds = getVisibleActions(inside).map((action) => action.id);

    expect(inside.currentLocation).toBe("Nira's Kitchen");
    expect(visibleIds).toContain('inspect-niras-kitchen');
    expect(visibleIds).toContain('talk-to-nira-inside');
    expect(visibleIds).not.toContain('inspect-niras-house');
    expect(visibleIds).not.toContain('listen-at-niras-door');
    expect(visibleIds).not.toContain('dust-niras-threshold');
    expect(visibleIds).not.toContain('call-nira-softly');
    expect(visibleIds).not.toContain('slide-stitched-page-under-door');
    expect(visibleIds).not.toContain('teach-nira-the-quiet-name');
  });

  it('uses kitchen inspection to reveal ledger scratches before the hearth search', () => {
    const inside = enterNirasKitchen();
    expect(getVisibleActions(inside).some((action) => action.id === 'search-the-cold-hearth')).toBe(false);

    const inspect = findAction(inside, 'inspect-niras-kitchen');
    const firstInspect = inspect.onExecute(inside).newState;
    expect(firstInspect.flags.sawNiraKitchenPins).toBe(true);
    expect(getVisibleActions(firstInspect).some((action) => action.id === 'search-the-cold-hearth')).toBe(false);

    const secondInspect = inspect.onExecute(firstInspect).newState;
    expect(secondInspect.flags.sawKitchenLedgerScratches).toBe(true);
    expect(secondInspect.repetition.niraKitchenInspectCount).toBe(2);
    expect(getVisibleActions(secondInspect).some((action) => action.id === 'search-the-cold-hearth')).toBe(true);
  });

  it('requires two talks before Nira identifies the ledger visitor', () => {
    const inside = enterNirasKitchen();
    const talk = findAction(inside, 'talk-to-nira-inside');

    const firstTalk = talk.onExecute(inside).newState;
    expect(firstTalk.flags.niraDescribedLedgerVisitor).not.toBe(true);

    const secondTalk = talk.onExecute(firstTalk).newState;
    expect(secondTalk.flags.niraDescribedLedgerVisitor).toBe(true);
    expect(secondTalk.repetition.niraInsideTalkCount).toBe(2);
    expect(talk.isDisabled?.(secondTalk)).toBe(true);
  });

  it('finds the hearth cinder only after the scratched kitchen floor is understood', () => {
    const inspected = inspectNirasKitchen();
    const search = findAction(inspected, 'search-the-cold-hearth');

    const firstSearch = search.onExecute(inspected).newState;
    expect(firstSearch.flags.foundHearthCinder).not.toBe(true);

    const secondSearch = search.onExecute(firstSearch).newState;
    expect(secondSearch.flags.foundHearthCinder).toBe(true);
    expect(secondSearch.resources.hearthCinder).toBe(1);
    expect(search.isDisabled?.(secondSearch)).toBe(true);
  });

  it('reveals the house ledger mark only after Nira account and hearth cinder', () => {
    const onlyNiraAccount = hearNirasInsideAccount();
    const onlyHearthCinder = findHearthCinder();

    expect(getVisibleActions(onlyNiraAccount).some((action) => action.id === 'reveal-the-house-ledger-mark')).toBe(false);
    expect(getVisibleActions(onlyHearthCinder).some((action) => action.id === 'reveal-the-house-ledger-mark')).toBe(false);

    const ready = hearNirasInsideAccount(onlyHearthCinder);
    const reveal = findAction(ready, 'reveal-the-house-ledger-mark');
    const revealed = reveal.onExecute(ready).newState;

    expect(revealed.flags.houseLedgerMarkRevealed).toBe(true);
    expect(revealed.flags.chapter5MiddleActive).toBe(true);
    expect(revealed.resources.houseLedgerMark).toBe(1);
    expect(revealed.resources.hearthCinder).toBe(1);
    expect(reveal.isDisabled?.(revealed)).toBe(true);
  });
});

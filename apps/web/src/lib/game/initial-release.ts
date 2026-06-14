import { GameAction, GameState } from './types';

const POST_FIRST_ARC_ACTION_IDS = new Set([
  'walk-to-nameless-row',
  'trace-blank-stone',
  'listen-to-nameless-row',
  'assemble-first-rubbings',
  'mark-nameless-stone',
  'leave-stone-unmarked',
  'ring-stone-with-black-salt',
  'cleanse-marked-name',
  'follow-the-salt-line',
  'inspect-uncarved-plot',
  'search-the-ash-basin',
  'bind-unwritten-page',
  'read-stitched-page',
  'listen-to-living-trace',
  'anchor-the-living-trace',
  'follow-the-living-trace',
  'take-the-service-path',
  'inspect-niras-house',
  'listen-at-niras-door',
  'dust-niras-threshold',
  'call-nira-softly',
  'ask-nira-what-she-remembers',
  'slide-stitched-page-under-door',
  'teach-nira-the-quiet-name',
  'enter-niras-house',
  'inspect-niras-kitchen',
  'talk-to-nira-inside',
  'search-the-cold-hearth',
  'reveal-the-house-ledger-mark',
]);

export function isInitialReleaseComplete(state: GameState): boolean {
  return state.flags['firstArcComplete'] === true && state.flags['chapter4Active'] !== true;
}

export function filterInitialReleaseActions(
  state: GameState,
  actions: GameAction[]
): GameAction[] {
  if (!isInitialReleaseComplete(state)) return actions;
  return actions.filter((action) => !POST_FIRST_ARC_ACTION_IDS.has(action.id));
}

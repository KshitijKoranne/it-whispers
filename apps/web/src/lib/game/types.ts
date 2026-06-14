// Core game type definitions for It Whispers

export type NightPhase =
  | 'Dusk'
  | 'Dark'
  | 'Deep Night'
  | 'Witching Hour'
  | 'Dead Hour'
  | 'Thinning Dark'
  | 'Dawn';

export interface PlayerState {
  courage: number;
  maxCourage: number;
  wounds: number;
  maxWounds: number;
  isAlive: boolean;
  endingId: string | null;
}

export interface Resources {
  candle: number;
  wax: number;
  matches: number;
  oil: number;
  salt: number;
  ironNails: number;
  rations: number;
  cloth: number;
  boneTokens: number;
  namesKnownCount: number;
  // Chapter 2
  rag: number;
  twine: number;
  crackedLantern: number;
  handSpade: number;
  cemeteryMap: number;
  keeperNote: number;
  // Chapter 3
  markerFragment: number;
  secondNameFragment: number;
  clothStrip: number;
  buriedLedgerPage: number;
  // Chapter 4
  graveChalk: number;
  graveRubbings: number;
  blackSalt: number;
  keeperThread: number;
  unwrittenLedgerPage: number;
  stitchedLedgerPage: number;
  livingNameTrace: number;
  livingNameAnchor: number;
  thresholdAsh: number;
}

export interface Tools {
  hasLantern: boolean;
  hasShovel: boolean;
  hasLedger: boolean;
  hasKeeperKey: boolean;
  hasRustyKnife: boolean;
  hasBellCharm: boolean;
}

export interface LightSystem {
  lightLevel: number; // 0=darkness, 1=weak candle, 2=steady candle, 3=lantern
  candleStability: number;
  candleTurnsRemaining: number;
  lanternOilRemaining: number;
}

export interface RepetitionVariables {
  whisperLevel: number;
  deadAttention: number;
  firstGraveListenCount: number;
  searchGroundCount: number;
  firstGraveMarkerProgress: number;
  shedSearchProgress: number;
  shedSecurity: number;
  ledgerReadProgress: number;
  ch3DigProgress: number;
  ch3GatheringProgress: number;
  blankStoneTraceProgress: number;
  namelessRowListenCount: number;
  blackSaltWardStrength: number;
  uncarvedPlotInspectCount: number;
  ashBasinSearchCount: number;
  livingTraceListenCount: number;
  niraHouseInspectCount: number;
  niraDoorListenCount: number;
}

export interface CombatState {
  inCombat: boolean;
  enemyId: string | null;
  enemyHealth: number;
  enemyType: string | null;
  playerGuarding: boolean;
  combatTurn: number;
  canFlee: boolean;
}

export type GraveState = 'silent' | 'whispering' | 'calm' | 'hostile' | 'resolved';

export interface Grave {
  graveId: string;
  displayName: string;
  trueName: string | null;
  location: string;
  state: GraveState;
  trustLevel: number;
  hasBeenListenedTo: boolean;
  requiresOffering: boolean;
  requiresName: boolean;
  reward: string | null;
  danger: number;
}

export interface GameSettings {
  sound: boolean;
  music: boolean;
  textSpeed: 'instant' | 'normal' | 'slow';
  reducedMotion: boolean;
}

export interface EventLogEntry {
  id: string;
  text: string;
  timestamp: number;
  type: 'story' | 'action' | 'whisper' | 'danger' | 'resource';
}

export interface GameState {
  chapter: string;
  currentLocation: string;
  timeOfNightMinutes: number;
  nightPhase: NightPhase;
  eventLog: EventLogEntry[];
  resources: Resources;
  tools: Tools;
  player: PlayerState;
  flags: Record<string, boolean>;
  progress: Record<string, number>;
  graves: Record<string, Grave>;
  combat: CombatState;
  lightSystem: LightSystem;
  repetition: RepetitionVariables;
  settings: GameSettings;
  meta: {
    lastSaved: number;
    gameVersion: string;
  };
}

export interface ActionRequirement {
  type: 'resource' | 'tool' | 'flag' | 'progress';
  key: string;
  value: number | boolean;
  comparison?: 'gte' | 'lte' | 'eq';
}

export interface ActionEffect {
  type: 'resource' | 'tool' | 'flag' | 'progress' | 'player' | 'light' | 'repetition';
  key: string;
  value: number | boolean | string;
  operation?: 'set' | 'add' | 'subtract';
}

export interface GameAction {
  id: string;
  label: string;
  description?: string;
  cooldownSeconds: number;
  inGameMinutesPassed: number;
  requirements?: ActionRequirement[];
  effects?: ActionEffect[];
  visible: (state: GameState) => boolean;
  isDisabled?: (state: GameState) => boolean;
  getDisabledReason?: (state: GameState) => string;
  repeatable: boolean;
  progressKey?: string;
  onExecute: (state: GameState) => {
    newState: GameState;
    logText: string;
  };
}

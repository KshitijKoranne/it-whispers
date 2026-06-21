'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameState } from '@/lib/game/types';
import { createInitialGameState, addLogEntry, tickAfterAction } from '@/lib/game/state';
import { saveGame, loadGame, loadSettings, saveSettings, deleteSave } from '@/lib/game/save';
import { getVisibleActions } from '@/lib/game/actions';
import { filterInitialReleaseActions, isInitialReleaseComplete } from '@/lib/game/initial-release';
import { ActionButton } from '@/components/game/ActionButton';
import { ResourcePanel } from '@/components/game/ResourcePanel';
import { EventLog } from '@/components/game/EventLog';
import { SettingsModal } from '@/components/game/SettingsModal';

function GearIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function SettingsGearButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none',
        border: `1px solid ${hovered ? '#2e2e2e' : '#1c1c1c'}`,
        color: hovered ? '#666666' : '#333333',
        padding: '0.28rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color 0.2s, border-color 0.2s',
        lineHeight: 1,
      }}
      aria-label="Settings"
    >
      <GearIcon />
    </button>
  );
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0c0c0c',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-prose)',
      }}
    >
      <span style={{ color: '#2e2e2e', fontSize: '0.8rem', letterSpacing: '0.12em' }}>loading</span>
    </div>
  );
}

function ComingSoonPanel({ onReturnToTitle }: { onReturnToTitle: () => void }) {
  return (
    <div
      style={{
        border: '1px solid #242424',
        background: '#0f0f0f',
        padding: '1.1rem 1.2rem',
        maxWidth: '40rem',
      }}
    >
      <div
        style={{
          color: '#6f7f86',
          fontSize: '0.72rem',
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
        }}
      >
        coming soon
      </div>
      <div style={{ color: '#c8bfaf', fontSize: '1rem', lineHeight: 1.65 }}>
        The first arc is complete. The nameless row, living-name chapters, and paid expansions
        will open in a later update.
      </div>
      <button
        type="button"
        onClick={onReturnToTitle}
        style={{
          marginTop: '1rem',
          background: '#131313',
          border: '1px solid #2e2e2e',
          color: '#c8bfaf',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '0.92rem',
          letterSpacing: '0.1em',
          padding: '0.65rem 1rem',
          textTransform: 'lowercase',
        }}
      >
        return to title
      </button>
    </div>
  );
}

const AUDIO_ASSETS = {
  action: '/assets/audio/action-stone-click.wav',
  candle: '/assets/audio/candle-flame-loop.wav',
  whisper: '/assets/audio/whisper-sting.wav',
  wind: '/assets/audio/cemetery-wind-loop.wav',
} as const;

const AUDIO_BASE_VOLUME = {
  action: 0.55,
  candle: 0.22,
  whisper: 0.5,
  wind: 0.34,
} as const;

const CHAPTER_VISUALS = {
  chapter1: {
    src: '/assets/visuals/chapter-1-first-grave.png',
    label: 'the first grave waits under candlelight',
  },
  chapter2: {
    src: '/assets/visuals/chapter-2-keepers-shed.png',
    label: "the keeper's shed breathes in the dark",
  },
  chapter3: {
    src: '/assets/visuals/chapter-3-cemetery-gate.png',
    label: 'fresh soil leads past the cemetery gate',
  },
} as const;

function getChapterVisual(state: GameState) {
  if (state.flags['chapter3Active']) return CHAPTER_VISUALS.chapter3;
  if (state.flags['chapter2Active']) return CHAPTER_VISUALS.chapter2;
  return CHAPTER_VISUALS.chapter1;
}

function ChapterVisual({ state }: { state: GameState }) {
  const visual = getChapterVisual(state);

  return (
    <figure
      style={{
        margin: 0,
        border: '1px solid #1c1c1c',
        background: '#070707',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          minHeight: 'clamp(10rem, 28vw, 18rem)',
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.58)), url('${visual.src}')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          position: 'relative',
        }}
        role="img"
        aria-label={visual.label}
      />
      <figcaption
        style={{
          borderTop: '1px solid #161616',
          color: '#59524a',
          fontSize: '0.72rem',
          letterSpacing: '0.16em',
          lineHeight: 1.6,
          padding: '0.65rem 0.8rem',
          textTransform: 'uppercase',
        }}
      >
        {visual.label}
      </figcaption>
    </figure>
  );
}

function GamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewGame = searchParams.get('new') === 'true';

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const [resourcePanelOpen, setResourcePanelOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  // ID of the log entry currently being streamed; null = idle
  const [streamingEntryId, setStreamingEntryId] = useState<string | null>(null);
  const isStreaming = streamingEntryId !== null;
  const audioUnlockedRef = useRef(false);
  const audioRef = useRef<{
    action: HTMLAudioElement | null;
    candle: HTMLAudioElement | null;
    whisper: HTMLAudioElement | null;
    wind: HTMLAudioElement | null;
  }>({
    action: null,
    candle: null,
    whisper: null,
    wind: null,
  });

  const applyAudioVolumes = useCallback((settings: GameState['settings']) => {
    const { action, candle, whisper, wind } = audioRef.current;
    if (action) action.volume = AUDIO_BASE_VOLUME.action * settings.effectsVolume;
    if (whisper) whisper.volume = AUDIO_BASE_VOLUME.whisper * settings.effectsVolume;
    if (candle) candle.volume = AUDIO_BASE_VOLUME.candle * settings.musicVolume;
    if (wind) wind.volume = AUDIO_BASE_VOLUME.wind * settings.musicVolume;
  }, []);

  // Responsive breakpoint detection
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isNewGame) {
      const initialState = { ...createInitialGameState(), settings: loadSettings() };
      const stateWithIntro = addLogEntry(
        addLogEntry(
          addLogEntry(
            addLogEntry(initialState, 'you wake with your cheek against wet stone.', 'story'),
            'the sky is black.',
            'story'
          ),
          'the ground is colder than it should be.',
          'story'
        ),
        'somewhere beneath you, someone whispers.',
        'whisper'
      );
      setGameState(stateWithIntro);
      saveGame(stateWithIntro);
    } else {
      const loaded = loadGame();
      if (loaded) {
        setGameState(loaded);
      } else {
        router.push('/');
      }
    }
  }, [isNewGame, router]);

  useEffect(() => {
    const wind = new Audio(AUDIO_ASSETS.wind);
    const candle = new Audio(AUDIO_ASSETS.candle);
    const action = new Audio(AUDIO_ASSETS.action);
    const whisper = new Audio(AUDIO_ASSETS.whisper);

    wind.loop = true;
    candle.loop = true;
    wind.volume = AUDIO_BASE_VOLUME.wind;
    candle.volume = AUDIO_BASE_VOLUME.candle;
    action.volume = AUDIO_BASE_VOLUME.action;
    whisper.volume = AUDIO_BASE_VOLUME.whisper;

    audioRef.current = { action, candle, whisper, wind };

    return () => {
      Object.values(audioRef.current).forEach((audio) => {
        if (!audio) return;
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  const syncAmbientAudio = useCallback(
    (state: GameState | null) => {
      const { candle, wind } = audioRef.current;
      if (!state || !audioUnlockedRef.current || !state.settings.sound) {
        candle?.pause();
        wind?.pause();
        return;
      }

      applyAudioVolumes(state.settings);

      if (state.settings.music) {
        void wind?.play().catch(() => {});
      } else {
        wind?.pause();
      }

      if (state.lightSystem.lightLevel > 0) {
        void candle?.play().catch(() => {});
      } else {
        candle?.pause();
      }
    },
    [applyAudioVolumes]
  );

  useEffect(() => {
    syncAmbientAudio(gameState);
  }, [
    gameState,
    gameState?.settings.sound,
    gameState?.settings.music,
    gameState?.settings.musicVolume,
    gameState?.settings.effectsVolume,
    gameState?.lightSystem.lightLevel,
    syncAmbientAudio,
  ]);

  const unlockAudio = useCallback(() => {
    audioUnlockedRef.current = true;
    syncAmbientAudio(gameState);
  }, [gameState, syncAmbientAudio]);

  const playAudioCue = useCallback(
    (cue: 'action' | 'whisper') => {
      if (!gameState?.settings.sound || !audioUnlockedRef.current) return;
      const audio = audioRef.current[cue];
      if (!audio) return;
      applyAudioVolumes(gameState.settings);
      audio.currentTime = 0;
      void audio.play().catch(() => {});
    },
    [applyAudioVolumes, gameState?.settings]
  );

  const handleSaveGame = (state: GameState) => {
    saveGame(state);
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 2200);
  };

  const handleActionClick = (actionId: string) => {
    if (!gameState) return;
    // Block new actions while previous log entry is still streaming
    if (isStreaming) return;
    const action = getVisibleActions(gameState).find((a) => a.id === actionId);
    if (!action) return;
    // Guard against externally-disabled actions executing
    if (action.isDisabled && action.isDisabled(gameState)) return;
    unlockAudio();
    playAudioCue('action');
    const { newState: afterAction } = action.onExecute(gameState);
    const ticked = tickAfterAction(afterAction);
    // Identify the newest log entry to stream
    const newestEntry = ticked.eventLog[ticked.eventLog.length - 1];
    setGameState(ticked);
    handleSaveGame(ticked);
    if (newestEntry) {
      setStreamingEntryId(newestEntry.id);
      if (newestEntry.type === 'whisper' || newestEntry.type === 'danger') {
        playAudioCue('whisper');
      }
    }
    syncAmbientAudio(ticked);
  };

  const handleSettingsChange = (newSettings: GameState['settings']) => {
    if (!gameState) return;
    const updated = { ...gameState, settings: newSettings };
    setGameState(updated);
    handleSaveGame(updated);
    saveSettings(newSettings);
    syncAmbientAudio(updated);
  };

  const handleResetSave = () => {
    deleteSave();
    router.push('/');
  };

  const handleReturnToTitle = () => {
    router.push('/');
  };

  if (!gameState) return <LoadingScreen />;

  const releaseComplete = isInitialReleaseComplete(gameState);
  const visibleActions = filterInitialReleaseActions(gameState, getVisibleActions(gameState));
  const actionsPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: isDesktop ? '1rem' : 0 }}>
      <div
        style={{
          fontSize: '0.8125rem',
          color: '#5a5a5a',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
        }}
      >
        actions
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {visibleActions.map((action) => {
          const isDisabled = action.isDisabled ? action.isDisabled(gameState) : false;
          const effectivelyDisabled = isDisabled || isStreaming;
          const disabledReason = isStreaming
            ? 'click the log or press space to continue'
            : isDisabled && action.getDisabledReason
              ? action.getDisabledReason(gameState)
              : undefined;
          return (
            <ActionButton
              key={action.id}
              label={action.label}
              description={action.description}
              cooldownSeconds={action.cooldownSeconds}
              reducedMotion={gameState.settings.reducedMotion}
              disabled={effectivelyDisabled}
              disabledReason={disabledReason}
              onClick={() => handleActionClick(action.id)}
            />
          );
        })}
      </div>
      {releaseComplete && <ComingSoonPanel onReturnToTitle={handleReturnToTitle} />}
    </div>
  );

  // ── Grain overlay (inline SVG data-url noise) ──────────────
  const grainStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 999,
    opacity: 0.03,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
    backgroundSize: '180px 180px',
  };

  // ── Vignette overlay ────────────────────────────────────────
  const vignetteStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 998,
    background: 'radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(0,0,0,0.60) 100%)',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0c0c0c',
        color: '#e2d9c8',
        fontFamily: 'var(--font-prose)',
        position: 'relative',
      }}
    >
      {/* Atmospheric overlays */}
      <div style={grainStyle} aria-hidden="true" />
      <div style={vignetteStyle} aria-hidden="true" />

      {/* Page wrapper */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(1.5rem, 4vw, 2.75rem) clamp(1.25rem, 3vw, 2.25rem)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Two-column (desktop) / single-column (mobile) layout */}
        <div
          style={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            alignItems: 'flex-start',
            gap: isDesktop ? '2.5rem' : '1.5rem',
          }}
        >
          {/* ── Main column ─────────────────────────────────── */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.4rem',
              width: '100%',
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <h1
                    style={{
                      fontFamily: 'var(--font-title)',
                      fontSize: 'clamp(1rem, 2vw, 1.2rem)',
                      fontWeight: 400,
                      color: '#c8bfaf',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    {gameState.currentLocation}
                  </h1>
                  <SettingsGearButton onClick={() => setShowSettings(true)} />
                </div>
                <div
                  style={{
                    marginTop: '0.4rem',
                    fontSize: '0.875rem',
                    color: '#5f5f5f',
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                  }}
                >
                  {gameState.chapter}
                </div>
              </div>

              {/* Save indicator */}
              <div
                style={{
                  fontSize: '0.62rem',
                  color: '#2e2e2e',
                  letterSpacing: '0.1em',
                  paddingTop: '0.1rem',
                  opacity: showSaveIndicator ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                }}
                aria-live="polite"
              >
                saved
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                height: '1px',
                background: 'linear-gradient(to right, #1c1c1c 60%, transparent)',
              }}
            />

            <ChapterVisual state={gameState} />

            {/* Event log */}
            <div
              style={{
                background: '#0e0e0e',
                border: '1px solid #1c1c1c',
                padding: 'clamp(1.1rem, 2.5vw, 1.75rem)',
                minHeight: '20rem',
                maxHeight: '65vh',
                overflowY: 'auto',
              }}
            >
              <EventLog
                entries={gameState.eventLog}
                reducedMotion={gameState.settings.reducedMotion}
                textSpeed={gameState.settings.textSpeed}
                streamingId={streamingEntryId}
                onStreamComplete={() => setStreamingEntryId(null)}
              />
            </div>

            {!isDesktop && actionsPanel}
          </div>

          {/* ── Resource panel ───────────────────────────────── */}
          <div
            style={{
              width: isDesktop ? '240px' : '100%',
              flexShrink: 0,
            }}
          >
            {/* Mobile: collapsible toggle */}
            {!isDesktop && (
              <button
                type="button"
                onClick={() => setResourcePanelOpen(!resourcePanelOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'none',
                  border: 'none',
                  color: '#555555',
                  fontSize: '0.75rem',
                  letterSpacing: '0.25em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  padding: '0.25rem 0',
                  marginBottom: '0.6rem',
                  fontFamily: 'inherit',
                }}
              >
                <span>status</span>
                <span style={{ fontSize: '0.55rem' }}>{resourcePanelOpen ? '▲' : '▼'}</span>
              </button>
            )}

            {/* Panel: always visible on desktop, toggle-controlled on mobile */}
            {(isDesktop || resourcePanelOpen) && <ResourcePanel state={gameState} />}
            {isDesktop && actionsPanel}
          </div>
        </div>
      </div>

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={gameState.settings}
        onSettingsChange={handleSettingsChange}
        onResetSave={handleResetSave}
      />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <GamePageContent />
    </Suspense>
  );
}

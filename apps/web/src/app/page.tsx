'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { hasSavedGame, deleteSave } from '@/lib/game/save';
import { SettingsModal } from '@/components/game/SettingsModal';
import { GameSettings } from '@/lib/game/types';

export default function HomePage() {
  const router = useRouter();
  const [showContinue, setShowContinue] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    sound: true,
    music: true,
    textSpeed: 'normal',
    reducedMotion: false,
  });

  useEffect(() => {
    setShowContinue(hasSavedGame());
    const savedSettings = localStorage.getItem('it-whispers-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch {
        // ignore malformed settings
      }
    }
  }, []);

  const handleNewGame = () => {
    if (showContinue) {
      setShowNewGameConfirm(true);
    } else {
      startNewGame();
    }
  };

  const startNewGame = () => {
    deleteSave();
    router.push('/game?new=true');
  };

  const handleContinue = () => {
    router.push('/game');
  };

  const handleSettingsChange = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('it-whispers-settings', JSON.stringify(newSettings));
  };

  const handleResetSave = () => {
    deleteSave();
    setShowContinue(false);
    setShowSettings(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0c0c0c',
        backgroundImage:
          "linear-gradient(90deg, rgba(12,12,12,0.98) 0%, rgba(12,12,12,0.9) 34%, rgba(12,12,12,0.58) 100%), url('/assets/visuals/key-art-cemetery.png')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        fontFamily: 'var(--font-prose)',
        position: 'relative',
      }}
    >
      {/* Grain overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 999,
          opacity: 0.03,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '180px 180px',
        }}
      />
      {/* Vignette overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 998,
          background: 'radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(0,0,0,0.60) 100%)',
        }}
      />

      <div
        style={{
          maxWidth: '22rem',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          marginRight: 'auto',
          marginLeft: 'clamp(0rem, 8vw, 7rem)',
        }}
      >
        {/* Title block */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div
            style={{
              fontSize: '0.6875rem',
              letterSpacing: '0.32em',
              color: '#5e7380',
              textTransform: 'uppercase',
              marginBottom: '1.25rem',
              fontFamily: 'var(--font-prose)',
            }}
          >
            a cemetery horror survival game
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-title)',
              fontSize: 'clamp(2.4rem, 8vw, 3.4rem)',
              fontWeight: 400,
              color: '#ddd4c0',
              letterSpacing: '0.13em',
              lineHeight: 1.05,
              margin: 0,
              textTransform: 'uppercase',
            }}
          >
            It Whispers
          </h1>

          {/* Decorative rule — a bit more gravestone-like */}
          <div
            style={{
              margin: '1.5rem auto 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
            }}
          >
            <div
              style={{
                width: '2rem',
                height: '1px',
                background: 'linear-gradient(to left, #2a2a2a, transparent)',
              }}
            />
            <div
              style={{ width: '3px', height: '3px', background: '#2a2a2a', borderRadius: '50%' }}
            />
            <div
              style={{
                width: '2rem',
                height: '1px',
                background: 'linear-gradient(to right, #2a2a2a, transparent)',
              }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {!showNewGameConfirm ? (
            <>
              <HomeButton onClick={handleNewGame} primary>
                new game
              </HomeButton>

              {showContinue && (
                <HomeButton onClick={handleContinue} primary>
                  continue
                </HomeButton>
              )}

              <HomeButton onClick={() => setShowSettings(true)}>settings</HomeButton>
              <ComingSoonButton>support / paid chapters coming soon</ComingSoonButton>
            </>
          ) : (
            <div
              style={{
                border: '1px solid #252525',
                padding: '1.5rem',
                background: '#0f0f0f',
              }}
            >
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: '#888888',
                  lineHeight: 1.7,
                  margin: '0 0 1.25rem',
                }}
              >
                starting a new game will erase your existing save.
                <br />
                are you certain?
              </p>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <HomeButton onClick={() => setShowNewGameConfirm(false)} style={{ flex: 1 }}>
                  cancel
                </HomeButton>
                <HomeButton onClick={startNewGame} primary style={{ flex: 1 }}>
                  confirm
                </HomeButton>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p
          style={{
            marginTop: '3rem',
            fontSize: '1rem',
            color: '#707070',
            textAlign: 'center',
            lineHeight: 1.75,
            letterSpacing: '0.02em',
          }}
        >
          best played with sound in a quiet room.
          <br />
          sound can be disabled in settings.
        </p>
      </div>

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onResetSave={handleResetSave}
      />
    </div>
  );
}

function ComingSoonButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      disabled
      style={{
        display: 'block',
        width: '100%',
        padding: '0.75rem 1.25rem',
        background: 'transparent',
        border: '1px solid #171717',
        color: '#3f3f3f',
        fontSize: '0.92rem',
        fontFamily: 'var(--font-prose)',
        letterSpacing: '0.1em',
        textAlign: 'center',
        cursor: 'not-allowed',
        textTransform: 'lowercase',
      }}
    >
      {children}
    </button>
  );
}

/* ─── HomeButton ─────────────────────────────────────────────── */
interface HomeButtonProps {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  style?: CSSProperties;
}

function HomeButton({ children, onClick, primary = false, style }: HomeButtonProps) {
  const [hovered, setHovered] = useState(false);

  const baseStyle: CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '0.75rem 1.25rem',
    background: primary ? (hovered ? '#181818' : '#131313') : 'transparent',
    border: primary
      ? `1px solid ${hovered ? '#3d3d3d' : '#2e2e2e'}`
      : `1px solid ${hovered ? '#2a2a2a' : '#1e1e1e'}`,
    color: primary ? (hovered ? '#e2d9c8' : '#c8bfaf') : hovered ? '#888888' : '#6a6a6a',
    fontSize: '1.0625rem',
    fontFamily: 'var(--font-prose)',
    letterSpacing: '0.12em',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease, background 0.2s ease, color 0.2s ease',
    textTransform: 'lowercase',
    ...style,
  };

  return (
    <button
      type="button"
      style={baseStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

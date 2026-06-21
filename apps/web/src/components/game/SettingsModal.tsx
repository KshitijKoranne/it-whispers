'use client';

import { useState, type CSSProperties } from 'react';
import { GameSettings } from '@/lib/game/types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  onResetSave: () => void;
}

export function SettingsModal({
  open,
  onClose,
  settings,
  onSettingsChange,
  onResetSave,
}: SettingsModalProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetConfirm = () => {
    onResetSave();
    setShowResetConfirm(false);
    onClose();
  };

  if (!open) return null;

  const backdrop: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    background: 'rgba(0,0,0,0.82)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    backdropFilter: 'blur(2px)',
    WebkitBackdropFilter: 'blur(2px)',
  };

  const panel: CSSProperties = {
    background: '#101010',
    border: '1px solid #222222',
    width: '100%',
    maxWidth: '22rem',
    padding: '2rem 1.75rem',
    fontFamily: 'var(--font-prose)',
    position: 'relative',
  };

  const heading: CSSProperties = {
    fontSize: '0.65rem',
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: '#333333',
    margin: '0 0 1.75rem',
  };

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.1rem',
  };

  const labelStyle: CSSProperties = {
    fontSize: '0.85rem',
    color: '#7a7a7a',
    letterSpacing: '0.04em',
  };

  const divider: CSSProperties = {
    height: '1px',
    background: '#1c1c1c',
    margin: '1.5rem 0',
  };

  return (
    <div style={backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: '#333333',
            cursor: 'pointer',
            fontSize: '1rem',
            lineHeight: 1,
            padding: '0.25rem',
            fontFamily: 'inherit',
          }}
          aria-label="Close settings"
        >
          ×
        </button>

        <p style={heading}>settings</p>

        {/* Sound */}
        <div style={rowStyle}>
          <span style={labelStyle}>sound</span>
          <DarkToggle
            checked={settings.sound}
            onChange={(v) => onSettingsChange({ ...settings, sound: v })}
            id="sound"
          />
        </div>

        {/* Music */}
        <div style={rowStyle}>
          <span style={labelStyle}>music</span>
          <DarkToggle
            checked={settings.music}
            onChange={(v) => onSettingsChange({ ...settings, music: v })}
            id="music"
          />
        </div>

        <VolumeSlider
          label="music volume"
          value={settings.musicVolume}
          onChange={(v) => onSettingsChange({ ...settings, musicVolume: v })}
        />

        <VolumeSlider
          label="effects volume"
          value={settings.effectsVolume}
          onChange={(v) => onSettingsChange({ ...settings, effectsVolume: v })}
        />

        {/* Reduced Motion */}
        <div style={rowStyle}>
          <span style={labelStyle}>reduced motion</span>
          <DarkToggle
            checked={settings.reducedMotion}
            onChange={(v) => onSettingsChange({ ...settings, reducedMotion: v })}
            id="reduced-motion"
          />
        </div>

        <div style={divider} />

        {/* Text Speed */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ ...labelStyle, marginBottom: '0.7rem', display: 'block' }}>text speed</div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {(['instant', 'normal', 'slow'] as const).map((speed) => {
              const active = settings.textSpeed === speed;
              return (
                <button
                  key={speed}
                  type="button"
                  onClick={() => onSettingsChange({ ...settings, textSpeed: speed })}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.5rem',
                    fontSize: '0.75rem',
                    letterSpacing: '0.06em',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    border: `1px solid ${active ? '#3d3d3d' : '#1e1e1e'}`,
                    background: active ? '#1a1a1a' : 'transparent',
                    color: active ? '#c8bfaf' : '#3d3d3d',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {speed}
                </button>
              );
            })}
          </div>
        </div>

        <div style={divider} />

        {/* Reset */}
        {!showResetConfirm ? (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            style={{
              width: '100%',
              padding: '0.55rem',
              background: 'transparent',
              border: '1px solid #2e1a1a',
              color: '#6e2e2e',
              fontSize: '0.75rem',
              letterSpacing: '0.08em',
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.borderColor = '#5a2020';
              btn.style.color = '#a04040';
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.borderColor = '#2e1a1a';
              btn.style.color = '#6e2e2e';
            }}
          >
            reset save data
          </button>
        ) : (
          <div>
            <p
              style={{ fontSize: '0.8rem', color: '#555555', lineHeight: 1.7, margin: '0 0 1rem' }}
            >
              this will erase all progress. are you certain?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: 'transparent',
                  border: '1px solid #2e2e2e',
                  color: '#555555',
                  fontSize: '0.75rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                }}
              >
                cancel
              </button>
              <button
                type="button"
                onClick={handleResetConfirm}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: '#1a0808',
                  border: '1px solid #5a2020',
                  color: '#a04040',
                  fontSize: '0.75rem',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                }}
              >
                confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VolumeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label style={{ display: 'block', margin: '0 0 1.1rem' }}>
      <span
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.45rem',
          color: '#7a7a7a',
          fontSize: '0.85rem',
          letterSpacing: '0.04em',
        }}
      >
        <span>{label}</span>
        <span>{Math.round(value * 100)}</span>
      </span>
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round(value * 100)}
        aria-label={label}
        onChange={(event) => onChange(Number(event.currentTarget.value) / 100)}
        style={{
          width: '100%',
          accentColor: '#c8922a',
          cursor: 'pointer',
        }}
      />
    </label>
  );
}

/* ─── DarkToggle ─────────────────────────────────────────────── */
function DarkToggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: '2.4rem',
        height: '1.2rem',
        borderRadius: '0.6rem',
        border: `1px solid ${checked ? '#3d3d3d' : '#1e1e1e'}`,
        background: checked ? '#1a1a1a' : '#0e0e0e',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: checked ? 'calc(100% - 0.9rem)' : '0.15rem',
          transform: 'translateY(-50%)',
          width: '0.7rem',
          height: '0.7rem',
          borderRadius: '50%',
          background: checked ? '#c8922a' : '#2e2e2e',
          transition: 'left 0.2s ease, background 0.2s ease',
        }}
      />
    </button>
  );
}

'use client';

import { useState, useEffect } from 'react';

interface ActionButtonProps {
  label: string;
  description?: string;
  cooldownSeconds: number;
  disabled?: boolean;
  disabledReason?: string;
  reducedMotion?: boolean;
  onClick: () => void;
}

export function ActionButton({
  label,
  description,
  cooldownSeconds,
  disabled = false,
  disabledReason,
  reducedMotion = false,
  onClick,
}: ActionButtonProps) {
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!isOnCooldown) return;

    const startTime = Date.now();
    const total = cooldownSeconds * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / total) * 100, 100);
      setProgress(pct);
      if (elapsed >= total) {
        setIsOnCooldown(false);
        setProgress(0);
        clearInterval(interval);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isOnCooldown, cooldownSeconds]);

  const handleClick = () => {
    if (disabled || isOnCooldown) return;
    setIsOnCooldown(true);
    setProgress(0);
    onClick();
  };

  const isDisabled = disabled || isOnCooldown;

  const btnStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    padding: '0.55rem 1.1rem',
    background: isDisabled ? '#0d0d0d' : hovered ? '#161616' : '#111111',
    border: `1px solid ${isDisabled ? '#1a1a1a' : hovered ? '#3a3a3a' : '#272727'}`,
    color: isDisabled ? '#2e2e2e' : hovered ? '#e2d9c8' : '#b0a898',
    fontSize: '1rem',
    fontFamily: 'var(--font-prose)',
    letterSpacing: '0.06em',
    cursor: isDisabled ? 'default' : 'pointer',
    transition: 'border-color 0.2s ease, color 0.2s ease, background 0.2s ease',
    textTransform: 'lowercase',
    whiteSpace: 'nowrap',
    minWidth: '6rem',
  };

  const fillStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${progress}%`,
    background: 'rgba(200, 146, 42, 0.10)',
    borderRight: progress > 2 ? '1px solid rgba(200,146,42,0.18)' : 'none',
    transition: 'none',
    pointerEvents: 'none',
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '0.18rem' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        title={description ?? disabledReason}
        onMouseEnter={() => !isDisabled && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={btnStyle}
      >
        {isOnCooldown && !reducedMotion && <span style={fillStyle} />}
        <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
      </button>
    </div>
  );
}

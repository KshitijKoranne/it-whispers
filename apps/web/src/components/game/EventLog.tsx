'use client';

import { useEffect, useRef, useState } from 'react';
import { EventLogEntry } from '@/lib/game/types';

/** Milliseconds between each character reveal. ~22ms ≈ quiet, readable pace. */
const MS_PER_CHAR = 22;

interface EventLogProps {
  entries: EventLogEntry[];
  reducedMotion?: boolean;
  /** ID of the entry currently being streamed. Null = nothing streaming. */
  streamingId?: string | null;
  /** Called the moment streaming finishes (naturally or by skip). */
  onStreamComplete?: () => void;
}

export function EventLog({
  entries,
  reducedMotion = false,
  streamingId = null,
  onStreamComplete,
}: EventLogProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Text revealed so far for the streaming entry
  const [streamedText, setStreamedText] = useState('');

  // Stable refs so interval callback is never stale
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const charIndexRef = useRef(0);
  const fullTextRef = useRef('');
  const onCompleteRef = useRef(onStreamComplete);
  onCompleteRef.current = onStreamComplete;

  // ── Skip: reveal entire text at once ────────────────────────
  const finishNow = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStreamedText(fullTextRef.current);
    onCompleteRef.current?.();
  };

  // ── Start / restart streaming when streamingId changes ───────
  useEffect(() => {
    if (!streamingId) {
      // Nothing to stream – clear residual state
      setStreamedText('');
      charIndexRef.current = 0;
      return;
    }

    const entry = entries.find((e) => e.id === streamingId);
    if (!entry) return;

    fullTextRef.current = entry.text;
    charIndexRef.current = 0;
    setStreamedText('');

    // Clear any running interval from a previous action
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Reduced-motion: skip to end immediately
    if (reducedMotion) {
      setStreamedText(entry.text);
      onCompleteRef.current?.();
      return;
    }

    intervalRef.current = setInterval(() => {
      charIndexRef.current += 1;
      const slice = fullTextRef.current.slice(0, charIndexRef.current);
      setStreamedText(slice);

      if (charIndexRef.current >= fullTextRef.current.length) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        onCompleteRef.current?.();
      }
    }, MS_PER_CHAR);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // We intentionally only re-run when streamingId itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamingId]);

  // ── Global Space / Enter to skip ────────────────────────────
  useEffect(() => {
    if (!streamingId) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        // Only skip; do not let the event bubble to buttons etc.
        if (intervalRef.current) {
          e.preventDefault();
          finishNow();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamingId]);

  // ── Auto-scroll as text grows ────────────────────────────────
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }, [streamedText, entries.length, reducedMotion]);

  if (entries.length === 0) return null;

  const isCurrentlyTyping = Boolean(streamingId && intervalRef.current);

  return (
    <>
      {!reducedMotion && (
        <style>{`
          @keyframes iw-entry-in {
            from { opacity: 0; transform: translateY(5px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .iw-new-entry {
            animation: iw-entry-in 0.45s ease forwards;
          }
          @keyframes iw-cursor-blink {
            0%, 100% { opacity: 0.45; }
            50%       { opacity: 0; }
          }
          .iw-cursor {
            display: inline-block;
            width: 1px;
            height: 1.1em;
            background: currentColor;
            margin-left: 2px;
            vertical-align: text-bottom;
            animation: iw-cursor-blink 0.9s step-end infinite;
          }
        `}</style>
      )}

      {/*
        Clicking the log area while text is streaming completes it immediately.
        The div is only interactive (tabIndex/role) while streaming.
      */}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
        onClick={() => {
          if (intervalRef.current) finishNow();
        }}
        role={streamingId ? 'button' : undefined}
        aria-label={streamingId ? 'Click to reveal all text' : undefined}
        tabIndex={streamingId ? 0 : -1}
      >
        {entries.map((entry, index) => {
          const isThisStreaming = entry.id === streamingId;
          const isNewest = index === entries.length - 1;
          const entryStyle = getStyleForType(entry.type);

          // Streaming entry uses partial text; all others use full text
          const displayText = isThisStreaming ? streamedText : entry.text;

          // Show fade-in animation only for completed newest entries
          const showFadeIn = isNewest && !reducedMotion && !isThisStreaming;

          // Show blinking cursor only while this entry is actively typing
          const showCursor = isThisStreaming && isCurrentlyTyping && !reducedMotion;

          return (
            <p
              key={entry.id}
              style={{
                margin: 0,
                fontFamily: 'var(--font-prose)',
                fontSize: 'clamp(1.1rem, 1.5vw, 1.2rem)',
                lineHeight: '1.95',
                letterSpacing: '0.012em',
                whiteSpace: 'pre-line',
                ...entryStyle,
              }}
              className={showFadeIn ? 'iw-new-entry' : ''}
            >
              {displayText}
              {showCursor && <span className="iw-cursor" aria-hidden="true" />}
            </p>
          );
        })}
        <div ref={logEndRef} />
      </div>
    </>
  );
}

function getStyleForType(type: EventLogEntry['type']): React.CSSProperties {
  switch (type) {
    case 'story':
      return { color: '#c8bfaf' };
    case 'action':
      return { color: '#848484', fontStyle: 'italic' };
    case 'whisper':
      return { color: '#6e8c9c', fontStyle: 'italic' };
    case 'danger':
      return { color: '#a04040' };
    case 'resource':
      return { color: '#c8922a' };
    default:
      return { color: '#c8bfaf' };
  }
}

'use client';

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0c0c0c',
        color: '#e2d9c8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'var(--font-prose)',
      }}
    >
      <section style={{ maxWidth: '28rem' }}>
        <div
          style={{
            color: '#6f7f86',
            fontSize: '0.72rem',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            marginBottom: '1rem',
          }}
        >
          It Whispers
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-title)',
            fontSize: 'clamp(2.2rem, 8vw, 3.2rem)',
            fontWeight: 400,
            lineHeight: 1.05,
            margin: '0 0 1rem',
          }}
        >
          This path is closed.
        </h1>
        <p style={{ color: '#8b8377', fontSize: '1rem', lineHeight: 1.7, margin: '0 0 1.5rem' }}>
          The cemetery does not open this way. Return to the first grave and keep your light
          close.
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          style={{
            background: '#131313',
            border: '1px solid #2e2e2e',
            color: '#c8bfaf',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.92rem',
            letterSpacing: '0.14em',
            padding: '0.75rem 1.1rem',
            textTransform: 'lowercase',
          }}
        >
          return
        </button>
      </section>
    </main>
  );
}

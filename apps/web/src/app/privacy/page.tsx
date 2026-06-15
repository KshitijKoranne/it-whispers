import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | It Whispers',
  description: 'Privacy policy for It Whispers.',
};

const updatedDate = 'June 15, 2026';

export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0c0c0c',
        color: '#d8cec0',
        fontFamily: 'var(--font-prose)',
        padding: '48px 20px',
      }}
    >
      <article style={{ maxWidth: 760, margin: '0 auto', lineHeight: 1.75 }}>
        <Link
          href="/"
          style={{
            color: '#8da1aa',
            fontSize: 13,
            letterSpacing: '0.16em',
            textDecoration: 'none',
            textTransform: 'uppercase',
          }}
        >
          It Whispers
        </Link>

        <h1
          style={{
            color: '#eee4d3',
            fontFamily: 'var(--font-title)',
            fontSize: 'clamp(2.2rem, 8vw, 3.4rem)',
            fontWeight: 400,
            letterSpacing: '0.08em',
            lineHeight: 1.1,
            margin: '28px 0 8px',
            textTransform: 'uppercase',
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ color: '#82786b', marginTop: 0 }}>Last updated: {updatedDate}</p>

        <Section title="Summary">
          <p>
            It Whispers is a single-player horror game. The current release does not use accounts,
            ads, in-app purchases, third-party analytics SDKs, or third-party crash reporting SDKs.
          </p>
        </Section>

        <Section title="Game Progress">
          <p>
            Your save data and settings are stored locally on your device or browser storage. They
            are not sent to us by the game. If you clear app data, browser storage, or use the reset
            save option, this local progress may be deleted.
          </p>
        </Section>

        <Section title="Network Requests">
          <p>
            The Android app loads the game over a secure HTTPS connection. As with most websites,
            the hosting service may process basic technical request information, such as IP address,
            user agent, request time, and requested page, to deliver the game and keep the service
            secure. We do not use this information for advertising, profiling, or selling user data.
          </p>
        </Section>

        <Section title="Payments">
          <p>
            Paid chapters and support options are marked as coming soon. The current release does
            not sell digital content or process payments inside the app.
          </p>
        </Section>

        <Section title="Children">
          <p>
            It Whispers is a horror game intended for a general teen-and-older audience. It is not
            directed to children under 13.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For privacy questions, contact the developer listed on the Google Play Store listing for
            It Whispers.
          </p>
        </Section>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ borderTop: '1px solid #26221d', marginTop: 30, paddingTop: 22 }}>
      <h2
        style={{
          color: '#eee4d3',
          fontSize: 18,
          letterSpacing: '0.08em',
          margin: '0 0 8px',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h2>
      <div style={{ color: '#b7ad9d', fontSize: 16 }}>{children}</div>
    </section>
  );
}

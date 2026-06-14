import type React from 'react';
import type { Metadata } from 'next';
import './global.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'It Whispers',
  description: 'A minimalist cemetery horror survival game',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ background: '#0c0c0c' }}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}

import { Provider } from '@/components/provider';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://tenbri.com'),
  title: { template: '%s | Tenbri docs', default: 'Tenbri docs' },
  description: 'Audit trail for AI agents: every decision signed, chained and provable.',
  icons: { icon: '/favicon.png' },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

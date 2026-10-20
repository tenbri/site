'use client';
import SearchDialog from '@/components/search';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { type ReactNode } from 'react';

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{ SearchDialog }}
      // Dark first like the landing page. The key is the one the landing page and blog read.
      theme={{ defaultTheme: 'dark', storageKey: 'starlight-theme', attribute: ['class', 'data-theme'] }}
    >
      {children}
    </RootProvider>
  );
}

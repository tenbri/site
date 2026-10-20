'use client';
import type { ComponentProps } from 'react';

// The brand links to the landing page, outside the docs app, so it is a plain anchor.
export function NavTitle(props: ComponentProps<'a'>) {
  return (
    <a {...props} href="/">
      <img src="/docs/mascot.webp" alt="" width={26} height={26} className="size-[26px]" />
      <span className="font-display text-[1.05rem] font-bold tracking-tight">Tenbri</span>
    </a>
  );
}

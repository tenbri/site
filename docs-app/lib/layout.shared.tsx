import { NavTitle } from '@/components/nav-title';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

// The landing page and the blog live outside the docs app (no /docs basePath), so they use plain anchors.
const navLink = 'text-sm text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground';
const menuLink =
  'relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: NavTitle,
    },
    githubUrl: 'https://github.com/tenbri/tenbri',
    links: [
      { text: 'Docs', url: '/introduction/', active: 'none' },
      { text: 'Examples', url: '/examples/', active: 'nested-url' },
      { text: 'Adapters', url: '/adapters/', active: 'nested-url' },
      { type: 'custom', on: 'nav', children: <a href="/blog/" className={navLink}>Blog</a> },
      { type: 'custom', on: 'menu', children: <a href="/blog/" className={menuLink}>Blog</a> },
    ],
  };
}

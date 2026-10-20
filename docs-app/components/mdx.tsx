import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { CodeBlockTab, CodeBlockTabs, CodeBlockTabsTrigger } from 'fumadocs-ui/components/codeblock';
import type { ComponentProps } from 'react';
import type { MDXComponents } from 'mdx/types';

// Content links are written as /docs/...; Next.js adds the /docs basePath itself. Other site paths
// (/blog/...) live outside the docs app and stay plain anchors.
const unbase = (href?: string) => (href?.startsWith('/docs/') ? href.slice(5) : href);
const outside = (href?: string) => !!href && href.startsWith('/') && !href.startsWith('/docs/') && !href.startsWith('//');

// <Tabs items> stores "python" for "Python"; code-block tabs store the raw label. Normalise both so
// a language picked in either kind of tab follows the reader across every tab group and page.
const tabValue = (v?: string) => v?.toLowerCase().replace(/\s/, '-');

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    a: ({ href, ...props }: ComponentProps<'a'>) =>
      outside(href) ? <a href={href} {...props} /> : <defaultMdxComponents.a href={unbase(href)} {...props} />,
    Card: ({ href, ...props }: ComponentProps<typeof defaultMdxComponents.Card>) => (
      <defaultMdxComponents.Card href={unbase(href)} {...props} />
    ),
    CodeBlockTabs: ({ defaultValue, ...props }: ComponentProps<typeof CodeBlockTabs>) => (
      <CodeBlockTabs defaultValue={tabValue(defaultValue)} {...props} />
    ),
    CodeBlockTabsTrigger: ({ value, ...props }: ComponentProps<typeof CodeBlockTabsTrigger>) => (
      <CodeBlockTabsTrigger value={tabValue(value)!} {...props} />
    ),
    CodeBlockTab: ({ value, ...props }: ComponentProps<typeof CodeBlockTab>) => (
      <CodeBlockTab value={tabValue(value)!} {...props} />
    ),
    Tabs,
    Tab,
    Steps,
    Step,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}

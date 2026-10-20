// /docs/ has no page of its own: send readers to the introduction. A static export cannot answer
// with a 3xx, so this is a meta refresh with a link as fallback.
export default function Index() {
  return (
    <main className="p-8">
      <meta httpEquiv="refresh" content="0; url=/docs/introduction/" />
      <link rel="canonical" href="https://tenbri.com/docs/introduction/" />
      <a href="/docs/introduction/" className="underline">Go to the Tenbri docs</a>
    </main>
  );
}

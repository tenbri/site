import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <img src="/docs/mascot.webp" alt="" width={72} height={72} />
      <h1 className="font-display text-3xl font-bold">Page not found</h1>
      <p className="text-fd-muted-foreground">This page does not exist, or it moved.</p>
      <Link href="/introduction/" className="font-medium text-fd-primary underline underline-offset-4">
        Go to the introduction
      </Link>
    </main>
  );
}

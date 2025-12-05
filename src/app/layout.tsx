// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Jack Ops — T Group',
  description: 'Hub de operações Jack Daniel’s by T Group',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-br from-black via-neutral-950 to-zinc-900 text-zinc-50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-wide">
              Jack Ops
              <span className="ml-2 text-sm font-normal text-zinc-400">
                · Operações Jack Daniel&apos;s
              </span>
            </h1>
            <a
              href="/events/new"
              className="rounded-full border border-zinc-700/80 bg-zinc-900/60 px-4 py-2 text-sm hover:bg-zinc-800/80 transition-all backdrop-blur-md"
            >
              + Novo evento
            </a>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}

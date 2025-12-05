// src/app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jack Ops — T Group",
  description: "Hub de operações Jack Daniel’s by T Group"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <header className="flex items-center justify-between gap-4">
            <div>
              <p className="subtitle-jack">T GROUP · JACK DANIEL&apos;S</p>
              <h1 className="title-jack mt-1">
                Jack Ops
                <span className="ml-2 text-sm font-normal text-zinc-400 normal-case tracking-normal">
                  · Operações de bares &amp; eventos
                </span>
              </h1>
            </div>
            <a href="/events/new" className="button-jack">
              + Novo evento
            </a>
          </header>
          <main className="glass-card p-4 md:p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}

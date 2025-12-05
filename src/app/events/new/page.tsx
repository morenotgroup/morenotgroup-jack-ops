'use client';

import { FormEvent, useState } from 'react';
import { DRINK_HEADER_NAMES } from '@/types/jack';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function NewEventPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    const formData = new FormData(e.currentTarget);

    const nome = String(formData.get('nome') || '').trim();
    const data = String(formData.get('data') || '').trim();
    const local = String(formData.get('local') || '').trim();
    const endereco = String(formData.get('endereco') || '').trim();
    const horario = String(formData.get('horario') || '').trim();
    const paxRaw = String(formData.get('pax') || '').trim();
    const pax = paxRaw ? Number(paxRaw) || null : null;

    const drinks: Record<string, number> = {};
    DRINK_HEADER_NAMES.forEach((d) => {
      const raw = String(formData.get(`drink-${d}`) || '').trim();
      drinks[d] = raw ? Number(raw) || 0 : 0;
    });

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          data,
          local,
          endereco,
          horario,
          pax,
          drinks,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        console.error('Erro API', json);
        throw new Error(json.error || 'Falha ao criar evento');
      }

      setStatus('success');
      e.currentTarget.reset();
    } catch (err: any) {
      setStatus('error');
      setError(err?.message ?? 'Erro desconhecido');
    }
  }

  return (
    <section className="max-w-3xl space-y-4">
      <h2 className="text-lg font-medium text-zinc-100">
        Novo evento Jack Daniel&apos;s
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 md:p-6 backdrop-blur"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400">
              Nome do evento
            </label>
            <input
              name="nome"
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400">
              Data
            </label>
            <input
              name="data"
              placeholder="15/12/2025"
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400">
              Local
            </label>
            <input
              name="local"
              placeholder="Casa Maria"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400">
              Endereço
            </label>
            <input
              name="endereco"
              placeholder="Rua X, 123 - Bairro, Cidade"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400">
              Horário
            </label>
            <input
              name="horario"
              placeholder="18h às 02h"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-400"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400">
              Pax (público)
            </label>
            <input
              name="pax"
              type="number"
              min={0}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-400"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-100">
            Saída prevista de drinks (por evento)
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            {DRINK_HEADER_NAMES.map((drink) => (
              <div key={drink} className="space-y-1">
                <label className="block text-xs font-medium text-zinc-400">
                  {drink}
                </label>
                <input
                  name={`drink-${drink}`}
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-400"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="rounded-full border border-zinc-700/80 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Salvando...' : 'Salvar evento'}
          </button>

          {status === 'success' && (
            <p className="text-xs text-emerald-400">
              Evento criado com sucesso! Ele já aparece na planilha.
            </p>
          )}
          {status === 'error' && (
            <p className="text-xs text-red-400">
              Erro ao salvar: {error ?? 'verifique os logs'}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

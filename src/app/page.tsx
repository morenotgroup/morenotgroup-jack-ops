// src/app/page.tsx
import { getEventos } from "@/lib/googleSheets";

export default async function HomePage() {
  let error: string | null = null;
  let eventos: any[] = [];

  try {
    eventos = await getEventos();
  } catch (err: any) {
    console.error("Erro ao carregar eventos", err);
    error =
      "Não foi possível carregar os eventos a partir da planilha. Verifique as configurações de integração com o Google Sheets.";
  }

  const hasEventos = Array.isArray(eventos) && eventos.length > 0;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-100">Eventos cadastrados</h2>

      {error && (
        <p className="text-sm text-red-400">
          {error}
          <br />
          <span className="text-xs text-zinc-500">
            Dica: confira as variáveis GOOGLE_SHEETS_JACK_ID,
            GOOGLE_SERVICE_ACCOUNT_EMAIL e GOOGLE_SERVICE_ACCOUNT_KEY na Vercel.
          </span>
        </p>
      )}

      {!error && !hasEventos && (
        <p className="text-sm text-zinc-400">
          Ainda não há eventos cadastrados. Clique em &quot;Novo evento&quot;
          no topo para começar.
        </p>
      )}

      {!error && hasEventos && (
        <div className="overflow-hidden glass-card bg-zinc-950/60 border border-white/5">
          <table className="min-w-full text-sm table-jack">
            <thead className="bg-zinc-950/80 border-b border-zinc-800/80">
              <tr>
                <th className="text-left font-medium text-zinc-300">#</th>
                <th className="text-left font-medium text-zinc-300">Evento</th>
                <th className="text-left font-medium text-zinc-300">Data</th>
                <th className="text-left font-medium text-zinc-300">Local</th>
                <th className="text-left font-medium text-zinc-300">Pax</th>
                <th className="text-left font-medium text-zinc-300">Drinks</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((ev) => {
                const totalDrinks = ev.drinks.reduce(
                  (acc: number, d: { quantidade: number }) =>
                    acc + (d.quantidade || 0),
                  0
                );
                return (
                  <tr
                    key={ev.rowIndex}
                    className="border-b border-zinc-800/70 hover:bg-zinc-900/80 transition-colors"
                  >
                    <td className="text-zinc-500">{ev.rowIndex}</td>
                    <td className="text-zinc-100">{ev.nome}</td>
                    <td className="text-zinc-200">{ev.data}</td>
                    <td className="text-zinc-300">
                      {ev.local || <span className="text-zinc-500">—</span>}
                    </td>
                    <td className="text-zinc-200">
                      {ev.pax ?? <span className="text-zinc-500">—</span>}
                    </td>
                    <td className="text-zinc-200">{totalDrinks} drinks</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        Cada linha corresponde a uma linha da aba &quot;Tabela Eventos&quot; da
        planilha de estudo Jack Daniel&apos;s.
      </p>
    </section>
  );
}

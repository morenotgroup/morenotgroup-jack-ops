import { getEventos } from '@/lib/googleSheets';

export default async function HomePage() {
  const eventos = await getEventos();

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-100">
        Eventos cadastrados
      </h2>

      {eventos.length === 0 && (
        <p className="text-sm text-zinc-400">
          Ainda não há eventos cadastrados. Clique em &quot;Novo evento&quot; no
          topo para começar.
        </p>
      )}

      {eventos.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-900/80 border-b border-zinc-800/80">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">
                  #
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">
                  Evento
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">
                  Data
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">
                  Local
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">
                  Pax
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-300">
                  Drinks
                </th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((ev) => {
                const totalDrinks = ev.drinks.reduce(
                  (acc, d) => acc + (d.quantidade || 0),
                  0,
                );
                return (
                  <tr
                    key={ev.rowIndex}
                    className="border-b border-zinc-800/70 hover:bg-zinc-900/90 transition-colors"
                  >
                    <td className="px-4 py-2 text-zinc-500">{ev.rowIndex}</td>
                    <td className="px-4 py-2 text-zinc-100">{ev.nome}</td>
                    <td className="px-4 py-2 text-zinc-200">{ev.data}</td>
                    <td className="px-4 py-2 text-zinc-300">
                      {ev.local || <span className="text-zinc-500">—</span>}
                    </td>
                    <td className="px-4 py-2 text-zinc-200">
                      {ev.pax ?? <span className="text-zinc-500">—</span>}
                    </td>
                    <td className="px-4 py-2 text-zinc-200">
                      {totalDrinks} drinks
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        Cada linha corresponde a uma linha da aba &quot;Tabela Eventos&quot; da
        planilha.
      </p>
    </section>
  );
}


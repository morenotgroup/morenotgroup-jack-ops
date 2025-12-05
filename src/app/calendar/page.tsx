// src/app/calendar/page.tsx
import { getEventos } from "@/lib/googleSheets";
import type { Evento } from "@/types/jack";

function parseDateBR(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const [dd, mm, yyyy] = parts.map((p) => parseInt(p, 10));
  if (!dd || !mm || !yyyy) return null;

  return new Date(yyyy, mm - 1, dd);
}

const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

export default async function CalendarPage() {
  let eventos: Evento[] = [];

  try {
    eventos = await getEventos();
  } catch (err) {
    console.error("Erro ao carregar eventos no calendário", err);
  }

  if (!eventos.length) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-zinc-100">Calendário</h2>
        <p className="text-sm text-zinc-400">
          Nenhum evento cadastrado ainda. Cadastre eventos na aba &quot;Eventos&quot;.
        </p>
      </section>
    );
  }

  const eventosComData = eventos
    .map((ev) => {
      const d = parseDateBR(ev.data);
      return { ...ev, _date: d };
    })
    .filter((ev) => ev._date !== null) as (Evento & { _date: Date })[];

  eventosComData.sort((a, b) => a._date.getTime() - b._date.getTime());

  const grupos = new Map<string, (Evento & { _date: Date })[]>();

  for (const ev of eventosComData) {
    const key = `${ev._date.getFullYear()}-${ev._date.getMonth()}`;
    if (!grupos.has(key)) {
      grupos.set(key, []);
    }
    grupos.get(key)!.push(ev);
  }

  const gruposOrdenados = Array.from(grupos.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-100">Calendário de eventos</h2>
      <p className="text-xs text-zinc-500">
        Visão agrupada por mês, baseada na coluna &quot;Data&quot; da planilha.
      </p>

      <div className="space-y-6">
        {gruposOrdenados.map(([key, events]) => {
          const [yearStr, monthStr] = key.split("-");
          const year = parseInt(yearStr, 10);
          const month = parseInt(monthStr, 10);

          const label = `${MONTHS_PT[month]} ${year}`;

          return (
            <div key={key} className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-100">{label}</h3>
              <div className="space-y-1">
                {events.map((ev) => {
                  const totalDrinks = ev.drinks.reduce(
                    (acc, d) => acc + (d.quantidade || 0),
                    0
                  );

                  const dia = ev._date.getDate().toString().padStart(2, "0");

                  return (
                    <div
                      key={ev.rowIndex}
                      className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/70 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-jack-gold/50 text-xs font-semibold text-jack-gold">
                          {dia}
                        </div>
                        <div>
                          <p className="text-sm text-zinc-50">{ev.nome}</p>
                          <p className="text-xs text-zinc-500">
                            Pax:{" "}
                            {ev.pax ?? (
                              <span className="text-zinc-600">não informado</span>
                            )}{" "}
                            · Drinks: {totalDrinks}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-zinc-500">
                        <p>{ev.data}</p>
                        {ev.local && <p>{ev.local}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

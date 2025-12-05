// src/app/dashboard/page.tsx
import { getEventos } from "@/lib/googleSheets";
import { DRINK_HEADER_NAMES, type DrinkName, type Evento } from "@/types/jack";

const DOSE_ML = 50; // 50ml por drink

function sumDrinks(ev: Evento): number {
  return ev.drinks.reduce((acc, d) => acc + (d.quantidade || 0), 0);
}

export default async function DashboardPage() {
  let eventos: Evento[] = [];

  try {
    eventos = await getEventos();
  } catch (err) {
    console.error("Erro ao carregar eventos no dashboard", err);
  }

  if (!eventos.length) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-zinc-100">Dashboard</h2>
        <p className="text-sm text-zinc-400">
          Nenhum evento cadastrado ainda. Cadastre eventos na aba &quot;Eventos&quot;.
        </p>
      </section>
    );
  }

  const totalEventos = eventos.length;
  const totalPax = eventos.reduce(
    (acc, ev) => acc + (ev.pax ?? 0),
    0
  );
  const totalDrinks = eventos.reduce((acc, ev) => acc + sumDrinks(ev), 0);

  const totalLitros = (totalDrinks * DOSE_ML) / 1000;
  const garrafasTeoricas = totalLitros; // 1L por garrafa

  const drinksPorTipo: Record<DrinkName, number> = {
    "MaracuJack": 0,
    "Jack & Coke": 0,
    "Jack Honey & Lemonade": 0,
    "Jack Apple & Lemonade": 0,
    "Jack Apple & Tonic": 0,
    "Jack Fire & Ginger": 0
  };

  eventos.forEach((ev) => {
    ev.drinks.forEach((d) => {
      drinksPorTipo[d.nome] += d.quantidade || 0;
    });
  });

  const rankingSku = DRINK_HEADER_NAMES.map((nome) => ({
    nome,
    quantidade: drinksPorTipo[nome],
    litros: (drinksPorTipo[nome] * DOSE_ML) / 1000
  })).sort((a, b) => b.quantidade - a.quantidade);

  const topEventos = [...eventos]
    .map((ev) => ({ ...ev, totalDrinks: sumDrinks(ev) }))
    .sort((a, b) => b.totalDrinks - a.totalDrinks)
    .slice(0, 5);

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-medium text-zinc-100">
        Dashboard de consumo
      </h2>

      {/* Cards resumo */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-zinc-950/80 px-3 py-3">
          <p className="text-xs text-zinc-500 uppercase tracking-[0.2em]">
            Eventos
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-50">
            {totalEventos}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Total de eventos registrados na planilha
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-950/80 px-3 py-3">
          <p className="text-xs text-zinc-500 uppercase tracking-[0.2em]">
            Pax estimado
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-50">
            {totalPax.toLocaleString("pt-BR")}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Soma da coluna Pax (quando preenchida)
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-950/80 px-3 py-3">
          <p className="text-xs text-zinc-500 uppercase tracking-[0.2em]">
            Drinks servidos
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-50">
            {totalDrinks.toLocaleString("pt-BR")}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Soma de todas as saídas de drinks por evento
          </p>
        </div>

        <div className="rounded-2xl border border-jack-gold/40 bg-zinc-950/80 px-3 py-3">
          <p className="text-xs text-jack-gold uppercase tracking-[0.2em]">
            Equivalente em garrafas 1L
          </p>
          <p className="mt-1 text-2xl font-semibold text-jack-gold">
            {garrafasTeoricas.toFixed(1)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-500">
            Considerando dose padrão Jack de 50ml
          </p>
        </div>
      </div>

      {/* Consumo por SKU */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-100">
            Consumo por SKU (drinks)
          </h3>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80">
            <table className="min-w-full text-xs table-jack">
              <thead className="border-b border-zinc-800/80 bg-zinc-950/90">
                <tr>
                  <th className="text-left font-medium text-zinc-300">
                    Drink
                  </th>
                  <th className="text-right font-medium text-zinc-300">
                    Drinks
                  </th>
                  <th className="text-right font-medium text-zinc-300">
                    Litros
                  </th>
                </tr>
              </thead>
              <tbody>
                {rankingSku.map((sku) => (
                  <tr
                    key={sku.nome}
                    className="border-b border-zinc-800/60 last:border-b-0"
                  >
                    <td className="text-zinc-100">{sku.nome}</td>
                    <td className="text-right text-zinc-200">
                      {sku.quantidade.toLocaleString("pt-BR")}
                    </td>
                    <td className="text-right text-zinc-200">
                      {sku.litros.toFixed(1)} L
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top eventos por consumo */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-100">
            Top 5 eventos por consumo de drinks
          </h3>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80">
            <table className="min-w-full text-xs table-jack">
              <thead className="border-b border-zinc-800/80 bg-zinc-950/90">
                <tr>
                  <th className="text-left font-medium text-zinc-300">
                    Evento
                  </th>
                  <th className="text-left font-medium text-zinc-300">Data</th>
                  <th className="text-right font-medium text-zinc-300">
                    Drinks
                  </th>
                </tr>
              </thead>
              <tbody>
                {topEventos.map((ev) => (
                  <tr
                    key={ev.rowIndex}
                    className="border-b border-zinc-800/60 last:border-b-0"
                  >
                    <td className="text-zinc-100">{ev.nome}</td>
                    <td className="text-zinc-300">{ev.data}</td>
                    <td className="text-right text-zinc-200">
                      {ev.totalDrinks.toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500">
        Cálculos baseados na receita padrão Jack Daniel&apos;s: 50ml por drink,
        20 drinks por garrafa de 1 litro (desconsiderando quebra, roubo ou
        desperdício).
      </p>
    </section>
  );
}

// src/app/api/jack/report/[row]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEventoByRow } from '@/lib/googleSheets';
import { JackReport } from '@/types/jack';

export async function GET(
  req: NextRequest,
  { params }: { params: { row: string } },
) {
  try {
    const rowIndex = Number(params.row);
    if (!rowIndex || Number.isNaN(rowIndex)) {
      return NextResponse.json(
        { error: 'Parâmetro "row" inválido.' },
        { status: 400 },
      );
    }

    const evento = await getEventoByRow(rowIndex);
    if (!evento) {
      return NextResponse.json(
        { error: `Evento não encontrado na linha ${rowIndex}.` },
        { status: 404 },
      );
    }

    const totalDrinks = evento.drinks.reduce(
      (acc, d) => acc + (d.quantidade || 0),
      0,
    );

    const report: JackReport = {
      slide3: {
        data: evento.data,
        local: evento.local,
        endereco: evento.endereco,
        horario_evento: evento.horario,
        // se quiser, pode montar algo tipo "Bar Jack & Coke + Maracujack"
        bar: evento.local,
        pax: evento.pax,
      },
      slide5: {
        drinks: evento.drinks.map((d) => ({
          nome: d.nome,
          quantidade: d.quantidade,
        })),
        total_drinks: totalDrinks,
      },
      slide6: {
        // por enquanto deixo null; depois você pode salvar uma URL de foto na planilha
        foto_url: null,
      },
    };

    return NextResponse.json(report);
  } catch (err: any) {
    console.error('Erro ao gerar JackReport', err);
    return NextResponse.json(
      {
        error: 'Erro ao gerar relatório Jack',
        details: String(err?.message ?? err),
      },
      { status: 500 },
    );
  }
}

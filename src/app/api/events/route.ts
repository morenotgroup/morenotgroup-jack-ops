// src/app/api/events/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addEvento, getEventos } from "@/lib/googleSheets";
import { DRINK_HEADER_NAMES } from "@/types/jack";

const novoEventoSchema = z.object({
  nome: z.string().min(1),
  data: z.string().min(1),
  local: z.string().default(""),
  endereco: z.string().default(""),
  horario: z.string().default(""),
  pax: z.number().int().nonnegative().nullable().optional(),
  drinks: z
    .record(z.string(), z.number().nonnegative())
    .optional()
    .default({})
});

export async function GET() {
  try {
    const eventos = await getEventos();
    return NextResponse.json(eventos);
  } catch (err: any) {
    console.error("Erro ao listar eventos", err);
    return NextResponse.json(
      {
        error: "Erro ao listar eventos",
        details: String(err?.message ?? err)
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = novoEventoSchema.parse(json);

    const drinksInput: Record<string, number> = {};
    DRINK_HEADER_NAMES.forEach((name) => {
      if (parsed.drinks[name] != null) {
        drinksInput[name] = parsed.drinks[name];
      }
    });

    const novoEvento = await addEvento({
      nome: parsed.nome,
      data: parsed.data,
      local: parsed.local,
      endereco: parsed.endereco,
      horario: parsed.horario,
      pax: parsed.pax ?? null,
      drinks: drinksInput
    });

    return NextResponse.json(novoEvento, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao criar evento", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Erro de validação", issues: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: "Erro ao criar evento",
        details: String(err?.message ?? err)
      },
      { status: 500 }
    );
  }
}

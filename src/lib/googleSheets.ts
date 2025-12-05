// src/lib/googleSheets.ts
import { google, sheets_v4 } from "googleapis";
import {
  DRINK_HEADER_NAMES,
  DrinkName,
  Evento,
  NovoEventoInput
} from "@/types/jack";

const SHEET_ID = process.env.GOOGLE_SHEETS_JACK_ID;

function ensureSheetId(): string {
  if (!SHEET_ID) {
    throw new Error(
      'Faltou configurar GOOGLE_SHEETS_JACK_ID nas variáveis de ambiente da Vercel.'
    );
  }
  return SHEET_ID;
}

let sheetsClient: sheets_v4.Sheets | null = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!email || !rawKey) {
    throw new Error(
      "Faltou GOOGLE_SERVICE_ACCOUNT_EMAIL ou GOOGLE_SERVICE_ACCOUNT_KEY nas variáveis de ambiente da Vercel."
    );
  }

  // Converte "\n" literais do painel da Vercel em quebras de linha reais
  const key = rawKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT(email, undefined, key, [
    "https://www.googleapis.com/auth/spreadsheets"
  ]);

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

export async function getSheetValues(range: string): Promise<any[][]> {
  const sheets = getSheetsClient();
  const spreadsheetId = ensureSheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });

  return (res.data.values ?? []) as any[][];
}

export async function appendRow(
  range: string,
  row: (string | number | null)[]
): Promise<number | null> {
  const sheets = getSheetsClient();
  const spreadsheetId = ensureSheetId();

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [row]
    }
  });

  const updatedRange = res.data.updates?.updatedRange; // ex: 'Tabela Eventos'!A12:Z12
  if (!updatedRange) return null;

  const match = updatedRange.match(/![A-Z]+(\d+):/);
  if (!match) return null;

  const rowIndex = parseInt(match[1], 10);
  return rowIndex;
}

// -----------------------
// JACK — TABELA EVENTOS
// -----------------------

const ABA_EVENTOS = "Tabela Eventos";

type HeaderIndexMap = {
  evento: number;
  data: number;
  pax: number;
  horario: number;
  local: number | null;
  endereco: number | null;
  drinkCols: { nome: DrinkName; index: number }[];
};

/**
 * Lê a aba "Tabela Eventos" e:
 * - identifica em qual linha está o cabeçalho (a que contém "Evento")
 * - devolve o cabeçalho, as linhas de dados e o número da linha do cabeçalho na planilha
 */
async function getEventosTable(): Promise<{
  header: any[];
  data: any[][];
  headerRowNumber: number;
}> {
  const all = await getSheetValues(`${ABA_EVENTOS}!A1:Z500`);

  if (!all.length) {
    return { header: [], data: [], headerRowNumber: 0 };
  }

  // Procura a PRIMEIRA linha que contenha "Evento" em alguma coluna
  const headerIndex = all.findIndex((row) =>
    row?.some(
      (cell: any) =>
        typeof cell === "string" &&
        cell.trim().toLowerCase() === "evento".toLowerCase()
    )
  );

  if (headerIndex === -1) {
    throw new Error(
      `Cabeçalho não encontrado na aba "${ABA_EVENTOS}" (não encontrei a coluna "Evento"). Verifique se a linha de títulos está correta.`
    );
  }

  const header = all[headerIndex] ?? [];
  const data = all.slice(headerIndex + 1);
  const headerRowNumber = headerIndex + 1; // 1-based (planilha)

  return { header, data, headerRowNumber };
}

function buildHeaderIndexMap(headerRow: any[]): HeaderIndexMap {
  const getRequiredIndex = (name: string): number => {
    const idx = headerRow.findIndex(
      (cell: any) => typeof cell === "string" && cell.trim() === name
    );
    if (idx === -1) {
      throw new Error(
        `Coluna "${name}" não encontrada na aba "${ABA_EVENTOS}". Verifique o cabeçalho.`
      );
    }
    return idx;
  };

  // obrigatórias: estão na tua planilha atual
  const eventoIdx = getRequiredIndex("Evento");
  const dataIdx = getRequiredIndex("Data");
  const paxIdx = getRequiredIndex("Pax");
  const horarioIdx = getRequiredIndex("Horário");

  // opcionais: hoje não existem na planilha, mas se você criar "Local" e "Endereço" ele já passa a usar
  const findOptionalIndex = (name: string): number | null => {
    const idx = headerRow.findIndex(
      (cell: any) => typeof cell === "string" && cell.trim() === name
    );
    return idx === -1 ? null : idx;
  };

  const localIdx = findOptionalIndex("Local");
  const enderecoIdx = findOptionalIndex("Endereço");

  const drinkCols: { nome: DrinkName; index: number }[] = [];

  DRINK_HEADER_NAMES.forEach((drinkName) => {
    const idx = headerRow.findIndex(
      (cell: any) => typeof cell === "string" && cell.trim() === drinkName
    );
    if (idx !== -1) {
      drinkCols.push({ nome: drinkName, index: idx });
    }
  });

  return {
    evento: eventoIdx,
    data: dataIdx,
    pax: paxIdx,
    horario: horarioIdx,
    local: localIdx,
    endereco: enderecoIdx,
    drinkCols
  };
}

export async function getEventos(): Promise<Evento[]> {
  const { header, data, headerRowNumber } = await getEventosTable();
  if (!header.length) return [];

  const map = buildHeaderIndexMap(header);

  const eventos: Evento[] = [];

  data.forEach((rowRaw, idx) => {
    const row = rowRaw ?? [];

    const nome = row[map.evento] ?? "";
    if (!nome) return; // pula linhas vazias de fato

    const dataVal = row[map.data] ?? "";
    const dataStr =
      typeof dataVal === "string"
        ? dataVal
        : dataVal instanceof Date
        ? dataVal.toISOString().slice(0, 10)
        : String(dataVal ?? "");

    const paxRaw = row[map.pax];
    let pax: number | null = null;
    if (paxRaw !== undefined && paxRaw !== null && paxRaw !== "") {
      const n = Number(paxRaw);
      pax = Number.isNaN(n) ? null : n;
    }

    const horario = row[map.horario] ?? "";

    const local =
      map.local != null && map.local >= 0 ? row[map.local] ?? "" : "";
    const endereco =
      map.endereco != null && map.endereco >= 0
        ? row[map.endereco] ?? ""
        : "";

    const drinks = map.drinkCols.map(({ nome, index }) => {
      const v = row[index];
      const n = v === "" || v == null ? 0 : Number(v) || 0;
      return { nome, quantidade: n };
    });

    // linha na planilha: cabeçalho + 1 (primeira linha de dados) + offset
    const rowIndex = headerRowNumber + 1 + idx;

    eventos.push({
      rowIndex,
      nome: String(nome),
      data: dataStr,
      local: String(local ?? ""),
      endereco: String(endereco ?? ""),
      pax,
      horario: String(horario ?? ""),
      drinks
    });
  });

  return eventos;
}

export async function getEventoByRow(
  rowIndex: number
): Promise<Evento | null> {
  const eventos = await getEventos();
  return eventos.find((e) => e.rowIndex === rowIndex) ?? null;
}

export async function addEvento(input: NovoEventoInput): Promise<Evento> {
  const { header } = await getEventosTable();
  if (!header.length) {
    throw new Error(
      `Não foi possível ler o cabeçalho da aba "${ABA_EVENTOS}".`
    );
  }

  const map = buildHeaderIndexMap(header);

  const rowTemplate: (string | number | null)[] = new Array(
    header.length
  ).fill("");

  rowTemplate[map.evento] = input.nome;
  rowTemplate[map.data] = input.data;

  if (map.local != null && map.local >= 0) {
    rowTemplate[map.local] = input.local ?? "";
  }
  if (map.endereco != null && map.endereco >= 0) {
    rowTemplate[map.endereco] = input.endereco ?? "";
  }

  rowTemplate[map.horario] = input.horario ?? "";
  if (input.pax != null) {
    rowTemplate[map.pax] = input.pax;
  }

  map.drinkCols.forEach(({ nome, index }) => {
    const quantidade = input.drinks[nome] ?? 0;
    rowTemplate[index] = quantidade;
  });

  const newRowIndex = await appendRow(`${ABA_EVENTOS}!A:Z`, rowTemplate);

  if (!newRowIndex) {
    throw new Error("Não foi possível determinar o índice da nova linha.");
  }

  const evento = await getEventoByRow(newRowIndex);
  if (!evento) {
    throw new Error(
      `Evento criado na linha ${newRowIndex}, mas não foi possível reler os dados.`
    );
  }

  return evento;
}

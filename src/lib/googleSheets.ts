// src/lib/googleSheets.ts
import { google, sheets_v4 } from 'googleapis';
import { DRINK_HEADER_NAMES, Evento, NovoEventoInput } from '@/types/jack';

const SHEET_ID = process.env.GOOGLE_SHEETS_JACK_ID;
if (!SHEET_ID) {
  throw new Error('Faltou configurar GOOGLE_SHEETS_JACK_ID no .env / Vercel');
}

let sheetsClient: sheets_v4.Sheets | null = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (!email || !rawKey) {
    throw new Error(
      'Faltou GOOGLE_SERVICE_ACCOUNT_EMAIL ou GOOGLE_SERVICE_ACCOUNT_KEY nas env vars da Vercel.',
    );
  }

  // Converte "\n" literais em quebras de linha reais para o formato PEM
  const key = rawKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT(
    email,
    undefined,
    key,
    ['https://www.googleapis.com/auth/spreadsheets'],
  );

  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

export async function getSheetValues(range: string): Promise<string[][]> {
  const sheets = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range,
  });

  const values = res.data.values ?? [];
  return values as string[][];
}

export async function appendRow(
  range: string,
  row: (string | number | null)[],
): Promise<number | null> {
  const sheets = getSheetsClient();

  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID!,
    range,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [row],
    },
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

const ABA_EVENTOS = 'Tabela Eventos';

const EVENT_HEADERS = {
  evento: 'Evento',
  data: 'Data',
  local: 'Local',
  endereco: 'Endereço',
  pax: 'Pax',
  horario: 'Horário',
} as const;

type HeaderIndexMap = {
  [K in keyof typeof EVENT_HEADERS]: number;
} & {
  drinkCols: { nome: string; index: number }[];
};

async function getEventosRawRange() {
  return getSheetValues(`${ABA_EVENTOS}!A1:Z500`);
}

function buildHeaderIndexMap(headerRow: string[]): HeaderIndexMap {
  const indices: any = {};

  (Object.keys(EVENT_HEADERS) as (keyof typeof EVENT_HEADERS)[]).forEach(
    (key) => {
      const colName = EVENT_HEADERS[key];
      const index = headerRow.indexOf(colName);
      if (index === -1) {
        throw new Error(
          `Coluna "${colName}" não encontrada na aba "${ABA_EVENTOS}". Verifique o cabeçalho.`,
        );
      }
      indices[key] = index;
    },
  );

  const drinkCols: { nome: string; index: number }[] = [];
  DRINK_HEADER_NAMES.forEach((drinkName) => {
    const idx = headerRow.indexOf(drinkName);
    if (idx !== -1) {
      drinkCols.push({ nome: drinkName, index: idx });
    }
  });

  return {
    ...indices,
    drinkCols,
  };
}

export async function getEventos(): Promise<Evento[]> {
  const values = await getEventosRawRange();

  if (!values.length) return [];

  const header = values[0];
  const map = buildHeaderIndexMap(header);

  const eventos: Evento[] = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row || row.length === 0) continue;

    const rowIndex = i + 1; // linha real na planilha (1 = cabeçalho)

    const nome = row[map.evento] ?? '';
    if (!nome) continue; // pula linhas realmente vazias

    const data = row[map.data] ?? '';
    const local = row[map.local] ?? '';
    const endereco = row[map.endereco] ?? '';
    const horario = row[map.horario] ?? '';
    const paxRaw = row[map.pax] ?? '';
    const pax = paxRaw ? Number(paxRaw) || null : null;

    const drinks = map.drinkCols.map(({ nome, index }) => {
      const val = row[index] ?? '';
      const quantidade = val ? Number(val) || 0 : 0;
      return { nome: nome as any, quantidade };
    });

    eventos.push({
      rowIndex,
      nome,
      data,
      local,
      endereco,
      pax,
      horario,
      drinks,
    });
  }

  return eventos;
}

export async function getEventoByRow(
  rowIndex: number,
): Promise<Evento | null> {
  const eventos = await getEventos();
  return eventos.find((e) => e.rowIndex === rowIndex) ?? null;
}

export async function addEvento(input: NovoEventoInput): Promise<Evento> {
  const [header] = await getSheetValues(`${ABA_EVENTOS}!A1:Z1`);
  const map = buildHeaderIndexMap(header);

  const rowTemplate: (string | number | null)[] = new Array(
    header.length,
  ).fill('');

  rowTemplate[map.evento] = input.nome;
  rowTemplate[map.data] = input.data;
  rowTemplate[map.local] = input.local;
  rowTemplate[map.endereco] = input.endereco;
  rowTemplate[map.horario] = input.horario;
  if (input.pax != null) {
    rowTemplate[map.pax] = input.pax;
  }

  map.drinkCols.forEach(({ nome, index }) => {
    const quantidade = input.drinks[nome as keyof typeof input.drinks] ?? 0;
    rowTemplate[index] = quantidade;
  });

  const newRowIndex = await appendRow(`${ABA_EVENTOS}!A:Z`, rowTemplate);

  if (!newRowIndex) {
    throw new Error('Não foi possível determinar o índice da nova linha.');
  }

  const evento = await getEventoByRow(newRowIndex);
  if (!evento) {
    throw new Error(
      `Evento criado na linha ${newRowIndex}, mas não foi possível reler os dados.`,
    );
  }

  return evento;
}

// src/types/jack.ts

// Esses nomes PRECISAM bater exatamente com os cabeçalhos da aba "Tabela Eventos"
export const DRINK_HEADER_NAMES = [
  "MaracuJack",
  "Jack & Coke",
  "Jack Honey & Lemonade",
  "Jack Apple & Lemonade",
  "Jack Apple & Tonic",
  "Jack Fire & Ginger"
] as const;

export type DrinkName = (typeof DRINK_HEADER_NAMES)[number];

export type Evento = {
  rowIndex: number; // número da linha real na planilha
  nome: string;
  data: string;
  local: string;
  endereco: string;
  pax: number | null;
  horario: string;
  drinks: {
    nome: DrinkName;
    quantidade: number;
  }[];
};

export type NovoEventoInput = {
  nome: string;
  data: string;
  local?: string;
  endereco?: string;
  pax: number | null;
  horario?: string;
  drinks: {
    [K in DrinkName]?: number;
  };
};

export type JackReport = {
  slide3: {
    data: string;
    local: string;
    endereco: string;
    horario_evento: string;
    bar: string;
    pax: number | null;
  };
  slide5: {
    drinks: {
      nome: string;
      quantidade: number;
    }[];
    total_drinks: number;
  };
  slide6: {
    foto_url: string | null;
  };
};

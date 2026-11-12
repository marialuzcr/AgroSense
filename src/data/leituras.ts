export type Leitura = {
  id: string;
  missaoId: string;
  area: string;
  pontoId: string;
  dataHora: string;

  temperatura: number;
  umidade: number;
  condutividade: number;
  potassio: number;
  fosforo: number;
  nitrogenio: number;
  ph: number;
};

export const leituras: Leitura[] = [
  {
    id: "1",
    missaoId: "MIS-001",
    area: "Norte",
    pontoId: "NORTE-01",
    dataHora: "2026-10-08T10:24:00",
    temperatura: 27.8,
    umidade: 65.4,
    condutividade: 1.1,
    potassio: 39,
    fosforo: 17,
    nitrogenio: 30,
    ph: 6.4,
  },
  {
    id: "2",
    missaoId: "MIS-002",
    area: "Leste",
    pontoId: "LESTE-01",
    dataHora: "2026-10-08T10:31:00",
    temperatura: 28.1,
    umidade: 66.8,
    condutividade: 1.2,
    potassio: 41,
    fosforo: 18,
    nitrogenio: 32,
    ph: 6.5,
  },
  {
    id: "3",
    missaoId: "MIS-003",
    area: "Sul",
    pontoId: "SUL-01",
    dataHora: "2026-10-08T11:05:00",
    temperatura: 29.2,
    umidade: 62.7,
    condutividade: 1.4,
    potassio: 43,
    fosforo: 20,
    nitrogenio: 34,
    ph: 6.2,
  },
  {
    id: "4",
    missaoId: "MIS-004",
    area: "Oeste",
    pontoId: "OESTE-01",
    dataHora: "2026-10-08T11:18:00",
    temperatura: 28.5,
    umidade: 67.2,
    condutividade: 1.3,
    potassio: 42,
    fosforo: 19,
    nitrogenio: 31,
    ph: 6.6,
  },
];

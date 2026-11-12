import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Leitura } from "./leituras";

const CHAVE_LEITURAS = "@monitoramento_agricola:leituras";

// Busca todas as leituras armazenadas
export async function buscarLeituras(): Promise<Leitura[]> {
  try {
    const dados = await AsyncStorage.getItem(CHAVE_LEITURAS);

    return dados ? (JSON.parse(dados) as Leitura[]) : [];
  } catch (erro) {
    console.error("Erro ao buscar leituras:", erro);
    throw erro;
  }
}

// Salva uma nova leitura
export async function salvarLeitura(novaLeitura: Leitura): Promise<void> {
  const leituras = await buscarLeituras();

  const leiturasAtualizadas = [...leituras, novaLeitura];

  await AsyncStorage.setItem(
    CHAVE_LEITURAS,
    JSON.stringify(leiturasAtualizadas),
  );

  console.log("MEDIÇÕES SALVAS:", leiturasAtualizadas);
}

// Busca as leituras de um ponto específico
export async function buscarLeiturasPorPonto(
  pontoId: string,
): Promise<Leitura[]> {
  const leituras = await buscarLeituras();

  return leituras
    .filter((leitura) => leitura.pontoId === pontoId)
    .sort(
      (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
    );
}

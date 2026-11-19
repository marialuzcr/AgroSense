
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TipoPonto = "fixo" | "movel";

export type Ponto = {
  id: string;
  area: string;
  nome: string;
  descricao: string;
  dataCadastro: string;
  tipo: TipoPonto;
};

const CHAVE_PONTOS = "@monitoramento_agricola:pontos";

export async function buscarPontos(): Promise<Ponto[]> {
  try {
    const dados = await AsyncStorage.getItem(CHAVE_PONTOS);

    if (!dados) return [];

    const pontos = JSON.parse(dados) as Partial<Ponto>[];

    // Pontos cadastrados antes da criação do campo "tipo" serão considerados fixos.
    return pontos.map((ponto) => ({
      ...ponto,
      tipo: ponto.tipo ?? "fixo",
    })) as Ponto[];
  } catch (erro) {
    console.error("Erro ao buscar pontos:", erro);
    throw erro;
  }
}

export async function salvarPonto(novoPonto: Ponto): Promise<void> {
  const pontos = await buscarPontos();

  const pontosAtualizados = [
    ...pontos.filter((ponto) => ponto.id !== novoPonto.id),
    novoPonto,
  ];

  await AsyncStorage.setItem(
    CHAVE_PONTOS,
    JSON.stringify(pontosAtualizados),
  );
}

export async function excluirPonto(id: string): Promise<void> {
  const pontos = await buscarPontos();

  const pontosAtualizados = pontos.filter((ponto) => ponto.id !== id);

  await AsyncStorage.setItem(
    CHAVE_PONTOS,
    JSON.stringify(pontosAtualizados),
  );
}

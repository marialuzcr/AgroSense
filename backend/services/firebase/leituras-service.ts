import {
  child,
  equalTo,
  get,
  onValue,
  orderByChild,
  query,
  ref,
  set,
} from "firebase/database";

import type { Leitura } from "../../../src/data/leituras";
import { auth, realtimeDb } from "../firebase";

// Retorna o caminho das leituras do usuário conectado
function obterReferenciaLeituras() {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Nenhum usuário está conectado.");
  }

  return ref(realtimeDb, `usuarios/${usuario.uid}/leituras`);
}

// Salva uma medição no Realtime Database
export async function salvarLeituraFirestore(
  leitura: Leitura,
): Promise<void> {
  try {
    await set(
      child(obterReferenciaLeituras(), leitura.id),
      leitura
    );
  } catch (erro) {
    console.error("Erro ao salvar medição:", erro);
    throw erro;
  }
}

// Busca todas as medições do usuário
export async function buscarLeiturasFirestore(): Promise<Leitura[]> {
  try {
    const resultado = await get(obterReferenciaLeituras());

    if (!resultado.exists()) {
      return [];
    }

    const dados = resultado.val();

    return Object.entries(dados).map(([id, leitura]) => ({
      ...(leitura as Leitura),
      id,
    }));
  } catch (erro) {
    console.error("Erro ao buscar medições:", erro);
    throw erro;
  }
}

// Busca as medições de um ponto específico
export async function buscarLeiturasPorPontoFirestore(
  pontoId: string,
): Promise<Leitura[]> {
  try {
    const consulta = query(
      obterReferenciaLeituras(),
      orderByChild("pontoId"),
      equalTo(pontoId),
    );

    const resultado = await get(consulta);

    if (!resultado.exists()) {
      return [];
    }

    const dados = resultado.val();

    return Object.entries(dados)
      .map(([id, leitura]) => ({
        ...(leitura as Leitura),
        id,
      }))
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
  } catch (erro) {
    console.error("Erro ao buscar medições do ponto:", erro);
    throw erro;
  }
}

// Busca uma medição pelo ID
export async function buscarLeituraPorIdFirestore(
  id: string,
): Promise<Leitura | null> {
  try {
    const referencia = child(obterReferenciaLeituras(), id);
    const resultado = await get(referencia);

    if (!resultado.exists()) {
      return null;
    }

    return {
      ...resultado.val(),
      id,
    } as Leitura;
  } catch (erro) {
    console.error("Erro ao buscar medição:", erro);
    throw erro;
  }
}


// Acompanha as medições do produtor em tempo real
export function observarLeituras(
  aoAtualizar: (leituras: Leitura[]) => void,
  aoErro?: (erro: Error) => void,
): () => void {
  try {
    const referencia = obterReferenciaLeituras();

    const cancelar = onValue(
      referencia,
      (snapshot) => {
        if (!snapshot.exists()) {
          aoAtualizar([]);
          return;
        }

        const dados = snapshot.val();

        const leituras = Object.entries(dados)
          .map(([id, leitura]) => ({
            ...(leitura as Leitura),
            id,
          }))
          .sort((a, b) => b.dataHora.localeCompare(a.dataHora));

        aoAtualizar(leituras);
      },
      (erro) => {
        console.error("Erro ao acompanhar medições:", erro);
        aoErro?.(erro);
      },
    );

    return cancelar;
  } catch (erro) {
    if (erro instanceof Error) {
      aoErro?.(erro);
    }

    return () => {};
  }
}


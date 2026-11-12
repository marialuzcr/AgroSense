
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { db, auth } from "../firebase";
import type { Leitura } from "../../../src/data/leituras";

// Retorna a coleção de leituras do usuário conectado
function obterColecaoLeituras() {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Nenhum usuário está conectado.");
  }

  return collection(db, "usuarios", usuario.uid, "leituras");
}

// Salva uma medição no Firestore
export async function salvarLeituraFirestore(
  leitura: Leitura,
): Promise<void> {
  try {
    await setDoc(doc(obterColecaoLeituras(), leitura.id), leitura);
  } catch (erro) {
    console.error("Erro ao salvar medição:", erro);
    throw erro;
  }
}

// Busca todas as medições do usuário
export async function buscarLeiturasFirestore(): Promise<Leitura[]> {
  try {
    const resultado = await getDocs(obterColecaoLeituras());

    return resultado.docs.map((documento) => ({
      ...documento.data(),
      id: documento.id,
    })) as Leitura[];
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
      obterColecaoLeituras(),
      where("pontoId", "==", pontoId),
      orderBy("dataHora", "desc"),
    );

    const resultado = await getDocs(consulta);

    return resultado.docs.map((documento) => ({
      ...documento.data(),
      id: documento.id,
    })) as Leitura[];
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
    const referencia = doc(obterColecaoLeituras(), id);
    const resultado = await getDoc(referencia);

    if (!resultado.exists()) {
      return null;
    }

    return {
      ...resultado.data(),
      id: resultado.id,
    } as Leitura;
  } catch (erro) {
    console.error("Erro ao buscar medição:", erro);
    throw erro;
  }
}

import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../firebase";

export type Missao = {
  id: string;
  data: string;
  horario: string;
  areas: {
    nome: string;
    pontos: number;
  }[];
  total: number;
  status: string;
};

const COLECAO_MISSOES = "missoes";

// Cadastra uma missão
export async function cadastrarMissao(
  missao: Missao,
): Promise<void> {
  try {
    await setDoc(doc(db, COLECAO_MISSOES, missao.id), missao);
  } catch (erro) {
    console.error("Erro ao cadastrar missão:", erro);
    throw erro;
  }
}

// Busca todas as missões
export async function buscarMissoesFirestore(): Promise<Missao[]> {
  try {
    const resultado = await getDocs(collection(db, COLECAO_MISSOES));

    return resultado.docs.map((documento) => ({
      ...documento.data(),
      id: documento.id,
    })) as Missao[];
  } catch (erro) {
    console.error("Erro ao buscar missões:", erro);
    throw erro;
  }
}

// Busca uma missão pelo ID
export async function buscarMissaoPorId(
  id: string,
): Promise<Missao | null> {
  try {
    const resultado = await getDoc(doc(db, COLECAO_MISSOES, id));

    if (!resultado.exists()) return null;

    return {
      ...resultado.data(),
      id: resultado.id,
    } as Missao;
  } catch (erro) {
    console.error("Erro ao buscar missão:", erro);
    throw erro;
  }
}

// Atualiza uma missão
export async function atualizarMissao(
  id: string,
  dados: Partial<Missao>,
): Promise<void> {
  try {
    await updateDoc(doc(db, COLECAO_MISSOES, id), dados);
  } catch (erro) {
    console.error("Erro ao atualizar missão:", erro);
    throw erro;
  }
}

// Exclui uma missão
export async function excluirMissaoFirestore(
  id: string,
): Promise<void> {
  try {
    await deleteDoc(doc(db, COLECAO_MISSOES, id));
  } catch (erro) {
    console.error("Erro ao excluir missão:", erro);
    throw erro;
  }
}

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  setDoc,
} from "firebase/firestore";

import { db, auth } from "../firebase";
import type { Ponto } from "../../../src/services/pontos-storage";

// Retorna a coleção de pontos do usuário conectado
function obterColecaoPontos() {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Nenhum usuário está conectado.");
  }

  return collection(db, "usuarios", usuario.uid, "pontos");
}

// Cadastra um novo ponto
export async function cadastrarPonto(ponto: Ponto): Promise<void> {
  try {
    await setDoc(doc(obterColecaoPontos(), ponto.id), ponto);
  } catch (erro) {
    console.error("Erro ao cadastrar ponto:", erro);
    throw erro;
  }
}

// Busca todos os pontos do usuário
export async function buscarPontosFirestore(): Promise<Ponto[]> {
  try {
    const resultado = await getDocs(obterColecaoPontos());

    return resultado.docs.map((documento) => ({
      ...documento.data(),
      id: documento.id,
    })) as Ponto[];
  } catch (erro) {
    console.error("Erro ao buscar pontos:", erro);
    throw erro;
  }
}

// Atualiza um ponto
export async function atualizarPontoFirestore(
  id: string,
  dados: Partial<Ponto>,
): Promise<void> {
  try {
    await updateDoc(doc(obterColecaoPontos(), id), dados);
  } catch (erro) {
    console.error("Erro ao atualizar ponto:", erro);
    throw erro;
  }
}

// Exclui um ponto
export async function excluirPontoFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(obterColecaoPontos(), id));
  } catch (erro) {
    console.error("Erro ao excluir ponto:", erro);
    throw erro;
  }
}

// Busca pontos de uma área específica
export async function buscarPontosPorAreaFirestore(
  area: string,
): Promise<Ponto[]> {
  try {
    const consulta = query(
      obterColecaoPontos(),
      where("area", "==", area),
    );

    const resultado = await getDocs(consulta);

    return resultado.docs.map((documento) => ({
      ...documento.data(),
      id: documento.id,
    })) as Ponto[];
  } catch (erro) {
    console.error("Erro ao buscar pontos por área:", erro);
    throw erro;
  }
}

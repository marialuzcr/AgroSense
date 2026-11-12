
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function testarFirebase() {
  try {
    const colecao = collection(db, "testes_conexao");

    // Grava um documento de teste
    await addDoc(colecao, {
      mensagem: "Conexão com o AgroSense funcionando!",
      data: new Date().toISOString(),
    });

    // Consulta os documentos gravados
    const resultado = await getDocs(colecao);

    console.log("Conexão com Firebase funcionando!");
    console.log("Documentos encontrados:", resultado.size);

  } catch (erro) {
    console.error("Erro ao conectar com Firebase:", erro);
  }
}

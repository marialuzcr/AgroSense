import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, updateEmail } from "firebase/auth";

import { auth, db } from "../../backend/services/firebase";

type PerfilUsuario = {
  nome: string;
  email: string;
  telefone: string;
  dataCadastro?: {
    toDate: () => Date;
  } | null;
};

export default function PerfilScreen() {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  useEffect(() => {
    const cancelarObservacao = onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) {
        setErro("Nenhum usuário está conectado.");
        setCarregando(false);
        return;
      }

      try {
        const referencia = doc(db, "usuarios", usuario.uid);
        const resultado = await getDoc(referencia);

        if (resultado.exists()) {
          const dados = resultado.data() as PerfilUsuario;

          setPerfil(dados);
          setNome(dados.nome || "");
          setEmail(dados.email || "");
          setTelefone(dados.telefone || "");
        } else {
          setErro("Os dados do perfil não foram encontrados.");
        }
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        setErro("Não foi possível carregar os dados do perfil.");
      } finally {
        setCarregando(false);
      }
    });

    return cancelarObservacao;
  }, []);

  const formatarData = () => {
    if (!perfil?.dataCadastro) return "Não informada";

    return perfil.dataCadastro.toDate().toLocaleDateString("pt-BR");
  };

  const iniciarEdicao = () => {
    setMensagem("");
    setErro("");
    setEditando(true);
  };

  const cancelarEdicao = () => {
    if (perfil) {
      setNome(perfil.nome);
      setEmail(perfil.email);
      setTelefone(perfil.telefone);
    }

    setEditando(false);
    setErro("");
    setMensagem("");
  };

  const salvarAlteracoes = async () => {
    const usuario = auth.currentUser;

    if (!usuario || !perfil) {
      setErro("Não foi possível identificar sua conta.");
      return;
    }

    if (!nome.trim() || !email.trim() || !telefone.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      if (email.trim() !== usuario.email) {
        await updateEmail(usuario, email.trim());
      }

      const referencia = doc(db, "usuarios", usuario.uid);

      await updateDoc(referencia, {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
      });

      const perfilAtualizado = {
        ...perfil,
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
      };

      setPerfil(perfilAtualizado);
      setEditando(false);
      setMensagem("Dados atualizados com sucesso!");
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);

      if (error.code === "auth/requires-recent-login") {
        setErro(
          "Para alterar o e-mail, faça login novamente e tente outra vez.",
        );
      } else if (error.code === "auth/email-already-in-use") {
        setErro("Este e-mail já está sendo utilizado por outra conta.");
      } else if (error.code === "auth/invalid-email") {
        setErro("Informe um e-mail válido.");
      } else {
        setErro("Não foi possível salvar as alterações.");
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Meu Perfil</Text>
        <Text style={styles.subtitle}>Dados da sua conta AgroSense</Text>

        {carregando ? (
          <ActivityIndicator size="large" color="#2F5D3A" />
        ) : erro && !perfil ? (
          <Text style={styles.error}>{erro}</Text>
        ) : perfil ? (
          <View style={styles.card}>
            {!editando && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={iniciarEdicao}
              >
                <Text style={styles.editButtonText}>EDITAR</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.label}>Nome completo</Text>
            {editando ? (
              <TextInput
                style={styles.input}
                value={nome}
                onChangeText={setNome}
                placeholder="Nome completo"
              />
            ) : (
              <Text style={styles.value}>{perfil.nome}</Text>
            )}

            <Text style={styles.label}>E-mail</Text>
            {editando ? (
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.value}>{perfil.email}</Text>
            )}

            <Text style={styles.label}>Telefone</Text>
            {editando ? (
              <TextInput
                style={styles.input}
                value={telefone}
                onChangeText={setTelefone}
                placeholder="Telefone"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.value}>{perfil.telefone}</Text>
            )}

            <Text style={styles.label}>Data de cadastro</Text>
            <Text style={styles.value}>{formatarData()}</Text>
          </View>
        ) : null}

        {erro !== "" && perfil ? (
          <Text style={styles.error}>{erro}</Text>
        ) : null}

        {mensagem !== "" ? (
          <Text style={styles.success}>{mensagem}</Text>
        ) : null}

        {perfil && editando && (
          <>
            <TouchableOpacity
              style={styles.button}
              onPress={salvarAlteracoes}
              disabled={salvando}
            >
              <Text style={styles.buttonText}>
                {salvando ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelarEdicao}
              disabled={salvando}
            >
              <Text style={styles.cancelButtonText}>CANCELAR</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>VOLTAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F6F2",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    width: "100%",
    maxWidth: 500,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#174B35",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 25,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  editButton: {
    alignSelf: "flex-end",
    backgroundColor: "#C62828",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginBottom: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  label: {
    fontSize: 14,
    color: "#777",
    marginTop: 15,
  },
  value: {
    fontSize: 17,
    fontWeight: "600",
    color: "#174B35",
    marginTop: 5,
  },
  input: {
    fontSize: 16,
    color: "#174B35",
    borderWidth: 1,
    borderColor: "#D0D8D0",
    borderRadius: 7,
    padding: 10,
    marginTop: 5,
    backgroundColor: "#FFFFFF",
  },
  error: {
    color: "#C62828",
    textAlign: "center",
    marginTop: 12,
  },
  success: {
    color: "#2F5D3A",
    textAlign: "center",
    marginTop: 12,
  },
  button: {
    height: 50,
    backgroundColor: "#2F5D3A",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },
  cancelButton: {
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#666666",
    fontSize: 15,
    fontWeight: "bold",
  },
  backButton: {
    height: 50,
    backgroundColor: "#2F5D3A",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

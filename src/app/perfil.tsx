import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

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
  const [alterandoSenha, setAlterandoSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

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

  const cancelarAlteracaoSenha = () => {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setAlterandoSenha(false);
    setErro("");
    setMensagem("");
  };

  const salvarNovaSenha = async () => {
    const usuario = auth.currentUser;

    setErro("");
    setMensagem("");

    if (!usuario || !usuario.email) {
      setErro("Não foi possível identificar sua conta.");
      return;
    }

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setErro("Preencha todos os campos de senha.");
      return;
    }

    if (novaSenha.length < 6) {
      setErro("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("A confirmação da nova senha não corresponde.");
      return;
    }

    if (senhaAtual === novaSenha) {
      setErro("A nova senha precisa ser diferente da senha atual.");
      return;
    }

    try {
      setSalvando(true);

      const credencial = EmailAuthProvider.credential(
        usuario.email,
        senhaAtual,
      );

      await reauthenticateWithCredential(usuario, credencial);
      await updatePassword(usuario, novaSenha);

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setAlterandoSenha(false);

      setMensagem("Senha alterada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);

      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        setErro("A senha atual está incorreta.");
      } else if (error.code === "auth/weak-password") {
        setErro("A nova senha é muito fraca. Utilize pelo menos 6 caracteres.");
      } else if (error.code === "auth/requires-recent-login") {
        setErro("Sua sessão expirou. Faça login novamente e tente outra vez.");
      } else {
        setErro("Não foi possível alterar a senha. Tente novamente.");
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {perfil?.nome?.trim()?.charAt(0)?.toUpperCase() || "A"}
            </Text>
          </View>

          <Text style={styles.brand}>AGROSENSE</Text>
          <Text style={styles.headerSubtitle}>MEU PERFIL</Text>
        </View>
      </View>

      <View style={styles.content}>
        {carregando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2F5D3A" />
            <Text style={styles.loadingText}>Carregando perfil...</Text>
          </View>
        ) : erro !== "" && !perfil ? (
          <View style={styles.card}>
            <Text style={styles.error}>{erro}</Text>
          </View>
        ) : perfil ? (
          <>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Dados pessoais</Text>
                  <Text style={styles.cardSubtitle}>
                    Consulte e atualize suas informações.
                  </Text>
                </View>

                <View style={styles.status}>
                  <Text style={styles.statusText}>CONTA</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.label}>Nome completo</Text>
              {editando ? (
                <TextInput
                  style={styles.input}
                  value={nome}
                  onChangeText={setNome}
                  placeholder="Nome completo"
                  placeholderTextColor="#929B91"
                />
              ) : (
                <View style={styles.valueBox}>
                  <Text style={styles.value}>{perfil.nome}</Text>
                </View>
              )}

              <Text style={styles.label}>E-mail</Text>
              {editando ? (
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="E-mail"
                  placeholderTextColor="#929B91"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <View style={styles.valueBox}>
                  <Text style={styles.value}>{perfil.email}</Text>
                </View>
              )}

              <Text style={styles.label}>Telefone</Text>
              {editando ? (
                <TextInput
                  style={styles.input}
                  value={telefone}
                  onChangeText={setTelefone}
                  placeholder="Telefone"
                  placeholderTextColor="#929B91"
                  keyboardType="phone-pad"
                />
              ) : (
                <View style={styles.valueBox}>
                  <Text style={styles.value}>{perfil.telefone}</Text>
                </View>
              )}

              <Text style={styles.label}>Data de cadastro</Text>
              <View style={styles.valueBox}>
                <Text style={styles.value}>{formatarData()}</Text>
              </View>
            </View>

            {!editando && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setMensagem("");
                  setErro("");
                  setEditando(true);
                  setAlterandoSenha(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>EDITAR PERFIL</Text>
              </TouchableOpacity>
            )}

            {!editando && (
              <>
                <TouchableOpacity
                  style={styles.buttonSenha}
                  onPress={() => {
                    setErro("");
                    setMensagem("");
                    setAlterandoSenha(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.buttonSenhaText}>ALTERAR SENHA</Text>
                </TouchableOpacity>

                {alterandoSenha && (
                  <View style={styles.formSenha}>
                    <Text style={styles.label}>Senha atual</Text>
                    <TextInput
                      style={styles.input}
                      value={senhaAtual}
                      onChangeText={setSenhaAtual}
                      placeholder="Digite sua senha atual"
                      placeholderTextColor="#929B91"
                      secureTextEntry
                      autoCapitalize="none"
                    />

                    <Text style={styles.label}>Nova senha</Text>
                    <TextInput
                      style={styles.input}
                      value={novaSenha}
                      onChangeText={setNovaSenha}
                      placeholder="Digite a nova senha"
                      placeholderTextColor="#929B91"
                      secureTextEntry
                      autoCapitalize="none"
                    />

                    <Text style={styles.label}>Confirmar nova senha</Text>
                    <TextInput
                      style={styles.input}
                      value={confirmarSenha}
                      onChangeText={setConfirmarSenha}
                      placeholder="Digite novamente a nova senha"
                      placeholderTextColor="#929B91"
                      secureTextEntry
                      autoCapitalize="none"
                    />

                    <Text style={styles.dicaSenha}>
                      A senha precisa ter pelo menos 6 caracteres.
                    </Text>

                    <TouchableOpacity
                      style={[styles.button, salvando && styles.disabledButton]}
                      onPress={salvarNovaSenha}
                      disabled={salvando}
                      activeOpacity={0.85}
                    >
                      {salvando ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>SALVAR NOVA SENHA</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={cancelarAlteracaoSenha}
                      disabled={salvando}
                    >
                      <Text style={styles.cancelButtonText}>CANCELAR</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {editando && (
              <>
                <TouchableOpacity
                  style={[styles.button, salvando && styles.disabledButton]}
                  onPress={salvarAlteracoes}
                  disabled={salvando}
                  activeOpacity={0.85}
                >
                  {salvando ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>SALVAR ALTERAÇÕES</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelarEdicao}
                  disabled={salvando}
                >
                  <Text style={styles.cancelButtonText}>CANCELAR EDIÇÃO</Text>
                </TouchableOpacity>
              </>
            )}

            {erro !== "" && (
              <View style={styles.errorBox}>
                <Text style={styles.error}>{erro}</Text>
              </View>
            )}

            {mensagem !== "" && (
              <View style={styles.successBox}>
                <Text style={styles.success}>{mensagem}</Text>
              </View>
            )}
          </>
        ) : null}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/dashboard")
          }
        >
          <Text style={styles.backButtonText}>VOLTAR</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          AGROSENSE • SISTEMA DE MONITORAMENTO AGRÍCOLA
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F5EF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 25,
  },
  header: {
    backgroundColor: "#244D31",
    paddingTop: 40,
    paddingBottom: 80,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    alignItems: "center",
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#A9C99D",
  },
  avatarText: {
    color: "#2F5D3A",
    fontSize: 35,
    fontWeight: "800",
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: "#D2E2D1",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 6,
  },
  content: {
    width: "90%",
    maxWidth: 500,
    alignSelf: "center",
    marginTop: -50,
  },
  loadingContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 35,
    alignItems: "center",
  },
  loadingText: {
    color: "#718071",
    marginTop: 12,
    fontSize: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 23,
    borderWidth: 1,
    borderColor: "#E3EAE0",
    shadowColor: "#1E3824",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formSenha: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E3EAE0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#263F2D",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#849082",
    marginTop: 5,
  },
  status: {
    backgroundColor: "#EAF2E8",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  statusText: {
    color: "#2F5D3A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "#E8EDE6",
    marginTop: 20,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#718071",
    marginTop: 17,
    marginBottom: 7,
  },
  valueBox: {
    minHeight: 46,
    justifyContent: "center",
    backgroundColor: "#F7F9F5",
    borderWidth: 1,
    borderColor: "#E8EDE6",
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    color: "#263F2D",
  },
  input: {
    minHeight: 48,
    fontSize: 15,
    color: "#263F2D",
    borderWidth: 1,
    borderColor: "#B9CBB7",
    borderRadius: 9,
    paddingHorizontal: 13,
    backgroundColor: "#FAFCF9",
  },
  dicaSenha: {
    color: "#849082",
    fontSize: 12,
    marginTop: 9,
  },
  errorBox: {
    backgroundColor: "#FFF0F0",
    borderRadius: 9,
    padding: 12,
    marginTop: 14,
  },
  error: {
    color: "#B3261E",
    textAlign: "center",
    fontSize: 13,
  },
  successBox: {
    backgroundColor: "#EAF4E9",
    borderRadius: 9,
    padding: 12,
    marginTop: 14,
  },
  success: {
    color: "#2F5D3A",
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    minHeight: 52,
    backgroundColor: "#2F5D3A",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  buttonSenha: {
    minHeight: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2F5D3A",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonSenhaText: {
    color: "#2F5D3A",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  cancelButton: {
    minHeight: 45,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    color: "#718071",
    fontSize: 13,
    fontWeight: "700",
  },
  backButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#B9CBB7",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 13,
    backgroundColor: "#FFFFFF",
  },
  backButtonText: {
    color: "#2F5D3A",
    fontSize: 14,
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    color: "#91A08E",
    fontSize: 9,
    letterSpacing: 0.7,
    marginTop: 22,
  },
});

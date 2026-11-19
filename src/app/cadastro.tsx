import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, db } from "../../backend/services/firebase";

export default function CadastroScreen() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleCadastro() {
    if (
      !nome.trim() ||
      !email.trim() ||
      !telefone.trim() ||
      !senha ||
      !confirmarSenha
    ) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não são iguais.");
      return;
    }

    try {
      setErro("");
      setCarregando(true);

      const resultado = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        senha,
      );

      await setDoc(doc(db, "usuarios", resultado.user.uid), {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        dataCadastro: serverTimestamp(),
      });

      router.replace("/dashboard");
    } catch (error: any) {
      console.error("Erro ao cadastrar usuário:", error);

      if (error.code === "auth/email-already-in-use") {
        setErro("Este e-mail já está cadastrado.");
      } else if (error.code === "auth/invalid-email") {
        setErro("Digite um e-mail válido.");
      } else if (error.code === "auth/weak-password") {
        setErro("Escolha uma senha mais segura.");
      } else if (error.code === "permission-denied") {
        setErro("Não foi possível salvar o perfil no banco de dados.");
      } else {
        setErro("Não foi possível criar a conta. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>MONITORAMENTO AGRÍCOLA</Text>
        <Text style={styles.subtitle}>Criar uma conta</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome"
            value={nome}
            onChangeText={setNome}
            editable={!carregando}
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!carregando}
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu telefone"
            keyboardType="phone-pad"
            value={telefone}
            onChangeText={setTelefone}
            editable={!carregando}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
            editable={!carregando}
          />

          <Text style={styles.label}>Confirmar senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite novamente sua senha"
            secureTextEntry
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            editable={!carregando}
          />

          {erro !== "" && <Text style={styles.error}>{erro}</Text>}

          <TouchableOpacity
            style={styles.button}
            onPress={handleCadastro}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>CRIAR CONTA</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={carregando}
          >
            <Text style={styles.backText}>VOLTAR AO LOGIN</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F2",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "90%",
    maxWidth: 500,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2F5D3A",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#555",
    marginBottom: 25,
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  error: {
    color: "#C62828",
    marginTop: 10,
    fontSize: 14,
  },
  button: {
    height: 50,
    backgroundColor: "#2F5D3A",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    alignItems: "center",
    marginTop: 20,
  },
  backText: {
    color: "#2F5D3A",
    fontSize: 14,
    fontWeight: "600",
  },
});

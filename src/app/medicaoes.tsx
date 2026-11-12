import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import type { Ponto } from "../services/pontos-storage";

import { buscarPontosFirestore } from "../../backend/services/firebase/pontos-service";

export default function MedicoesScreen() {
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarPontos = useCallback(async () => {
    try {
      setCarregando(true);
      const pontosSalvos = await buscarPontosFirestore();
      setPontos(pontosSalvos);
    } catch (erro) {
      console.error("Erro ao buscar pontos:", erro);
      Alert.alert("Erro", "Não foi possível carregar os pontos cadastrados.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarPontos();
    }, [carregarPontos]),
  );

  function abrirMedicao(ponto: Ponto) {
    router.push({
      pathname: "/medicao-detalhes",
      params: {
        area: ponto.area,
        pontoId: ponto.id,
        pontoNome: ponto.nome,
        descricao: ponto.descricao,
        tipo: ponto.tipo,
      },
    });
  }

  function voltarDashboard() {
    router.replace("/dashboard");
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
    >
      <TouchableOpacity onPress={voltarDashboard}>
        <Text style={styles.voltar}>← Voltar ao Dashboard</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Medições</Text>

      <Text style={styles.subtitulo}>
        Selecione um ponto cadastrado para acompanhar a coleta dos sensores.
      </Text>

      {carregando ? (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#287A50" />
          <Text style={styles.mensagem}>Carregando pontos...</Text>
        </View>
      ) : pontos.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.nomeCard}>Nenhum ponto cadastrado</Text>
          <Text style={styles.mensagem}>
            Cadastre um ponto antes de iniciar uma medição.
          </Text>

          <TouchableOpacity
            style={styles.botao}
            onPress={() => router.push("/missoes")}
          >
            <Text style={styles.textoBotao}>Ir para Cadastro de Pontos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        pontos.map((ponto) => (
          <TouchableOpacity
            key={ponto.id}
            style={styles.cardPonto}
            onPress={() => abrirMedicao(ponto)}
          >
            <View style={styles.cabecalhoCard}>
              <Text style={styles.nomePonto}>{ponto.nome}</Text>
              <Text style={styles.seta}>→</Text>
            </View>

            <Text style={styles.informacao}>Identificação: {ponto.id}</Text>

            <Text style={styles.informacao}>Área: {ponto.area}</Text>

            {!!ponto.descricao && (
              <Text style={styles.descricao}>{ponto.descricao}</Text>
            )}

            <Text style={styles.selecionar}>Abrir medição do ponto</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F6F2",
  },
  conteudo: {
    width: "90%",
    maxWidth: 850,
    alignSelf: "center",
    paddingTop: 25,
    paddingBottom: 45,
  },
  voltar: {
    color: "#287A50",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 25,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#174B35",
  },
  subtitulo: {
    fontSize: 14,
    color: "#667085",
    marginTop: 7,
    marginBottom: 25,
    lineHeight: 21,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cardPonto: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cabecalhoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  nomePonto: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#174B35",
  },
  seta: {
    fontSize: 24,
    color: "#287A50",
  },
  informacao: {
    fontSize: 14,
    color: "#526170",
    marginTop: 5,
  },
  descricao: {
    fontSize: 14,
    color: "#718096",
    marginTop: 10,
  },
  selecionar: {
    fontSize: 14,
    color: "#287A50",
    fontWeight: "bold",
    marginTop: 16,
  },
  nomeCard: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#174B35",
  },
  mensagem: {
    fontSize: 14,
    color: "#667085",
    lineHeight: 22,
    marginTop: 10,
  },
  botao: {
    backgroundColor: "#287A50",
    padding: 15,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 20,
  },
  textoBotao: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
});

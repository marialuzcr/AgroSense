import { useEffect, useState } from "react";

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { Leitura } from "../data/leituras";
import { buscarLeiturasFirestore } from "../../backend/services/firebase/leituras-service";

import { router } from "expo-router";

export default function HistoricoScreen() {
  const [historico, setHistorico] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarHistorico() {
      try {
        const leituras = await buscarLeiturasFirestore();

        leituras.sort(
          (a, b) =>
            new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
        );

        setHistorico(leituras);
      } catch (erro) {
        console.error("Erro ao carregar histórico:", erro);
        Alert.alert("Erro", "Não foi possível carregar o histórico.");
      } finally {
        setCarregando(false);
      }
    }

    carregarHistorico();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => router.push("/dashboard")}
        >
          <Text style={styles.seta}>←</Text>

          <Text style={styles.textoVoltar}>Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Histórico</Text>

        <Text style={styles.subtitle}>
          Histórico das medições realizadas pelo drone
        </Text>

        {carregando && <Text>Carregando medições...</Text>}

        {!carregando && historico.length === 0 && (
          <Text>Nenhuma medição encontrada.</Text>
        )}

        {historico.map((registro, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.topoCard}>
              <View>
                <Text style={styles.area}>Área {registro.area}</Text>

                <Text style={styles.missao}>{registro.missaoId}</Text>
              </View>

              <View style={styles.dataContainer}>
                <Text style={styles.data}>
                  {new Date(registro.dataHora).toLocaleDateString("pt-BR")}
                </Text>

                <Text style={styles.horario}>
                  {new Date(registro.dataHora).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.divisor} />

            <View style={styles.medicao}>
              <Text style={styles.label}>Temperatura</Text>

              <Text style={styles.valor}>{registro.temperatura}</Text>
            </View>

            <View style={styles.medicao}>
              <Text style={styles.label}>Umidade</Text>

              <Text style={styles.valor}>{registro.umidade}</Text>
            </View>

            <View style={styles.medicao}>
              <Text style={styles.label}>Condutividade elétrica</Text>
              <Text style={styles.valor}>{registro.condutividade}</Text>
            </View>

            <View style={styles.medicao}>
              <Text style={styles.label}>pH do solo</Text>
              <Text style={styles.valor}>{registro.ph}</Text>
            </View>

            <View style={styles.medicao}>
              <Text style={styles.label}>Nitrogênio</Text>

              <Text style={styles.valor}>{registro.nitrogenio}</Text>
            </View>

            <View style={styles.medicao}>
              <Text style={styles.label}>Fósforo</Text>

              <Text style={styles.valor}>{registro.fosforo}</Text>
            </View>

            <View style={styles.medicao}>
              <Text style={styles.label}>Potássio</Text>

              <Text style={styles.valor}>{registro.potassio}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F2",
  },

  content: {
    width: "90%",
    maxWidth: 700,
    alignSelf: "center",
    paddingVertical: 25,
  },

  botaoVoltar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  seta: {
    fontSize: 28,
    color: "#2F5D3A",
    marginRight: 8,
  },

  textoVoltar: {
    fontSize: 16,
    color: "#2F5D3A",
    fontWeight: "600",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2F5D3A",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  topoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  area: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2F5D3A",
    marginBottom: 5,
  },

  missao: {
    fontSize: 14,
    color: "#777",
  },

  dataContainer: {
    alignItems: "flex-end",
  },

  data: {
    fontSize: 14,
    color: "#555",
  },

  horario: {
    fontSize: 14,
    color: "#777",
    marginTop: 3,
  },

  divisor: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 15,
  },

  medicao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },

  label: {
    fontSize: 15,
    color: "#555",
  },

  valor: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
});

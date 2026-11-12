import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

export default function MissaoDetalhesScreen() {
  const { id } = useLocalSearchParams();

  const missoes = {
    "001": {
      data: "08/10/2026",
      horario: "10:00",
      areas: [
        {
          nome: "Norte",
          pontos: 24,
        },
        {
          nome: "Leste",
          pontos: 31,
        },
        {
          nome: "Oeste",
          pontos: 27,
        },
      ],
      total: 82,
      status: "Missão concluída",
    },

    "002": {
      data: "08/10/2026",
      horario: "11:00",
      areas: [
        {
          nome: "Sul",
          pontos: 18,
        },
        {
          nome: "Oeste",
          pontos: 27,
        },
      ],
      total: 45,
      status: "Missão concluída",
    },
  };

  const missao = missoes[String(id) as keyof typeof missoes] || missoes["001"];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => router.push("/missoes")}
        >
          <Text style={styles.seta}>←</Text>

          <Text style={styles.textoVoltar}>Missões</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Missão {id}</Text>

        <Text style={styles.subtitle}>
          {missao.data} às {missao.horario}
        </Text>

        <Text style={styles.sectionTitle}>Áreas percorridas</Text>

        {missao.areas.map((area) => (
          <View key={area.nome} style={styles.areaCard}>
            <View>
              <Text style={styles.areaName}>{area.nome}</Text>

              <Text style={styles.info}>Área monitorada pelo drone</Text>
            </View>

            <Text style={styles.points}>{area.pontos} pontos</Text>
          </View>
        ))}

        <View style={styles.totalCard}>
          <Text style={styles.totalTitle}>Total de pontos coletados</Text>

          <Text style={styles.total}>{missao.total} pontos</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Status</Text>

          <Text style={styles.status}>{missao.status}</Text>
        </View>
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
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },

  areaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  areaName: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#2F5D3A",
    marginBottom: 5,
  },

  info: {
    fontSize: 14,
    color: "#777",
  },

  points: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },

  totalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginTop: 10,
    marginBottom: 15,

    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  totalTitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },

  total: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2F5D3A",
  },

  statusCard: {
    backgroundColor: "#EAF4EC",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },

  statusTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },

  status: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2F5D3A",
  },
});

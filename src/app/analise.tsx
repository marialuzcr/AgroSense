import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useEffect, useState } from "react";
import { router } from "expo-router";

import type { Leitura } from "../data/leituras";
import { buscarLeiturasFirestore } from "../../backend/services/firebase/leituras-service";

export default function AnalisesScreen() {
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarLeituras() {
      try {
        const resultado = await buscarLeiturasFirestore();
        setLeituras(resultado);
      } catch (erro) {
        console.error("Erro ao carregar análises:", erro);
        Alert.alert("Erro", "Não foi possível carregar as medições.");
      } finally {
        setCarregando(false);
      }
    }

    carregarLeituras();
  }, []);

  // Agrupa as medições de acordo com a área
  const areas = Object.values(
    leituras.reduce<
      Record<
        string,
        {
          nome: string;
          temperatura: number[];
          umidade: number[];
          nitrogenio: number[];
          fosforo: number[];
          potassio: number[];
        }
      >
    >((grupos, leitura) => {
      const nome = leitura.area || "Não informada";

      if (!grupos[nome]) {
        grupos[nome] = {
          nome,
          temperatura: [],
          umidade: [],
          nitrogenio: [],
          fosforo: [],
          potassio: [],
        };
      }

      grupos[nome].temperatura.push(leitura.temperatura);
      grupos[nome].umidade.push(leitura.umidade);
      grupos[nome].nitrogenio.push(leitura.nitrogenio);
      grupos[nome].fosforo.push(leitura.fosforo);
      grupos[nome].potassio.push(leitura.potassio);

      return grupos;
    }, {}),
  );

  // Calcula a média dos valores
  function calcularMedia(valores: number[]): string {
    if (valores.length === 0) return "0,0";

    const soma = valores.reduce((total, valor) => total + valor, 0);

    return (soma / valores.length).toFixed(1).replace(".", ",");
  }

  const mediaTemperatura = calcularMedia(
    leituras.map((leitura) => leitura.temperatura),
  );

  const mediaUmidade = calcularMedia(
    leituras.map((leitura) => leitura.umidade),
  );

  const mediaNitrogenio = calcularMedia(
    leituras.map((leitura) => leitura.nitrogenio),
  );

  const mediaFosforo = calcularMedia(
    leituras.map((leitura) => leitura.fosforo),
  );

  const mediaPotassio = calcularMedia(
    leituras.map((leitura) => leitura.potassio),
  );

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

        <Text style={styles.title}>Análises</Text>

        <Text style={styles.subtitle}>
          Médias das medições das áreas monitoradas
        </Text>

        {carregando ? (
          <View style={styles.card}>
            <Text style={styles.label}>Carregando medições...</Text>
          </View>
        ) : leituras.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.areaNome}>Nenhuma medição encontrada</Text>
            <Text style={styles.label}>
              Quando houver medições salvas no Firestore, as análises aparecerão
              aqui.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Média geral das áreas</Text>

            <View style={styles.card}>
              <View style={styles.medicao}>
                <Text style={styles.label}>Temperatura média</Text>
                <Text style={styles.valor}>{mediaTemperatura} °C</Text>
              </View>

              <View style={styles.medicao}>
                <Text style={styles.label}>Umidade média</Text>
                <Text style={styles.valor}>{mediaUmidade} %</Text>
              </View>

              <View style={styles.medicao}>
                <Text style={styles.label}>Nitrogênio médio</Text>
                <Text style={styles.valor}>{mediaNitrogenio} mg/kg</Text>
              </View>

              <View style={styles.medicao}>
                <Text style={styles.label}>Fósforo médio</Text>
                <Text style={styles.valor}>{mediaFosforo} mg/kg</Text>
              </View>

              <View style={styles.medicao}>
                <Text style={styles.label}>Potássio médio</Text>
                <Text style={styles.valor}>{mediaPotassio} mg/kg</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Comparação entre áreas</Text>

            {areas.map((area) => (
              <View key={area.nome} style={styles.areaCard}>
                <Text style={styles.areaNome}>Área {area.nome}</Text>

                <View style={styles.medicao}>
                  <Text style={styles.label}>Temperatura</Text>
                  <Text style={styles.valor}>
                    {calcularMedia(area.temperatura)} °C
                  </Text>
                </View>

                <View style={styles.medicao}>
                  <Text style={styles.label}>Umidade</Text>
                  <Text style={styles.valor}>
                    {calcularMedia(area.umidade)} %
                  </Text>
                </View>

                <View style={styles.medicao}>
                  <Text style={styles.label}>Nitrogênio</Text>
                  <Text style={styles.valor}>
                    {calcularMedia(area.nitrogenio)} mg/kg
                  </Text>
                </View>

                <View style={styles.medicao}>
                  <Text style={styles.label}>Fósforo</Text>
                  <Text style={styles.valor}>
                    {calcularMedia(area.fosforo)} mg/kg
                  </Text>
                </View>

                <View style={styles.medicao}>
                  <Text style={styles.label}>Potássio</Text>
                  <Text style={styles.valor}>
                    {calcularMedia(area.potassio)} mg/kg
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
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
    paddingBottom: 40,
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
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    marginTop: 5,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  areaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  areaNome: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#2F5D3A",
    marginBottom: 12,
  },

  medicao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  label: {
    fontSize: 14,
    color: "#555",
    flexShrink: 1,
    marginRight: 10,
  },

  valor: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },
});

import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import type { Ponto } from "../services/pontos-storage";

import { buscarPontosFirestore } from "../../backend/services/firebase/pontos-service";
import { buscarLeiturasPorPontoFirestore } from "../../backend/services/firebase/leituras-service";

type PontoComLeitura = {
  ponto: Ponto;
  ultimaLeitura: string;
};

const areas = [
  { nome: "Norte", identificacao: "AREA-001" },
  { nome: "Leste", identificacao: "AREA-002" },
  { nome: "Sul", identificacao: "AREA-003" },
  { nome: "Oeste", identificacao: "AREA-004" },
];

export default function AreasScreen() {
  const [pontosPorArea, setPontosPorArea] = useState<
    Record<string, PontoComLeitura[]>
  >({});
  const [carregando, setCarregando] = useState(true);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);

      const pontos = await buscarPontosFirestore();
      const resultado: Record<string, PontoComLeitura[]> = {};

      for (const area of areas) {
        const pontosDaArea = pontos.filter(
          (ponto) =>
            ponto.area.trim().toLowerCase() === area.nome.toLowerCase(),
        );

        const pontosComLeitura: PontoComLeitura[] = [];

        for (const ponto of pontosDaArea) {
          const leituras = await buscarLeiturasPorPontoFirestore(ponto.id);

          if (leituras.length > 0) {
            pontosComLeitura.push({
              ponto,
              ultimaLeitura: leituras[0].dataHora,
            });
          }
        }

        resultado[area.nome] = pontosComLeitura;
      }

      setPontosPorArea(resultado);
    } catch (erro) {
      console.error("Erro ao carregar medições das áreas:", erro);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  function formatarData(data: string) {
    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
      return data;
    }

    return dataFormatada.toLocaleString("pt-BR");
  }

  const possuiMedicoes = Object.values(pontosPorArea).some(
    (lista) => lista.length > 0,
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

        <Text style={styles.title}>Pontos medidos</Text>

        <Text style={styles.subtitle}>
          Consulte os pontos que já possuem medições recebidas.
        </Text>

        {carregando ? (
          <Text style={styles.mensagem}>Carregando dados...</Text>
        ) : (
          areas.map((area) => {
            const pontos = pontosPorArea[area.nome] || [];

            if (pontos.length === 0) {
              return null;
            }

            return (
              <View key={area.identificacao} style={styles.areaCard}>
                <Text style={styles.areaName}>{area.nome}</Text>

                <Text style={styles.quantidade}>
                  {pontos.length}{" "}
                  {pontos.length === 1
                    ? "ponto com medição"
                    : "pontos com medições"}
                </Text>

                {pontos.map(({ ponto, ultimaLeitura }) => (
                  <TouchableOpacity
                    key={ponto.id}
                    style={styles.pontoCard}
                    onPress={() =>
                      router.push({
                        pathname: "/area-detalhes",
                        params: {
                          area: area.nome,
                        },
                      })
                    }
                  >
                    <View style={styles.topoPonto}>
                      <Text style={styles.nomePonto}>{ponto.nome}</Text>
                      <Text style={styles.arrow}>→</Text>
                    </View>

                    <Text style={styles.identificacao}>{ponto.id}</Text>

                    <Text style={styles.ultimaLeitura}>
                      Última medição: {formatarData(ultimaLeitura)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })
        )}

        {!carregando && !possuiMedicoes && (
          <View style={styles.vazio}>
            <Text style={styles.vazioTitulo}>Nenhuma medição disponível</Text>
            <Text style={styles.mensagem}>
              As áreas aparecerão aqui quando houver medições recebidas.
            </Text>
          </View>
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
    fontSize: 15,
    color: "#666",
    marginBottom: 22,
    lineHeight: 22,
  },
  areaCard: {
    backgroundColor: "#E7EFE5",
    borderRadius: 10,
    padding: 18,
    marginBottom: 20,
  },
  areaName: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  quantidade: {
    fontSize: 13,
    color: "#526653",
    marginTop: 5,
    marginBottom: 15,
  },
  pontoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  topoPonto: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nomePonto: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  arrow: {
    fontSize: 22,
    color: "#2F5D3A",
  },
  identificacao: {
    fontSize: 13,
    color: "#777",
    marginTop: 5,
  },
  ultimaLeitura: {
    fontSize: 13,
    color: "#526653",
    marginTop: 12,
  },
  vazio: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  vazioTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2F5D3A",
    marginBottom: 8,
  },
  mensagem: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 21,
  },
});

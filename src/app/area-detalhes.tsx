import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import type { Ponto } from "../services/pontos-storage";

import { buscarPontosFirestore } from "../../backend/services/firebase/pontos-service";
import { buscarLeiturasPorPontoFirestore } from "../../backend/services/firebase/leituras-service";
type PontoComLeituras = {
  ponto: Ponto;
  quantidade: number;
  ultimaLeitura: string;
};

export default function AreaDetalhesScreen() {
  const params = useLocalSearchParams();
  const area = Array.isArray(params.area) ? params.area[0] : params.area;

  const [pontos, setPontos] = useState<PontoComLeituras[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarDados() {
        try {
          setCarregando(true);

          const todosPontos = await buscarPontosFirestore();

          const pontosDaArea = todosPontos.filter(
            (ponto) =>
              ponto.area.trim().toLowerCase() ===
              String(area).trim().toLowerCase(),
          );

          const resultado: PontoComLeituras[] = [];

          for (const ponto of pontosDaArea) {
            const leituras = await buscarLeiturasPorPontoFirestore(ponto.id);

            if (leituras.length > 0) {
              resultado.push({
                ponto,
                quantidade: leituras.length,
                ultimaLeitura: leituras[0].dataHora,
              });
            }
          }

          if (ativo) {
            setPontos(resultado);
          }
        } catch (erro) {
          console.error("Erro ao carregar dados da área:", erro);

          if (ativo) {
            Alert.alert(
              "Erro",
              "Não foi possível carregar as medições desta área.",
            );
          }
        } finally {
          if (ativo) {
            setCarregando(false);
          }
        }
      }

      carregarDados();

      return () => {
        ativo = false;
      };
    }, [area]),
  );

  function formatarData(data: string) {
    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
      return data;
    }

    return dataFormatada.toLocaleString("pt-BR");
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => router.push("/areas")}
        >
          <Text style={styles.seta}>←</Text>
          <Text style={styles.textoVoltar}>Áreas</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Área {area}</Text>

        <Text style={styles.subtitle}>
          Consulte os pontos que já possuem medições recebidas.
        </Text>

        {!carregando && pontos.length > 0 && (
          <View style={styles.resumoCard}>
            <Text style={styles.resumoNumero}>{pontos.length}</Text>
            <Text style={styles.resumoTexto}>
              {pontos.length === 1
                ? "Ponto com medição"
                : "Pontos com medições"}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Pontos monitorados</Text>

        {carregando ? (
          <View style={styles.card}>
            <Text style={styles.textoVazio}>Carregando medições...</Text>
          </View>
        ) : pontos.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.vazioTitulo}>Nenhuma medição disponível</Text>
            <Text style={styles.textoVazio}>
              Os pontos desta área aparecerão aqui quando receberem suas
              primeiras medições.
            </Text>
          </View>
        ) : (
          pontos.map(({ ponto, quantidade, ultimaLeitura }) => (
            <TouchableOpacity
              key={ponto.id}
              style={styles.pontoCard}
              onPress={() =>
                router.push({
                  pathname: "/ponto-detalhes",
                  params: {
                    area: String(area),
                    pontoId: ponto.id,
                    pontoNome: ponto.nome,
                    origem: "areas",
                  },
                })
              }
            >
              <View style={styles.pontoCabecalho}>
                <View style={styles.pontoIdentificacao}>
                  <Text style={styles.pontoNome}>{ponto.nome}</Text>
                  <Text style={styles.pontoId}>{ponto.id}</Text>
                </View>

                <Text style={styles.arrow}>→</Text>
              </View>

              {!!ponto.descricao && (
                <Text style={styles.pontoDescricao}>{ponto.descricao}</Text>
              )}

              <View style={styles.divisor} />

              <Text style={styles.informacao}>
                Medições recebidas: {quantidade}
              </Text>

              <Text style={styles.informacao}>
                Última medição: {formatarData(ultimaLeitura)}
              </Text>

              <Text style={styles.status}>Dados recebidos</Text>
            </TouchableOpacity>
          ))
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
  resumoCard: {
    backgroundColor: "#E7EFE5",
    borderRadius: 10,
    padding: 20,
    marginBottom: 25,
  },
  resumoNumero: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  resumoTexto: {
    fontSize: 14,
    color: "#526653",
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  pontoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  pontoCabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pontoIdentificacao: {
    flex: 1,
  },
  pontoNome: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  pontoId: {
    fontSize: 12,
    color: "#888",
    marginTop: 3,
  },
  arrow: {
    fontSize: 24,
    color: "#2F5D3A",
  },
  pontoDescricao: {
    fontSize: 14,
    color: "#666",
    marginTop: 12,
  },
  divisor: {
    height: 1,
    backgroundColor: "#EEEEEE",
    marginVertical: 13,
  },
  informacao: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  status: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2F5D3A",
    marginTop: 5,
  },
  textoVazio: {
    fontSize: 14,
    color: "#777",
    lineHeight: 21,
    marginTop: 5,
  },
  vazioTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2F5D3A",
    marginBottom: 8,
  },
});

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
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/areas")
          }
        >
          <Text style={styles.seta}>←</Text>
          <Text style={styles.textoVoltar}>Áreas</Text>
        </TouchableOpacity>

        <View style={styles.cabecalho}>
          <Text style={styles.miniTitulo}>AGROSENSE</Text>
          <Text style={styles.title}>Área {area}</Text>
          <Text style={styles.subtitle}>
            Consulte os pontos monitorados e acompanhe as medições recebidas
            nesta área.
          </Text>
        </View>

        {!carregando && pontos.length > 0 && (
          <View style={styles.resumoCard}>
            <View>
              <Text style={styles.resumoLegenda}>PONTOS COM MEDIÇÃO</Text>
              <Text style={styles.resumoNumero}>{pontos.length}</Text>
              <Text style={styles.resumoDescricao}>
                {pontos.length === 1
                  ? "ponto com dados recebidos"
                  : "pontos com dados recebidos"}
              </Text>
            </View>

            <View style={styles.resumoLateral}>
              <Text style={styles.resumoLateralNumero}>
                {pontos.reduce((total, ponto) => total + ponto.quantidade, 0)}
              </Text>
              <Text style={styles.resumoLateralTexto}>medições realizadas</Text>
            </View>
          </View>
        )}

        <View style={styles.secaoTitulo}>
          <Text style={styles.sectionTitle}>Pontos monitorados</Text>
          <Text style={styles.sectionSubtitle}>
            Selecione um ponto para consultar seu histórico.
          </Text>
        </View>

        {carregando ? (
          <View style={styles.estadoCard}>
            <Text style={styles.textoVazio}>Carregando medições...</Text>
          </View>
        ) : pontos.length === 0 ? (
          <View style={styles.vazio}>
            <View style={styles.vazioIcone}>
              <Text style={styles.vazioIconeTexto}>—</Text>
            </View>
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
              activeOpacity={0.75}
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
                <View style={styles.pontoIndicador} />

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

              <View style={styles.informacoes}>
                <Text style={styles.informacao}>
                  Medições recebidas: {quantidade}
                </Text>

                <Text style={styles.informacao}>
                  Última medição: {formatarData(ultimaLeitura)}
                </Text>
              </View>

              <View style={styles.statusContainer}>
                <View style={styles.statusIndicador} />
                <Text style={styles.status}>Dados recebidos</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.rodape}>AGROSENSE • MONITORAMENTO AGRÍCOLA</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F5EF",
  },
  content: {
    width: "90%",
    maxWidth: 850,
    alignSelf: "center",
    paddingTop: 25,
    paddingBottom: 35,
  },
  botaoVoltar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  seta: {
    fontSize: 25,
    color: "#2F5D3A",
    marginRight: 9,
  },
  textoVoltar: {
    fontSize: 15,
    color: "#2F5D3A",
    fontWeight: "600",
  },
  cabecalho: {
    marginBottom: 22,
  },
  miniTitulo: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
    color: "#779477",
    marginBottom: 8,
  },
  title: {
    fontSize: 29,
    fontWeight: "bold",
    color: "#244D31",
    marginBottom: 9,
  },
  subtitle: {
    fontSize: 14,
    color: "#687568",
    lineHeight: 22,
    maxWidth: 560,
  },
  resumoCard: {
    backgroundColor: "#244D31",
    borderRadius: 15,
    padding: 22,
    marginBottom: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resumoLegenda: {
    color: "#D7E5D5",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  resumoNumero: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "bold",
    marginTop: 7,
  },
  resumoDescricao: {
    color: "#D7E5D5",
    fontSize: 12,
    marginTop: 3,
  },
  resumoLateral: {
    alignItems: "flex-end",
    paddingLeft: 12,
  },
  resumoLateralNumero: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "bold",
  },
  resumoLateralTexto: {
    color: "#D7E5D5",
    fontSize: 11,
    marginTop: 3,
  },
  secaoTitulo: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#244D31",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#788278",
    marginTop: 4,
  },
  pontoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5EAE2",
  },
  pontoCabecalho: {
    flexDirection: "row",
    alignItems: "center",
  },
  pontoIndicador: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 4,
    backgroundColor: "#A8C69F",
    marginRight: 13,
  },
  pontoIdentificacao: {
    flex: 1,
  },
  pontoNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  pontoId: {
    fontSize: 11,
    color: "#899289",
    marginTop: 4,
  },
  arrow: {
    fontSize: 23,
    color: "#6E9270",
    marginLeft: 8,
  },
  pontoDescricao: {
    fontSize: 13,
    color: "#687568",
    marginTop: 13,
    lineHeight: 20,
  },
  divisor: {
    height: 1,
    backgroundColor: "#EDF0EB",
    marginVertical: 14,
  },
  informacoes: {
    gap: 7,
  },
  informacao: {
    fontSize: 12,
    color: "#687568",
    lineHeight: 19,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EDF4EB",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 13,
  },
  statusIndicador: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#6E9270",
    marginRight: 7,
  },
  status: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2F5D3A",
  },
  estadoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5EAE2",
  },
  vazio: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5EAE2",
  },
  vazioIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EDF4EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  vazioIconeTexto: {
    color: "#6E9270",
    fontSize: 22,
  },
  vazioTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2F5D3A",
    marginBottom: 8,
    textAlign: "center",
  },
  textoVazio: {
    fontSize: 13,
    color: "#788278",
    lineHeight: 21,
    textAlign: "center",
  },
  rodape: {
    textAlign: "center",
    color: "#9AA49A",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 30,
  },
});

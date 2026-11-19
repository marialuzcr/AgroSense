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
  const [areaExpandida, setAreaExpandida] = useState<string | null>(null);

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

  const totalPontos = Object.values(pontosPorArea).reduce(
    (total, lista) => total + lista.length,
    0,
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/dashboard")
          }
        >
          <Text style={styles.seta}>←</Text>
          <Text style={styles.textoVoltar}>Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.cabecalho}>
          <Text style={styles.miniTitulo}>AGROSENSE</Text>
          <Text style={styles.title}>Áreas de medição</Text>
          <Text style={styles.subtitle}>
            Acompanhe os pontos que já possuem medições registradas na
            propriedade.
          </Text>
        </View>

        <View style={styles.resumoCard}>
          <View>
            <Text style={styles.resumoLegenda}>PONTOS COM MEDIÇÃO</Text>
            <Text style={styles.resumoNumero}>
              {carregando ? "..." : totalPontos}
            </Text>
            <Text style={styles.resumoDescricao}>
              {totalPontos === 1 ? "ponto registrado" : "pontos registrados"}
            </Text>
          </View>
        </View>

        <View style={styles.secaoTitulo}>
          <Text style={styles.secaoTexto}>Suas áreas</Text>
          <Text style={styles.secaoSubtexto}>
            Selecione uma área para visualizar seus pontos
          </Text>
        </View>

        {carregando ? (
          <View style={styles.estadoCard}>
            <Text style={styles.mensagem}>Carregando dados...</Text>
          </View>
        ) : (
          areas.map((area) => {
            const pontos = pontosPorArea[area.nome] || [];
            const expandida = areaExpandida === area.nome;

            if (pontos.length === 0) {
              return null;
            }

            return (
              <View key={area.identificacao} style={styles.areaCard}>
                <TouchableOpacity
                  style={styles.areaCabecalho}
                  activeOpacity={0.7}
                  onPress={() => setAreaExpandida(expandida ? null : area.nome)}
                >
                  <View>
                    <Text style={styles.areaIdentificacao}>
                      {area.identificacao}
                    </Text>
                    <Text style={styles.areaName}>{area.nome}</Text>
                  </View>

                  <View style={styles.areaDireita}>
                    <View style={styles.contador}>
                      <Text style={styles.contadorNumero}>{pontos.length}</Text>
                      <Text style={styles.contadorTexto}>
                        {pontos.length === 1 ? "ponto" : "pontos"}
                      </Text>
                    </View>

                    <Text style={styles.expandirSeta}>
                      {expandida ? "⌃" : "⌄"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {expandida && (
                  <>
                    <View style={styles.divisor} />

                    {pontos.map(({ ponto, ultimaLeitura }) => (
                      <TouchableOpacity
                        key={ponto.id}
                        style={styles.pontoCard}
                        activeOpacity={0.75}
                        onPress={() =>
                          router.push({
                            pathname: "/area-detalhes",
                            params: {
                              area: area.nome,
                            },
                          })
                        }
                      >
                        <View style={styles.pontoIndicador} />

                        <View style={styles.pontoConteudo}>
                          <Text style={styles.nomePonto}>{ponto.nome}</Text>
                          <Text style={styles.identificacao}>{ponto.id}</Text>
                          <Text style={styles.ultimaLeitura}>
                            Última medição: {formatarData(ultimaLeitura)}
                          </Text>
                        </View>

                        <Text style={styles.arrow}>→</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            );
          })
        )}

        {!carregando && !possuiMedicoes && (
          <View style={styles.vazio}>
            <View style={styles.vazioIcone}>
              <Text style={styles.vazioIconeTexto}>—</Text>
            </View>
            <Text style={styles.vazioTitulo}>Nenhuma medição disponível</Text>
            <Text style={styles.vazioMensagem}>
              As áreas aparecerão aqui quando houver medições recebidas dos
              sensores.
            </Text>
          </View>
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
    fontSize: 13,
    marginTop: 2,
  },
  secaoTitulo: {
    marginBottom: 16,
  },
  secaoTexto: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#244D31",
  },
  secaoSubtexto: {
    fontSize: 13,
    color: "#788278",
    marginTop: 4,
  },
  areaCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 17,
    borderWidth: 1,
    borderColor: "#E5EAE2",
  },
  areaCabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  areaIdentificacao: {
    color: "#81917F",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  areaName: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  areaDireita: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contador: {
    backgroundColor: "#EDF4EB",
    borderRadius: 10,
    minWidth: 65,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  contadorNumero: {
    color: "#2F5D3A",
    fontSize: 17,
    fontWeight: "bold",
  },
  contadorTexto: {
    color: "#687568",
    fontSize: 10,
  },
  expandirSeta: {
    fontSize: 22,
    color: "#6E9270",
    width: 20,
    textAlign: "center",
  },
  divisor: {
    height: 1,
    backgroundColor: "#EDF0EB",
    marginVertical: 15,
  },
  pontoCard: {
    backgroundColor: "#F8FAF7",
    borderRadius: 10,
    padding: 14,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDF0EB",
  },
  pontoIndicador: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 4,
    backgroundColor: "#A8C69F",
    marginRight: 12,
  },
  pontoConteudo: {
    flex: 1,
  },
  nomePonto: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  identificacao: {
    fontSize: 11,
    color: "#899289",
    marginTop: 3,
  },
  ultimaLeitura: {
    fontSize: 12,
    color: "#687568",
    marginTop: 9,
  },
  arrow: {
    fontSize: 22,
    color: "#6E9270",
    marginLeft: 8,
  },
  estadoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 25,
    alignItems: "center",
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
  vazioMensagem: {
    fontSize: 13,
    color: "#788278",
    textAlign: "center",
    lineHeight: 21,
  },
  mensagem: {
    fontSize: 14,
    color: "#687568",
    textAlign: "center",
    lineHeight: 21,
  },
  rodape: {
    textAlign: "center",
    color: "#9AA49A",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 30,
  },
});

import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import type { Ponto, TipoPonto } from "../services/pontos-storage";

import {
  buscarPontosFirestore,
  atualizarPontoFirestore,
} from "../../backend/services/firebase/pontos-service";
import { buscarLeiturasPorPontoFirestore } from "../../backend/services/firebase/leituras-service";
import type { Leitura } from "../data/leituras";

export default function PontoDetalhesScreen() {
  const params = useLocalSearchParams();

  const areaParam = Array.isArray(params.area) ? params.area[0] : params.area;
  const pontoIdParam = Array.isArray(params.pontoId)
    ? params.pontoId[0]
    : params.pontoId;
  const origemParam = Array.isArray(params.origem)
    ? params.origem[0]
    : params.origem;

  const area = String(areaParam ?? "");
  const pontoId = String(pontoIdParam ?? "");
  const origem = String(origemParam ?? "");

  const [ponto, setPonto] = useState<Ponto | null>(null);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoTipo, setSalvandoTipo] = useState(false);
  const [mensagemTipo, setMensagemTipo] = useState("");

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true);

        const pontos = await buscarPontosFirestore();
        const encontrado = pontos.find((item) => item.id === pontoId);

        setPonto(encontrado ?? null);

        if (encontrado) {
          const leiturasEncontradas =
            await buscarLeiturasPorPontoFirestore(pontoId);
          setLeituras(leiturasEncontradas);
        } else {
          setLeituras([]);
        }
      } catch (erro) {
        console.error("Erro ao carregar detalhes do ponto:", erro);
        Alert.alert("Erro", "Não foi possível carregar os dados do ponto.");
      } finally {
        setCarregando(false);
      }
    }

    if (pontoId) {
      carregarDados();
    } else {
      setCarregando(false);
    }
  }, [pontoId]);

  function voltar() {
    if (origem === "cadastro") {
      router.replace("/missoes");
      return;
    }

    router.replace({
      pathname: "/area-detalhes",
      params: {
        area: ponto?.area ?? area,
      },
    });
  }

  async function alterarTipo(novoTipo: TipoPonto) {
    if (!ponto || salvandoTipo || novoTipo === ponto.tipo) return;

    try {
      setSalvandoTipo(true);
      setMensagemTipo("");

      await atualizarPontoFirestore(ponto.id, {
        tipo: novoTipo,
      });

      const pontoAtualizado: Ponto = {
        ...ponto,
        tipo: novoTipo,
      };

      setPonto(pontoAtualizado);

      setMensagemTipo(
        `Tipo alterado para ${novoTipo === "fixo" ? "Ponto fixo" : "Ponto móvel"}.`,
      );
    } catch (erro) {
      console.error("Erro ao alterar tipo do ponto:", erro);
      setMensagemTipo("Não foi possível alterar o tipo do ponto.");
    } finally {
      setSalvandoTipo(false);
    }
  }

  function formatarData(data: string) {
    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
      return data;
    }

    return dataFormatada.toLocaleString("pt-BR");
  }

  const ultimaLeitura = [...leituras].sort(
    (a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
  )[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
    >
      <TouchableOpacity onPress={voltar}>
        <Text style={styles.voltar}>← Voltar à área</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Detalhes do ponto</Text>

      <Text style={styles.subtitulo}>
        Informações do ponto e dados recebidos dos sensores.
      </Text>

      {carregando ? (
        <View style={styles.card}>
          <Text style={styles.mensagem}>
            Carregando informações do ponto...
          </Text>
        </View>
      ) : !ponto ? (
        <View style={styles.card}>
          <Text style={styles.tituloCard}>Ponto não encontrado</Text>
          <Text style={styles.mensagem}>
            Não foi possível localizar esse ponto. Volte à área e selecione
            novamente.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.rotulo}>Ponto selecionado</Text>

            <Text style={styles.nomePonto}>{ponto.nome}</Text>

            <Text style={styles.informacao}>Área: {ponto.area}</Text>
            <Text style={styles.informacao}>Identificação: {ponto.id}</Text>

            <View style={styles.secaoTipo}>
              <Text style={styles.rotulo}>Tipo de ponto</Text>

              {!!mensagemTipo && (
                <Text style={styles.ajudaTipo}>{mensagemTipo}</Text>
              )}

              <Text style={styles.tipoAtual}>
                {ponto.tipo === "movel" ? "Ponto móvel" : "Ponto fixo"}
              </Text>

              <Text style={styles.ajudaTipo}>
                {ponto.tipo === "movel"
                  ? "O local pode mudar a cada coleta."
                  : "Este ponto representa um local permanente."}
              </Text>

              <TouchableOpacity
                style={[
                  styles.botaoAlterar,
                  salvandoTipo && styles.botaoDesabilitado,
                ]}
                onPress={() =>
                  alterarTipo(ponto.tipo === "fixo" ? "movel" : "fixo")
                }
                disabled={salvandoTipo}
              >
                <Text style={styles.textoBotaoAlterar}>
                  {salvandoTipo ? "Salvando..." : "Alterar tipo"}
                </Text>
              </TouchableOpacity>
            </View>

            {!!ponto.descricao && (
              <View style={styles.secaoDescricao}>
                <Text style={styles.rotulo}>Descrição</Text>
                <Text style={styles.descricao}>{ponto.descricao}</Text>
              </View>
            )}

            <Text style={styles.dataCadastro}>
              Cadastrado em:{" "}
              {new Date(ponto.dataCadastro).toLocaleDateString("pt-BR")}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.tituloCard}>Dados das medições</Text>

            {leituras.length === 0 ? (
              <Text style={styles.mensagem}>
                Nenhuma medição foi recebida para este ponto ainda.
              </Text>
            ) : (
              <>
                <Text style={styles.rotulo}>Última medição recebida</Text>

                <Text style={styles.dataLeitura}>
                  {formatarData(ultimaLeitura!.dataHora)}
                </Text>

                <View style={styles.divisor} />

                <Text style={styles.valor}>
                  Temperatura: {ultimaLeitura!.temperatura ?? "Não informado"}{" "}
                  °C
                </Text>
                <Text style={styles.valor}>
                  Umidade: {ultimaLeitura!.umidade ?? "Não informado"} %
                </Text>
                <Text style={styles.valor}>
                  Condutividade:{" "}
                  {ultimaLeitura!.condutividade ?? "Não informado"} mS/cm
                </Text>
                <Text style={styles.valor}>
                  Potássio: {ultimaLeitura!.potassio ?? "Não informado"}
                </Text>
                <Text style={styles.valor}>
                  Fósforo: {ultimaLeitura!.fosforo ?? "Não informado"}
                </Text>
                <Text style={styles.valor}>
                  Nitrogênio: {ultimaLeitura!.nitrogenio ?? "Não informado"}
                </Text>
                <Text style={styles.valor}>
                  pH: {ultimaLeitura!.ph ?? "Não informado"}
                </Text>

                <View style={styles.divisor} />

                <Text style={styles.totalLeituras}>
                  Total de medições recebidas: {leituras.length}
                </Text>
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F8",
  },
  conteudo: {
    width: "90%",
    maxWidth: 750,
    alignSelf: "center",
    paddingVertical: 25,
    paddingBottom: 40,
  },
  voltar: {
    color: "#287A50",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 22,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1D2935",
  },
  subtitulo: {
    fontSize: 14,
    color: "#718096",
    marginTop: 6,
    marginBottom: 22,
    lineHeight: 21,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  rotulo: {
    fontSize: 13,
    color: "#718096",
  },
  nomePonto: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#1D2935",
    marginTop: 5,
    marginBottom: 12,
  },
  informacao: {
    fontSize: 14,
    color: "#526170",
    marginTop: 7,
  },
  secaoTipo: {
    marginTop: 20,
    padding: 14,
    backgroundColor: "#F4F6F8",
    borderRadius: 8,
  },
  tipoAtual: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#287A50",
    marginTop: 7,
  },
  ajudaTipo: {
    fontSize: 13,
    color: "#718096",
    marginTop: 5,
    lineHeight: 19,
  },
  botaoAlterar: {
    alignSelf: "flex-start",
    backgroundColor: "#287A50",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 13,
  },
  textoBotaoAlterar: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  secaoDescricao: {
    marginTop: 18,
  },
  descricao: {
    fontSize: 14,
    color: "#526170",
    lineHeight: 21,
    marginTop: 6,
  },
  dataCadastro: {
    fontSize: 12,
    color: "#718096",
    marginTop: 20,
  },
  tituloCard: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1D2935",
    marginBottom: 16,
  },
  mensagem: {
    fontSize: 14,
    color: "#718096",
    lineHeight: 22,
  },
  dataLeitura: {
    fontSize: 14,
    color: "#526170",
    marginTop: 6,
  },
  divisor: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 15,
  },
  valor: {
    fontSize: 15,
    color: "#344054",
    marginBottom: 13,
  },
  totalLeituras: {
    fontSize: 13,
    color: "#287A50",
    fontWeight: "600",
  },
});

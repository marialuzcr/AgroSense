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
  const [leituraSelecionada, setLeituraSelecionada] = useState<string | null>(
    null,
  );

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

          const leiturasOrdenadas = [...leiturasEncontradas].sort(
            (a, b) =>
              new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
          );

          setLeituras(leiturasOrdenadas);
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

      setPonto({
        ...ponto,
        tipo: novoTipo,
      });

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

  function alternarLeitura(id: string) {
    setLeituraSelecionada((atual) => (atual === id ? null : id));
  }

  function renderDadosLeitura(leitura: Leitura) {
    const dados = [
      { nome: "Temperatura", valor: leitura.temperatura, unidade: "°C" },
      { nome: "Umidade", valor: leitura.umidade, unidade: "%" },
      {
        nome: "Condutividade",
        valor: leitura.condutividade,
        unidade: "mS/cm",
      },
      { nome: "Potássio", valor: leitura.potassio, unidade: "" },
      { nome: "Fósforo", valor: leitura.fosforo, unidade: "" },
      { nome: "Nitrogênio", valor: leitura.nitrogenio, unidade: "" },
      { nome: "pH", valor: leitura.ph, unidade: "" },
    ];

    return (
      <View style={styles.dadosContainer}>
        <Text style={styles.dadosTitulo}>Resultados desta medição</Text>

        <View style={styles.gradeDados}>
          {dados.map((dado) => (
            <View key={dado.nome} style={styles.dadoCard}>
              <Text style={styles.nomeDado}>{dado.nome}</Text>
              <Text style={styles.valorDado}>
                {dado.valor ?? "Não informado"}
                {dado.valor != null && dado.unidade ? ` ${dado.unidade}` : ""}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  const ultimaLeitura = leituras[0];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <TouchableOpacity style={styles.botaoVoltar} onPress={voltar}>
          <Text style={styles.seta}>←</Text>
          <Text style={styles.textoVoltar}>Voltar à área</Text>
        </TouchableOpacity>

        <Text style={styles.miniTitulo}>AGROSENSE</Text>
        <Text style={styles.titulo}>Detalhes do ponto</Text>
        <Text style={styles.subtitulo}>
          Consulte as informações do ponto e acompanhe seu histórico de
          medições.
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
            <View style={styles.resumoCard}>
              <View style={styles.resumoTopo}>
                <View style={styles.indicadorResumo} />
                <Text style={styles.rotuloClaro}>PONTO SELECIONADO</Text>
              </View>

              <Text style={styles.nomePontoClaro}>{ponto.nome}</Text>
              <Text style={styles.identificacaoClaro}>{ponto.id}</Text>

              <View style={styles.resumoRodape}>
                <View>
                  <Text style={styles.rotuloClaro}>ÁREA</Text>
                  <Text style={styles.valorResumo}>{ponto.area}</Text>
                </View>
                <View>
                  <Text style={styles.rotuloClaro}>MEDIÇÕES</Text>
                  <Text style={styles.valorResumo}>{leituras.length}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.tituloCard}>Informações do ponto</Text>

              {!!ponto.descricao && (
                <Text style={styles.descricao}>{ponto.descricao}</Text>
              )}

              <View style={styles.secaoTipo}>
                <Text style={styles.rotulo}>Tipo de ponto</Text>
                <Text style={styles.tipoAtual}>
                  {ponto.tipo === "movel" ? "Ponto móvel" : "Ponto fixo"}
                </Text>
                <Text style={styles.ajudaTipo}>
                  {ponto.tipo === "movel"
                    ? "O local pode mudar a cada coleta."
                    : "Este ponto representa um local permanente."}
                </Text>

                {!!mensagemTipo && (
                  <Text style={styles.mensagemTipo}>{mensagemTipo}</Text>
                )}

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

              <Text style={styles.dataCadastro}>
                Cadastrado em:{" "}
                {new Date(ponto.dataCadastro).toLocaleDateString("pt-BR")}
              </Text>
            </View>

            <View style={styles.cabecalhoHistorico}>
              <View>
                <Text style={styles.tituloHistorico}>
                  Histórico de medições
                </Text>
                <Text style={styles.subtituloHistorico}>
                  Selecione uma medição para consultar os resultados.
                </Text>
              </View>
              <View style={styles.contador}>
                <Text style={styles.contadorNumero}>{leituras.length}</Text>
              </View>
            </View>

            {leituras.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.tituloCard}>
                  Nenhuma medição disponível
                </Text>
                <Text style={styles.mensagem}>
                  Este ponto ainda não recebeu medições.
                </Text>
              </View>
            ) : (
              leituras.map((leitura, indice) => {
                const aberta = leituraSelecionada === leitura.id;

                return (
                  <View key={leitura.id} style={styles.leituraCard}>
                    <TouchableOpacity
                      style={styles.leituraCabecalho}
                      activeOpacity={0.75}
                      onPress={() => alternarLeitura(leitura.id)}
                    >
                      <View style={styles.leituraIndicador} />

                      <View style={styles.leituraIdentificacao}>
                        <Text style={styles.leituraNumero}>
                          Medição {leituras.length - indice}
                        </Text>
                        <Text style={styles.dataLeitura}>
                          {formatarData(leitura.dataHora)}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.botaoExpandir,
                          aberta && styles.botaoExpandirAberto,
                        ]}
                      >
                        <Text
                          style={[
                            styles.setaLeitura,
                            aberta && styles.setaLeituraAberta,
                          ]}
                        >
                          {aberta ? "−" : "+"}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {aberta && renderDadosLeitura(leitura)}
                  </View>
                );
              })
            )}
          </>
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
  conteudo: {
    width: "90%",
    maxWidth: 850,
    alignSelf: "center",
    paddingTop: 25,
    paddingBottom: 40,
  },
  botaoVoltar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  seta: {
    fontSize: 25,
    color: "#2F5D3A",
    marginRight: 8,
  },
  textoVoltar: {
    fontSize: 15,
    color: "#2F5D3A",
    fontWeight: "600",
  },
  miniTitulo: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
    color: "#779477",
    marginBottom: 8,
  },
  titulo: {
    fontSize: 29,
    fontWeight: "bold",
    color: "#244D31",
  },
  subtitulo: {
    fontSize: 14,
    color: "#687568",
    marginTop: 7,
    marginBottom: 22,
    lineHeight: 21,
  },
  resumoCard: {
    backgroundColor: "#244D31",
    borderRadius: 15,
    padding: 22,
    marginBottom: 20,
  },
  resumoTopo: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicadorResumo: {
    width: 4,
    height: 12,
    borderRadius: 4,
    backgroundColor: "#A8C69F",
    marginRight: 8,
  },
  rotuloClaro: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#D4E3D1",
  },
  nomePontoClaro: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 13,
  },
  identificacaoClaro: {
    fontSize: 13,
    color: "#D4E3D1",
    marginTop: 3,
  },
  resumoRodape: {
    flexDirection: "row",
    gap: 45,
    borderTopWidth: 1,
    borderTopColor: "#456B4E",
    marginTop: 20,
    paddingTop: 15,
  },
  valorResumo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5EAE2",
  },
  tituloCard: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#244D31",
    marginBottom: 14,
  },
  rotulo: {
    fontSize: 12,
    fontWeight: "600",
    color: "#829082",
  },
  descricao: {
    fontSize: 14,
    color: "#687568",
    lineHeight: 21,
    marginBottom: 15,
  },
  secaoTipo: {
    padding: 16,
    backgroundColor: "#F2F5EF",
    borderRadius: 10,
  },
  tipoAtual: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2F5D3A",
    marginTop: 8,
  },
  ajudaTipo: {
    fontSize: 12,
    color: "#788278",
    marginTop: 6,
    lineHeight: 19,
  },
  mensagemTipo: {
    fontSize: 12,
    color: "#2F5D3A",
    marginTop: 8,
  },
  botaoAlterar: {
    alignSelf: "flex-start",
    backgroundColor: "#2F5D3A",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 13,
  },
  textoBotaoAlterar: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  dataCadastro: {
    fontSize: 12,
    color: "#899289",
    marginTop: 17,
  },
  cabecalhoHistorico: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 14,
  },
  tituloHistorico: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#244D31",
  },
  subtituloHistorico: {
    fontSize: 12,
    color: "#788278",
    marginTop: 5,
  },
  contador: {
    minWidth: 42,
    height: 42,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#E5EEE2",
    justifyContent: "center",
    alignItems: "center",
  },
  contadorNumero: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  leituraCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E5EAE2",
    marginBottom: 12,
    overflow: "hidden",
  },
  leituraCabecalho: {
    flexDirection: "row",
    alignItems: "center",
    padding: 17,
  },
  leituraIndicador: {
    width: 4,
    height: 43,
    borderRadius: 4,
    backgroundColor: "#A8C69F",
    marginRight: 13,
  },
  leituraIdentificacao: {
    flex: 1,
  },
  leituraNumero: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  dataLeitura: {
    fontSize: 12,
    color: "#788278",
    marginTop: 5,
  },
  botaoExpandir: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#EDF3EA",
    justifyContent: "center",
    alignItems: "center",
  },
  botaoExpandirAberto: {
    backgroundColor: "#2F5D3A",
  },
  setaLeitura: {
    fontSize: 21,
    color: "#2F5D3A",
  },
  setaLeituraAberta: {
    color: "#FFFFFF",
  },
  dadosContainer: {
    padding: 17,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#EDF0EB",
    backgroundColor: "#FBFCFA",
  },
  dadosTitulo: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#244D31",
    marginBottom: 13,
  },
  gradeDados: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  dadoCard: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: "#F0F5ED",
    borderRadius: 9,
    padding: 12,
  },
  nomeDado: {
    fontSize: 12,
    color: "#788278",
    marginBottom: 6,
  },
  valorDado: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  mensagem: {
    fontSize: 14,
    color: "#788278",
    lineHeight: 22,
  },
  rodape: {
    textAlign: "center",
    color: "#9AA49A",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 25,
  },
});

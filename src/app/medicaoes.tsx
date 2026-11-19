import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  observarEquipamento,
  observarSessaoAtiva,
  type EstadoEquipamento,
  type SessaoMedicao,
} from "../../backend/services/firebase/sessoes-service";

import { router, useFocusEffect } from "expo-router";

import { buscarPontosFirestore } from "../../backend/services/firebase/pontos-service";
import type { Ponto } from "../services/pontos-storage";

export default function MedicoesScreen() {
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoMedicao | null>(null);

  const [estadoEquipamento, setEstadoEquipamento] =
    useState<EstadoEquipamento | null>(null);

  const [verificandoEquipamento, setVerificandoEquipamento] = useState(true);
  const [erroEquipamento, setErroEquipamento] = useState(false);

  const [verificandoSessao, setVerificandoSessao] = useState(true);
  const [erroSessao, setErroSessao] = useState(false);

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

  // Observa a sessão de medição ativa
  useEffect(() => {
    const cancelar = observarSessaoAtiva(
      (sessao) => {
        setSessaoAtiva(sessao);
        setVerificandoSessao(false);
        setErroSessao(false);
      },
      (erro) => {
        console.error("Erro ao consultar sessão ativa:", erro);
        setErroSessao(true);
        setVerificandoSessao(false);
      },
    );

    return cancelar;
  }, []);

  // Observa a conexão do equipamento
  useEffect(() => {
    const cancelar = observarEquipamento(
      (estado) => {
        setEstadoEquipamento(estado);
        setVerificandoEquipamento(false);
        setErroEquipamento(false);
      },
      (erro) => {
        console.error("Erro ao consultar conexão:", erro);
        setErroEquipamento(true);
        setVerificandoEquipamento(false);
      },
    );

    return cancelar;
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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={voltarDashboard}
          activeOpacity={0.7}
        >
          <Text style={styles.setaVoltar}>←</Text>
          <Text style={styles.textoVoltar}>Voltar ao Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.cabecalho}>
          <Text style={styles.miniTitulo}>AGROSENSE</Text>

          <View style={styles.linhaTitulo}>
            <Text style={styles.titulo}>Medições</Text>

            <View style={styles.indicadores}>
              <View
                style={[
                  styles.etiquetaEquipamento,
                  verificandoSessao || erroSessao
                    ? styles.etiquetaVerificando
                    : sessaoAtiva
                      ? styles.etiquetaOcupado
                      : styles.etiquetaDisponivel,
                ]}
              >
                <Text style={styles.textoEtiqueta}>
                  {verificandoSessao
                    ? "Verificando sessão..."
                    : erroSessao
                      ? "Sessão indisponível"
                      : sessaoAtiva
                        ? "Equipamento ativo"
                        : "Equipamento disponível"}
                </Text>
              </View>

              <View
                style={[
                  styles.etiquetaEquipamento,
                  verificandoEquipamento ||
                  erroEquipamento ||
                  !estadoEquipamento
                    ? styles.etiquetaVerificando
                    : estadoEquipamento.conectado
                      ? styles.etiquetaDisponivel
                      : styles.etiquetaOcupado,
                ]}
              >
                <Text
                  style={[
                    styles.textoEtiqueta,
                    estadoEquipamento?.conectado && !erroEquipamento
                      ? styles.textoDisponivel
                      : styles.textoAtivo,
                  ]}
                >
                  {verificandoEquipamento
                    ? "Verificando conexão..."
                    : erroEquipamento || !estadoEquipamento
                      ? "Conexão indisponível"
                      : estadoEquipamento.conectado
                        ? "Equipamento conectado"
                        : "Equipamento desconectado"}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.subtitulo}>
            Selecione um ponto cadastrado para acompanhar a coleta dos sensores.
          </Text>
        </View>

        {carregando ? (
          <View style={styles.cardEstado}>
            <ActivityIndicator size="large" color="#2F5D3A" />
            <Text style={styles.mensagem}>Carregando pontos...</Text>
          </View>
        ) : pontos.length === 0 ? (
          <View style={styles.cardEstado}>
            <Text style={styles.nomeCard}>Nenhum ponto cadastrado</Text>
            <Text style={styles.mensagem}>
              Cadastre um ponto antes de iniciar uma medição.
            </Text>

            <TouchableOpacity
              style={styles.botao}
              onPress={() => router.push("/missoes")}
              activeOpacity={0.8}
            >
              <Text style={styles.textoBotao}>Ir para Cadastro de Pontos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.tituloLista}>
              <Text style={styles.tituloSecao}>Pontos cadastrados</Text>
              <Text style={styles.contador}>{pontos.length}</Text>
            </View>

            {pontos.map((ponto) => (
              <TouchableOpacity
                key={ponto.id}
                style={styles.cardPonto}
                onPress={() => abrirMedicao(ponto)}
                activeOpacity={0.75}
              >
                <View style={styles.linhaCard}>
                  <View style={styles.identificacaoPonto}>
                    <Text style={styles.rotuloCard}>PONTO CADASTRADO</Text>
                    <Text style={styles.nomePonto}>{ponto.nome}</Text>
                  </View>

                  <View
                    style={[
                      styles.etiquetaPonto,
                      sessaoAtiva?.pontoId === ponto.id
                        ? styles.etiquetaOcupado
                        : styles.etiquetaDisponivel,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoEtiqueta,
                        sessaoAtiva?.pontoId === ponto.id
                          ? styles.textoAtivo
                          : styles.textoDisponivel,
                      ]}
                    >
                      {verificandoSessao || erroSessao
                        ? "Verificando"
                        : sessaoAtiva?.pontoId === ponto.id
                          ? "Ativo"
                          : "Disponível"}
                    </Text>
                  </View>
                </View>

                <View style={styles.divisor} />

                <View style={styles.informacoes}>
                  <View style={styles.informacaoBloco}>
                    <Text style={styles.rotuloInformacao} numberOfLines={1}>
                      IDENTIFICAÇÃO
                    </Text>
                    <Text style={styles.informacao} numberOfLines={1}>
                      {ponto.id}
                    </Text>
                  </View>

                  <View style={styles.informacaoBloco}>
                    <Text style={styles.rotuloInformacao} numberOfLines={1}>
                      ÁREA
                    </Text>
                    <Text style={styles.informacao} numberOfLines={1}>
                      {ponto.area}
                    </Text>
                  </View>

                  <View style={styles.informacaoBloco}>
                    <Text style={styles.rotuloInformacao} numberOfLines={1}>
                      TIPO DE PONTO
                    </Text>
                    <Text style={styles.informacao} numberOfLines={1}>
                      {ponto.tipo === "fixo" ? "Fixo" : "Móvel"}
                    </Text>
                  </View>
                </View>

                {!!ponto.descricao && (
                  <Text style={styles.descricao}>{ponto.descricao}</Text>
                )}

                <View style={styles.rodapeCard}>
                  <Text style={styles.selecionar}>Abrir medição do ponto</Text>
                  <Text style={styles.setaRodape}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
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
  conteudo: {
    width: "90%",
    maxWidth: 850,
    alignSelf: "center",
    paddingTop: 25,
    paddingBottom: 45,
  },
  botaoVoltar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  setaVoltar: {
    fontSize: 22,
    color: "#2F5D3A",
    marginRight: 8,
  },
  textoVoltar: {
    color: "#2F5D3A",
    fontSize: 14,
    fontWeight: "600",
  },
  cabecalho: {
    marginBottom: 25,
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
    lineHeight: 21,
  },
  tituloLista: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
    gap: 9,
  },
  tituloSecao: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#244D31",
  },
  contador: {
    minWidth: 25,
    height: 25,
    paddingHorizontal: 7,
    borderRadius: 8,
    backgroundColor: "#E5EDE1",
    color: "#2F5D3A",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 12,
    fontWeight: "bold",
    overflow: "hidden",
  },
  cardEstado: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 22,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5EAE2",
  },
  cardPonto: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5EAE2",
  },
  linhaCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  identificacaoPonto: {
    flex: 1,
    paddingRight: 12,
  },
  rotuloCard: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#829082",
    marginBottom: 6,
  },
  nomePonto: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#244D31",
  },
  botaoAbrir: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: "#EDF3EA",
    justifyContent: "center",
    alignItems: "center",
  },
  seta: {
    fontSize: 22,
    color: "#2F5D3A",
  },
  divisor: {
    height: 1,
    backgroundColor: "#E5EAE2",
    marginTop: 16,
    marginBottom: 15,
  },
  informacoes: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
  },
  informacaoBloco: {
    flex: 1,
    minWidth: 0,
    paddingRight: 5,
  },
  rotuloInformacao: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.3,
    color: "#829082",
    marginBottom: 5,
  },
  informacao: {
    fontSize: 13,
    color: "#526B56",
    fontWeight: "600",
  },
  descricao: {
    fontSize: 13,
    color: "#788278",
    marginTop: 13,
    lineHeight: 20,
  },
  rodapeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 17,
  },
  selecionar: {
    fontSize: 13,
    color: "#2F5D3A",
    fontWeight: "bold",
  },
  setaRodape: {
    fontSize: 17,
    color: "#2F5D3A",
  },
  nomeCard: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#244D31",
  },
  mensagem: {
    fontSize: 14,
    color: "#788278",
    lineHeight: 22,
    marginTop: 10,
  },
  botao: {
    backgroundColor: "#2F5D3A",
    padding: 15,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 20,
  },
  textoBotao: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  rodape: {
    textAlign: "center",
    color: "#9AA49A",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 25,
  },
  linhaTitulo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 10,
  },
  indicadores: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  etiquetaEquipamento: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
  },
  etiquetaPonto: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  etiquetaDisponivel: {
    backgroundColor: "#E5EDE1",
  },
  etiquetaOcupado: {
    backgroundColor: "#FCE8E6",
  },
  etiquetaVerificando: {
    backgroundColor: "#F1EBDD",
  },
  textoEtiqueta: {
    fontSize: 11,
    fontWeight: "bold",
  },
  textoAtivo: {
    color: "#C0392B",
  },
  textoDisponivel: {
    color: "#2F5D3A",
  },
});

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { observarLeituras } from "../../backend/services/firebase/leituras-service";
import {
  iniciarSessao,
  observarEquipamento,
  observarSessaoAtiva,
} from "../../backend/services/firebase/sessoes-service";

import type { Leitura } from "../data/leituras";

import type {
  EstadoEquipamento,
  SessaoMedicao,
} from "../../backend/services/firebase/sessoes-service";

export default function MedicaoDetalhesScreen() {
  const params = useLocalSearchParams();

  const area = Array.isArray(params.area) ? params.area[0] : params.area;
  const pontoId = Array.isArray(params.pontoId)
    ? params.pontoId[0]
    : params.pontoId;
  const pontoNome = Array.isArray(params.pontoNome)
    ? params.pontoNome[0]
    : params.pontoNome;
  const descricao = Array.isArray(params.descricao)
    ? params.descricao[0]
    : params.descricao;
  const tipo = Array.isArray(params.tipo) ? params.tipo[0] : params.tipo;

  const [medicaoIniciada, setMedicaoIniciada] = useState(false);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const leituraAtual = leituras[0];

  const [erroLeitura, setErroLeitura] = useState("");
  const [erroMedicao, setErroMedicao] = useState("");

  const [equipamentoConectado, setEquipamentoConectado] = useState<
    boolean | null
  >(null);

  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoMedicao | null>(null);

  const equipamentoOcupado =
    sessaoAtiva !== null && sessaoAtiva.pontoId !== pontoId;

  function voltar() {
    router.back();
  }

  // Observa a conexão do equipamento e a sessão global.
  useEffect(() => {
    const cancelarEquipamento = observarEquipamento(
      (estado: EstadoEquipamento) => {
        setEquipamentoConectado(estado.conectado);
      },
      (erro) => {
        console.error("Erro ao verificar equipamento:", erro);
        setEquipamentoConectado(false);
      },
    );

    const cancelarSessao = observarSessaoAtiva(
      (sessao) => {
        setSessaoAtiva(sessao);

        if (sessao?.pontoId === pontoId) {
          setMedicaoIniciada(true);
          setErroMedicao("");
        } else if (!sessao) {
          setMedicaoIniciada(false);
        }
      },
      (erro) => {
        console.error("Erro ao verificar sessão:", erro);
      },
    );

    return () => {
      cancelarEquipamento();
      cancelarSessao();
    };
  }, [pontoId]);

  async function iniciarMedicao() {
    if (medicaoIniciada || equipamentoOcupado) return;

    setErroMedicao("");

    if (equipamentoConectado !== true) {
      setErroMedicao(
        equipamentoConectado === false
          ? "Aparelho desconectado. Tente conectar para fazer uma medição."
          : "Verificando conexão com o aparelho. Aguarde um momento.",
      );
      return;
    }

    if (!pontoId || !area) {
      Alert.alert("Atenção", "Ponto ou área não identificados.");
      return;
    }

    try {
      await iniciarSessao(pontoId, pontoNome || "Ponto", area);

      setMedicaoIniciada(true);

      Alert.alert(
        "Medição iniciada",
        "Solicitação registrada. Aguardando os dados dos sensores.",
      );
    } catch (erro) {
      console.error("Erro ao iniciar medição:", erro);

      const mensagemErro = erro instanceof Error ? erro.message : "";

      if (
        mensagemErro.includes(
          "O equipamento já está sendo utilizado em outra medição",
        )
      ) {
        setErroMedicao(
          "Já existe uma medição em andamento em outro ponto. Aguarde a conclusão da coleta atual para iniciar uma nova medição.",
        );
      } else {
        setErroMedicao(
          "Ocorreu um problema ao solicitar a medição. Verifique sua conexão e tente novamente.",
        );
      }
    }
  }

  // Recebe as leituras somente quando a medição deste ponto está ativa.
  useEffect(() => {
    if (!medicaoIniciada || !pontoId) {
      setLeituras([]);
      return;
    }

    const cancelar = observarLeituras(
      (dados) => {
        const leiturasDoPonto = dados
          .filter((leitura) => leitura.pontoId === pontoId)
          .sort((a, b) => b.dataHora.localeCompare(a.dataHora));

        setLeituras(leiturasDoPonto);
        setErroLeitura("");
      },
      (erro) => {
        console.error("Erro ao receber medições:", erro);
        setErroLeitura("Não foi possível receber os dados dos sensores.");
      },
    );

    return cancelar;
  }, [medicaoIniciada, pontoId]);

  const tituloStatus =
    equipamentoConectado === null
      ? "Verificando aparelho..."
      : !equipamentoConectado
        ? "Aparelho desconectado"
        : equipamentoOcupado
          ? "Equipamento em uso em outro ponto"
          : medicaoIniciada
            ? "Aguardando dados dos sensores"
            : "Disponível para medição";

  const mensagemStatus =
    equipamentoConectado === null
      ? "Aguarde enquanto verificamos a conexão com o aparelho."
      : !equipamentoConectado
        ? "Tente conectar o aparelho para fazer uma medição."
        : equipamentoOcupado
          ? `O equipamento está realizando uma medição no ponto ${sessaoAtiva?.pontoNome || sessaoAtiva?.pontoId}. Aguarde a conclusão.`
          : medicaoIniciada
            ? "A solicitação foi preparada. Os dados aparecerão aqui quando forem recebidos do ESP32."
            : "O aparelho está conectado e disponível. Você pode iniciar uma medição.";

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <TouchableOpacity onPress={voltar} style={styles.botaoVoltar}>
          <Text style={styles.setaVoltar}>←</Text>
          <Text style={styles.textoVoltar}>Voltar aos pontos</Text>
        </TouchableOpacity>

        <Text style={styles.miniTitulo}>AGROSENSE</Text>
        <Text style={styles.titulo}>Medição automática</Text>

        <Text style={styles.subtitulo}>
          Acompanhe a coleta de dados e as informações recebidas dos sensores.
        </Text>

        <View style={styles.resumoCard}>
          <View style={styles.resumoTopo}>
            <View style={styles.indicadorResumo} />
            <Text style={styles.rotuloClaro}>PONTO SELECIONADO</Text>
          </View>

          <View style={styles.resumoRodape}>
            <View style={styles.itemResumo}>
              <Text style={styles.rotuloClaro}>PONTO</Text>
              <Text style={styles.valorResumo} numberOfLines={1}>
                {pontoNome || "Ponto"}
              </Text>
              <Text style={styles.identificacaoClaro} numberOfLines={1}>
                {pontoId || "Não informado"}
              </Text>
            </View>

            <View style={styles.itemResumo}>
              <Text style={styles.rotuloClaro}>ÁREA</Text>
              <Text style={styles.valorResumo} numberOfLines={1}>
                {area || "Não informada"}
              </Text>
            </View>

            <View style={styles.itemResumo}>
              <Text style={styles.rotuloClaro}>TIPO DE PONTO</Text>
              <Text style={styles.valorResumo} numberOfLines={1}>
                {tipo === "fixo"
                  ? "Fixo"
                  : tipo === "movel"
                    ? "Móvel"
                    : "Não informado"}
              </Text>
            </View>
          </View>
        </View>

        {!!descricao && (
          <View style={styles.card}>
            <Text style={styles.tituloSecao}>Informações adicionais</Text>
            <Text style={styles.descricao}>{descricao}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.tituloSecao}>Status da medição</Text>

          <View style={styles.linhaStatus}>
            <View
              style={[
                styles.indicadorStatus,
                equipamentoConectado === true && styles.indicadorAtivo,
                (!equipamentoConectado || equipamentoOcupado) &&
                  styles.indicadorErro,
              ]}
            />

            <Text style={styles.status}>{tituloStatus}</Text>
          </View>

          <Text style={styles.mensagem}>{mensagemStatus}</Text>

          <TouchableOpacity
            style={[
              styles.botaoIniciar,
              (medicaoIniciada ||
                equipamentoConectado !== true ||
                equipamentoOcupado) &&
                styles.botaoDesabilitado,
            ]}
            onPress={iniciarMedicao}
            disabled={
              medicaoIniciada ||
              equipamentoConectado !== true ||
              equipamentoOcupado
            }
          >
            <Text style={styles.textoBotao}>
              {medicaoIniciada
                ? "Medição em andamento"
                : equipamentoConectado === null
                  ? "Verificando aparelho..."
                  : !equipamentoConectado
                    ? "Aparelho desconectado"
                    : equipamentoOcupado
                      ? "Equipamento em uso"
                      : "Iniciar medição"}
            </Text>
          </TouchableOpacity>

          {(!equipamentoConectado || erroMedicao !== "") &&
            equipamentoConectado !== null && (
              <View style={styles.caixaErro}>
                <Text style={styles.tituloErro}>
                  {!equipamentoConectado
                    ? "Aparelho desconectado"
                    : erroMedicao.includes("Já existe uma medição")
                      ? "Equipamento ocupado"
                      : "Não foi possível iniciar"}
                </Text>

                <Text style={styles.textoErro}>
                  {!equipamentoConectado
                    ? "Tente conectar o aparelho para fazer uma medição."
                    : erroMedicao}
                </Text>
              </View>
            )}

          {erroMedicao !== "" && equipamentoConectado === null && (
            <View style={styles.caixaErro}>
              <Text style={styles.tituloErro}>Atenção</Text>
              <Text style={styles.textoErro}>{erroMedicao}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cabecalhoSensores}>
            <Text style={styles.tituloSecao}>Dados dos sensores</Text>

            <View style={styles.etiquetaPendente}>
              <Text style={styles.textoPendente}>
                {leituraAtual ? "Dados recebidos" : "Pendente"}
              </Text>
            </View>
          </View>

          {erroLeitura ? (
            <Text style={styles.mensagem}>{erroLeitura}</Text>
          ) : !medicaoIniciada ? (
            <Text style={styles.mensagem}>
              Inicie uma medição para receber os dados dos sensores.
            </Text>
          ) : !leituraAtual ? (
            <Text style={styles.mensagem}>
              Aguardando os dados dos sensores...
            </Text>
          ) : (
            <>
              <Text style={styles.mensagem}>
                Última leitura recebida:{" "}
                {new Date(leituraAtual.dataHora).toLocaleString("pt-BR")}
              </Text>

              <View style={styles.listaSensores}>
                {[
                  {
                    nome: "Temperatura",
                    valor: leituraAtual.temperatura,
                    unidade: "°C",
                  },
                  {
                    nome: "Umidade",
                    valor: leituraAtual.umidade,
                    unidade: "%",
                  },
                  {
                    nome: "Condutividade",
                    valor: leituraAtual.condutividade,
                    unidade: "",
                  },
                  {
                    nome: "Potássio",
                    valor: leituraAtual.potassio,
                    unidade: "",
                  },
                  {
                    nome: "Fósforo",
                    valor: leituraAtual.fosforo,
                    unidade: "",
                  },
                  {
                    nome: "Nitrogênio",
                    valor: leituraAtual.nitrogenio,
                    unidade: "",
                  },
                  {
                    nome: "pH do solo",
                    valor: leituraAtual.ph,
                    unidade: "",
                  },
                ].map((sensor) => (
                  <View key={sensor.nome} style={styles.itemSensor}>
                    <Text style={styles.nomeSensor}>{sensor.nome}</Text>
                    <Text style={styles.valorPendente}>
                      {sensor.valor} {sensor.unidade}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

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
    fontSize: 23,
    color: "#2F5D3A",
    marginRight: 8,
  },
  textoVoltar: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2F5D3A",
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
  identificacaoClaro: {
    fontSize: 13,
    color: "#D4E3D1",
    marginTop: 3,
  },
  resumoRodape: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#456B4E",
    marginTop: 20,
    paddingTop: 15,
  },
  itemResumo: {
    flex: 1,
    minWidth: 0,
  },
  valorResumo: {
    fontSize: 15,
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
  tituloSecao: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#244D31",
    marginBottom: 15,
  },
  descricao: {
    fontSize: 14,
    color: "#687568",
    lineHeight: 21,
  },
  linhaStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  indicadorStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D6A23A",
  },
  indicadorAtivo: {
    backgroundColor: "#2F5D3A",
  },
  indicadorErro: {
    backgroundColor: "#C63D35",
  },
  status: {
    fontSize: 14,
    fontWeight: "600",
    color: "#344B38",
  },
  mensagem: {
    fontSize: 14,
    color: "#788278",
    lineHeight: 22,
    marginTop: 13,
  },
  botaoIniciar: {
    backgroundColor: "#2F5D3A",
    padding: 15,
    borderRadius: 9,
    alignItems: "center",
    marginTop: 20,
  },
  botaoDesabilitado: {
    backgroundColor: "#8A9B91",
  },
  textoBotao: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  caixaErro: {
    backgroundColor: "#FCE8E6",
    borderWidth: 1,
    borderColor: "#E7B5B5",
    borderRadius: 9,
    padding: 14,
    marginTop: 15,
  },
  tituloErro: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  textoErro: {
    color: "#8F3028",
    fontSize: 13,
    lineHeight: 20,
  },
  cabecalhoSensores: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  etiquetaPendente: {
    backgroundColor: "#F0F5ED",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  textoPendente: {
    fontSize: 11,
    fontWeight: "600",
    color: "#788278",
  },
  listaSensores: {
    marginTop: 17,
    gap: 9,
  },
  itemSensor: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F2F5EF",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  nomeSensor: {
    fontSize: 13,
    color: "#526B56",
    fontWeight: "600",
  },
  valorPendente: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#9AA49A",
  },
  rodape: {
    textAlign: "center",
    color: "#9AA49A",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 10,
  },
});

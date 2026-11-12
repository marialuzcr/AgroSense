import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { Leitura } from "../data/leituras";
import { salvarLeituraFirestore } from "../../backend/services/firebase/leituras-service";

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

  console.log("Tipo recebido na medição:", tipo);

  const [medicaoIniciada, setMedicaoIniciada] = useState(false);

  function voltar() {
    router.back();
  }

  async function iniciarMedicao() {
    if (medicaoIniciada) return;

    try {
      const novaLeitura: Leitura = {
        id: `TESTE-${Date.now()}`,
        missaoId: "TESTE",
        area: area || "Não informada",
        pontoId: pontoId || "",
        dataHora: new Date().toISOString(),
        temperatura: 25.5,
        umidade: 60,
        condutividade: 1.2,
        potassio: 40,
        fosforo: 30,
        nitrogenio: 20,
        ph: 6.5,
      };

      await salvarLeituraFirestore(novaLeitura);

      setMedicaoIniciada(true);

      Alert.alert("Sucesso", "A medição de teste foi salva no Firestore!");
    } catch (erro) {
      console.error("Erro ao salvar medição:", erro);

      Alert.alert(
        "Erro",
        "Não foi possível salvar a medição. Verifique o console.",
      );
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
    >
      <TouchableOpacity onPress={voltar} style={styles.botaoVoltar}>
        <Text style={styles.textoVoltar}>← Voltar aos pontos</Text>
      </TouchableOpacity>

      <Text style={styles.titulo}>Medição automática</Text>

      <Text style={styles.subtitulo}>
        Acompanhamento da coleta de dados dos sensores.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Ponto selecionado</Text>
        <Text style={styles.nomePonto}>{pontoNome || "Ponto"}</Text>

        <Text style={styles.informacao}>Área: {area || "Não informada"}</Text>

        <Text style={styles.informacao}>
          Identificação: {pontoId || "Não informada"}
        </Text>

        <Text style={styles.informacao}>
          Tipo de ponto:{" "}
          {tipo === "fixo"
            ? "Fixo"
            : tipo === "movel"
              ? "Móvel"
              : "não informado"}
        </Text>

        {!!descricao && <Text style={styles.descricao}>{descricao}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.tituloSecao}>Status da medição</Text>

        <View style={styles.linhaStatus}>
          <View
            style={[styles.indicador, medicaoIniciada && styles.indicadorAtivo]}
          />
          <Text style={styles.status}>
            {medicaoIniciada
              ? "Aguardando dados dos sensores"
              : "Aguardando início"}
          </Text>
        </View>

        <Text style={styles.mensagem}>
          {medicaoIniciada
            ? "A solicitação foi preparada. Os dados aparecerão aqui quando forem recebidos do ESP32."
            : "Inicie uma medição para preparar a solicitação de coleta dos sensores."}
        </Text>

        <TouchableOpacity
          style={[
            styles.botaoIniciar,
            medicaoIniciada && styles.botaoDesabilitado,
          ]}
          onPress={iniciarMedicao}
          disabled={medicaoIniciada}
        >
          <Text style={styles.textoBotao}>
            {medicaoIniciada ? "Aguardando sensores" : "Iniciar medição"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.tituloSecao}>Dados dos sensores</Text>

        <Text style={styles.mensagem}>
          Os valores de temperatura, umidade, condutividade, potássio, fósforo,
          nitrogênio e pH aparecerão aqui quando forem recebidos dos sensores.
        </Text>

        <View style={styles.aviso}></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F2",
  },
  conteudo: {
    width: "90%",
    maxWidth: 850,
    alignSelf: "center",
    paddingTop: 25,
    paddingBottom: 45,
  },
  botaoVoltar: {
    marginBottom: 25,
  },
  textoVoltar: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2F5D3A",
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2F5D3A",
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 15,
    color: "#667085",
    marginBottom: 22,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: "#667085",
    marginBottom: 8,
  },
  nomePonto: {
    fontSize: 23,
    fontWeight: "bold",
    color: "#174B35",
    marginBottom: 14,
  },
  informacao: {
    fontSize: 14,
    color: "#526170",
    marginTop: 5,
  },
  descricao: {
    fontSize: 14,
    color: "#718096",
    marginTop: 10,
  },
  tituloSecao: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#174B35",
    marginBottom: 16,
  },
  linhaStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  indicador: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#D6A23A",
  },
  indicadorAtivo: {
    backgroundColor: "#287A50",
  },
  status: {
    fontSize: 15,
    fontWeight: "600",
    color: "#344054",
  },
  mensagem: {
    fontSize: 14,
    color: "#667085",
    lineHeight: 22,
    marginTop: 14,
  },
  botaoIniciar: {
    backgroundColor: "#287A50",
    padding: 16,
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
  aviso: {
    backgroundColor: "#F1F3F2",
    borderRadius: 8,
    padding: 13,
    marginTop: 18,
  },
  textoAviso: {
    fontSize: 12,
    color: "#667085",
  },
});

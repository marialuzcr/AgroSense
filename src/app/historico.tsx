import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import type { Leitura } from "../data/leituras";
import { buscarLeiturasFirestore } from "../../backend/services/firebase/leituras-service";

export default function HistoricoScreen() {
  const [historico, setHistorico] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarHistorico() {
      try {
        const leituras = await buscarLeiturasFirestore();

        leituras.sort(
          (a, b) =>
            new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
        );

        setHistorico(leituras);
      } catch (erro) {
        console.error("Erro ao carregar histórico:", erro);
        Alert.alert("Erro", "Não foi possível carregar o histórico.");
      } finally {
        setCarregando(false);
      }
    }

    carregarHistorico();
  }, []);

  function formatarData(data: string) {
    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
      return data;
    }

    return dataFormatada.toLocaleDateString("pt-BR");
  }

  function formatarHorario(data: string) {
    const dataFormatada = new Date(data);

    if (Number.isNaN(dataFormatada.getTime())) {
      return "";
    }

    return dataFormatada.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function voltarDashboard() {
    router.replace("/dashboard");
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <TouchableOpacity style={styles.botaoVoltar} onPress={voltarDashboard}>
          <Text style={styles.seta}>←</Text>
          <Text style={styles.textoVoltar}>Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.miniTitulo}>AGROSENSE</Text>
        <Text style={styles.titulo}>Histórico de medições</Text>

        <Text style={styles.subtitulo}>
          Consulte as medições realizadas e acompanhe os resultados registrados.
        </Text>

        <View style={styles.resumoCard}>
          <Text style={styles.rotuloClaro}>MEDIÇÕES REGISTRADAS</Text>
          <Text style={styles.totalLeituras}>{historico.length}</Text>
          <Text style={styles.textoResumo}>registros encontrados</Text>
        </View>

        <View style={styles.cabecalhoHistorico}>
          <View>
            <Text style={styles.tituloSecao}>Todas as medições</Text>
            <Text style={styles.subtituloSecao}>
              Da mais recente para a mais antiga
            </Text>
          </View>
        </View>

        {carregando ? (
          <View style={styles.cardMensagem}>
            <ActivityIndicator size="large" color="#2F5D3A" />
            <Text style={styles.mensagem}>Carregando medições...</Text>
          </View>
        ) : historico.length === 0 ? (
          <View style={styles.cardMensagem}>
            <Text style={styles.tituloCard}>Nenhuma medição encontrada</Text>
            <Text style={styles.mensagem}>
              As medições registradas aparecerão aqui.
            </Text>
          </View>
        ) : (
          historico.map((registro, index) => (
            <View key={registro.id || index} style={styles.card}>
              <View style={styles.topoCard}>
                <View style={styles.identificacao}>
                  <View style={styles.indicador} />
                  <View style={styles.infoTopo}>
                    <Text style={styles.area}>Área {registro.area}</Text>
                    <Text style={styles.missao}>{registro.missaoId}</Text>
                  </View>
                </View>

                <View style={styles.dataContainer}>
                  <Text style={styles.data}>
                    {formatarData(registro.dataHora)}
                  </Text>
                  <Text style={styles.horario}>
                    {formatarHorario(registro.dataHora)}
                  </Text>
                </View>
              </View>

              <View style={styles.divisor} />

              <Text style={styles.tituloResultados}>Resultados da medição</Text>

              <View style={styles.gradeDados}>
                <View style={styles.dadoCard}>
                  <Text style={styles.label}>Temperatura</Text>
                  <Text style={styles.valor}>{registro.temperatura} °C</Text>
                </View>

                <View style={styles.dadoCard}>
                  <Text style={styles.label}>Umidade</Text>
                  <Text style={styles.valor}>{registro.umidade} %</Text>
                </View>

                <View style={styles.dadoCard}>
                  <Text style={styles.label}>Condutividade</Text>
                  <Text style={styles.valor}>
                    {registro.condutividade} mS/cm
                  </Text>
                </View>

                <View style={styles.dadoCard}>
                  <Text style={styles.label}>pH do solo</Text>
                  <Text style={styles.valor}>{registro.ph}</Text>
                </View>

                <View style={styles.dadoCard}>
                  <Text style={styles.label}>Nitrogênio (N)</Text>
                  <Text style={styles.valor}>{registro.nitrogenio} mg/kg</Text>
                </View>

                <View style={styles.dadoCard}>
                  <Text style={styles.label}>Fósforo (P)</Text>
                  <Text style={styles.valor}>{registro.fosforo} mg/kg</Text>
                </View>

                <View style={styles.dadoCard}>
                  <Text style={styles.label}>Potássio (K)</Text>
                  <Text style={styles.valor}>{registro.potassio} mg/kg</Text>
                </View>
              </View>
            </View>
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
    marginBottom: 25,
  },
  rotuloClaro: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#D4E3D1",
  },
  totalLeituras: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 8,
  },
  textoResumo: {
    fontSize: 12,
    color: "#D4E3D1",
    marginTop: 3,
  },
  cabecalhoHistorico: {
    marginBottom: 14,
  },
  tituloSecao: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#244D31",
  },
  subtituloSecao: {
    fontSize: 12,
    color: "#788278",
    marginTop: 5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5EAE2",
  },
  topoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  identificacao: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  indicador: {
    width: 4,
    height: 43,
    borderRadius: 4,
    backgroundColor: "#A8C69F",
    marginRight: 13,
  },
  infoTopo: {
    flex: 1,
  },
  area: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  missao: {
    fontSize: 12,
    color: "#788278",
    marginTop: 5,
  },
  dataContainer: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  data: {
    fontSize: 12,
    color: "#526170",
    fontWeight: "600",
  },
  horario: {
    fontSize: 12,
    color: "#788278",
    marginTop: 4,
  },
  divisor: {
    height: 1,
    backgroundColor: "#EDF0EB",
    marginVertical: 17,
  },
  tituloResultados: {
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
  label: {
    fontSize: 12,
    color: "#788278",
    marginBottom: 7,
  },
  valor: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  cardMensagem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5EAE2",
    alignItems: "center",
  },
  tituloCard: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#244D31",
    marginBottom: 8,
  },
  mensagem: {
    fontSize: 14,
    color: "#788278",
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
  rodape: {
    textAlign: "center",
    color: "#9AA49A",
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 25,
  },
});

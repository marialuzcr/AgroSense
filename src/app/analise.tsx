import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useEffect, useState } from "react";
import { router } from "expo-router";

import type { Leitura } from "../data/leituras";
import { buscarLeiturasFirestore } from "../../backend/services/firebase/leituras-service";

export default function AnalisesScreen() {
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarLeituras() {
      try {
        const resultado = await buscarLeiturasFirestore();
        setLeituras(resultado);
      } catch (erro) {
        console.error("Erro ao carregar análises:", erro);
        Alert.alert("Erro", "Não foi possível carregar as medições.");
      } finally {
        setCarregando(false);
      }
    }

    carregarLeituras();
  }, []);

  const areas = Object.values(
    leituras.reduce<
      Record<
        string,
        {
          nome: string;
          temperatura: number[];
          umidade: number[];
          nitrogenio: number[];
          fosforo: number[];
          potassio: number[];
        }
      >
    >((grupos, leitura) => {
      const nome = leitura.area || "Não informada";

      if (!grupos[nome]) {
        grupos[nome] = {
          nome,
          temperatura: [],
          umidade: [],
          nitrogenio: [],
          fosforo: [],
          potassio: [],
        };
      }

      grupos[nome].temperatura.push(leitura.temperatura);
      grupos[nome].umidade.push(leitura.umidade);
      grupos[nome].nitrogenio.push(leitura.nitrogenio);
      grupos[nome].fosforo.push(leitura.fosforo);
      grupos[nome].potassio.push(leitura.potassio);

      return grupos;
    }, {}),
  );

  function calcularMedia(valores: number[]): string {
    if (valores.length === 0) return "0,0";

    const soma = valores.reduce((total, valor) => total + valor, 0);

    return (soma / valores.length).toFixed(1).replace(".", ",");
  }

  const mediaTemperatura = calcularMedia(
    leituras.map((leitura) => leitura.temperatura),
  );

  const mediaUmidade = calcularMedia(
    leituras.map((leitura) => leitura.umidade),
  );

  const mediaNitrogenio = calcularMedia(
    leituras.map((leitura) => leitura.nitrogenio),
  );

  const mediaFosforo = calcularMedia(
    leituras.map((leitura) => leitura.fosforo),
  );

  const mediaPotassio = calcularMedia(
    leituras.map((leitura) => leitura.potassio),
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => router.replace("/dashboard")}
        >
          <Text style={styles.seta}>←</Text>
          <Text style={styles.textoVoltar}>Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.miniTitulo}>AGROSENSE</Text>
        <Text style={styles.titulo}>Análises</Text>

        <Text style={styles.subtitulo}>
          Acompanhe as médias das medições e compare os resultados das áreas
          monitoradas.
        </Text>

        {carregando ? (
          <View style={styles.cardMensagem}>
            <ActivityIndicator size="large" color="#2F5D3A" />
            <Text style={styles.mensagem}>Carregando medições...</Text>
          </View>
        ) : leituras.length === 0 ? (
          <View style={styles.cardMensagem}>
            <Text style={styles.tituloCard}>Nenhuma medição encontrada</Text>
            <Text style={styles.mensagem}>
              Quando houver medições salvas no Firestore, as análises aparecerão
              aqui.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.resumoCard}>
              <Text style={styles.rotuloClaro}>MEDIÇÕES ANALISADAS</Text>
              <Text style={styles.totalLeituras}>{leituras.length}</Text>
              <Text style={styles.textoResumo}>
                registros considerados nas médias
              </Text>
            </View>

            <View style={styles.cabecalhoSecao}>
              <Text style={styles.tituloSecao}>Média geral</Text>
              <Text style={styles.subtituloSecao}>
                Resultado conjunto de todas as áreas
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.gradeDados}>
                <View style={styles.dadoCard}>
                  <Text style={styles.label}>Temperatura média</Text>
                  <Text style={styles.valor}>{mediaTemperatura} °C</Text>
                </View>

                <View style={styles.dadoCard}>
                  <Text style={styles.label}>Umidade média</Text>
                  <Text style={styles.valor}>{mediaUmidade} %</Text>
                </View>

                <View style={styles.dadoCard}>
                  <Text style={styles.label}>Nitrogênio médio</Text>
                  <Text style={styles.valor}>{mediaNitrogenio} mg/kg</Text>
                </View>

                <View style={styles.dadoCard}>
                  <Text style={styles.label}>Fósforo médio</Text>
                  <Text style={styles.valor}>{mediaFosforo} mg/kg</Text>
                </View>

                <View style={styles.dadoCard}>
                  <Text style={styles.label}>Potássio médio</Text>
                  <Text style={styles.valor}>{mediaPotassio} mg/kg</Text>
                </View>
              </View>
            </View>

            <View style={styles.cabecalhoSecao}>
              <Text style={styles.tituloSecao}>Comparação entre áreas</Text>
              <Text style={styles.subtituloSecao}>
                Médias individuais de cada área monitorada
              </Text>
            </View>

            {areas.map((area) => (
              <View key={area.nome} style={styles.cardArea}>
                <View style={styles.topoArea}>
                  <View style={styles.indicadorArea} />
                  <Text style={styles.areaNome}>Área {area.nome}</Text>
                </View>

                <View style={styles.linhaMedicao}>
                  <Text style={styles.label}>Temperatura</Text>
                  <Text style={styles.valor}>
                    {calcularMedia(area.temperatura)} °C
                  </Text>
                </View>

                <View style={styles.linhaMedicao}>
                  <Text style={styles.label}>Umidade</Text>
                  <Text style={styles.valor}>
                    {calcularMedia(area.umidade)} %
                  </Text>
                </View>

                <View style={styles.linhaMedicao}>
                  <Text style={styles.label}>Nitrogênio</Text>
                  <Text style={styles.valor}>
                    {calcularMedia(area.nitrogenio)} mg/kg
                  </Text>
                </View>

                <View style={styles.linhaMedicao}>
                  <Text style={styles.label}>Fósforo</Text>
                  <Text style={styles.valor}>
                    {calcularMedia(area.fosforo)} mg/kg
                  </Text>
                </View>

                <View style={[styles.linhaMedicao, styles.ultimaLinha]}>
                  <Text style={styles.label}>Potássio</Text>
                  <Text style={styles.valor}>
                    {calcularMedia(area.potassio)} mg/kg
                  </Text>
                </View>
              </View>
            ))}
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
  cabecalhoSecao: {
    marginBottom: 14,
    marginTop: 3,
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
    padding: 18,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#E5EAE2",
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
    padding: 13,
  },
  label: {
    fontSize: 12,
    color: "#788278",
    flexShrink: 1,
    marginRight: 8,
  },
  valor: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2F5D3A",
  },
  cardArea: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5EAE2",
  },
  topoArea: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  indicadorArea: {
    width: 4,
    height: 25,
    borderRadius: 4,
    backgroundColor: "#A8C69F",
    marginRight: 12,
  },
  areaNome: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#244D31",
  },
  linhaMedicao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF0EB",
  },
  ultimaLinha: {
    borderBottomWidth: 0,
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
    textAlign: "center",
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

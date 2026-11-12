import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import type { Ponto } from "../services/pontos-storage";

import {
  buscarPontosFirestore,
  excluirPontoFirestore,
} from "../../backend/services/firebase/pontos-service";

type Ordem = "recentes" | "antigos";

export default function MissoesScreen() {
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ordem, setOrdem] = useState<Ordem>("recentes");

  const carregarPontos = useCallback(async () => {
    try {
      setCarregando(true);
      const resultado = await buscarPontosFirestore();
      setPontos(resultado);
    } catch (erro) {
      console.error("Erro ao carregar pontos:", erro);
      Alert.alert("Erro", "Não foi possível carregar os pontos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarPontos();
    }, [carregarPontos]),
  );

  const pontosOrdenados = [...pontos].sort((a, b) => {
    const dataA = new Date(a.dataCadastro).getTime();
    const dataB = new Date(b.dataCadastro).getTime();

    return ordem === "recentes" ? dataB - dataA : dataA - dataB;
  });

  function voltarDashboard() {
    router.replace("/dashboard");
  }

  function abrirCadastro() {
    router.push("/ponto-cadastro");
  }

  function abrirDetalhes(ponto: Ponto) {
    router.push({
      pathname: "/ponto-detalhes",
      params: {
        area: ponto.area,
        pontoId: ponto.id,
        origem: "cadastro",
      },
    });
  }

  async function confirmarExclusao(ponto: Ponto) {
    const excluir = async () => {
      try {
        await excluirPontoFirestore(ponto.id);
        await carregarPontos();

        if (Platform.OS === "web") {
          window.alert("Ponto excluído com sucesso!");
        } else {
          Alert.alert("Ponto excluído", "O ponto foi removido do cadastro.");
        }
      } catch (erro) {
        console.error("Erro ao excluir ponto:", erro);

        if (Platform.OS === "web") {
          window.alert("Não foi possível excluir o ponto.");
        } else {
          Alert.alert(
            "Erro",
            "Não foi possível excluir o ponto. Tente novamente.",
          );
        }
      }
    };

    if (Platform.OS === "web") {
      const confirmou = window.confirm(
        `Deseja realmente excluir o ponto "${ponto.nome}" (${ponto.id})?`,
      );

      if (confirmou) {
        await excluir();
      }
    } else {
      Alert.alert(
        "Excluir ponto",
        `Tem certeza que deseja excluir o ponto "${ponto.nome}" (${ponto.id})?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: excluir,
          },
        ],
      );
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <TouchableOpacity onPress={voltarDashboard}>
          <Text style={styles.voltar}>← Voltar ao Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.cabecalho}>
          <View style={styles.cabecalhoTexto}>
            <Text style={styles.titulo}>Cadastro de Pontos</Text>
            <Text style={styles.subtitulo}>
              Gerencie os pontos cadastrados na propriedade.
            </Text>
          </View>

          <TouchableOpacity style={styles.botaoNovo} onPress={abrirCadastro}>
            <Text style={styles.textoBotaoNovo}>+ Novo ponto</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resumo}>
          <Text style={styles.total}>{pontos.length}</Text>
          <Text style={styles.resumoTexto}>Pontos cadastrados</Text>
        </View>

        <Text style={styles.tituloSecao}>Pontos da propriedade</Text>

        <View style={styles.ordenacao}>
          <Text style={styles.textoOrdenacao}>Ordenar por:</Text>

          <View style={styles.opcoesOrdenacao}>
            <TouchableOpacity
              style={[styles.opcao, ordem === "recentes" && styles.opcaoAtiva]}
              onPress={() => setOrdem("recentes")}
            >
              <Text
                style={[
                  styles.textoOpcao,
                  ordem === "recentes" && styles.textoOpcaoAtiva,
                ]}
              >
                Mais recentes
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.opcao, ordem === "antigos" && styles.opcaoAtiva]}
              onPress={() => setOrdem("antigos")}
            >
              <Text
                style={[
                  styles.textoOpcao,
                  ordem === "antigos" && styles.textoOpcaoAtiva,
                ]}
              >
                Mais antigos
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {carregando ? (
          <View style={styles.cardVazio}>
            <Text style={styles.mensagem}>Carregando pontos...</Text>
          </View>
        ) : pontosOrdenados.length === 0 ? (
          <View style={styles.cardVazio}>
            <Text style={styles.vazioTitulo}>Nenhum ponto cadastrado</Text>
            <Text style={styles.mensagem}>
              Clique em Novo ponto para cadastrar o primeiro local.
            </Text>
          </View>
        ) : (
          pontosOrdenados.map((ponto) => (
            <View key={ponto.id} style={styles.pontoCard}>
              <TouchableOpacity onPress={() => abrirDetalhes(ponto)}>
                <View style={styles.topoPonto}>
                  <View style={styles.identificacao}>
                    <Text style={styles.nomePonto}>{ponto.nome}</Text>
                    <Text style={styles.idPonto}>{ponto.id}</Text>
                  </View>

                  <Text style={styles.seta}>→</Text>
                </View>

                <View style={styles.divisor} />

                <Text style={styles.area}>Área: {ponto.area}</Text>

                {!!ponto.descricao && (
                  <Text style={styles.descricao}>{ponto.descricao}</Text>
                )}

                <Text style={styles.data}>
                  Cadastrado em:{" "}
                  {new Date(ponto.dataCadastro).toLocaleDateString("pt-BR")}
                </Text>

                <Text style={styles.detalhes}>Ver detalhes do ponto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoExcluir}
                onPress={() => confirmarExclusao(ponto)}
              >
                <Text style={styles.textoBotaoExcluir}>Excluir ponto</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F6F2",
  },
  conteudo: {
    width: "90%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingTop: 25,
    paddingBottom: 45,
  },
  voltar: {
    color: "#287A50",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 28,
  },
  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 15,
    marginBottom: 25,
  },
  cabecalhoTexto: {
    flex: 1,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#174B35",
  },
  subtitulo: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
  },
  botaoNovo: {
    backgroundColor: "#287A50",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 9,
  },
  textoBotaoNovo: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  resumo: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 30,
  },
  total: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#174B35",
  },
  resumoTexto: {
    fontSize: 14,
    color: "#667085",
    marginTop: 3,
  },
  tituloSecao: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#26382E",
    marginBottom: 15,
  },
  ordenacao: {
    marginBottom: 16,
  },
  textoOrdenacao: {
    fontSize: 13,
    color: "#667085",
    marginBottom: 9,
  },
  opcoesOrdenacao: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  opcao: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D5DDD7",
    backgroundColor: "#FFF",
  },
  opcaoAtiva: {
    backgroundColor: "#287A50",
    borderColor: "#287A50",
  },
  textoOpcao: {
    color: "#526170",
    fontSize: 13,
    fontWeight: "600",
  },
  textoOpcaoAtiva: {
    color: "#FFF",
  },
  pontoCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  topoPonto: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  identificacao: {
    flex: 1,
  },
  nomePonto: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#174B35",
  },
  idPonto: {
    fontSize: 13,
    color: "#888",
    marginTop: 5,
  },
  seta: {
    fontSize: 25,
    color: "#287A50",
  },
  divisor: {
    height: 1,
    backgroundColor: "#E8E8E8",
    marginVertical: 14,
  },
  area: {
    fontSize: 14,
    color: "#526170",
  },
  descricao: {
    fontSize: 14,
    color: "#718096",
    marginTop: 8,
  },
  data: {
    fontSize: 12,
    color: "#888",
    marginTop: 10,
  },
  detalhes: {
    fontSize: 13,
    color: "#287A50",
    fontWeight: "600",
    marginTop: 15,
  },
  botaoExcluir: {
    backgroundColor: "#FCE8E8",
    borderWidth: 1,
    borderColor: "#E7B5B5",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  textoBotaoExcluir: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "600",
  },
  cardVazio: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  vazioTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#174B35",
    marginBottom: 8,
  },
  mensagem: {
    fontSize: 14,
    color: "#667085",
    lineHeight: 21,
  },
});

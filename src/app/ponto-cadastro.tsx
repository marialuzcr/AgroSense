import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { TipoPonto, Ponto } from "../services/pontos-storage";

import {
  buscarPontosFirestore,
  cadastrarPonto as cadastrarPontoFirestore,
} from "../../backend/services/firebase/pontos-service";

const AREAS = ["Norte", "Sul", "Leste", "Oeste"];

const PREFIXOS: { [key: string]: string } = {
  Norte: "NORTE",
  Sul: "SUL",
  Leste: "LESTE",
  Oeste: "OESTE",
};

export default function PontoCadastroScreen() {
  const params = useLocalSearchParams();

  const areaParam = Array.isArray(params.area) ? params.area[0] : params.area;

  const [area, setArea] = useState(String(areaParam ?? ""));
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoPonto>("fixo");
  const [cadastrando, setCadastrando] = useState(false);

  function voltarCadastro() {
    router.replace("/missoes");
  }

  async function cadastrarPonto() {
    if (!area) {
      Alert.alert("Atenção", "Selecione uma área.");
      return;
    }

    if (!nome.trim()) {
      Alert.alert("Atenção", "Informe o nome do ponto.");
      return;
    }

    if (!descricao.trim()) {
      Alert.alert("Atenção", "Informe uma descrição para o ponto.");
      return;
    }

    if (cadastrando) return;

    try {
      setCadastrando(true);

      const pontosExistentes = await buscarPontosFirestore();

      const numerosExistentes = pontosExistentes
        .filter((ponto) => ponto.area === area)
        .map((ponto) => {
          const resultado = ponto.id.match(/-(\d+)$/);
          return resultado ? Number(resultado[1]) : 0;
        });

      const proximoNumero =
        numerosExistentes.length > 0 ? Math.max(...numerosExistentes) + 1 : 1;

      const prefixo = PREFIXOS[area] || "PONTO";
      const identificacao = `${prefixo}-${String(proximoNumero).padStart(2, "0")}`;

      const novoPonto: Ponto = {
        id: identificacao,
        area,
        nome: nome.trim(),
        descricao: descricao.trim(),
        dataCadastro: new Date().toISOString(),
        tipo,
      };

      await cadastrarPontoFirestore(novoPonto);

      Alert.alert(
        "Cadastro realizado!",
        `O ponto ${nome.trim()} foi salvo como ${tipo === "fixo" ? "fixo" : "móvel"}, com a identificação ${identificacao}.`,
      );

      router.replace("/missoes");
    } catch (erro) {
      console.error("Erro ao cadastrar ponto:", erro);

      Alert.alert(
        "Erro no cadastro",
        "Não foi possível salvar o ponto. Tente novamente.",
      );
    } finally {
      setCadastrando(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.botaoVoltar} onPress={voltarCadastro}>
          <Text style={styles.seta}>←</Text>
          <Text style={styles.textoVoltar}>Voltar ao Cadastro de Pontos</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Cadastrar ponto</Text>

        <Text style={styles.subtitle}>
          Cadastre um local de coleta dentro da propriedade.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Selecione a área</Text>

          <View style={styles.areas}>
            {AREAS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.areaOpcao,
                  area === item && styles.areaSelecionada,
                ]}
                onPress={() => setArea(item)}
              >
                <Text
                  style={[
                    styles.areaTexto,
                    area === item && styles.areaTextoSelecionado,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divisor} />

          <Text style={styles.label}>Tipo de ponto</Text>

          <View style={styles.tipos}>
            <TouchableOpacity
              style={[
                styles.tipoOpcao,
                tipo === "fixo" && styles.tipoSelecionado,
              ]}
              onPress={() => setTipo("fixo")}
            >
              <Text
                style={[
                  styles.tipoTitulo,
                  tipo === "fixo" && styles.tipoTextoSelecionado,
                ]}
              >
                Ponto fixo
              </Text>

              <Text
                style={[
                  styles.tipoDescricao,
                  tipo === "fixo" && styles.tipoTextoSelecionado,
                ]}
              >
                Local permanente com histórico de medições.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tipoOpcao,
                tipo === "movel" && styles.tipoSelecionado,
              ]}
              onPress={() => setTipo("movel")}
            >
              <Text
                style={[
                  styles.tipoTitulo,
                  tipo === "movel" && styles.tipoTextoSelecionado,
                ]}
              >
                Ponto móvel
              </Text>

              <Text
                style={[
                  styles.tipoDescricao,
                  tipo === "movel" && styles.tipoTextoSelecionado,
                ]}
              >
                Local que pode mudar a cada coleta.
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divisor} />

          <Text style={styles.label}>Nome do ponto</Text>

          <TextInput
            style={styles.input}
            placeholder="Ex.: Ponto 13"
            placeholderTextColor="#999"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>Descrição do local</Text>

          <TextInput
            style={[styles.input, styles.inputDescricao]}
            placeholder="Ex.: Próximo à entrada da plantação"
            placeholderTextColor="#999"
            value={descricao}
            onChangeText={setDescricao}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.observacao}>
            Utilize uma descrição que ajude o operador a identificar o local
            onde deverá posicionar o drone.
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.botaoCadastrar,
            cadastrando && styles.botaoDesabilitado,
          ]}
          onPress={cadastrarPonto}
          disabled={cadastrando}
        >
          <Text style={styles.textoBotao}>
            {cadastrando ? "Salvando..." : "Cadastrar ponto"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F2",
  },
  content: {
    width: "90%",
    maxWidth: 700,
    alignSelf: "center",
    paddingVertical: 25,
    paddingBottom: 40,
  },
  botaoVoltar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  seta: {
    fontSize: 28,
    color: "#2F5D3A",
    marginRight: 8,
  },
  textoVoltar: {
    fontSize: 15,
    color: "#2F5D3A",
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2F5D3A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 22,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 9,
    marginTop: 15,
  },
  areas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  areaOpcao: {
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 8,
    paddingVertical: 11,
    paddingHorizontal: 17,
    backgroundColor: "#FAFAFA",
  },
  areaSelecionada: {
    backgroundColor: "#2F5D3A",
    borderColor: "#2F5D3A",
  },
  areaTexto: {
    color: "#444",
    fontWeight: "600",
  },
  areaTextoSelecionado: {
    color: "#FFF",
  },
  tipos: {
    gap: 10,
  },
  tipoOpcao: {
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 8,
    padding: 14,
    backgroundColor: "#FAFAFA",
  },
  tipoSelecionado: {
    backgroundColor: "#2F5D3A",
    borderColor: "#2F5D3A",
  },
  tipoTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 5,
  },
  tipoDescricao: {
    fontSize: 13,
    color: "#666",
    lineHeight: 19,
  },
  tipoTextoSelecionado: {
    color: "#FFF",
  },
  divisor: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 15,
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#DADADA",
    borderRadius: 8,
    padding: 13,
    fontSize: 15,
    color: "#333",
  },
  inputDescricao: {
    height: 100,
  },
  observacao: {
    fontSize: 12,
    color: "#888",
    lineHeight: 18,
    marginTop: 10,
  },
  botaoCadastrar: {
    backgroundColor: "#2F5D3A",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  botaoDesabilitado: {
    opacity: 0.6,
  },
  textoBotao: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

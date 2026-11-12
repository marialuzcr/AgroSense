import { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";
import { buscarLeiturasFirestore } from "../../backend/services/firebase/leituras-service";
import type { Leitura } from "../data/leituras";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../backend/services/firebase";

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [ultimaLeitura, setUltimaLeitura] = useState<Leitura | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const cancelarObservacao = onAuthStateChanged(auth, async (usuario) => {
      if (!usuario) {
        setNomeUsuario("");
        return;
      }

      try {
        const referencia = doc(db, "usuarios", usuario.uid);
        const resultado = await getDoc(referencia);

        if (resultado.exists()) {
          setNomeUsuario(resultado.data().nome || "");
        }
      } catch (erro) {
        console.error("Erro ao buscar nome do usuário:", erro);
      }
    });

    return cancelarObservacao;
  }, []);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const leituras = await buscarLeiturasFirestore();
      const ordenadas = [...leituras].sort(
        (a, b) =>
          new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime(),
      );

      setUltimaLeitura(ordenadas[0] ?? null);
    } catch (erro) {
      console.error("Erro ao carregar medições:", erro);
      setUltimaLeitura(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados]),
  );

  const formatarData = (data: string) => new Date(data).toLocaleString("pt-BR");

  const dados = ultimaLeitura
    ? [
        { nome: "Temperatura", valor: `${ultimaLeitura.temperatura} °C` },
        { nome: "Umidade", valor: `${ultimaLeitura.umidade} %` },
        { nome: "Nitrogênio (N)", valor: `${ultimaLeitura.nitrogenio} mg/kg` },
        { nome: "Fósforo (P)", valor: `${ultimaLeitura.fosforo} mg/kg` },
        {
          nome: "Condutividade",
          valor: `${ultimaLeitura.condutividade} mS/cm`,
        },
        { nome: "pH do solo", valor: String(ultimaLeitura.ph) },
        { nome: "Potássio (K)", valor: `${ultimaLeitura.potassio} mg/kg` },
      ]
    : [];

  return (
    <View style={styles.container}>
      {!isMobile && (
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>AgroSense</Text>

          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItemActive}>
              <Text style={styles.menuText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/areas")}
            >
              <Text style={styles.menuText}>Áreas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/medicaoes")}
            >
              <Text style={styles.menuText}>Medições</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/missoes")}
            >
              <Text style={styles.menuText}>Cadastro de Pontos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/historico")}
            >
              <Text style={styles.menuText}>Histórico</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/analise")}
            >
              <Text style={styles.menuText}>Análises</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push("/perfil")}
            >
              <Text style={styles.menuText}>Meu Perfil</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logout}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.menuText}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Olá{nomeUsuario ? `, ${nomeUsuario}` : ""}!
            </Text>
            <Text style={styles.headerSubtitle}>
              Acompanhe os dados recebidos da sua propriedade.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Última medição recebida</Text>

        {carregando ? (
          <View style={styles.vazio}>
            <Text style={styles.mensagem}>Carregando dados...</Text>
          </View>
        ) : !ultimaLeitura ? (
          <View style={styles.vazio}>
            <Text style={styles.vazioTitulo}>Nenhuma medição recebida</Text>
            <Text style={styles.mensagem}>
              Quando os sensores enviarem os primeiros dados, os resultados
              aparecerão aqui.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoLeitura}>
              <Text style={styles.infoTexto}>
                Ponto: {ultimaLeitura.pontoId}
              </Text>
              <Text style={styles.infoTexto}>Área: {ultimaLeitura.area}</Text>
              <Text style={styles.infoTexto}>
                Data: {formatarData(ultimaLeitura.dataHora)}
              </Text>
            </View>

            <View style={styles.cardsContainer}>
              {dados.map((dado) => (
                <View
                  key={dado.nome}
                  style={[
                    styles.card,
                    isMobile ? styles.cardMobile : styles.cardDesktop,
                  ]}
                >
                  <Text style={styles.cardTitle}>{dado.nome}</Text>
                  <Text style={styles.cardValue}>{dado.valor}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F3F6F2",
  },
  sidebar: {
    width: 230,
    backgroundColor: "#174B35",
    paddingTop: 35,
    paddingHorizontal: 18,
  },
  sidebarTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  menu: {
    marginTop: 50,
    gap: 10,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: "#2F7655",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  menuText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  logout: {
    marginTop: "auto",
    marginBottom: 30,
    padding: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 25,
    paddingBottom: 40,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    marginBottom: 25,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#174B35",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 5,
  },
  acoes: {
    gap: 12,
    marginBottom: 28,
  },
  acaoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  acaoTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#174B35",
    marginBottom: 5,
  },
  acaoDescricao: {
    fontSize: 14,
    color: "#666",
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 15,
  },
  vazio: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 24,
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
    color: "#666",
    lineHeight: 21,
  },
  infoLeitura: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
  },
  infoTexto: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    minHeight: 110,
    justifyContent: "center",
  },
  cardMobile: {
    width: "100%",
  },
  cardDesktop: {
    width: "31%",
  },
  cardTitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#174B35",
  },
  mobileMenu: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 20,
    paddingVertical: 16,
  },
  mobileMenuText: {
    fontSize: 12,
    color: "#174B35",
    fontWeight: "600",
  },
});

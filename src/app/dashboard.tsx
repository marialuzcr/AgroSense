import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../backend/services/firebase";
import { buscarLeiturasFirestore } from "../../backend/services/firebase/leituras-service";
import type { Leitura } from "../data/leituras";

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
        {
          nome: "Temperatura",
          valor: `${ultimaLeitura.temperatura} °C`,
          unidade: "Temperatura do solo",
        },
        {
          nome: "Umidade",
          valor: `${ultimaLeitura.umidade} %`,
          unidade: "Umidade do solo",
        },
        {
          nome: "Nitrogênio (N)",
          valor: `${ultimaLeitura.nitrogenio} mg/kg`,
          unidade: "Nutriente do solo",
        },
        {
          nome: "Fósforo (P)",
          valor: `${ultimaLeitura.fosforo} mg/kg`,
          unidade: "Nutriente do solo",
        },
        {
          nome: "Condutividade",
          valor: `${ultimaLeitura.condutividade} mS/cm`,
          unidade: "Condutividade elétrica",
        },
        {
          nome: "pH do solo",
          valor: String(ultimaLeitura.ph),
          unidade: "Acidez do solo",
        },
        {
          nome: "Potássio (K)",
          valor: `${ultimaLeitura.potassio} mg/kg`,
          unidade: "Nutriente do solo",
        },
      ]
    : [];

  const menu = [
    { nome: "Dashboard", rota: "/dashboard" as const },
    { nome: "Áreas", rota: "/areas" as const },
    { nome: "Medições", rota: "/medicaoes" as const },
    { nome: "Cadastro de Pontos", rota: "/missoes" as const },
    { nome: "Histórico", rota: "/historico" as const },
    { nome: "Análises", rota: "/analise" as const },
    { nome: "Meu Perfil", rota: "/perfil" as const },
  ];

  return (
    <View style={styles.container}>
      {!isMobile && (
        <View style={styles.sidebar}>
          <View>
            <View style={styles.brandArea}>
              <Text style={styles.sidebarTitle}>AGROSENSE</Text>
              <Text style={styles.sidebarSubtitle}>MONITORAMENTO AGRÍCOLA</Text>
            </View>

            <Text style={styles.menuLabel}>MENU PRINCIPAL</Text>

            <View style={styles.menu}>
              {menu.map((item, index) => (
                <TouchableOpacity
                  key={item.rota}
                  style={index === 0 ? styles.menuItemActive : styles.menuItem}
                  onPress={() => {
                    if (index !== 0) router.push(item.rota);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={
                      index === 0 ? styles.menuTextActive : styles.menuText
                    }
                  >
                    {item.nome}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.logout}
            onPress={async () => {
              try {
                await signOut(auth);
                router.replace("/login");
              } catch (erro) {
                console.error("Erro ao sair da conta:", erro);
              }
            }}
          >
            <Text style={styles.menuText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.mobileContent,
        ]}
      >
        <View style={styles.topHeader}>
          <View style={styles.headerTextArea}>
            <Text style={styles.greeting}>
              Olá{nomeUsuario ? `, ${nomeUsuario}` : ""}!
            </Text>
            <Text style={styles.headerSubtitle}>
              Bem-vindo ao seu painel de monitoramento.
            </Text>
          </View>
        </View>

        <View style={styles.welcomeCard}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeLabel}>PAINEL DE CONTROLE</Text>
            <Text style={styles.welcomeTitle}>Acompanhe sua propriedade</Text>
            <Text style={styles.welcomeDescription}>
              Consulte os dados das medições e acompanhe as condições do solo.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Última medição recebida</Text>
            <Text style={styles.sectionSubtitle}>
              Dados mais recentes registrados no sistema
            </Text>
          </View>
        </View>

        {carregando ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="large" color="#2F5D3A" />
            <Text style={styles.message}>Carregando dados...</Text>
          </View>
        ) : !ultimaLeitura ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhuma medição recebida</Text>
            <Text style={styles.message}>
              Quando os sensores enviarem os primeiros dados, os resultados
              aparecerão aqui.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.measurementInfo}>
              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>PONTO</Text>
                <Text style={styles.infoValue}>{ultimaLeitura.pontoId}</Text>
              </View>

              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>ÁREA</Text>
                <Text style={styles.infoValue}>{ultimaLeitura.area}</Text>
              </View>

              <View style={styles.infoBlock}>
                <Text style={styles.infoLabel}>DATA DA MEDIÇÃO</Text>
                <Text style={styles.infoValue}>
                  {formatarData(ultimaLeitura.dataHora)}
                </Text>
              </View>
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
                  <View style={styles.cardAccent} />
                  <Text style={styles.cardTitle}>{dado.nome}</Text>
                  <Text style={styles.cardValue}>{dado.valor}</Text>
                  <Text style={styles.cardDescription}>{dado.unidade}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {isMobile && (
          <View style={styles.mobileNavigation}>
            <Text style={styles.mobileNavigationTitle}>NAVEGAÇÃO</Text>
            <View style={styles.mobileNavigationGrid}>
              {menu.map((item, index) => (
                <TouchableOpacity
                  key={item.rota}
                  style={
                    index === 0
                      ? styles.mobileMenuItemActive
                      : styles.mobileMenuItem
                  }
                  onPress={() => {
                    if (index !== 0) router.push(item.rota);
                  }}
                >
                  <Text
                    style={
                      index === 0
                        ? styles.mobileMenuTextActive
                        : styles.mobileMenuText
                    }
                  >
                    {item.nome}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.mobileMenuItem}
                onPress={async () => {
                  try {
                    await signOut(auth);
                    router.replace("/login");
                  } catch (erro) {
                    console.error("Erro ao sair da conta:", erro);
                  }
                }}
              >
                <Text style={styles.mobileMenuText}>Sair da conta</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.footer}>
          AGROSENSE • SISTEMA DE MONITORAMENTO AGRÍCOLA
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F2F5EF",
  },
  sidebar: {
    width: 245,
    backgroundColor: "#244D31",
    paddingTop: 30,
    paddingHorizontal: 17,
    paddingBottom: 15,
    justifyContent: "space-between",
  },
  brandArea: {
    alignItems: "center",
    paddingBottom: 10,
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },
  logoText: {
    color: "#2F5D3A",
    fontSize: 31,
    fontWeight: "800",
  },
  sidebarTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  sidebarSubtitle: {
    color: "#C6D9C5",
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 5,
  },
  menuLabel: {
    color: "#B9CEB9",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 28,
    marginBottom: 12,
    marginLeft: 10,
  },
  menu: {
    gap: 7,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  menuItemActive: {
    backgroundColor: "#3D7049",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderLeftWidth: 3,
    borderLeftColor: "#C5DDBB",
  },
  menuText: {
    color: "#E0EADF",
    fontSize: 13,
    fontWeight: "500",
  },
  menuTextActive: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  logout: {
    borderTopWidth: 1,
    borderTopColor: "#46694E",
    paddingTop: 18,
    paddingHorizontal: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 30,
    paddingBottom: 40,
    maxWidth: 1250,
    width: "100%",
    alignSelf: "center",
  },
  mobileContent: {
    padding: 18,
    paddingTop: 25,
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 25,
  },
  headerTextArea: {
    flex: 1,
  },
  greeting: {
    fontSize: 27,
    fontWeight: "800",
    color: "#244D31",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#788477",
    marginTop: 5,
  },
  profileButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE5D9",
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  profileButtonText: {
    color: "#2F5D3A",
    fontSize: 12,
    fontWeight: "700",
  },
  welcomeCard: {
    backgroundColor: "#244D31",
    borderRadius: 17,
    padding: 24,
    marginBottom: 30,
    overflow: "hidden",
    minHeight: 150,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeLabel: {
    color: "#BBD3B8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  welcomeTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  welcomeDescription: {
    color: "#E0EADF",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 500,
  },
  welcomeDecoration: {
    width: 85,
    height: 85,
    borderRadius: 27,
    backgroundColor: "#3A6744",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  welcomeLetter: {
    color: "#D5E6D1",
    fontSize: 52,
    fontWeight: "800",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#263F2D",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#849082",
    marginTop: 5,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 28,
    borderWidth: 1,
    borderColor: "#E3EAE0",
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2F5D3A",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    color: "#7A8578",
    lineHeight: 21,
    textAlign: "center",
    marginTop: 12,
  },
  measurementInfo: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E3EAE0",
    padding: 18,
    marginBottom: 17,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  infoBlock: {
    flex: 1,
    minWidth: 130,
  },
  infoLabel: {
    color: "#899486",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  infoValue: {
    color: "#2F5D3A",
    fontSize: 14,
    fontWeight: "700",
  },
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 13,
    padding: 19,
    minHeight: 130,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E3EAE0",
    overflow: "hidden",
  },
  cardMobile: {
    width: "100%",
  },
  cardDesktop: {
    width: "31%",
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#A8C69F",
  },
  cardTitle: {
    fontSize: 13,
    color: "#788477",
    fontWeight: "600",
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 23,
    fontWeight: "800",
    color: "#244D31",
  },
  cardDescription: {
    color: "#9AA396",
    fontSize: 11,
    marginTop: 7,
  },
  mobileNavigation: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginTop: 25,
    borderWidth: 1,
    borderColor: "#E3EAE0",
  },
  mobileNavigationTitle: {
    color: "#788477",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 12,
  },
  mobileNavigationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mobileMenuItem: {
    width: "48%",
    backgroundColor: "#F4F7F2",
    borderRadius: 8,
    padding: 12,
  },
  mobileMenuItemActive: {
    width: "48%",
    backgroundColor: "#E5EFE2",
    borderRadius: 8,
    padding: 12,
  },
  mobileMenuText: {
    color: "#536B55",
    fontSize: 12,
    fontWeight: "600",
  },
  mobileMenuTextActive: {
    color: "#244D31",
    fontSize: 12,
    fontWeight: "800",
  },
  footer: {
    color: "#9AA396",
    fontSize: 9,
    letterSpacing: 0.8,
    textAlign: "center",
    marginTop: 30,
  },
});

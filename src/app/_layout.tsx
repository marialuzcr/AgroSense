import { Stack, router, useSegments } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { auth } from "../../backend/services/firebase";

export default function RootLayout() {
  const [verificandoLogin, setVerificandoLogin] = useState(true);
  const [usuarioConectado, setUsuarioConectado] = useState(false);

  const segmentos = useSegments();

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, (usuario) => {
      setUsuarioConectado(!!usuario);
      setVerificandoLogin(false);
    });

    return cancelar;
  }, []);

  useEffect(() => {
    if (verificandoLogin) return;

    const telaAtual = segmentos[0];

    const telasPublicas = ["login", "cadastro", "index"];
    const estaEmTelaPublica = telasPublicas.includes(telaAtual);

    if (!usuarioConectado && !estaEmTelaPublica) {
      router.replace("/login");
    }

    if (usuarioConectado && estaEmTelaPublica) {
      router.replace("/dashboard");
    }
  }, [verificandoLogin, usuarioConectado, segmentos]);

  if (verificandoLogin) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F2F5EF",
        }}
      >
        <ActivityIndicator size="large" color="#2F5D3A" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />

      <Stack.Screen name="areas" options={{ headerShown: false }} />
      <Stack.Screen name="area-detalhes" options={{ headerShown: false }} />

      <Stack.Screen name="missoes" options={{ headerShown: false }} />
      <Stack.Screen name="ponto-cadastro" options={{ headerShown: false }} />
      <Stack.Screen name="ponto-detalhes" options={{ headerShown: false }} />
      <Stack.Screen name="cadastro" options={{ headerShown: false }} />

      <Stack.Screen name="medicaoes" options={{ headerShown: false }} />
      <Stack.Screen name="medicao-detalhes" options={{ headerShown: false }} />

      <Stack.Screen name="analise" options={{ headerShown: false }} />
      <Stack.Screen name="historico" options={{ headerShown: false }} />
      <Stack.Screen name="missao-detalhes" options={{ headerShown: false }} />
    </Stack>
  );
}

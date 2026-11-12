import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />

      {/* Áreas e dados recebidos */}
      <Stack.Screen name="areas" options={{ headerShown: false }} />
      <Stack.Screen name="area-detalhes" options={{ headerShown: false }} />

      {/* Cadastro de pontos */}
      <Stack.Screen name="missoes" options={{ headerShown: false }} />
      <Stack.Screen name="ponto-cadastro" options={{ headerShown: false }} />
      <Stack.Screen name="ponto-detalhes" options={{ headerShown: false }} />

      {/* Medições */}
      <Stack.Screen name="medicaoes" options={{ headerShown: false }} />
      <Stack.Screen name="medicao-detalhes" options={{ headerShown: false }} />

      {/* Demais telas */}
      <Stack.Screen name="analise" options={{ headerShown: false }} />
      <Stack.Screen name="historico" options={{ headerShown: false }} />
      <Stack.Screen name="missao-detalhes" options={{ headerShown: false }} />
    </Stack>
  );
}

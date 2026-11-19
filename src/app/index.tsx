import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      if (event.key === "Enter") {
        router.push("/login");
      }
    }

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>MONITORAMENTO AGRÍCOLA</Text>

        <Text style={styles.subtitle}>
          Sistema de Monitoramento{"\n"}
          de Solo
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("/login");
          }}
        >
          <Text style={styles.buttonText}>ENTRAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7F2",
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    width: "90%",
    maxWidth: 500,
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#2F5D3A",
    marginBottom: 20,
  },

  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#555",
    marginBottom: 40,
  },

  button: {
    width: "80%",
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: "#2F5D3A",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

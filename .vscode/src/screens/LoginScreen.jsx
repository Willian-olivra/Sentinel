import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState("");

  function handleLogin() {
    // Por enquanto só navega para o mapa
    navigation.navigate("Mapa", { username });
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Digite seu nome"
        value={username}
        onChangeText={setUsername}
      />
      <Button title="Entrar" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  input: { borderWidth: 1, marginBottom: 20, padding: 10, borderRadius: 8 },
});

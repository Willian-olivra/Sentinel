import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Alert,
  Pressable,
  SafeAreaView,
} from "react-native";
import Animated, {
  withDelay,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

// --- Configuração do Botão ---
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CONFIG = {
  duration: 1200,
  overshootClamping: true,
  dampingRatio: 0.8,
};

const OFFSET = 60;

// --- Componente do Botão Flutuante (Sub-botão) ---
const FloatingActionButton = ({ isExpanded, index, buttonLetter }) => {
  const animatedStyles = useAnimatedStyle(() => {
    const moveValue = isExpanded.value ? OFFSET * index : 0;
    const translateValue = withSpring(-moveValue, SPRING_CONFIG);
    const delay = index * 100;

    const scaleValue = isExpanded.value ? 1 : 0;

    return {
      transform: [
        { translateY: translateValue },
        {
          scale: withDelay(delay, withTiming(scaleValue)),
        },
      ],
    };
  });

  return (
    <AnimatedPressable style={[animatedStyles, styles.shadow, styles.button]}>
      <Animated.Text style={styles.content}>{buttonLetter}</Animated.Text>
    </AnimatedPressable>
  );
};

// --- Tipo de Dados do Mapa ---
type Player = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  team: string;
  role: string;
};

// --- Componente Principal (Mapa + Botão) ---
export default function App() {
  // --- States e Refs do Mapa ---
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const mapRef = useRef<MapView>(null);

  // --- Shared Values e Handlers do Botão ---
  const isExpanded = useSharedValue(false);

  const handlePress = () => {
    isExpanded.value = !isExpanded.value;
  };

  const plusIconStyle = useAnimatedStyle(() => {
    const moveValue = interpolate(Number(isExpanded.value), [0, 1], [0, 2]);
    const translateValue = withTiming(moveValue);
    const rotateValue = isExpanded.value ? "45deg" : "0deg";

    return {
      transform: [
        { translateX: translateValue },
        { rotate: withTiming(rotateValue) },
      ],
    };
  });

  // --- Lógica do Mapa (useEffect) ---
  useEffect(() => {
    let subscription: any;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Não foi possível acessar sua localização.");
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      const mockPlayers = createMockPlayers(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
      setPlayers(mockPlayers);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 2,
        },
        (newLocation) => {
          setLocation(newLocation);
          // Não vamos mais centrar a câmera automaticamente para
          // que o usuário possa navegar livremente.
          // mapRef.current?.animateCamera({
          //   center: {
          //     latitude: newLocation.coords.latitude,
          //     longitude: newLocation.coords.longitude,
          //   },
          //   zoom: 18.5,
          // });
        }
      );

      setLoading(false);
    })();

    return () => {
      if (subscription) subscription.remove();
    };
  }, []);

  // --- Funções Auxiliares do Mapa ---
  const createMockPlayers = (lat: number, lon: number): Player[] => {
    return [
      {
        id: "1",
        name: "Sniper Alpha",
        latitude: lat + 0.0005,
        longitude: lon + 0.0005,
        team: "Alpha",
        role: "sniper",
      },
      // ...outros jogadores
    ];
  };

  const getAlphaIcon = (role: string) => {
    // Retorna o 'require' apropriado...
    // (O teu código original para 'require' está correto,
    // mas não posso incluí-lo aqui pois não tenho os 'assets')
    // Ex: return require("../../assets/icons/alpha/sniper.png");
    return null; // Placeholder
  };

  const getBravoIcon = (role: string) => {
    // Retorna o 'require' apropriado...
    return null; // Placeholder
  };

  // --- Lógica de Renderização ---

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  // Nota: Não mostramos "loading" se a localização for nula,
  // apenas renderizamos o mapa (ele vai centrar em 0,0 por defeito)
  // e o botão.

  return (
    <SafeAreaView style={styles.container}>
      {/* CAMADA 1: O MAPA
        Ocupa todo o espaço disponível e fica no fundo.
      */}
      <MapView
        ref={mapRef}
        style={styles.map} // <-- Estilo chave!
        initialRegion={
          location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : undefined // Deixa o MapView decidir se a localização for nula
        }
        showsUserLocation
      >
        {/* Marcadores de outros jogadores */}
        {players.map((player) => (
          <Marker
            key={player.id}
            coordinate={{
              latitude: player.latitude,
              longitude: player.longitude,
            }}
            title={`${player.name} (${player.role})`}
            // image={ ... } (Removido por enquanto, pois os 'assets' não estão disponíveis)
          />
        ))}

        {/* Marcador do próprio jogador (se a localização existir) */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Você"
            pinColor="blue"
          />
        )}
      </MapView>

      {/* CAMADA 2: O BOTÃO FLUTUANTE
        Renderizado DEPOIS do mapa, com 'position: absolute',
        ele flutua por cima.
      */}
      <View style={styles.buttonContainer}>
        <AnimatedPressable
          onPress={handlePress}
          style={[styles.shadow, mainButtonStyles.button]}
        >
          <Animated.Text style={[plusIconStyle, mainButtonStyles.content]}>
            +
          </Animated.Text>
        </AnimatedPressable>

        <FloatingActionButton
          isExpanded={isExpanded}
          index={1}
          buttonLetter={"M"}
        />
        <FloatingActionButton
          isExpanded={isExpanded}
          index={2}
          buttonLetter={"W"}
        />
        <FloatingActionButton
          isExpanded={isExpanded}
          index={3}
          buttonLetter={"S"}
        />
      </View>
    </SafeAreaView>
  );
}

// --- ESTILOS UNIFICADOS ---

// Estilos do Botão Principal (+)
const mainButtonStyles = StyleSheet.create({
  button: {
    zIndex: 1,
    height: 56,
    width: 56,
    borderRadius: 100,
    backgroundColor: "#b58df1",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    fontSize: 24,
    color: "#f8f9ff",
  },
});

// Estilos Gerais (Mapa, Botões Secundários, Containers)
const styles = StyleSheet.create({
  // NOVO: Container principal para cobrir todo o ecrã
  container: {
    flex: 1,
  },
  // ALTERADO: O mapa agora usa 'absoluteFillObject'
  map: {
    ...StyleSheet.absoluteFillObject, // <-- Preenche todo o container pai
  },
  // (Do teu código do mapa)
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // (Do teu código do botão)
  button: {
    width: 40,
    height: 40,
    backgroundColor: "#82cab2",
    position: "absolute",
    borderRadius: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: -2,
    flexDirection: "row",
  },
  // ALTERADO: Adicionamos 'bottom' e 'right' para posicionar o container
  buttonContainer: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    // --- NOVAS PROPRIEDADES DE POSICIONAMENTO ---
    bottom: 50, // 50px de distância do fundo
    right: 30, // 30px de distância da direita
  },
  // (Do teu código do botão)
  shadow: {
    shadowColor: "#171717",
    shadowOffset: { width: -0.5, height: 3.5 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  // (Do teu código do botão)
  content: {
    color: "#f8f9ff",
    fontWeight: "500",
  },
});
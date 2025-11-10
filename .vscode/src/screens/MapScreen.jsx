import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

export default function MapScreen({ route }) {
  const { username } = route.params;
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      // Solicita permissão
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "O app precisa da sua localização.");
        return;
      }

      // Pega localização inicial
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      // Monitora em tempo real
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // a cada 2 segundos
          distanceInterval: 1, // ou a cada 1 metro
        },
        (newLocation) => {
          setLocation(newLocation.coords);
        }
      );

      // Limpa quando sai da tela
      return () => subscription.remove();
    })();
  }, []);

  if (!location) {
    return <View style={styles.container} />; // Tela vazia até pegar localização
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation={true}
        followsUserLocation={true}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title={username}
          description="Sua posição atual"
          pinColor="blue"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});

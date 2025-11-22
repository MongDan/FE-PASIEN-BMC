import React from "react";
import { View, StyleSheet, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SplashScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Image
        source={require("../assets/HeaderBar.png")}
        style={styles.headerBar}
      />

      {/* Body */}
      <View style={styles.bodyContent}>
        {/* Logo + Teks */}
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/Logo.png")}
            style={styles.logo}
          />
          <View style={styles.textBlock}>
            <Text style={styles.title}>Ruang</Text>
            <Text style={styles.subtitle}>Bunda</Text>
          </View>
        </View>

        {/* Logo Bawah (tanpa jarak ke atas) */}
        <View style={styles.logoBawah}>
          <Image
            source={require("../assets/Kemenkes.png")}
            style={styles.logoKecil}
          />
          <Image
            source={require("../assets/IBI.png")}
            style={styles.logoKecil}
          />
          <Image
            source={require("../assets/BMC.png")}
            style={styles.logoKecil}
          />
        </View>
      </View>

      {/* Footer */}
      <Image
        source={require("../assets/FooterBar.png")}
        style={styles.footerBar}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffffff",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerBar: {
    width: "100%",
    height: 140,
    resizeMode: "cover"
  },
  bodyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: -30
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginRight: 10
  },
  textBlock: {
    justifyContent: "center"
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000000",
    lineHeight: 38
  },
  subtitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2196F3",
    lineHeight: 38
  },
  logoBawah: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  logoKecil: {
    width: 50,
    height: 90,
    resizeMode: "contain",
    marginHorizontal: 15 // sedikit jarak antar logo saja
  },
  footerBar: {
    width: "100%",
    height: 140,
    resizeMode: "cover"
  }
});
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

      {/* Body Content */}
      <View style={styles.bodyContent}>
        <View style={styles.mainWrapper}>
          
          {/* Sisi Kiri: Ruang Bunda */}
          <View style={styles.brandContainer}>
            <Image
              source={require("../assets/Logo.png")}
              style={styles.logoMain}
            />
            <View style={styles.textBlock}>
              <Text style={styles.title}>Ruang</Text>
              <Text style={styles.subtitle}>Bunda</Text>
            </View>
          </View>

          {/* Garis Vertikal (Separator) */}
          <View style={styles.verticalLine} />

          {/* Sisi Kanan: BMC */}
          <View style={styles.bmcContainer}>
            <Image
              source={require("../assets/BMC.png")}
              style={styles.logoKecil}
            />
          </View>
          
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
    backgroundColor: "#FFFFFF",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerBar: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  bodyContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  mainWrapper: {
    flexDirection: "row", 
    alignItems: "center",
    justifyContent: "center",
    width: "100%", 
    paddingHorizontal: 24, 
  },
  // --- SISI KIRI ---
  brandContainer: {
    flex: 1, 
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", 
  },
  logoMain: {
    width: 60, 
    height: 60,
    resizeMode: "contain",
    marginRight: 10, 
  },
  textBlock: {
    justifyContent: "center",
    alignItems: "flex-start", 
  },
  title: {
    fontSize: 20, 
    fontWeight: "bold",
    color: "#333333",
    lineHeight: 22,
    letterSpacing: 0.5, 
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2196F3",
    lineHeight: 22,
    letterSpacing: 0.5,
  },
  // --- GARIS TENGAH ---
  verticalLine: {
    width: 1.5,
    height: 60, 
    backgroundColor: "#E0E0E0", 
    marginHorizontal: 24, 
    borderRadius: 1,
  },
  // --- SISI KANAN ---
  bmcContainer: {
    flex: 1, 
    justifyContent: "center",
    alignItems: "flex-start", 
  },
  logoKecil: {
    width: 85, 
    height: 85,
    resizeMode: "contain",
  },
  footerBar: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
});
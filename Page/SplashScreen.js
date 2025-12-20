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
          
          {/* Sisi Kiri: Ruang Bunda (Ukuran disesuaikan) */}
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
    flexDirection: "row", // Sejajar horizontal
    alignItems: "center",
    justifyContent: "center",
    // Padding horizontal agar tidak terlalu mepet pinggir layar
    paddingHorizontal: 20, 
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", // Merapatkan ke arah garis tengah
  },
  logoMain: {
    width: 75, // DIKECILKAN: Agar tidak terlalu dominan
    height: 75,
    resizeMode: "contain",
    marginRight: 8,
  },
  textBlock: {
    justifyContent: "center",
  },
  title: {
    fontSize: 22, // DIKECILKAN: Menyeimbangkan dengan ikon baru
    fontWeight: "bold",
    color: "#333333", // Warna hitam yang lebih soft (nyaman di mata)
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 22, // DIKECILKAN
    fontWeight: "bold",
    color: "#2196F3",
    lineHeight: 24,
  },
  verticalLine: {
    width: 1.5, // Garis dibuat sedikit lebih tipis agar elegan
    height: 70, // Tinggi disesuaikan dengan elemen di kanan kirinya
    backgroundColor: "#DDDDDD", // Warna abu-abu muda yang modern
    marginHorizontal: 20, // Jarak nafas yang pas
    borderRadius: 1, // Ujung garis sedikit membulat
  },
  bmcContainer: {
    justifyContent: "center",
    alignItems: "center",
    justifyContent: "flex-start", // Merapatkan ke arah garis tengah
  },
  logoKecil: {
    width: 95, // UKURAN PAS: Secara visual seimbang dengan gabungan Ikon+Teks di kiri
    height: 95,
    resizeMode: "contain",
  },
  footerBar: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
});
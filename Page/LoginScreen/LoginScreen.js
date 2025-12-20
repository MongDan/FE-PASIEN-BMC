import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur"; // Pastikan ini sudah terinstal

const CustomAlert = ({ visible, title, message, type, onClose }) => {
  const isError = type === "error";
  const iconName = isError ? "close-circle" : "information-circle";
  const iconColor = isError ? "#F44336" : "#2196F3";

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Ionicons name={iconName} size={60} color={iconColor} style={{ marginBottom: 10 }} />
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: iconColor }]}
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "info" });

  const navigate = useNavigate();

  const showAlert = (title, message, type = "info") => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert("Data Belum Lengkap", "Username dan Password tidak boleh kosong.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`https://restful-api-bmc-production-v2.up.railway.app/api/login-pasien`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Username atau Password salah.");
      
      setIsLoading(false);
      if (data.token) await AsyncStorage.setItem("userToken", data.token);
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); navigate("/home"); }, 1500);
    } catch (error) {
      setIsLoading(false);
      showAlert("Gagal Masuk", error.message, "error");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <CustomAlert 
        visible={alertConfig.visible} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        type={alertConfig.type} 
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })} 
      />

      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <FontAwesome name="check-circle" size={55} color="#4CAF50" />
            <Text style={styles.successTitle}>Login Berhasil</Text>
          </View>
        </View>
      )}

      {/* Header Tetap Di Atas */}
      <View style={styles.header}>
        <Image source={require("../../assets/Logo.png")} style={styles.logo} />
        <View style={styles.textBlock}>
          <Text style={styles.title}>Ruang</Text>
          <Text style={styles.subtitle}>Bunda</Text>
        </View>
      </View>

      {/* Gambar Latar */}
      <View style={styles.imageWrapper}>
        <Image source={require("../../assets/ibu-hamil.png")} style={styles.doctorImage} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* GUNAKAN BLURVIEW DISINI */}
        <BlurView intensity={80} tint="light" style={styles.loginCard}>
          <Text style={styles.loginTitle}>Login</Text>

          <Text style={styles.label}>Username:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#ddd"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <FontAwesome name="user" size={18} color="#fff" />
          </View>

          <Text style={styles.label}>Password:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#ddd"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <FontAwesome name={showPassword ? "eye-slash" : "eye"} size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Login</Text>}
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F6F2" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContainer: { width: "80%", backgroundColor: "white", borderRadius: 20, padding: 25, alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 10 },
  modalMessage: { fontSize: 15, color: "#666", textAlign: "center", marginVertical: 15 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, width: "100%", alignItems: "center" },
  modalButtonText: { color: "white", fontWeight: "bold" },
  successOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  successBox: { width: 250, backgroundColor: "#fff", borderRadius: 20, padding: 25, alignItems: "center" },
  successTitle: { marginTop: 10, fontSize: 18, fontWeight: "bold" },
  header: { flexDirection: "row", alignItems: "center", marginTop: 50, marginLeft: 20, position: 'absolute', top: 0, zIndex: 20 },
  logo: { width: 50, height: 50, marginRight: 8 },
  textBlock: { flexDirection: "column" },
  title: { fontSize: 20, fontWeight: "bold" },
  subtitle: { fontSize: 20, fontWeight: "bold", color: "#2196F3" },
  imageWrapper: { position: "absolute", top: 100, left: 0, right: 0, alignItems: "center" },
  doctorImage: { width: "100%", height: 400, resizeMode: "contain" },
  scrollContent: { flexGrow: 1, justifyContent: "flex-end" },
  loginCard: {
    backgroundColor: "rgba(255, 255, 255, 0.4)", // Transparan agar blur terlihat
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingVertical: 50,
    paddingHorizontal: 30,
    alignItems: "center",
    overflow: "hidden", // Agar isi tidak keluar dari border radius
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  loginTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { alignSelf: "flex-start", marginTop: 15, fontWeight: "600" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(68, 138, 255, 0.7)",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginTop: 8,
    width: "100%",
    height: 48,
  },
  input: { flex: 1, color: "#fff", paddingRight: 10 },
  loginButton: { backgroundColor: "#2196F3", borderRadius: 25, paddingVertical: 12, paddingHorizontal: 50, marginTop: 30 },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
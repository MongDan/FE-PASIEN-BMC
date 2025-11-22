import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigate } from "react-router-native";

// Definisikan tipe data untuk state profile agar lebih jelas
const initialProfileState = {
  username: "Memuat...",
  no_reg: "N/A",
  alamat: "N/A",
  umur: "N/A",
};

// ======================= KOMPONEN FOOTER =======================
const Footer = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>© 2025 Ruang Bunda</Text>
  </View>
);
// ====================================================================

export default function ProfileScreen({ style }) {
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(initialProfileState);
  const [userToken, setUserToken] = useState(null);

  // Username Modal
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  // Password Modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setConfirmPasswordVisible] = useState(false);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // 🔹 Fungsi Kembali ke Home/Main Screen
  const handleGoBack = () => {
    // Mengarahkan secara eksplisit ke rute Home/Dashboard.
    navigate("/home", { replace: true });
  };

  // 🔹 Load user data dari API
  const loadUserData = async () => {
    setIsPageLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      setUserToken(token);

      if (!token) throw new Error("Token tidak ditemukan");

      const res = await fetch(
        "https://restful-api-bmc-production.up.railway.app/api/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (!res.ok || data.status !== "success")
        throw new Error(data.message || "Gagal memuat profil");

      const profile = data.data;

      // Update state dengan data baru
      setProfileData({
        username: profile.username || "N/A",
        no_reg: profile.no_reg || "N/A",
        alamat: profile.alamat || "N/A",
        umur: profile.umur ? String(profile.umur) : "N/A", // Pastikan umur berupa string
      });
      setNewUsername(profile.username || ""); // Set untuk modal ubah username

      await AsyncStorage.setItem("userName", profile.username || "");
    } catch (error) {
      console.log("Gagal memuat data profil:", error);
      Alert.alert("Error", "Gagal memuat data profil. Silakan coba lagi.");
      setProfileData((prev) => ({ ...prev, username: "Gagal Memuat" }));
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // 🔹 Update Password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Harap isi semua field password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Password baru dan konfirmasi tidak cocok.");
      return;
    }
    // Tambahkan validasi sederhana untuk password baru
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password baru minimal 6 karakter.");
      return;
    }

    setIsApiLoading(true);
    try {
      const body = JSON.stringify({
        password_lama: currentPassword,
        password_baru: newPassword,
        password_baru_confirmation: confirmPassword,
      });

      const response = await fetch(
        "https://restful-api-bmc-production.up.railway.app/api/profile/ubah-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengubah password.");
      }

      Alert.alert("Sukses", data.message || "Password berhasil diubah.");
      setPasswordModalVisible(false);
      // Reset semua field
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setConfirmPasswordVisible(false);
    } catch (error) {
      console.error("Gagal ganti password:", error);
      Alert.alert("Gagal", error.message);
    } finally {
      setIsApiLoading(false);
    }
  };

  // 🔹 Update Username
  const handleChangeUsername = async () => {
    const trimmedName = newUsername.trim();
    if (!trimmedName) {
      Alert.alert("Error", "Username tidak boleh kosong.");
      return;
    }
    if (trimmedName === profileData.username) {
      Alert.alert(
        "Info",
        "Username sama dengan yang lama, tidak perlu diubah."
      );
      setUsernameModalVisible(false);
      return;
    }

    setIsApiLoading(true);
    try {
      const body = JSON.stringify({ username: trimmedName });

      const response = await fetch(
        "https://restful-api-bmc-production.up.railway.app/api/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengubah username.");
      }

      await AsyncStorage.setItem("userName", trimmedName);
      setProfileData((prev) => ({ ...prev, username: trimmedName }));
      Alert.alert("Sukses", data.message || "Username berhasil diubah.");
      setUsernameModalVisible(false);
    } catch (error) {
      console.error("Gagal ganti username:", error);
      Alert.alert("Gagal", error.message);
    } finally {
      setIsApiLoading(false);
    }
  };

  // 🔹 Render input password dengan toggle show/hide
  const renderPasswordInput = (
    value,
    setValue,
    showPassword,
    setShowPassword,
    placeholder
  ) => (
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        secureTextEntry={!showPassword}
        value={value}
        onChangeText={setValue}
        placeholderTextColor="#999"
        editable={!isApiLoading}
      />
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
        <Ionicons
          name={showPassword ? "eye" : "eye-off"}
          size={20}
          color="#777"
        />
      </TouchableOpacity>
    </View>
  );

  // 🔹 Render item detail profil (misal: No. Reg, Alamat, Umur)
  const renderProfileDetailItem = (iconName, label, value) => (
    <View style={styles.detailItemNew}>
      <Ionicons
        name={iconName}
        size={20}
        color="#448AFF"
        style={styles.detailIconNew}
      />
      <View style={styles.detailTextContainerNew}>
        <Text style={styles.detailLabelNew}>{label}</Text>
        <Text style={styles.detailValueNew}>{value}</Text>
      </View>
    </View>
  );

  // 🔹 Render item menu (misal: Ubah Username, Logout)
  const renderMenuItem = (
    iconName,
    text,
    onPress,
    color = "#333",
    iconColor = "#448AFF"
  ) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={isPageLoading || isApiLoading} // Menonaktifkan saat loading
    >
      <Ionicons name={iconName} size={22} color={iconColor} />
      <Text style={[styles.menuItemText, { color }]}>{text}</Text>
      {iconName !== "log-out-outline" && (
        <Ionicons name="chevron-forward-outline" size={22} color="#bdbdbd" />
      )}
    </TouchableOpacity>
  );

  // 🔹 Logout
  const handleLogout = async () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Tidak", style: "cancel" },
      {
        text: "Ya",
        style: "destructive",
        onPress: async () => {
          try {
            // Hapus semua data yang relevan
            await AsyncStorage.multiRemove(["userToken", "userName"]);
            navigate("/", { replace: true });
          } catch (error) {
            Alert.alert("Error", "Terjadi kesalahan saat logout.");
          }
        },
      },
    ]);
  };

  // Pre-calculate Umur string safely
  const displayUmur = profileData.umur === "N/A" 
    ? "N/A" 
    : `${profileData.umur} Tahun`;

  return (
    <View style={styles.fullScreenContainer}>
      <ScrollView style={[styles.container, style]}>
        {/* Header Profile (dengan latar belakang yang lebih menarik) */}
        <View style={styles.profileHeader}>
          {/* Tombol Kembali (panah kiri atas) */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back-outline" size={28} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <FontAwesome name="user-circle" size={80} color="#fff" />
            {isPageLoading ? (
              <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />
            ) : (
              <Text style={styles.username}>{profileData.username}</Text>
            )}
            <Text style={styles.userSubtitle}>Akun Pengguna</Text>
          </View>
        </View>

        {/* Detail Informasi Profil (Minimalis & Modern) */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Detail Informasi</Text>
          {isPageLoading ? (
            <ActivityIndicator color="#448AFF" style={{ paddingVertical: 10 }} />
          ) : (
            <View style={styles.detailListContainer}>
              {renderProfileDetailItem(
                "id-card-outline",
                "No. Registrasi",
                profileData.no_reg
              )}
              {renderProfileDetailItem(
                "calendar-outline",
                "Umur",
                displayUmur // Menggunakan string yang sudah dihitung
              )}
              {renderProfileDetailItem(
                "location-outline",
                "Alamat",
                profileData.alamat
              )}
            </View>
          )}
        </View>

        {/* Menu Pengaturan Akun (Lebih ke Atas karena Card Detail lebih ringkas) */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Pengaturan Akun</Text>
          {renderMenuItem(
            "person-outline",
            "Ubah Username",
            () => setUsernameModalVisible(true)
          )}
          {renderMenuItem(
            "lock-closed-outline",
            "Ubah Password",
            () => setPasswordModalVisible(true)
          )}
          {renderMenuItem(
            "log-out-outline",
            "Logout",
            handleLogout,
            "#FF5252",
            "#FF5252"
          )}
        </View>
        
        {/* Padding tambahan untuk memastikan konten terpisah dari Footer */}
        <View style={{ height: 20 }} /> 
      </ScrollView>
      
      {/* FOOTER DI LUAR SCROLLVIEW */}
      <Footer />
      
      {/* Modal Username */}
      <Modal
        visible={usernameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUsernameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ubah Username</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Username Baru"
                value={newUsername}
                onChangeText={setNewUsername}
                editable={!isApiLoading}
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, isApiLoading && { opacity: 0.7 }]}
              onPress={handleChangeUsername}
              disabled={isApiLoading}
            >
              {isApiLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setUsernameModalVisible(false)}
              disabled={isApiLoading}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Password */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ubah Password</Text>
            {renderPasswordInput(
              currentPassword,
              setCurrentPassword,
              showCurrentPassword,
              setShowCurrentPassword,
              "Password Saat Ini"
            )}
            {renderPasswordInput(
              newPassword,
              setNewPassword,
              showNewPassword,
              setShowNewPassword,
              "Password Baru (min 6 kar.)"
            )}
            {renderPasswordInput(
              confirmPassword,
              setConfirmPassword,
              showConfirmPassword,
              setConfirmPasswordVisible,
              "Konfirmasi Password Baru"
            )}
            <TouchableOpacity
              style={[styles.saveButton, isApiLoading && { opacity: 0.7 }]}
              onPress={handleChangePassword}
              disabled={isApiLoading}
            >
              {isApiLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setPasswordModalVisible(false)}
              disabled={isApiLoading}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container Utama
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#F2F3F5",
  },
  container: {
    flex: 1,
    // background color sudah di handle oleh fullScreenContainer
  },

  // --- HEADER SECTION ---
  profileHeader: {
    // Simulasi Gradien Biru Muda ke Biru
    backgroundColor: "#448AFF", // Warna dasar
    paddingVertical: 40,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden", // Penting untuk tampilan rounded
  },
  headerContent: {
    alignItems: "center",
  },
  backButton: {
    position: 'absolute',
    top: 50, // Sesuaikan dengan ketinggian yang Anda inginkan
    left: 20,
    zIndex: 10,
    padding: 5,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
  },
  userSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },

  // --- INFO CARD SECTION (Minimalis & Modern) ---
  infoCard: {
    marginHorizontal: 20,
    marginTop: -30, // Tarik ke atas menutupi bagian bawah header
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15, // Dibuat sedikit lebih besar untuk pemisah yang jelas
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },

  // Container baru untuk detail yang disusun secara flex (2 kolom minimalis)
  detailListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Style baru untuk setiap item detail
  detailItemNew: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%', // Mengatur agar 2 item bisa berdampingan (48% + margin)
    marginBottom: 15, // Jarak antar baris
  },
  detailIconNew: {
    marginRight: 10,
  },
  detailTextContainerNew: {
    flex: 1,
  },
  detailLabelNew: {
    fontSize: 12,
    color: "#999",
  },
  detailValueNew: {
    fontSize: 14, // Dibuat sedikit lebih kecil agar lebih ringkas
    color: "#333",
    fontWeight: '600',
    marginTop: 1,
  },

  // --- MENU SECTION ---
  menuContainer: {
    marginTop: 10,
    marginHorizontal: 20,
    marginBottom: 0, // Dibuat 0 karena padding bawah ScrollView yang akan menampung footer
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#999",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  menuItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
  },

  // --- FOOTER STYLES ---
  footer: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    width: "100%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc", // Border yang lebih jelas
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#448AFF",
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
    marginTop: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
  },
  cancelButtonText: {
    color: "#FF5252",
    fontSize: 16,
    fontWeight: "500",
  },
});
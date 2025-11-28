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
  Platform,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigate } from "react-router-native";


const COLORS = {
  primaryBlue: '#2196F3', 
  darkBlue: '#1976D2', 
  lightBlue: '#E3F2FD', 
  white: '#FFFFFF', 
  offWhite: '#F8F9FA',
  textPrimary: '#263238', 
  textSecondary: '#607D8B', 
  accentSuccess: '#4CAF50', 
  accentError: '#F44336', 
  shadow: 'rgba(0, 0, 0, 0.08)', 
  border: '#E0E0E0',
};

const SHADOW_STYLE = {
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 6,
};

const initialProfileState = {
  username: "Memuat...",
  no_reg: "N/A",
  alamat: "N/A",
  umur: "N/A",
};

const Footer = () => (
  <View style={styles.footer}>
    <Text style={styles.footerText}>© 2025 Ruang Bunda</Text>
  </View>
);

export default function ProfileScreen({ style }) {
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(initialProfileState);
  const [userToken, setUserToken] = useState(null);

  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setConfirmPasswordVisible] = useState(false);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isApiLoading, setIsApiLoading] = useState(false);

  const AppAsyncStorage = AsyncStorage || { getItem: async () => "mock-token" };

  const handleGoBack = () => {
    navigate(-1);
  };

  const loadUserData = async () => {
    setIsPageLoading(true);
    try {
      const token = await AppAsyncStorage.getItem("userToken");
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

      setProfileData({
        username: profile.username || "N/A",
        no_reg: profile.no_reg || "N/A",
        alamat: profile.alamat || "N/A",
        umur: profile.umur ? String(profile.umur) : "N/A", 
      });
      setNewUsername(profile.username || ""); 

      await AppAsyncStorage.setItem("userName", profile.username || "");
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

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Harap isi semua field password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Password baru dan konfirmasi tidak cocok.");
      return;
    }
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

      await AppAsyncStorage.setItem("userName", trimmedName);
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
        placeholderTextColor={COLORS.textSecondary}
        editable={!isApiLoading}
      />
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
        <Ionicons
          name={showPassword ? "eye" : "eye-off"}
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );

  const renderProfileDetailItem = (iconName, label, value) => (
    <View style={styles.detailItemNew}>
      <Ionicons
        name={iconName}
        size={20}
        color={COLORS.primaryBlue} 
        style={styles.detailIconNew}
      />
      <View style={styles.detailTextContainerNew}>
        <Text style={styles.detailLabelNew}>{label}</Text>
        <Text style={styles.detailValueNew} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );

  const renderMenuItem = (
    iconName,
    text,
    onPress,
    color = COLORS.textPrimary,
    iconColor = COLORS.primaryBlue
  ) => (
    <TouchableOpacity
      style={[styles.menuItem, SHADOW_STYLE]} 
      onPress={onPress}
      disabled={isPageLoading || isApiLoading}
    >
      <Ionicons name={iconName} size={22} color={iconColor} />
      <Text style={[styles.menuItemText, { color }]}>{text}</Text>
      {iconName !== "log-out-outline" && (
        <Ionicons name="chevron-forward-outline" size={22} color={COLORS.textSecondary} />
      )}
    </TouchableOpacity>
  );

  const handleLogout = async () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Tidak", style: "cancel" },
      {
        text: "Ya",
        style: "destructive",
        onPress: async () => {
          try {
            await AppAsyncStorage.multiRemove(["userToken", "userName"]);
            navigate("/", { replace: true });
          } catch (error) {
            Alert.alert("Error", "Terjadi kesalahan saat logout.");
          }
        },
      },
    ]);
  };

  const displayUmur = profileData.umur === "N/A"
    ? "N/A"
    : `${profileData.umur} Tahun`;
  
  const displayAlamat = profileData.alamat.length > 20
    ? `${profileData.alamat.substring(0, 20)}...`
    : profileData.alamat;

  return (
    <View style={styles.fullScreenContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header Profile (dengan latar belakang biru konsisten) */}
        <View style={styles.profileHeader}>
          {/* Tombol Kembali */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="chevron-back-outline" size={30} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.profileIconContainer}>
                <FontAwesome name="user-circle" size={60} color={COLORS.darkBlue} />
            </View>
            
            {isPageLoading ? (
              <ActivityIndicator color={COLORS.white} style={{ marginTop: 15 }} />
            ) : (
              <Text style={styles.username}>{profileData.username}</Text>
            )}
            <Text style={styles.userSubtitle}>Akun Bunda {profileData.no_reg}</Text>
          </View>
        </View>

        {/* Detail Informasi Profil (Minimalis & Modern - Menggunakan 2 Kolom) */}
        <View style={[styles.infoCard, SHADOW_STYLE]}>
          <Text style={styles.cardTitle}>Detail Informasi</Text>
          {isPageLoading ? (
            <ActivityIndicator color={COLORS.primaryBlue} style={{ paddingVertical: 10 }} />
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
                displayUmur
              )}
              {renderProfileDetailItem(
                "location-outline",
                "Alamat",
                displayAlamat 
              )}
               {/* Tambahkan kolom kosong agar tata letak 2 kolom tetap rapi jika ganjil */}
               <View style={styles.detailItemNew} /> 
            </View>
          )}
        </View>

        {/* Menu Pengaturan Akun (Lebih ke Tengah) */}
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Pengaturan Akun</Text>
          {renderMenuItem(
            "person-outline",
            "Ubah Username",
            () => {
                setNewUsername(profileData.username); 
                setUsernameModalVisible(true);
            },
            COLORS.textPrimary,
            COLORS.primaryBlue
          )}
          {renderMenuItem(
            "lock-closed-outline",
            "Ubah Password",
            () => setPasswordModalVisible(true),
            COLORS.textPrimary,
            COLORS.primaryBlue
          )}
          {renderMenuItem(
            "log-out-outline",
            "Logout",
            handleLogout,
            COLORS.accentError, 
            COLORS.accentError 
          )}
        </View>

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
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, isApiLoading && { opacity: 0.7 }]}
              onPress={handleChangeUsername}
              disabled={isApiLoading}
            >
              {isApiLoading ? (
                <ActivityIndicator color={COLORS.white} />
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
                <ActivityIndicator color={COLORS.white} />
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

  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.offWhite, 
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, 
  },

  profileHeader: {
    backgroundColor: COLORS.primaryBlue, 
    paddingVertical: 50, 
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    paddingTop: Platform.OS === 'android' ? 70 : 50,
  },
  headerContent: {
    alignItems: "center",
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 40,
    left: 20,
    zIndex: 10,
    padding: 5,
  },
  profileIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white, 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    ...SHADOW_STYLE,
  },
  username: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    marginTop: 5,
  },
  userSubtitle: {
    fontSize: 14,
    color: COLORS.lightBlue, 
    marginTop: 2,
    fontWeight: '500',
  },

  infoCard: {
    marginHorizontal: 20,
    marginTop: -40, 
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20, 
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.darkBlue, 
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },

  detailListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 5, 
  },
  detailItemNew: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
  },
  detailIconNew: {
    marginRight: 10,
  },
  detailTextContainerNew: {
    flex: 1,
  },
  detailLabelNew: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  detailValueNew: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginTop: 1,
  },

  menuContainer: {
    marginHorizontal: 20,
    marginBottom: 0,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingVertical: 18, 
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12, 
  },
  menuItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    fontWeight: '600',
  },

  footer: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
 
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 25,
    width: "100%",
    ...SHADOW_STYLE,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.darkBlue,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: COLORS.offWhite, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    color: COLORS.textPrimary,
  },
  eyeIcon: {
    padding: 5,
  },
  saveButton: {
    backgroundColor: COLORS.primaryBlue,
    borderRadius: 30, 
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 15,
    padding: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
});
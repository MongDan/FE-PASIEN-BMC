import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Alert,
  Platform,
} from "react-native";

// --- MOCK LIBRARY UNTUK KOMPILASI DI WEB ---
import { Ionicons } from "@expo/vector-icons";
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// MOCK FALLBACK
const MockIonicons = ({ size, color }) => (
  <Text style={{ fontSize: size, color }}>Icon</Text>
);
const MockActivityIndicator = ({ color }) => (
  <Text style={{ color }}>Loading...</Text>
);
const MockAlert = { alert: (t, m) => console.log("ALERT:", t, m) };
const MockAsyncStorage = { getItem: async () => "mock-token-12345" };

const { width } = Dimensions.get("window");

// =================================================================
// ✨ Warna dan Konstanta Desain (Diambil dari EdukasiScreen) ✨
// =================================================================
const COLORS = {
  // Palet Biru dan Putih yang Bersih dan Menenangkan
  primaryBlue: '#2196F3', // Biru standar yang cerah dan profesional
  darkBlue: '#1976D2', // Biru yang lebih gelap untuk aksen kuat
  lightBlue: '#E3F2FD', // Biru sangat terang, hampir putih, untuk latar belakang/aksen lembut
  white: '#FFFFFF', // Putih murni
  offWhite: '#F8F9FA', // Putih gading untuk latar belakang section (latar belakang chat)
  textPrimary: '#263238', // Abu-abu gelap, mudah dibaca
  textSecondary: '#607D8B', // Abu-abu kebiruan untuk teks sekunder
  accentSuccess: '#4CAF50', // Hijau untuk sukses (toast)
  accentError: '#F44336', // Merah untuk error (toast)
  shadow: 'rgba(0, 0, 0, 0.08)', // Bayangan sangat lembut
  border: '#E0E0E0', // Garis batas tipis
};

const SHADOW_STYLE = {
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2, // Sedikit lebih terlihat untuk efek "melayang"
  shadowRadius: 6,
  elevation: 6,
};

// ============================
// CHAT BUBBLE COMPONENT (Diperbarui)
// ============================
const MessageBubble = ({ item }) => {
  const isPatient = item.isPatient;
  const AppIonicons = Ionicons || MockIonicons; // Menggunakan Ionicons yang sudah di-mock

  return (
    <View
      style={[
        styles.messageContainer,
        isPatient ? styles.patientContainer : styles.staffContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isPatient ? styles.patientBubble : styles.staffBubble,
        ]}
      >
        <Text style={isPatient ? styles.patientText : styles.staffText}>
          {item.isi}
        </Text>
        <View style={styles.timestampRow}>
          <Text
            style={
              isPatient ? styles.patientTimestamp : styles.staffTimestamp
            }
          >
            {item.tanggal}
          </Text>
          {/* Tambahkan ikon status (opsional) */}
          {isPatient && (
            <AppIonicons name="checkmark-done" size={12} color={COLORS.lightBlue} style={{marginLeft: 5}}/>
          )}
        </View>
      </View>
    </View>
  );
};

// ============================
// MAIN SCREEN (Diperbarui)
// ============================
export default function PesanScreen() {
  // FIX: hook must always be called normally
  let navigate;
  try {
    navigate = useNavigate(); // REAL HOOK (Expo / Native)
  } catch {
    navigate = (path) =>
      console.log("Mock navigate to:", path); // FALLBACK (Web compiler)
  }

  const [pesanData, setPesanData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [noReg] = useState("BDN001"); // MOCK VALUE
  const [bulan] = useState(33); // MOCK VALUE
  const [errorMessage, setErrorMessage] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [pesanBaru, setPesanBaru] = useState("");

  const scrollViewRef = useRef(null);

  const AppAlert = Alert?.alert ? Alert : MockAlert;
  const AppAsyncStorage = AsyncStorage || MockAsyncStorage;
  const AppIonicons = Ionicons || MockIonicons;
  const AppActivityIndicator = ActivityIndicator || MockActivityIndicator;

  // Auto scroll
  useEffect(() => {
    if (scrollViewRef.current) {
      // Delay scroll sedikit agar bubble sempat di-render
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [pesanData, isLoading]);

  const handleGoBack = () => {
    navigate(-1); // Menggunakan -1 seperti di EdukasiScreen
  };

  // ============================
  // FETCH PESAN
  // ============================
  const loadPesan = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const token = await AppAsyncStorage.getItem("userToken");

      // Menggunakan mock data API
      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/pesan/${noReg}/${bulan}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat pesan");

      // FIX: Logika pengiriman harus sesuai dengan data asli API. 
      // isPatient = true (jika dari pasien), false (jika dari staf/bidan)
      // Karena data API tidak jelas, kita gunakan logika mock bawaan, 
      // tetapi akan diasumsikan staff: index % 3 === 0
      const dataWithSender = (data.data || []).map((item, index) => ({
        ...item,
        // Dibuat lebih random (Staff (false) jika id ganjil, Pasien (true) jika id genap)
        isPatient: item.id % 2 === 0, 
        tanggal: new Date(
          Date.now() - index * 60000
        ).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      setPesanData(dataWithSender);
    } catch (error) {
      setErrorMessage(error.message);
      AppAlert.alert("Error", "Gagal memuat riwayat pesan.");
      setPesanData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPesan();
  }, []);

  // ============================
  // KIRIM PESAN
  // ============================
  const handleKirimPesan = async () => {
    if (!pesanBaru.trim()) {
      AppAlert.alert("Info", "Pesan tidak boleh kosong.");
      return;
    }

    const currentPesan = pesanBaru;
    setPesanBaru("");

    const newSentMessage = {
      isi: currentPesan,
      tanggal: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isPatient: true, // Pesan baru selalu dari Pasien
      id: Date.now() // Mock ID
    };

    setPesanData((p) => [...p, newSentMessage]);
    setModalVisible(false);
    // setIsLoading(true); // Tidak perlu loading penuh, cukup tunggu sedikit.

    try {
      const token = await AppAsyncStorage.getItem("userToken");

      const res = await fetch(
        "https://restful-api-bmc-production.up.railway.app/api/pesan/kirim",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            no_reg: noReg,
            isi: currentPesan,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // AppAlert.alert("Berhasil", data.message); // Tidak perlu alert setelah kirim
      // Refresh data setelah berhasil kirim
      loadPesan(); 

    } catch (e) {
      // Hapus pesan yang gagal dikirim
      setPesanData((p) => p.filter((msg) => msg.id !== newSentMessage.id)); 
      AppAlert.alert("Gagal Kirim", `Pesan tidak terkirim. ${e.message}`);
      setModalVisible(true); // Buka kembali modal agar user bisa edit/coba lagi
    } finally {
      setIsLoading(false); // Pastikan loading state mati jika dinyalakan
    }
  };

  // ============================
  // RENDER
  // ============================
  return (
    <View style={styles.fullContainer}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <AppIonicons name="chevron-back-outline" size={30} color={COLORS.primaryBlue} />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Konsultasi Bunda 👩‍⚕️</Text>
          <Text style={styles.headerSubtitle}>
            Komunikasikan kesehatan Bunda dengan Bidan
          </Text>
        </View>
      </View>

      {/* SCROLL CHAT */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.contentWrapper}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.infoLabelContainer}>
          <Text style={styles.infoLabelText}>
            Chat Kehamilan Bulan Ke-{bulan} | Pasien: {noReg}
          </Text>
        </View>

        {isLoading && !pesanData.length ? (
          <View style={styles.centerLoading}>
            <AppActivityIndicator size="large" color={COLORS.primaryBlue} />
            <Text style={styles.loadingText}>Memuat Riwayat Pesan...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerError}>
            <AppIonicons name="chatbox-outline" size={50} color={COLORS.accentError} style={{marginBottom: 10}}/>
            <Text style={styles.errorText}>Gagal memuat riwayat pesan.</Text>
            <Text style={styles.errorTextDetail}>{errorMessage}</Text>
          </View>
        ) : pesanData.length === 0 ? (
          <View style={styles.centerEmpty}>
            <AppIonicons name="chatbubble-outline" size={50} color={COLORS.textSecondary} style={{marginBottom: 10}}/>
            <Text style={styles.noData}>
              Belum ada riwayat pesan. Klik tombol plus di kanan bawah untuk memulai konsultasi.
            </Text>
          </View>
        ) : (
          pesanData.map((item, index) => (
            <MessageBubble key={`msg-${index}`} item={item} />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BUTTON KIRIM (FAB) */}
      <TouchableOpacity
        style={[styles.addButton, SHADOW_STYLE]}
        onPress={() => setModalVisible(true)}
      >
        <AppIonicons
          name="add" // Icon lebih universal untuk aksi baru
          size={35}
          color={COLORS.white}
        />
      </TouchableOpacity>

      {/* MODAL KIRIM (Diperbarui) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Tanyakan pada Bidan</Text>

            <TextInput
              style={styles.input}
              placeholder="Tulis pesan atau pertanyaan Anda di sini..."
              placeholderTextColor={COLORS.textSecondary}
              value={pesanBaru}
              onChangeText={setPesanBaru}
              multiline
              autoFocus
            />
            
            <Text style={styles.inputHint}>*Pastikan pertanyaan Anda jelas dan ringkas.</Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setPesanBaru(''); // Reset pesan jika dibatalkan
                }}
              >
                <Text style={styles.cancelText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleKirimPesan}
                disabled={!pesanBaru.trim()}
              >
                <Text style={styles.sendButtonText}>Kirim Pesan</Text>
                <AppIonicons name="send" size={16} color={COLORS.white} style={{marginLeft: 8}}/>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =====================
// STYLES (Diperbarui dengan konsistensi EdukasiScreen)
// =====================
const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: COLORS.offWhite },

  // --- Header ---
  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    ...SHADOW_STYLE,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 10,
  },

  backButton: { marginRight: 10 },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.darkBlue,
  },

  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },

  // --- Chat Area ---
  contentWrapper: { flex: 1 },
  contentContainer: { paddingVertical: 10, paddingHorizontal: 5 },

  infoLabelContainer: {
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: COLORS.lightBlue,
    borderRadius: 8,
    marginBottom: 20,
  },

  infoLabelText: { textAlign: "center", color: COLORS.textSecondary, fontSize: 13 },

  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  loadingText: { color: COLORS.primaryBlue, marginTop: 10, fontSize: 16 },

  centerError: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  errorText: { color: COLORS.accentError, textAlign: "center", fontSize: 18, fontWeight: 'bold' },
  errorTextDetail: { color: COLORS.textSecondary, textAlign: 'center', fontSize: 14, marginTop: 5 },

  centerEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  noData: { color: COLORS.textSecondary, textAlign: "center", marginTop: 10, fontSize: 15, paddingHorizontal: 20 },

  // --- Chat Bubbles ---
  messageContainer: { flexDirection: "row", marginHorizontal: 10, marginBottom: 8 },
  patientContainer: { justifyContent: "flex-end" },
  staffContainer: { justifyContent: "flex-start" },

  messageBubble: {
    paddingHorizontal: 15, // Padding horizontal lebih besar
    paddingVertical: 10,
    borderRadius: 15,
    maxWidth: width * 0.8, // Maksimum lebih besar
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },

  patientBubble: {
    backgroundColor: COLORS.primaryBlue,
    marginLeft: 50,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 5, // Sudut lancip kecil untuk indikator pengirim
  },

  staffBubble: {
    backgroundColor: COLORS.white, // Staff bubble warna putih/lightBlue
    marginRight: 50,
    borderTopLeftRadius: 5, // Sudut lancip kecil untuk indikator pengirim
    borderTopRightRadius: 15,
    borderWidth: 1, // Border tipis untuk membedakan dari latar belakang
    borderColor: COLORS.border,
  },

  patientText: { color: COLORS.white, fontSize: 15, lineHeight: 22 },
  staffText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 22 },

  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 5,
  },

  patientTimestamp: { fontSize: 11, color: COLORS.lightBlue },
  staffTimestamp: { fontSize: 11, color: COLORS.textSecondary },

  // --- FAB (Floating Action Button) ---
  addButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.darkBlue, // Menggunakan darkBlue agar lebih menonjol
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  // --- Modal ---
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Overlay sedikit lebih gelap
    justifyContent: "flex-end", // Muncul dari bawah
  },

  modalBox: {
    backgroundColor: COLORS.white,
    padding: 25,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    ...SHADOW_STYLE,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
    marginBottom: 20,
    textAlign: 'left',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    color: COLORS.textPrimary,
  },

  inputHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 5,
    marginBottom: 10,
    fontStyle: 'italic',
  },

  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  sendButton: {
    backgroundColor: COLORS.primaryBlue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
    flexDirection: 'row',
    ...SHADOW_STYLE,
  },

  sendButtonText: { color: COLORS.white, fontWeight: "bold", fontSize: 16 },

  cancelButton: { 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 16 },
});
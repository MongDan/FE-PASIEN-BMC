import React, { useState, useEffect, useRef } from "react";

// --- MOCK LIBRARY UNTUK KOMPILASI DI WEB ---
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
} from "react-native";

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

// ============================
// CHAT BUBBLE COMPONENT
// ============================
const MessageBubble = ({ item }) => {
  const isPatient = item.isPatient;

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
        <Text
          style={
            isPatient ? styles.patientTimestamp : styles.staffTimestamp
          }
        >
          {item.tanggal}
        </Text>
      </View>
    </View>
  );
};

// ============================
// MAIN SCREEN
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
  const [noReg] = useState("BDN001");
  const [bulan] = useState(33);
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
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [pesanData, isLoading]);

  const handleGoBack = () => {
    navigate("/home", { replace: true });
  };

  // ============================
  // FETCH PESAN
  // ============================
  const loadPesan = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const token = await AppAsyncStorage.getItem("userToken");

      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/pesan/${noReg}/${bulan}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal memuat pesan");

      const dataWithSender = (data.data || []).map((item, index) => ({
        ...item,
        isPatient: index % 3 !== 0,
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
      isPatient: true,
    };

    setPesanData((p) => [...p, newSentMessage]);
    setModalVisible(false);
    setIsLoading(true);

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

      AppAlert.alert("Berhasil", data.message);
      loadPesan();
    } catch (e) {
      setPesanData((p) => p.filter((msg) => msg !== newSentMessage));
      AppAlert.alert("Error", e.message);
      setModalVisible(true);
    } finally {
      setIsLoading(false);
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
          <AppIonicons name="arrow-back-outline" size={24} color="#1A237E" />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Konsultasi Kesehatan</Text>
          <Text style={styles.headerSubtitle}>
            Riwayat pesan & komunikasi Anda dengan tenaga medis
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
            Riwayat Pesan Kehamilan Bulan Ke-{bulan}
          </Text>
        </View>

        {isLoading && !pesanData.length ? (
          <AppActivityIndicator size="large" color="#0056D2" />
        ) : errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : pesanData.length === 0 ? (
          <Text style={styles.noData}>Belum ada pesan</Text>
        ) : (
          pesanData.map((item, index) => (
            <MessageBubble key={`msg-${index}`} item={item} />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BUTTON KIRIM */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <AppIonicons
          name="chatbubble-ellipses-outline"
          size={28}
          color="#fff"
        />
      </TouchableOpacity>

      {/* MODAL KIRIM */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Kirim Pesan Baru</Text>

            <TextInput
              style={styles.input}
              placeholder="Tulis pesan..."
              value={pesanBaru}
              onChangeText={setPesanBaru}
              multiline
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleKirimPesan}
            >
              <Text style={styles.sendButtonText}>Kirim</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: "#F8F9FA" },

  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

  backButton: { marginRight: 10 },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A237E",
  },

  headerSubtitle: { fontSize: 12, color: "#607D8B" },

  contentWrapper: { flex: 1 },
  contentContainer: { paddingVertical: 20 },

  infoLabelContainer: {
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },

  infoLabelText: { textAlign: "center", color: "#607D8B" },

  errorText: { color: "red", textAlign: "center" },
  noData: { color: "#777", textAlign: "center", marginTop: 50 },

  messageContainer: { flexDirection: "row", marginBottom: 10 },
  patientContainer: { justifyContent: "flex-end" },
  staffContainer: { justifyContent: "flex-start" },

  messageBubble: {
    padding: 12,
    borderRadius: 15,
    maxWidth: width * 0.75,
  },

  patientBubble: {
    backgroundColor: "#0056D2",
    marginLeft: "auto",
  },

  staffBubble: {
    backgroundColor: "#E3F2FD",
    marginRight: "auto",
  },

  patientText: { color: "#fff" },
  staffText: { color: "#1A237E" },

  patientTimestamp: { fontSize: 10, color: "#eee", marginTop: 3 },
  staffTimestamp: { fontSize: 10, color: "#555", marginTop: 3 },

  addButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0056D2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
  },

  modalTitle: {
    fontSize: 18,
    color: "#1A237E",
    textAlign: "center",
    marginBottom: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
  },

  sendButton: {
    marginTop: 15,
    backgroundColor: "#0056D2",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  sendButtonText: { color: "#fff", fontWeight: "bold" },

  cancelButton: { marginTop: 10, alignItems: "center" },
  cancelText: { color: "#FF7043" },
});

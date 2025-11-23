import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-native'; 
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';
import {
  AntDesign,
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
  MaterialIcons,
  Feather,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Ganti URL API dengan URL yang sesuai
const BASE_URL_PATIENT = 'https://restful-api-bmc-production.up.railway.app/api/pasien';
const ASYNC_STORAGE_KEY = 'userToken';

// Polyfill minimal atob untuk JWT decoding
if (typeof global.atob === 'undefined') {
  global.atob = (data) => Buffer.from(data, 'base64').toString('binary');
}

/* ===================== TOKEN + DECODE ===================== */
const getTokenFromStorage = async () => {
  try {
    return await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
  } catch (e) {
    return null;
  }
};

const decodeJwtPayload = (token) => {
  try {
    const parts = token.split('.');
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = decodeURIComponent(
      global
        .atob(payloadBase64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(payloadJson);

    return {
      pasienId: payload.sub,
      pasienName: payload.name || payload.username || 'Pasien',
    };
  } catch (e) {
    return { pasienId: null, pasienName: 'Error Loading' };
  }
};

/* ===================== HELPERS (LOGIC) ===================== */

/**
 * Helper untuk mengkonversi nilai menjadi string yang siap ditampilkan.
 * @param {any} num 
 * @param {boolean} isDecimal 
 * @returns {string} 
 */
const cleanNumberString = (num, isDecimal = false) => {
  if (num === null || num === undefined) return '---';
  if (typeof num === 'string' && num.trim() === '') return '---';

  const str = String(num).trim();
  const n = parseFloat(str);

  if (Number.isNaN(n)) {
    return str || '---';
  }

  if (isDecimal) {
    return n.toFixed(1);
  }

  return String(Math.trunc(n));
};


// Helper untuk mengambil Jam dari format "YYYY-MM-DD HH:MM:SS"
const extractTime = (dateTimeString) => {
  if (!dateTimeString) return '---';
  try {
    const str = String(dateTimeString);
    const parts = str.split(' ');
    if (parts.length > 1) {
      const timePart = parts[1];
      return timePart.split(':').slice(0, 2).join(':');
    }
    return '---';
  } catch (e) {
    return '---';
  }
};

/**
 * Mendapatkan status DJJ sesuai aturan:
 */
const getDjjStatus = (djj) => {
  const value = parseFloat(djj);
  if (isNaN(value) || value === 0) return { text: 'N/A', color: '#9E9E9E', message: 'Detak jantung janin tidak tersedia/belum dicatat.' };

  if (value >= 110 && value <= 160) {
    return {
      text: 'Normal',
      color: '#4CAF50', 
      message: 'Detak jantung janin normal. Adek bayi sehat di dalam.',
    };
  }

  if (value < 110 || value > 160) {
    return {
      text: 'Gawat Janin',
      color: '#F44336', 
      message: 'Detak jantung tidak stabil. Segera panggil Bidan/Dokter!',
    };
  }

  return { text: 'N/A', color: '#9E9E9E', message: 'Memuat data...' };
};

const getDilatationPhase = (cm) => {
  const value = parseFloat(cm);
  if (isNaN(value) || value <= 3) return 'Fase Laten (0-3 cm)';
  if (value >= 4 && value <= 10) return 'Fase Aktif (4-10 cm)';
  if (value > 10) return 'Kala II (Lengkap)';
  return 'Fase Laten (0-3 cm)';
};

/**
 * Mendapatkan status umum ibu (Tensi, Nadi, Suhu)
 */
/**
 * Menghitung status kesehatan ibu berdasarkan data partograf terbaru.
 * Aturan Suhu: <35 Hipotermia, 35.0-37.5 Normal, >37.5 Demam.
 * @param {string} sistolik
 * @param {string} diastolik
 * @param {string} nadi_ibu
 * @param {string} suhu_ibu
 * @returns {object} { status, issues, detail }
 */
const getIbuStatus = (sistolik, diastolik, nadi_ibu, suhu_ibu) => {
    // Parsing nilai, menggunakan nama parameter baru (nadi_ibu, suhu_ibu)
    const s = parseFloat(sistolik); // Sistolik
    const d = parseFloat(diastolik); // Diastolik
    const n = parseFloat(nadi_ibu); // Nadi
    const h = parseFloat(suhu_ibu); // Suhu

    const issues = [];
    let detail = {};

    // 1. Cek Data Belum Lengkap
    if (isNaN(s) || isNaN(d) || isNaN(n) || isNaN(h)) {
        return {
            status: 'DATA BELUM LENGKAP',
            color: '#BDBDBD',
            message: 'Pastikan semua data tanda-tanda vital (TTV) terisi.',
            issues: ['Pastikan semua data tanda-tanda vital (TTV) terisi.'],
            detail: detail,
        };
    }

    // 2. Cek Suhu (MODIFIKASI LOGIKA SUHU: Normal 35.0 - 37.5)
    if (h > 37.5) {
        issues.push('Suhu tubuh tinggi (Demam)');
        detail['suhu'] = {
            icon: 'thermometer-high',
            color: '#D32F2F', 
            text: `Demam: Suhu ${h.toFixed(1)} °C`,
        };
    } else if (h < 35.0) {
        issues.push('Berpotensi Hipotermia');
        detail['suhu'] = {
            icon: 'thermometer-low',
            color: '#1976D2', 
            text: `Suhu Rendah: Suhu ${h.toFixed(1)} °C`,
        };
    }

    // 3. Cek Tekanan Darah
    if (s > 140 || d > 90) {
        issues.push('Hipertensi / Pre-eklampsia');
        detail['tensi'] = {
            icon: 'heart-pulse',
            color: '#D32F2F',
            text: `Tensi Tinggi: ${s}/${d} mmHg`,
        };
    } else if (s < 90 || d < 60) {
        issues.push('Hipotensi');
        detail['tensi'] = {
            icon: 'heart-pulse',
            color: '#1976D2',
            text: `Tensi Rendah: ${s}/${d} mmHg`,
        };
    }

    // 4. Cek Nadi
    if (n > 120) {
        issues.push('Takikardia (Nadi Cepat)');
        detail['nadi'] = {
            icon: 'pulse',
            color: '#D32F2F',
            text: `Nadi Cepat: ${n} bpm`,
        };
    } else if (n < 50) {
        issues.push('Bradikardia (Nadi Lambat)');
        detail['nadi'] = {
            icon: 'pulse',
            color: '#1976D2',
            text: `Nadi Lambat: ${n} bpm`,
        };
    }

    // 5. Penentuan Status Akhir
    if (issues.length > 0) {
        const isCritical = issues.some(i => i.includes('Hipertensi') || i.includes('Hipotensi') || i.includes('Takikardia') || i.includes('Demam'));
        return {
            status: isCritical ? 'PERLU WASPADA' : 'PERLU PERHATIAN',
            color: isCritical ? '#D32F2F' : '#FFA000', // Merah atau Oranye
            message: `Terdapat ${issues.length} potensi masalah: ${issues.join(', ')}.`,
            issues: issues,
            detail: detail,
        };
    } else {
        // Jika semua TTV normal
        return {
            status: 'NORMAL',
            color: '#4CAF50', // Hijau
            message: 'Kondisi Tanda-tanda Vital Ibu Baik.',
            issues: ['Kondisi Tanda-tanda Vital Ibu Baik.'],
            detail: detail,
        };
    }
};


const getLatestFilledPartografData = (partografArray) => {
    if (!partografArray || partografArray.length === 0) {
        return null;
    }

    const sortedData = [...partografArray].sort((a, b) =>
        new Date(b.waktu_catat) - new Date(a.waktu_catat)
    );

    const fieldKeys = [
        'waktu_catat', 'djj', 'pembukaan_servik', 'penurunan_kepala',
        'nadi_ibu', 'suhu_ibu', 'sistolik', 'diastolik',
        'aseton', 'protein', 'volume_urine', 'air_ketuban', 'molase',
        'obat_cairan'
    ];

    let filledData = {};
    for (const key of fieldKeys) {
        filledData[key] = null;
    }

    filledData['partograf_id'] = sortedData[0]['partograf_id'] || null;

    for (const record of sortedData) {
        for (const key of fieldKeys) {
            if (filledData[key] === null) {
                let value = record[key];

                const isInvalidText = (
                    value === null ||
                    value === undefined ||
                    String(value).trim() === '' ||
                    String(value).trim() === '-'
                );

                if (isInvalidText) {
                    continue;
                }

                if (key === 'djj' || key === 'pembukaan_servik') {
                    const numValue = parseFloat(value);
                    if (numValue <= 0 || isNaN(numValue)) continue;
                }

                if (key === 'suhu_ibu') {
                    const numValue = parseFloat(value);
                    if (numValue <= 30.0 || isNaN(numValue)) continue; 
                }

                filledData[key] = value;
            }
        }
    }

    if (sortedData.length > 0) {
        filledData['waktu_catat'] = sortedData[0]['waktu_catat'] || '---';
    }

    return filledData;
};


/* ===================== VISUALISASI PEMBUKAAN ===================== */

const DILATATION_METAPHORS = [
  { cm: 0, text: 'Pembukaan 0-3 cm', metaphor: 'Ujung Jari (Fase Laten)', caption: 'Jalan lahir masih dalam fase awal, Bunda bisa beristirahat.', progress: 0.1 },
  { cm: 4, text: 'Pembukaan 4 cm', metaphor: 'Jeruk Nipis (Irisan)', caption: 'Jalan lahir mulai terbuka aktif. Semangat Bunda!', progress: 0.4 },
  { cm: 5, text: 'Pembukaan 5 cm', metaphor: 'Buah Kiwi (Potongan Melintang)', caption: 'Hampir setengah jalan! Fokus pada pernapasan.', progress: 0.5 },
  { cm: 6, text: 'Pembukaan 6 cm', metaphor: 'Kue Marie / Kuki', caption: 'Sudah setengah jalan! Tarik napas panjang.', progress: 0.6 },
  { cm: 7, text: 'Pembukaan 7 cm', metaphor: 'Tomat Merah', caption: 'Tinggal sedikit lagi! Pertahankan energi Anda.', progress: 0.7 },
  { cm: 8, text: 'Pembukaan 8 cm', metaphor: 'Jeruk Sunkist / Apel', caption: 'Pembukaan semakin cepat. Anda hebat!', progress: 0.8 },
  { cm: 9, text: 'Pembukaan 9 cm', metaphor: 'Donat', caption: 'Sedikit lagi, hampir sempurna!', progress: 0.9 },
  { cm: 10, text: 'Pembukaan 10 cm', metaphor: 'Kepala Bayi / Semangka Kecil', caption: 'Pembukaan Lengkap! Siap untuk mengejan sesuai aba-aba Bidan.', progress: 1.0 },
];

/**
 * Komponen untuk menampilkan visualisasi pembukaan serviks berdasarkan cm.
 */
const DilatationVisualizer = ({ pembukaan }) => {
  // Pastikan pembukaan adalah string aman untuk menghindari error formatText di Progress.Circle
  const dilatationString = cleanNumberString(pembukaan);
  const dilatation = parseFloat(pembukaan);

  let closestDilatation = DILATATION_METAPHORS[0];

  if (dilatation >= 4) {
    const sortedMetaphors = DILATATION_METAPHORS.filter(m => m.cm >= 4).sort((a, b) => b.cm - a.cm);
    const currentMetaphor = sortedMetaphors.find(m => dilatation >= m.cm) || DILATATION_METAPHORS[1];
    closestDilatation = currentMetaphor;

    if (dilatation >= 10) {
        closestDilatation = DILATATION_METAPHORS.find(m => m.cm === 10);
    }
  }

  const { text, metaphor, caption } = closestDilatation;
  const progress = Math.min(dilatation / 10, 1);
  const size = width * 0.40;

  return (
    <View style={styles.dilatationVisualizerContainer}>
      <Text style={styles.visualizerTitle}>Fase Persalinan</Text>
      <Text style={styles.currentDilatationText}>{text} ({dilatationString} cm)</Text>
      <View style={styles.visualizerContent}>
        <View style={styles.visualizerLeft}>
          <Progress.Circle
            size={size}
            progress={progress}
            showsText={true}
            color="#03A9F4"
            thickness={size * 0.08}
            unfilledColor="#E1F5FE"
            formatText={() => `${dilatationString} cm`}
            textStyle={styles.circleText}
          />
        </View>

        <View style={styles.visualizerRight}>
          <Text style={styles.metaphorLabel}>Visualisasi Ukuran:</Text>
          <Text style={styles.metaphorText}>{metaphor}</Text>
          <View style={styles.captionBox}>
            <Ionicons name="sparkles" size={18} color="#03A9F4" />
            <Text style={styles.captionText}>{caption}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};


/* ===================== DJJ STATUS CARD ===================== */

const DjjStatusCard = ({ djj, djjStatus }) => {
  const isDanger = djjStatus.color === '#F44336';
  const isNormal = djjStatus.color === '#4CAF50';
  const backgroundColor = isDanger ? '#FFEBEE' : isNormal ? '#E8F5E9' : '#FFF3E0';
  const borderColor = djjStatus.color;
  const iconColor = isDanger ? '#F44336' : isNormal ? '#4CAF50' : '#FF9800';

  return (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionTitle}>Status Detak Jantung Janin</Text>
      <View style={[styles.djjCard, { backgroundColor, borderColor }]}>

        {/* Header (Status Normal/Gawat Janin) - PERBAIKAN: Rata Kiri */}
        <View style={styles.djjHeader}>
          <Ionicons name="heart-circle" size={30} color={iconColor} />
          <Text style={[styles.djjZoneTitle, { color: iconColor, marginLeft: 8 }]}>
            STATUS: {(djjStatus.text || '').toUpperCase()} 
          </Text>
        </View>

        {/* Konten (Nilai dan Keterangan) - PERBAIKAN: Rata Kiri */}
        <View style={styles.djjContent}>
            <View style={styles.djjValueContainer}>
                <Text style={styles.djjValue}>
                    {cleanNumberString(djj)}
                </Text>
                <Text style={styles.djjUnit}>bpm</Text>
            </View>
            <Text style={styles.djjMessage}>{djjStatus.message}</Text>
        </View>
      </View>
    </View>
  );
};
// ...

/* ===================== IBU STATUS CARD (BARU) ===================== */

const IbuStatusCard = ({ sistolik, diastolik, nadi, suhu }) => {
    const ibuStatus = getIbuStatus(sistolik, diastolik, nadi, suhu);
    const isNormal = ibuStatus.color === '#4CAF50';
    const backgroundColor = ibuStatus.color === '#BDBDBD' ? '#F5F5F5' : isNormal ? '#E8F5E9' : ibuStatus.color === '#FFA000' ? '#FFF3E0' : '#FFEBEE';
    const borderColor = ibuStatus.color;
    const iconColor = ibuStatus.color;
    
    // Nilai state sudah berupa string yang siap dirender
    const tensiText = `${sistolik}/${diastolik} mmHg`;
    const nadiText = `${nadi} bpm`;
    const suhuText = `${suhu} °C`;


    return (
        <View style={styles.sectionWrapper}>
            <Text style={styles.sectionTitle}>Status Kesehatan Ibu</Text>
            <View style={[styles.ibuCard, { backgroundColor, borderColor }]}>

                {/* Header (Kondisi: Normal/Perlu Perhatian) - PERBAIKAN: Rata Kiri */}
                <View style={styles.djjHeader}>
                    <Ionicons name={isNormal ? "checkmark-circle" : "alert-circle"} size={30} color={iconColor} />
                    <Text style={[styles.djjZoneTitle, { color: iconColor, marginLeft: 8 }]}>
                        KONDISI: {(ibuStatus.status || 'N/A').toUpperCase()}
                    </Text>
                </View>

                <Text style={[styles.djjMessage, {marginTop: 4}]}>{ibuStatus.message}</Text>

                {/* Tampilkan detail hanya jika status TIDAK normal atau Belum Lengkap */}
                {ibuStatus.status !== 'NORMAL' && (
                    <View style={styles.detailContainer}>
                        <Text style={styles.detailTitle}>Detail Data Vital (Dicatat Bidan):</Text>
                        
                        {/* Tensi */}
                        <View style={styles.detailRow}>
                            <Feather name="activity" size={16} color={ibuStatus.detail.tensi?.color || '#007bff'} />
                            <Text style={styles.detailText}>Tensi: <Text style={{fontWeight: ibuStatus.detail.tensi ? 'bold' : 'normal'}}>{tensiText}</Text></Text>
                        </View>
                        
                        {/* Nadi */}
                        <View style={styles.detailRow}>
                            <Ionicons name="pulse" size={16} color={ibuStatus.detail.nadi?.color || '#f44336'} />
                            <Text style={styles.detailText}>Nadi: <Text style={{fontWeight: ibuStatus.detail.nadi ? 'bold' : 'normal'}}>{nadiText}</Text></Text>
                        </View>
                        
                        {/* Suhu */}
                        <View style={styles.detailRow}>
                            <FontAwesome name="thermometer-half" size={16} color={ibuStatus.detail.suhu?.color || '#ff5722'} />
                            <Text style={styles.detailText}>Suhu: <Text style={{fontWeight: ibuStatus.detail.suhu ? 'bold' : 'normal'}}>{suhuText}</Text></Text>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};


/* ===================== HEADER TOP ===================== */

const HeaderTop = ({ pasienName }) => (
  <View style={styles.headerTopContainer}>
    <View style={styles.headerLeft}>
      <MaterialCommunityIcons
        name="stethoscope"
        size={50}
        color="#03A9F4" // Biru yang lebih menonjol
        style={styles.logoStethoscope}
      />
      <View>
        <Text style={styles.logoTitle}>Ruang</Text>
        <Text style={styles.logoTitleBlue}>Bunda</Text>
      </View>
    </View>

    <TouchableOpacity style={styles.notificationButton}>
      <Ionicons name="notifications-outline" size={26} color="black" />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>2</Text>
      </View>
    </TouchableOpacity>
  </View>
);



const HeaderGradient = ({ pasienName }) => (
  <LinearGradient
    colors={['#E1F5FE', '#ffffff']} 
    start={[0, 0]}
    end={[0, 1]}
    style={styles.headerGradient}
  >
    <Text style={styles.haloText}>Halo, {pasienName}</Text>
  </LinearGradient>
);

/* ===================== MIDWIFE CARD ===================== */

const MidwifeCard = ({ bidanName, activePhase, waktuCatat }) => (
  <View style={styles.midwifeCardWrapper}>
    <View style={styles.midwifeCard}>
      <View style={styles.midwifeRow}>
        <FontAwesome name="user-circle" size={44} color="#007bff" />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={styles.midwifeLabel}>Ditangani oleh</Text>
          <Text style={styles.midwifeName}>{bidanName}</Text>
        </View>
        <View style={styles.activeIndicatorContainer}>
          <Text style={styles.activeText}>Aktif</Text>
          <View style={styles.activeIndicator} />
        </View>
      </View>

      <View style={styles.stageNote}>
        <Feather name="info" size={16} color="#007bff" />
        <Text style={styles.stageText}>
          Anda sedang dalam tahap <Text style={styles.activePhaseTextBold}>{activePhase}</Text> persalinan
        </Text>
      </View>

      <View style={styles.timeNote}>
        <Feather name="clock" size={16} color="#333" />
        <Text style={styles.timeText}>
          Data terakhir dicatat pada: <Text style={styles.timeBold}>{extractTime(waktuCatat)}</Text>
        </Text>
      </View>
    </View>
  </View>
);

const TabBarItem = ({ iconName, label, isFocused, onPress }) => (
  <TouchableOpacity
    style={styles.tabItem}
    onPress={onPress}
  >
    {isFocused ? (
      <View style={{ alignItems: 'center' }}>
        <MaterialCommunityIcons name={iconName} size={26} color="#03A9F4" />
        <Text style={styles.tabLabelFocused}>{label}</Text>
      </View>
    ) : (
      <View style={{ alignItems: 'center' }}>
        <MaterialCommunityIcons name={iconName} size={26} color="#8e8e93" />
        <Text style={styles.tabLabel}>{label}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const BottomTabBar = ({ navigate }) => (
  <View style={styles.tabBarContainer}>

    <TabBarItem
      iconName="home"
      label="Home"
      isFocused={true}
      onPress={() => navigate('/home')}
    />

    {/* PERUBAHAN DI SINI: navigate ke '/pesan' */}
    <TabBarItem
      iconName="message-text"
      label="Pesan"
      isFocused={false}
      onPress={() => navigate('/pesan')} 
    />

    <TabBarItem
      iconName="book-open-page-variant"
      label="Edukasi"
      isFocused={false}
      onPress={() => navigate('/edukasi')} 
    />

    <TabBarItem
      iconName="account-circle"
      label="Profil"
      isFocused={false}
      onPress={() => navigate('/profile')}
    />
  </View>
);


export default function MainScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pasienName, setPasienName] = useState('');

  const [bidanName, setBidanName] = useState('Memuat Bidan...');
  const [pembukaan, setPembukaan] = useState(0);

  const [djj, setDjj] = useState(0);
  const [sistolik, setSistolik] = useState('---');
  const [diastolik, setDiastolik] = useState('---');
  const [nadi, setNadi] = useState('---');
  const [suhu, setSuhu] = useState('---');

  const [waktuCatat, setWaktuCatat] = useState('');

  const [djjStatus, setDjjStatus] = useState({ text: '', color: '#9E9E9E', message: 'Memuat...' });
  const navigate = useNavigate();

  const fetchBidanData = async (pasienId, token) => {
    try {
      const BIDAN_URL = `${BASE_URL_PATIENT}/${pasienId}/bidanId`;
      const res = await fetch(BIDAN_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();

      if (json.bidan_nama) {
        setBidanName(json.bidan_nama.trim() || 'Bidan');
      } else {
        setBidanName('Bidan Tidak Ditemukan');
      }
    } catch (err) {
      console.log('ERROR FETCH BIDAN:', err.message);
      setBidanName('Error Memuat Bidan');
    }
  };

const fetchPartografData = async (pasienId, token) => {
    try {
      // URL diubah untuk mengambil SEMUA riwayat catatan partograf
      const PARTOGRAF_URL = `${BASE_URL_PATIENT}/${pasienId}/catatan-partograf`;
      const res = await fetch(PARTOGRAF_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorJson = await res.json();
        const errorMessage = errorJson.message || 'Unknown error';

        // Penanganan Error Khusus untuk Data Belum Ditemukan
        if (errorMessage.includes('Belum ada catatan partograf') || res.status === 404) {
              // Log sebagai WARNING dan set state ke default, lalu return.
            console.log('WARNING FETCH PARTOGRAF:', errorMessage);
            
            setPembukaan(0);
            setDjj(0);
            setSistolik('---'); setDiastolik('---');
            setNadi('---'); setSuhu('---');
            setWaktuCatat('---');
            setDjjStatus(getDjjStatus(0));
            return; 
        }

        throw new Error(`Partograf fetch failed: ${errorMessage}`);
      }

      const json = await res.json();
      const dataArray = json.data;

      if (!dataArray || dataArray.length === 0) {
        setPembukaan(0);
        setDjj(0);
        setSistolik('---'); setDiastolik('---');
        setNadi('---'); setSuhu('---');
        setWaktuCatat('---');
        setDjjStatus(getDjjStatus(0));
        return;
      }

      const latestData = getLatestFilledPartografData(dataArray);

      if (!latestData) {
        throw new Error("Could not process latest Partograph data.");
      }

      setPembukaan(parseFloat(latestData.pembukaan_servik) || 0);
      setDjj(parseFloat(latestData.djj) || 0);

      setSistolik(cleanNumberString(latestData.sistolik));
      setDiastolik(cleanNumberString(latestData.diastolik));
      setNadi(cleanNumberString(latestData.nadi_ibu));
      setSuhu(cleanNumberString(latestData.suhu_ibu, true)); 

      setWaktuCatat(latestData.waktu_catat || '---');

      setDjjStatus(getDjjStatus(latestData.djj));
    } catch (err) {
      console.log('ERROR FETCH PARTOGRAF:', err.message);
      setPembukaan(0);
      setDjj(0);
      setSistolik('---'); setDiastolik('---');
      setNadi('---'); setSuhu('---');
      setWaktuCatat('---');
      setDjjStatus(getDjjStatus(0));
    }
  };

  const fetchData = useCallback(async () => {
    const isInitialLoad = loading && !refreshing;

    try {
      if (!isInitialLoad) {
        setRefreshing(true);
      }

      const token = await getTokenFromStorage();
      if (!token) {
        console.log('No token found, navigating to login'); 
        navigate('/login');
        return;
      }

      const { pasienId, pasienName } = decodeJwtPayload(token);
      setPasienName(pasienName);

      await Promise.all([
        fetchBidanData(pasienId, token),
        fetchPartografData(pasienId, token)
      ]);

    } catch (err) {
      console.log('GENERAL ERROR:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, refreshing, navigate]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);


  if (loading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color="#03A9F4" />
        <Text>Memuat data...</Text>
      </View>
    );
  }

  // Menentukan tahap persalinan
  const activePhase = getDilatationPhase(pembukaan);

  return (
    <View style={styles.containerFixed}>
      <ScrollView
        style={styles.scrollViewContent}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#03A9F4"
            colors={["#03A9F4"]}
          />
        }
      >

        {/* HEADER ATAS */}
        <HeaderTop pasienName={pasienName} />

        {/* GRADIENT */}
        <HeaderGradient pasienName={pasienName} />

        {/* CARD BIDAN */}
        <MidwifeCard
          bidanName={bidanName}
          activePhase={activePhase}
          waktuCatat={waktuCatat}
        />

        {/* VISUALISASI PEMBUKAAN (FOKUS 1) */}
        <DilatationVisualizer pembukaan={pembukaan} />

        {/* DJJ STATUS CARD (FOKUS 2 - STATUS AMAN/BAHAYA) */}
        <DjjStatusCard djj={djj} djjStatus={djjStatus} />

        {/* IBU STATUS CARD (FOKUS 3 - STATUS KESEHATAN IBU DENGAN BAHASA AWAM) */}
        <IbuStatusCard
            sistolik={sistolik}
            diastolik={diastolik}
            nadi={nadi}
            suhu={suhu}
        />

      </ScrollView>

      <BottomTabBar navigate={navigate} />
    </View>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  containerFixed: {
    flex: 1,
    backgroundColor: '#F5F5F5', 
  },
  scrollViewContent: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingBottom: 60,
  },

  // Header Styles
  headerTopContainer: {
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 0,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoStethoscope: {
    marginRight: 8,
  },

  logoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    lineHeight: 20,
  },

  logoTitleBlue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#03A9F4', 
    lineHeight: 20,
  },

  notificationButton: {
    position: 'relative',
  },

  badge: {
    position: 'absolute',
    right: -6,
    top: -4,
    backgroundColor: '#F44336',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },

  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  headerGradient: {
    paddingHorizontal: 0,
    paddingVertical: 22,
    paddingBottom: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    marginTop: -10,
    zIndex: -1,
  },

  haloText: {
    fontSize: 19,
    fontWeight: '600',
    color: '#000',
    paddingHorizontal: 20,
  },

  midwifeCardWrapper: {
    marginTop: -40,
    paddingHorizontal: 18,
  },

  midwifeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  midwifeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  midwifeLabel: {
    fontSize: 13,
    color: '#777',
      lineHeight: 18,
  },

  midwifeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
      lineHeight: 20,
  },

  activeIndicatorContainer: {
    alignItems: 'center',
  },

  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginTop: 2,
  },

  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },

  stageNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  stageText: {
    marginLeft: 4,
    color: '#555',
    fontSize: 14,
    lineHeight: 18,
  },

  activePhaseTextBold: {
    fontWeight: '700',
    color: '#03A9F4',
  },

  timeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    marginLeft: 4,
    color: '#777',
    fontSize: 12,
  },
  timeBold: {
    fontWeight: '700',
    color: '#333',
    fontSize: 13,
  },

  dilatationVisualizerContainer: {
    marginTop: 30,
    marginBottom: 30,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    marginHorizontal: 18,
    shadowColor: '#03A9F4',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E1F5FE',
  },
  visualizerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#03A9F4',
    marginBottom: 5,
    textAlign: 'center',
  },
  currentDilatationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 15,
  },
  visualizerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  visualizerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualizerRight: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
  },
  circleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#03A9F4',
  },
  metaphorLabel: {
    fontSize: 14,
    color: '#777',
    marginBottom: 2,
  },
  metaphorText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 10,
  },
  captionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E1F5FE', 
    padding: 12,
    borderRadius: 12,
  },
  captionText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#004c8c',
    flexShrink: 1,
    lineHeight: 18,
  },

  sectionWrapper: {
    paddingHorizontal: 18,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  djjCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  ibuCard: { 
    padding: 18,
    borderRadius: 18,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  djjHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  djjZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

    djjContent: {
        alignItems: 'flex-start', 
        paddingLeft: 4,
    },

    djjValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 2,
        marginTop: 4,
    },
  djjValue: {
    fontSize: 42,
    fontWeight: '900',
    color: '#000',
  },
  djjUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4, // Sedikit jarak dari nilai angka
  },
  djjMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  detailContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },

  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 90 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },

  tabLabel: {
    fontSize: 11,
    color: '#8e8e93',
    marginTop: 2,
  },

  tabLabelFocused: {
    fontSize: 11,
    color: '#03A9F4', 
    fontWeight: '600',
    marginTop: 2,
  },

  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
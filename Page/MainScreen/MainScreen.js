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
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
  Feather,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// =================================================================
// ✨ Warna dan Konstanta Desain (Diambil dari file lain untuk KONSISTENSI) ✨
// =================================================================
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
  accentWarning: '#FFA000', 
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
  if (isNaN(value) || value === 0) return { text: 'N/A', color: COLORS.textSecondary, message: 'Detak jantung janin tidak tersedia/belum dicatat.' };

  if (value >= 110 && value <= 160) {
    return {
      text: 'Normal',
      color: COLORS.accentSuccess, 
      message: 'Detak jantung janin normal. Adek bayi sehat di dalam.',
    };
  }

  if (value < 110 || value > 160) {
    return {
      text: 'Gawat Janin',
      color: COLORS.accentError, 
      message: 'Detak jantung tidak stabil. Segera panggil Bidan/Dokter!',
    };
  }

  return { text: 'Memuat', color: COLORS.textSecondary, message: 'Memuat data...' };
};

const getDilatationPhase = (cm) => {
  const value = parseFloat(cm);
  if (isNaN(value) || value <= 3) return 'Fase Laten (0-3 cm)';
  if (value >= 4 && value <= 10) return 'Fase Aktif (4-10 cm)';
  if (value > 10) return 'Kala II (Lengkap)';
  return 'Fase Laten (0-3 cm)';
};

/**
 * Menghitung status kesehatan ibu berdasarkan data partograf terbaru.
 * Aturan Suhu: <35 Hipotermia, 35.0-37.5 Normal, >37.5 Demam.
 * @param {string} sistolik
 * @param {string} diastolik
 * @param {string} nadi_ibu
 * @param {string} suhu_ibu
 * @returns {object} { status, color, message, issues, detail }
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
            color: COLORS.textSecondary, // Abu-abu untuk N/A
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
            color: COLORS.accentError, 
            text: `Demam: Suhu ${h.toFixed(1)} °C`,
        };
    } else if (h < 35.0) {
        issues.push('Berpotensi Hipotermia');
        detail['suhu'] = {
            icon: 'thermometer-low',
            color: COLORS.darkBlue, // Biru tua untuk suhu rendah
            text: `Suhu Rendah: Suhu ${h.toFixed(1)} °C`,
        };
    }
    // 3. Cek Tekanan Darah
    if (s > 140 || d > 90) {
        issues.push('Hipertensi / Pre-eklampsia');
        detail['tensi'] = {
            icon: 'heart-pulse',
            color: COLORS.accentError,
            text: `Tensi Tinggi: ${s}/${d} mmHg`,
        };
    } else if (s < 90 || d < 60) {
        issues.push('Hipotensi');
        detail['tensi'] = {
            icon: 'heart-pulse',
            color: COLORS.darkBlue,
            text: `Tensi Rendah: ${s}/${d} mmHg`,
        };
    }
    // 4. Cek Nadi
    if (n > 120) {
        issues.push('Takikardia (Nadi Cepat)');
        detail['nadi'] = {
            icon: 'pulse',
            color: COLORS.accentError,
            text: `Nadi Cepat: ${n} bpm`,
        };
    } else if (n < 50) {
        issues.push('Bradikardia (Nadi Lambat)');
        detail['nadi'] = {
            icon: 'pulse',
            color: COLORS.darkBlue,
            text: `Nadi Lambat: ${n} bpm`,
        };
    }
    // 5. Penentuan Status Akhir
    if (issues.length > 0) {
        const isCritical = issues.some(i => i.includes('Hipertensi') || i.includes('Hipotensi') || i.includes('Takikardia') || i.includes('Demam'));
        return {
            status: isCritical ? 'PERLU WASPADA' : 'PERLU PERHATIAN',
            color: isCritical ? COLORS.accentError : COLORS.accentWarning, // Merah atau Oranye
            message: `Terdapat ${issues.length} potensi masalah: ${issues.join(', ')}. Segera hubungi Bidan Anda.`,
            issues: issues,
            detail: detail,
        };
    } else {
        // Jika semua TTV normal
        return {
            status: 'NORMAL',
            color: COLORS.accentSuccess, // Hijau
            message: 'Kondisi Tanda-tanda Vital Ibu Baik. Tetap jaga kesehatan.',
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
                    if (numValue < 0 || isNaN(numValue)) continue; 
                }

                if (key === 'suhu_ibu') {
                    const numValue = parseFloat(value);
                    if (numValue < 30.0 || isNaN(numValue)) continue; 
                }
                
                // Khusus Pembukaan, jika nilainya "0" (asli dari DB) atau N/A, lanjutkan
                if (key === 'pembukaan_servik') {
                     const numValue = parseFloat(value);
                     if (numValue === 0) continue; 
                }


                filledData[key] = value;
            }
        }
    }
    
    // Perbarui waktu catat dengan data terbaru, terlepas apakah field lain null
    if (sortedData.length > 0) {
        filledData['waktu_catat'] = sortedData[0]['waktu_catat'] || '---';
    }


    return filledData;
};


/* ===================== VISUALISASI PEMBUKAAN ===================== */

const DILATATION_METAPHORS = [
  { cm: 0, text: 'Fase Laten', metaphor: 'Ujung Jari', caption: 'Jalan lahir masih dalam fase awal, Bunda bisa beristirahat.', progress: 0.1, icon: 'bed-outline' },
  { cm: 4, text: 'Fase Aktif Awal', metaphor: 'Jeruk Nipis (Irisan)', caption: 'Pembukaan aktif dimulai. Fokus pada pernapasan.', progress: 0.4, icon: 'walk-outline' },
  { cm: 5, text: 'Fase Aktif', metaphor: 'Buah Kiwi', caption: 'Hampir setengah jalan! Terus bergerak dan bernapas.', progress: 0.5, icon: 'hourglass-half-outline' },
  { cm: 6, text: 'Fase Aktif Lanjut', metaphor: 'Kue Marie / Kuki', caption: 'Lebih dari setengah jalan! Pertahankan fokus dan energi.', progress: 0.6, icon: 'heart-circle-outline' },
  { cm: 7, text: 'Fase Transisi', metaphor: 'Tomat Merah', caption: 'Masa transisi yang intens. Ingat tujuan Bunda!', progress: 0.7, icon: 'flash-outline' },
  { cm: 8, text: 'Fase Transisi', metaphor: 'Jeruk Sunkist / Apel', caption: 'Pembukaan semakin cepat. Anda hebat!', progress: 0.8, icon: 'fast-food-outline' },
  { cm: 9, text: 'Fase Transisi Akhir', metaphor: 'Donat', caption: 'Sedikit lagi, hampir sempurna!', progress: 0.9, icon: 'cloud-done-outline' },
  { cm: 10, text: 'Kala II', metaphor: 'Kepala Bayi / Semangka Kecil', caption: 'Pembukaan Lengkap! Siap mengejan sesuai aba-aba Bidan.', progress: 1.0, icon: 'happy-outline' },
];

/**
 * Komponen untuk menampilkan visualisasi pembukaan serviks berdasarkan cm.
 */
const DilatationVisualizer = ({ pembukaan }) => {
  // Pastikan pembukaan adalah string aman
  const dilatation = parseFloat(pembukaan);
  const dilatationString = (isNaN(dilatation) || dilatation < 0) ? '---' : dilatation.toFixed(1).replace('.0', '');
  const displayCm = (isNaN(dilatation) || dilatation < 0) ? 'N/A' : `${dilatationString} cm`;


  let closestDilatation = DILATATION_METAPHORS[0];

  if (dilatation >= 4) {
    const sortedMetaphors = DILATATION_METAPHORS.filter(m => m.cm >= 4).sort((a, b) => b.cm - a.cm);
    const currentMetaphor = sortedMetaphors.find(m => dilatation >= m.cm) || DILATATION_METAPHORS[1];
    closestDilatation = currentMetaphor;

    if (dilatation >= 10) {
        closestDilatation = DILATATION_METAPHORS.find(m => m.cm === 10);
    }
  }

  // Jika data tidak tersedia atau 0, gunakan metadata 0.
  if (isNaN(dilatation) || dilatation <= 0) {
      closestDilatation = DILATATION_METAPHORS[0];
  }


  const { text, metaphor, caption, icon } = closestDilatation;
  const progress = Math.min(dilatation / 10, 1);
  const size = width * 0.40;
  const progressColor = (dilatation >= 10) ? COLORS.accentSuccess : COLORS.primaryBlue;

  return (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionTitle}>👶 Fase Persalinan Bayi</Text>
      <View style={[styles.dilatationVisualizerContainer, SHADOW_STYLE]}>
        
        <View style={styles.visualizerContent}>
          <View style={styles.visualizerLeft}>
            <Progress.Circle
              size={size}
              progress={progress}
              showsText={true}
              color={progressColor}
              thickness={size * 0.08}
              unfilledColor={COLORS.lightBlue}
              formatText={() => displayCm}
              textStyle={styles.circleText}
            />
          </View>

          <View style={styles.visualizerRight}>
            <Text style={styles.metaphorLabel}>Tahap Saat Ini:</Text>
            <Text style={styles.metaphorText}>{text}</Text>
            
            <View style={styles.stageNote}>
                <Ionicons name={icon} size={18} color={COLORS.darkBlue} />
                <Text style={styles.stageTextDetail}>{caption}</Text>
            </View>

            <View style={styles.metaphorBox}>
              <Text style={styles.metaphorTitle}>Visualisasi Pembukaan</Text>
              <Text style={styles.metaphorValue}>{metaphor}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};


/* ===================== DJJ STATUS CARD ===================== */

const DjjStatusCard = ({ djj, djjStatus }) => {
  const isDanger = djjStatus.color === COLORS.accentError;
  const isNormal = djjStatus.color === COLORS.accentSuccess;
  const isNA = djjStatus.color === COLORS.textSecondary;
  
  const backgroundColor = isDanger ? COLORS.accentError + '10' : isNormal ? COLORS.accentSuccess + '10' : COLORS.offWhite;
  const borderColor = djjStatus.color;
  const iconColor = djjStatus.color;

  return (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionTitle}>🫀 Status Detak Jantung Janin</Text>
      <View style={[styles.statusCard, { backgroundColor, borderColor }]}>

        {/* Header (Status Normal/Gawat Janin) */}
        <View style={styles.statusHeader}>
          <Ionicons name="heart-circle" size={30} color={iconColor} />
          <Text style={[styles.statusZoneTitle, { color: iconColor, marginLeft: 8 }]}>
            STATUS: {(djjStatus.text || '').toUpperCase()} 
          </Text>
        </View>

        {/* Konten (Nilai dan Keterangan) */}
        <View style={styles.statusContent}>
            <View style={styles.statusValueContainer}>
                <Text style={styles.statusValue}>
                    {cleanNumberString(djj)}
                </Text>
                <Text style={styles.statusUnit}>bpm</Text>
            </View>
            <Text style={[styles.statusMessage, isNA && {fontStyle: 'italic'}]}>{djjStatus.message}</Text>
        </View>
      </View>
    </View>
  );
};
// ...

/* ===================== IBU STATUS CARD (BARU) ===================== */

const IbuStatusCard = ({ sistolik, diastolik, nadi, suhu }) => {
    const ibuStatus = getIbuStatus(sistolik, diastolik, nadi, suhu);
    const isNormal = ibuStatus.color === COLORS.accentSuccess;
    const isNA = ibuStatus.color === COLORS.textSecondary;
    
    const backgroundColor = isNA ? COLORS.offWhite : isNormal ? COLORS.accentSuccess + '10' : ibuStatus.color === COLORS.accentWarning ? COLORS.accentWarning + '10' : COLORS.accentError + '10';
    const borderColor = ibuStatus.color;
    const iconColor = ibuStatus.color;
    
    const tensiText = `${cleanNumberString(sistolik)}/${cleanNumberString(diastolik)} mmHg`;
    const nadiText = `${cleanNumberString(nadi)} bpm`;
    const suhuText = `${cleanNumberString(suhu, true)} °C`;

    return (
        <View style={styles.sectionWrapper}>
            <Text style={styles.sectionTitle}>👩‍⚕️ Status Kesehatan Ibu</Text>
            <View style={[styles.statusCard, { backgroundColor, borderColor }]}>

                {/* Header (Kondisi: Normal/Perlu Perhatian) */}
                <View style={styles.statusHeader}>
                    <Ionicons name={isNormal ? "checkmark-circle" : "alert-circle"} size={30} color={iconColor} />
                    <Text style={[styles.statusZoneTitle, { color: iconColor, marginLeft: 8 }]}>
                        KONDISI: {(ibuStatus.status || 'N/A').toUpperCase()}
                    </Text>
                </View>

                <Text style={[styles.statusMessage, {marginTop: 4, marginBottom: 10}, isNA && {fontStyle: 'italic'}]}>{ibuStatus.message}</Text>

                {/* KONDISI BARU: Tampilkan detail TTV hanya jika status TIDAK NORMAL */}
                {
                  !isNormal && !isNA && (
                      <View style={styles.detailContainer}>
                          <Text style={styles.detailTitle}>Detail Masalah Tanda-tanda Vital:</Text>
                          
                          {/* Tensi */}
                          <View style={styles.detailRow}>
                              <Feather name="activity" size={16} color={ibuStatus.detail.tensi?.color || COLORS.primaryBlue} />
                              <Text style={styles.detailText}>
                                  Tensi: 
                                  <Text style={{fontWeight: ibuStatus.detail.tensi ? 'bold' : 'normal', color: ibuStatus.detail.tensi?.color || COLORS.textPrimary}}>
                                      {tensiText}
                                  </Text>
                              </Text>
                          </View>
                          
                          {/* Nadi */}
                          <View style={styles.detailRow}>
                              <Ionicons name="pulse-outline" size={16} color={ibuStatus.detail.nadi?.color || COLORS.primaryBlue} />
                              <Text style={styles.detailText}>
                                  Nadi: 
                                  <Text style={{fontWeight: ibuStatus.detail.nadi ? 'bold' : 'normal', color: ibuStatus.detail.nadi?.color || COLORS.textPrimary}}>
                                      {nadiText}
                                  </Text>
                              </Text>
                          </View>
                          
                          {/* Suhu */}
                          <View style={styles.detailRow}>
                              <FontAwesome name="thermometer-half" size={16} color={ibuStatus.detail.suhu?.color || COLORS.primaryBlue} />
                              <Text style={styles.detailText}>
                                  Suhu: 
                                  <Text style={{fontWeight: ibuStatus.detail.suhu ? 'bold' : 'normal', color: ibuStatus.detail.suhu?.color || COLORS.textPrimary}}>
                                      {suhuText}
                                  </Text>
                              </Text>
                          </View>
                      </View>
                  )
                }
                
                {
                   isNA && (
                      <View style={[styles.detailContainer, {borderTopWidth: 0, marginTop: 0}]}>
                         <Text style={[styles.detailTitle, {fontStyle: 'italic'}]}>Data TTV terakhir (dicatat Bidan) tidak tersedia atau belum lengkap.</Text>
                      </View>
                   )
                }
                

            </View>
        </View>
    );
};
/* ===================== HEADER TOP ===================== */
const HeaderTop = () => (
  <View style={styles.headerTopContainer}>
    <View style={styles.headerLeft}>
      <MaterialCommunityIcons
        name="stethoscope"
        size={40}
        color={COLORS.darkBlue} 
        style={styles.logoStethoscope}
      />
      <View>
        <Text style={styles.logoTitle}>Ruang</Text>
        <Text style={styles.logoTitleBlue}>Bunda</Text>
      </View>
    </View>

    <TouchableOpacity style={styles.notificationButton}>
      <Ionicons name="notifications-outline" size={26} color={COLORS.textPrimary} />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>2</Text>
      </View>
    </TouchableOpacity>
  </View>
);

const HeaderGradient = ({ pasienName }) => (
  <LinearGradient
    colors={[COLORS.lightBlue, COLORS.white]} 
    start={[0, 0]}
    end={[0, 1]}
    style={styles.headerGradient}
  >
    <Text style={styles.haloText}>Halo, {pasienName}</Text>
    <Text style={styles.welcomeSubtitle}>Selamat datang kembali di dashboard pemantauan persalinan.</Text>
  </LinearGradient>
);

/* ===================== MIDWIFE CARD ===================== */
const MidwifeCard = ({ bidanName, activePhase, waktuCatat }) => (
  <View style={styles.midwifeCardWrapper}>
    <View style={[styles.midwifeCard, SHADOW_STYLE]}>
      <View style={styles.midwifeRow}>
        <FontAwesome name="user-circle" size={44} color={COLORS.primaryBlue} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.midwifeLabel}>Ditangani oleh Bidan:</Text>
          <Text style={styles.midwifeName}>{bidanName}</Text>
        </View>
        <View style={styles.activeIndicatorContainer}>
          <Text style={styles.activeText}>Aktif</Text>
          <View style={styles.activeIndicator} />
        </View>
      </View>

      <View style={styles.stageNoteMidwife}>
        <Feather name="info" size={16} color={COLORS.darkBlue} />
        <Text style={styles.stageText}>
          Anda dalam: <Text style={styles.activePhaseTextBold}>{activePhase}</Text>
        </Text>
      </View>

      <View style={styles.timeNote}>
        <Feather name="clock" size={16} color={COLORS.textSecondary} />
        <Text style={styles.timeText}>
          Data terakhir dicatat: <Text style={styles.timeBold}>{extractTime(waktuCatat)}</Text>
        </Text>
      </View>
    </View>
  </View>
);

/* ===================== BOTTOM TAB BAR ===================== */
const TabBarItem = ({ iconName, label, isFocused, onPress }) => (
  <TouchableOpacity
    style={styles.tabItem}
    onPress={onPress}
  >
    <View style={{ alignItems: 'center' }}>
      <MaterialCommunityIcons 
        name={iconName} 
        size={26} 
        color={isFocused ? COLORS.primaryBlue : COLORS.textSecondary} 
      />
      <Text style={isFocused ? styles.tabLabelFocused : styles.tabLabel}>{label}</Text>
    </View>
  </TouchableOpacity>
);

const BottomTabBar = ({ navigate }) => (
  <View style={[styles.tabBarContainer, SHADOW_STYLE]}>

    <TabBarItem
      iconName="home"
      label="Home"
      isFocused={true}
      onPress={() => navigate('/home')}
    />

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

  const [djjStatus, setDjjStatus] = useState({ text: 'Memuat', color: COLORS.textSecondary, message: 'Memuat...' });
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

      // Fungsi helper untuk reset state ke default/kosong
      const resetPartografState = (message) => {
          console.log(message);
          setPembukaan(0);
          setDjj(0);
          setSistolik('---'); setDiastolik('---');
          setNadi('---'); setSuhu('---');
          setWaktuCatat('---');
          setDjjStatus(getDjjStatus(0));
      }

      if (!res.ok) {
        const errorJson = await res.json();
        const errorMessage = errorJson.message || 'Unknown error';

        if (errorMessage.includes('Belum ada catatan partograf') || res.status === 404) {
             resetPartografState('WARNING FETCH PARTOGRAF: Data partograf belum tersedia.');
             return; 
        }

        throw new Error(`Partograf fetch failed: ${errorMessage}`);
      }

      const json = await res.json();
      const dataArray = json.data;

      if (!dataArray || dataArray.length === 0) {
        resetPartografState('WARNING FETCH PARTOGRAF: Data partograf kosong dari API.');
        return;
      }

      const latestData = getLatestFilledPartografData(dataArray);

      if (!latestData) {
        resetPartografState("Could not process latest Partograph data.");
        return;
      }

      // Pastikan nilai dikonversi dengan benar, menggunakan nilai mentah jika '---' atau 'N/A'
      const rawPembukaan = parseFloat(latestData.pembukaan_servik) || 0;
      const rawDjj = parseFloat(latestData.djj) || 0;
      
      setPembukaan(rawPembukaan);
      setDjj(rawDjj);

      setSistolik(cleanNumberString(latestData.sistolik));
      setDiastolik(cleanNumberString(latestData.diastolik));
      setNadi(cleanNumberString(latestData.nadi_ibu));
      setSuhu(cleanNumberString(latestData.suhu_ibu, true)); 

      setWaktuCatat(latestData.waktu_catat || '---');

      setDjjStatus(getDjjStatus(rawDjj));
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
        <ActivityIndicator size="large" color={COLORS.primaryBlue} />
        <Text style={styles.loadingText}>Memuat data dashboard...</Text>
      </View>
    );
  }

  // Menentukan tahap persalinan
  const activePhase = getDilatationPhase(pembukaan);

  return (
    <View style={styles.containerFixed}>
      <ScrollView
        style={styles.scrollViewContent}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primaryBlue}
            colors={[COLORS.primaryBlue]}
          />
        }
      >

        {/* HEADER ATAS (LOGO & NOTIF) */}
        <HeaderTop />

        {/* GRADIENT & WELCOME */}
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
        
        <View style={{height: 20}} />

      </ScrollView>

      <BottomTabBar navigate={navigate} />
    </View>
  );
}
/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  containerFixed: {
    flex: 1,
    backgroundColor: COLORS.offWhite, 
  },
  scrollViewContent: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },

  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  // Header Styles
  headerTopContainer: {
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    ...SHADOW_STYLE, 
    marginBottom: 0,
    zIndex: 10, 
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoStethoscope: {
    marginRight: 8,
  },

  logoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },

  logoTitleBlue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primaryBlue, 
    lineHeight: 22,
  },

  notificationButton: {
    position: 'relative',
    padding: 5,
  },

  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: COLORS.accentError,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },

  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 50, 
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    marginTop: -10, 
    zIndex: 1, 
  },

  haloText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  midwifeCardWrapper: {
    marginTop: -40,
    paddingHorizontal: 18,
    zIndex: 5, 
  },

  midwifeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  midwifeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  midwifeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  midwifeName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.darkBlue,
    lineHeight: 22,
  },

  activeIndicatorContainer: {
    alignItems: 'center',
    marginLeft: 10,
  },

  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accentSuccess,
    marginTop: 2,
  },

  activeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentSuccess,
  },

  stageNoteMidwife: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  stageText: {
    marginLeft: 8,
    color: COLORS.textPrimary,
    fontSize: 14,
    lineHeight: 18,
  },

  activePhaseTextBold: {
    fontWeight: '700',
    color: COLORS.primaryBlue,
  },

  timeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    marginLeft: 8,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  timeBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontSize: 13,
  },

  sectionWrapper: {
    paddingHorizontal: 18,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },

  dilatationVisualizerContainer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.lightBlue,
  },
  visualizerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    color: COLORS.darkBlue,
  },
  metaphorLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  metaphorText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.darkBlue,
    marginBottom: 10,
  },
  stageTextDetail: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.darkBlue,
    flexShrink: 1,
    lineHeight: 18,
  },
  metaphorBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  metaphorTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  metaphorValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },

  statusCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.border, 
    ...SHADOW_STYLE,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusZoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

    statusContent: {
        alignItems: 'flex-start', 
        paddingLeft: 4,
    },

    statusValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 2,
        marginTop: 4,
    },
  statusValue: {
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  statusUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4, 
  },
  statusMessage: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
    paddingLeft: 4,
  },
  detailContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
  },


  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: Platform.OS === 'ios' ? 90 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },

  tabLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  tabLabelFocused: {
    fontSize: 11,
    color: COLORS.primaryBlue, 
    fontWeight: '600',
    marginTop: 2,
  },
});
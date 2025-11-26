import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

export const { width } = Dimensions.get('window');

// =================================================================
// ✨ Warna dan Konstanta Desain
// =================================================================
export const COLORS = {
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

export const SHADOW_STYLE = {
  shadowColor: COLORS.shadow,
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.2, 
  shadowRadius: 6,
  elevation: 6,
};

export const BASE_URL_PATIENT = 'https://restful-api-bmc-production.up.railway.app/api/pasien';
export const ASYNC_STORAGE_KEY = 'userToken';

// Polyfill minimal atob untuk JWT decoding
if (typeof global.atob === 'undefined') {
  global.atob = (data) => Buffer.from(data, 'base64').toString('binary');
}

/* ===================== TOKEN + DECODE ===================== */
export const getTokenFromStorage = async () => {
  try {
    return await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
  } catch (e) {
    return null;
  }
};

export const decodeJwtPayload = (token) => {
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
export const cleanNumberString = (num, isDecimal = false) => {
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

export const extractTime = (dateTimeString) => {
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

export const getDjjStatus = (djj) => {
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

export const getDilatationPhase = (cm) => {
  const value = parseFloat(cm);
  if (isNaN(value) || value <= 3) return 'Fase Laten (0-3 cm)';
  if (value >= 4 && value <= 10) return 'Fase Aktif (4-10 cm)';
  if (value > 10) return 'Kala II (Lengkap)';
  return 'Fase Laten (0-3 cm)';
};

export const getIbuStatus = (sistolik, diastolik, nadi_ibu, suhu_ibu) => {
    const s = parseFloat(sistolik); 
    const d = parseFloat(diastolik); 
    const n = parseFloat(nadi_ibu); 
    const h = parseFloat(suhu_ibu); 

    const issues = [];
    let detail = {};

    // 1. Cek Data Belum Lengkap
    if (isNaN(s) || isNaN(d) || isNaN(n) || isNaN(h)) {
        return {
            status: 'DATA BELUM LENGKAP',
            color: COLORS.textSecondary, 
            message: 'Pastikan semua data tanda-tanda vital (TTV) terisi.',
            issues: ['Pastikan semua data tanda-tanda vital (TTV) terisi.'],
            detail: detail,
        };
    }
    // 2. Cek Suhu
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
            color: COLORS.darkBlue, 
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
            color: isCritical ? COLORS.accentError : COLORS.accentWarning, 
            message: `Terdapat ${issues.length} potensi masalah: ${issues.join(', ')}. Segera hubungi Bidan Anda.`,
            issues: issues,
            detail: detail,
        };
    } else {
        return {
            status: 'NORMAL',
            color: COLORS.accentSuccess, 
            message: 'Kondisi Tanda-tanda Vital Ibu Baik. Tetap jaga kesehatan.',
            issues: ['Kondisi Tanda-tanda Vital Ibu Baik.'],
            detail: detail,
        };
    }
};

export const getLatestFilledPartografData = (partografArray) => {
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
                
                if (key === 'pembukaan_servik') {
                      const numValue = parseFloat(value);
                      if (numValue === 0) continue; 
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
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW_STYLE, width } from '../utils/global';

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

const DilatationVisualizer = ({ pembukaan }) => {
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

const styles = StyleSheet.create({
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
  stageNote: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
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
});

export default DilatationVisualizer;
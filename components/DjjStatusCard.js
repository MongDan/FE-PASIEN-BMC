import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW_STYLE, cleanNumberString } from '../utils/global';

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
});

export default DjjStatusCard;
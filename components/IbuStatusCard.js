import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, Feather, FontAwesome } from '@expo/vector-icons';
import { COLORS, SHADOW_STYLE, getIbuStatus, cleanNumberString } from '../utils/global';

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
});

export default IbuStatusCard;
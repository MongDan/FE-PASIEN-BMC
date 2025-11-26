import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { COLORS, SHADOW_STYLE, extractTime } from '../utils/global';

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

const styles = StyleSheet.create({
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
});

export default MidwifeCard;
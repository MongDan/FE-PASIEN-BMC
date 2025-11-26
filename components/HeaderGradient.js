import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/global';

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

const styles = StyleSheet.create({
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
});

export default HeaderGradient;
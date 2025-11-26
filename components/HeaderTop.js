import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOW_STYLE } from '../utils/global';

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

const styles = StyleSheet.create({
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
});

export default HeaderTop;
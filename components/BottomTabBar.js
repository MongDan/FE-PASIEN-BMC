import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOW_STYLE } from '../utils/global';

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

const styles = StyleSheet.create({
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

export default BottomTabBar;
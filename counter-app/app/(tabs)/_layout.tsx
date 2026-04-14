import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import HamburgerMenu from '@/components/HamburgerMenu';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="segnalazioni" />
        <Tabs.Screen name="chiusura" />
        <Tabs.Screen name="fidelity" />
        <Tabs.Screen name="profilo" />
      </Tabs>

      <HamburgerMenu />
    </View>
  );
}

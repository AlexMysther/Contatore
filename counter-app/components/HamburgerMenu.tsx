import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNav } from '@/context/NavContext';

const MENU_ITEMS: { route: string; match: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { route: '/(tabs)/',             match: '/',              label: 'Home',         icon: 'home' },
  { route: '/(tabs)/segnalazioni', match: '/segnalazioni',  label: 'Segnalazioni', icon: 'warning' },
  { route: '/(tabs)/chiusura',     match: '/chiusura',      label: 'Chiusura',     icon: 'lock-closed' },
  { route: '/(tabs)/fidelity',     match: '/fidelity',      label: 'Fidelity',     icon: 'star' },
  { route: '/(tabs)/profilo',      match: '/profilo',       label: 'Profilo',      icon: 'person' },
];

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { hideNav } = useNav();

  if (hideNav) return null;

  const navigate = (route: string) => {
    setOpen(false);
    router.push(route as any);
  };

  return (
    <>
      {/* Bottone hamburger fisso in basso a destra */}
      <TouchableOpacity style={s.fab} onPress={() => setOpen(true)}>
        <View style={s.bar} />
        <View style={s.bar} />
        <View style={s.bar} />
      </TouchableOpacity>

      {/* Tendina */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.menu} onPress={e => e.stopPropagation()}>
            {MENU_ITEMS.map(item => {
              const isActive = pathname === item.match;
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[s.item, isActive && s.itemActive]}
                  onPress={() => navigate(item.route)}
                >
                  <Ionicons name={item.icon} size={22} color={isActive ? '#c0392b' : '#555'} />
                  <Text style={[s.itemLabel, isActive && s.itemLabelActive]}>{item.label}</Text>
                  {isActive && <View style={s.dot} />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  fab:      { position: 'absolute', bottom: 24, right: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: '#c0392b', justifyContent: 'center', alignItems: 'center', gap: 5, zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 8 },
  bar:      { width: 22, height: 2.5, backgroundColor: '#fff', borderRadius: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end', paddingBottom: 90, paddingHorizontal: 24 },
  menu:     { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10 },
  item:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  itemActive:      { backgroundColor: '#fdecea' },
  itemIcon:        {},
  itemLabel:       { fontSize: 17, color: '#1a1a1a', flex: 1 },
  itemLabelActive: { color: '#c0392b', fontWeight: '700' },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#c0392b' },
});

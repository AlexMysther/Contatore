import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNav } from '@/context/NavContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MENU_ITEMS: { route: string; match: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { route: '/(tabs)/',             match: '/',              label: 'Home',         icon: 'home' },
  { route: '/(tabs)/segnalazioni', match: '/segnalazioni',  label: 'Segnalazioni', icon: 'warning' },
  { route: '/(tabs)/chiusura',     match: '/chiusura',      label: 'Chiusura',     icon: 'lock-closed' },
  { route: '/(tabs)/fidelity',     match: '/fidelity',      label: 'Fidelity',     icon: 'star' },
  { route: '/(tabs)/profilo',      match: '/profilo',       label: 'Profilo',      icon: 'person' },
];

export default function HamburgerMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { hideNav } = useNav();
  const insets = useSafeAreaInsets();

  if (hideNav) return null;

  return (
    <View style={[s.bar, { paddingBottom: insets.bottom || 8 }]}>
      {MENU_ITEMS.map(item => {
        const isActive = pathname === item.match;
        return (
          <TouchableOpacity
            key={item.route}
            style={s.item}
            onPress={() => router.push(item.route as any)}
          >
            <Ionicons name={item.icon} size={22} color={isActive ? '#fff' : 'rgba(255,255,255,0.5)'} />
            <Text style={[s.label, isActive && s.labelActive]}>{item.label}</Text>
            {isActive && <View style={s.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar:   { flexDirection: 'row', backgroundColor: '#c0392b', paddingTop: 10, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.15, shadowRadius: 6 },
  item:  { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  labelActive: { color: '#fff', fontWeight: '700' },
  dot:   { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff', marginTop: 1 },
});

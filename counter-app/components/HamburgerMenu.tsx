import { useEffect, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNav } from '@/context/NavContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RED_DEEP, RED_TINT, SURFACE, LINE, INK_SOFT } from '@/constants/palette';
import { PressScale, Pop, useReduceMotion } from '@/components/motion';

type IconName = keyof typeof Ionicons.glyphMap;
type MenuItem = { route: string; match: string; label: string; icon: IconName; iconOff: IconName };

const MENU_ITEMS: MenuItem[] = [
  { route: '/(tabs)/',             match: '/',             label: 'Home',         icon: 'home',        iconOff: 'home-outline' },
  { route: '/(tabs)/segnalazioni', match: '/segnalazioni', label: 'Segnalazioni', icon: 'warning',     iconOff: 'warning-outline' },
  { route: '/(tabs)/chiusura',     match: '/chiusura',     label: 'Chiusura',     icon: 'lock-closed', iconOff: 'lock-closed-outline' },
  { route: '/(tabs)/fidelity',     match: '/fidelity',     label: 'Fidelity',     icon: 'star',        iconOff: 'star-outline' },
  { route: '/(tabs)/profilo',      match: '/profilo',      label: 'Profilo',      icon: 'person',      iconOff: 'person-outline' },
];

function TabItem({ item, active, onPress }: { item: MenuItem; active: boolean; onPress: () => void }) {
  const reduce = useReduceMotion();
  // 0 = inattiva, 1 = attiva: guida la pillola dietro l'icona.
  const t = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { t.setValue(active ? 1 : 0); return; }
    Animated.timing(t, {
      toValue: active ? 1 : 0,
      duration: active ? 220 : 140, // l'uscita è più rapida dell'entrata
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [active, reduce]);
  const scaleX = t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <PressScale
      style={s.item}
      scaleTo={0.92}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={item.label}
    >
      <View style={s.iconWrap}>
        <Animated.View style={[s.pill, { opacity: t, transform: [{ scaleX }] }]} />
        <Pop trigger={active} amount={1.15}>
          <Ionicons name={active ? item.icon : item.iconOff} size={24} color={active ? RED_DEEP : INK_SOFT} />
        </Pop>
      </View>
      <Text numberOfLines={1} style={[s.label, active && s.labelActive]}>{item.label}</Text>
    </PressScale>
  );
}

export default function HamburgerMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const { hideNav } = useNav();
  const insets = useSafeAreaInsets();

  if (hideNav) return null;

  return (
    <View style={[s.bar, { paddingBottom: insets.bottom || 6 }]} accessibilityRole="tablist">
      {MENU_ITEMS.map(item => {
        const active = pathname === item.match;
        return (
          <TabItem
            key={item.route}
            item={item}
            active={active}
            // navigate (non push): passare da una sezione all'altra non accumula cronologia
            onPress={() => { if (!active) router.navigate(item.route as any); }}
          />
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar:      { flexDirection: 'row', backgroundColor: SURFACE, paddingTop: 6, borderTopWidth: 2, borderTopColor: LINE },
  item:     { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2 },
  iconWrap: { width: 56, height: 32, alignItems: 'center', justifyContent: 'center' },
  pill:     { ...StyleSheet.absoluteFillObject, borderRadius: 16, backgroundColor: RED_TINT },
  label:    { fontSize: 11, fontWeight: '700', color: INK_SOFT },
  labelActive: { fontWeight: '800', color: RED_DEEP },
});

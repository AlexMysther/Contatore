import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const FOTO_DEFAULT = require('@/assets/custom/userDef.jpg');

export default function Welcome() {
  const { user } = useAuth();
  const opacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const roleLabel = user?.ruolo === 'admin' ? 'Amministratore' : 'Staff';
  const foto = user?.avatarUrl ? { uri: user.avatarUrl } : FOTO_DEFAULT;

  return (
    <View style={s.container}>
      <Animated.View style={[s.card, { opacity }]}>
        <Image source={foto} style={s.avatar} />
        <Text style={s.benvenuto}>Ciao, {user?.nome?.split(' ')[0]}!</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>{roleLabel}</Text>
        </View>
        <TouchableOpacity style={s.btn} onPress={() => router.replace('/(tabs)')}>
          <Text style={s.btnText}>Entra</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const RED = '#c0392b';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: RED, justifyContent: 'center', alignItems: 'center' },
  card:      { alignItems: 'center', gap: 10 },
  avatar:    { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  emoji:     { fontSize: 72 },
  benvenuto: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 8 },
  nome:      { fontSize: 22, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  badge:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 4 },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btn:       { marginTop: 40, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14 },
  btnText:   { color: RED, fontWeight: '800', fontSize: 16 },
});

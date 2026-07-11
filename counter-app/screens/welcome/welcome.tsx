import { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { s } from './welcome.styles';

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
  const isAH = user?.username === 'AH';
  const foto = user?.avatarUrl ? { uri: user.avatarUrl } : FOTO_DEFAULT;

  return (
    <View style={s.container}>
      <Animated.View style={[s.card, { opacity }]}>
        <Image source={foto} style={s.avatar} />
        <Text style={s.benvenuto}>{isAH ? 'Lunga vita al Presidente XI' : `Ciao, ${user?.nome?.split(' ')[0]}!`}</Text>
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
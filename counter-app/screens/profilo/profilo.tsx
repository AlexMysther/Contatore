import { useState } from 'react';
import { View, Text, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PressScale, Pop, Enter } from '@/components/motion';
import { useAuth } from '@/context/AuthContext';
import { s, RED, RED_DEEP, GREEN_DEEP, BLUE } from './profilo.styles';

const BANNER_IMAGE = require('@/assets/custom/pizzium-wordmark.png');

export default function Profilo() {
  const { user, logout, updateAvatar } = useAuth();
  const [uploading, setUploading] = useState(false);
  const isAdmin = user?.ruolo === 'admin';

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permesso negato', 'Serve accesso alla galleria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (result.canceled) return;
    setUploading(true);
    const err = await updateAvatar(result.assets[0].uri);
    setUploading(false);
    if (err) Alert.alert('Errore', err);
  };

  return (
    <SafeAreaView style={s.container}>
      <Enter style={s.logoWrap} bouncy fromY={-18} fromScale={0.7}>
        <Image source={BANNER_IMAGE} style={s.logo} resizeMode="contain" accessibilityLabel="Pizzium" />
      </Enter>

      <Enter delay={120} style={s.card}>
        <PressScale
          style={s.avatarWrap}
          onPress={pickAvatar}
          disabled={uploading}
          accessibilityRole="button"
          accessibilityLabel="Cambia foto profilo"
          accessibilityState={{ busy: uploading }}
        >
          <Pop trigger={user?.avatarUrl} amount={1.08}>
            {user?.avatarUrl
              ? <Image source={{ uri: user.avatarUrl }} style={s.avatar} />
              : <View style={s.avatarPlaceholder}><Text style={s.avatarInitial}>{user?.nome?.[0]?.toUpperCase() ?? '?'}</Text></View>
            }
          </Pop>
          <View style={s.editBadge}>
            {uploading
              ? <ActivityIndicator size="small" color={RED} />
              : <Ionicons name="camera" size={18} color={RED} />}
          </View>
        </PressScale>

        <Text style={s.nome}>{user?.nome ?? ''}</Text>
        {!!user?.ruolo && (
          <View style={[s.ruoloPill, isAdmin ? s.ruoloAdmin : s.ruoloUser]}>
            <Ionicons name={isAdmin ? 'shield-checkmark' : 'person'} size={14} color={isAdmin ? BLUE : GREEN_DEEP} />
            <Text style={[s.ruoloText, isAdmin ? s.ruoloTextAdmin : s.ruoloTextUser]}>{user.ruolo}</Text>
          </View>
        )}
        <Text style={s.hint}>{uploading ? 'Caricamento foto…' : 'Tocca la foto per cambiarla'}</Text>
      </Enter>

      <Enter delay={200} style={s.logoutWrap}>
        <PressScale style={s.logoutBtn} onPress={logout} accessibilityRole="button">
          <Ionicons name="log-out-outline" size={20} color={RED_DEEP} />
          <Text style={s.logoutText}>Esci</Text>
        </PressScale>
      </Enter>
    </SafeAreaView>
  );
}

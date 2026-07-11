import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { s } from './profilo.styles';

const BANNER_IMAGE = require('@/assets/custom/Logo-pizzium-ROSSO-01-3.png');

export default function Profilo() {
  const { user, logout, updateAvatar } = useAuth();
  const [uploading, setUploading] = useState(false);

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
      <Image source={BANNER_IMAGE} style={s.banner} resizeMode="cover" />

      <View style={s.card}>
        <TouchableOpacity style={s.avatarWrap} onPress={pickAvatar} disabled={uploading}>
          {user?.avatarUrl
            ? <Image source={{ uri: user.avatarUrl }} style={s.avatar} />
            : <View style={s.avatarPlaceholder}><Text style={s.avatarInitial}>{user?.nome?.[0]?.toUpperCase() ?? '?'}</Text></View>
          }
          <View style={s.editBadge}><Text style={s.editBadgeText}>{uploading ? '…' : '✎'}</Text></View>
        </TouchableOpacity>

        <Text style={s.nome}>{user?.nome ?? ''}</Text>
        <Text style={s.ruolo}>{user?.ruolo ?? ''}</Text>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>Esci</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
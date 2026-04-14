import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';

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

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#fff' },
  banner:           { width: '100%', height: 180 },
  card:             { alignItems: 'center', paddingVertical: 32, gap: 8 },
  avatarWrap:       { position: 'relative', marginBottom: 4 },
  avatar:           { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder:{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#c0392b', alignItems: 'center', justifyContent: 'center' },
  avatarInitial:    { color: '#fff', fontSize: 38, fontWeight: '700' },
  editBadge:        { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd' },
  editBadgeText:    { fontSize: 13, color: '#555' },
  nome:             { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  ruolo:            { fontSize: 14, color: '#888' },
  logoutBtn:        { marginHorizontal: 24, borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#fdecea', borderWidth: 1, borderColor: '#ef9a9a' },
  logoutText:       { fontSize: 16, color: '#c0392b', fontWeight: '600' },
});

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const LOGO = require('@/assets/custom/Logo-pizzium-ROSSO-01-3.png');

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Inserisci username e password');
      return;
    }
    setLoading(true);
    setError(null);
    const err = await login(username.trim(), password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.card}>
        <Image source={LOGO} style={s.logo} resizeMode="contain" />
        <Text style={s.title}>Pizzium Tunisia</Text>
        <Text style={s.subtitle}>Accedi per continuare</Text>

        <View style={s.form}>
          <Text style={s.label}>Username</Text>
          <TextInput
            style={s.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="username"
            placeholderTextColor="#bbb"
          />

          <Text style={s.label}>Password</Text>
          <View style={s.pwdRow}>
            <TextInput
              style={[s.input, s.pwdInput]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              placeholder="••••••••"
              placeholderTextColor="#bbb"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPwd(v => !v)}>
              <Ionicons name={showPwd ? 'eye-off' : 'eye'} size={20} color="#aaa" />
            </TouchableOpacity>
          </View>

          {error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnLabel}>Accedi</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.link} onPress={() => router.replace('/register')}>
            <Text style={s.linkText}>Non hai un account? <Text style={s.linkBold}>Registrati</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const RED = '#c0392b';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', justifyContent: 'center', alignItems: 'center' },
  card:      { backgroundColor: '#fff', borderRadius: 20, padding: 32, width: '90%', maxWidth: 380, alignItems: 'center', elevation: 4 },

  logo:     { width: 400, height: 200 },
  title:    { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 28 },

  form:  { width: '100%', gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#555' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1a1a1a', backgroundColor: '#fafafa',
    marginBottom: 8,
  },

  pwdRow:   { position: 'relative', justifyContent: 'center', marginBottom: 8 },
  pwdInput: { marginBottom: 0, paddingRight: 44 },
  eyeBtn:   { position: 'absolute', right: 12, padding: 4 },
  eyeIcon:  {},

  error: { fontSize: 13, color: RED, textAlign: 'center' },

  btn:      { marginTop: 8, backgroundColor: RED, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },

  link:     { marginTop: 16, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#888' },
  linkBold: { color: RED, fontWeight: '700' },
});

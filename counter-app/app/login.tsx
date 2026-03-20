import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

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
        <Text style={s.logo}>🍕</Text>
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
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#bbb"
            onSubmitEditing={handleLogin}
          />

          {error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnLabel}>Accedi</Text>
            }
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

  logo:     { fontSize: 56 },
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

  error: { fontSize: 13, color: RED, textAlign: 'center' },

  btn:      { marginTop: 8, backgroundColor: RED, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { s } from './login.styles';

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
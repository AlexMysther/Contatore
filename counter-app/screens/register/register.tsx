import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { s } from './register.styles';

const LOGO = require('@/assets/custom/Logo-pizzium-ROSSO-01-3.png');

export default function Register() {
  const { register } = useAuth();
  const [nome, setNome]           = useState('');
  const [cognome, setCognome]     = useState('');
  const [username, setUsername]   = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  const handleRegister = async () => {
    if (!nome.trim() || !cognome.trim() || !username.trim() || !password.trim()) {
      setError('Tutti i campi sono obbligatori');
      return;
    }
    if (password !== confirm) {
      setError('Le password non coincidono');
      return;
    }
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }
    setLoading(true);
    setError(null);
    const err = await register(username.trim(), password, nome.trim(), cognome.trim());
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
        <Text style={s.subtitle}>Crea un nuovo account</Text>

        <View style={s.form}>
          <Text style={s.label}>Nome</Text>
          <TextInput
            style={s.input}
            value={nome}
            onChangeText={setNome}
            autoCorrect={false}
            placeholder="Nome"
            placeholderTextColor="#bbb"
          />

          <Text style={s.label}>Cognome</Text>
          <TextInput
            style={s.input}
            value={cognome}
            onChangeText={setCognome}
            autoCorrect={false}
            placeholder="Cognome"
            placeholderTextColor="#bbb"
          />

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
          />

          <Text style={s.label}>Conferma password</Text>
          <TextInput
            style={s.input}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#bbb"
            onSubmitEditing={handleRegister}
          />

          {error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnLabel}>Registrati</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.link} onPress={() => router.replace('/login')}>
            <Text style={s.linkText}>Hai già un account? <Text style={s.linkBold}>Accedi</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
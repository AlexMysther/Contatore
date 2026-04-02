import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';

const AUTH_KEY = '@auth_token';
const API_BASE = 'https://silver-cod-jjrpr6wgwpxpc5p7w-3000.app.github.dev';

type User = {
  id: string;
  nome: string;
  ruolo: string;
  permessi: string[];
  token: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  login: async () => null,
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then(raw => {
      if (raw) setUser(JSON.parse(raw));
      setLoading(false);
    });
  }, []);

  const login = async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? 'Errore di login';
      const u: User = { id: data.id, nome: data.nome, ruolo: data.ruolo, permessi: data.permessi, token: data.token };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(u));
      setUser(u);
      return null;
    } catch {
      return 'Impossibile raggiungere il server';
    }
  };

  const logout = () => {
    AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

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
  avatarUrl?: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  updateAvatar: (uri: string) => Promise<string | null>;
};

const AuthContext = createContext<AuthCtx>({
  user: null, loading: true,
  login: async () => null,
  logout: () => {},
  updateAvatar: async () => null,
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

      // Fetch avatarUrl from /api/utenti/me
      let avatarUrl: string | undefined;
      try {
        const meRes = await fetch(`${API_BASE}/api/utenti/me`, {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (meRes.ok) {
          const me = await meRes.json();
          avatarUrl = me.avatarUrl;
        }
      } catch {}

      const u: User = { id: data.id, nome: data.nome, ruolo: data.ruolo, permessi: data.permessi, token: data.token, avatarUrl };
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

  const updateAvatar = async (uri: string): Promise<string | null> => {
    if (!user) return 'Non autenticato';
    try {
      const formData = new FormData();
      formData.append('avatar', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
      const res = await fetch(`${API_BASE}/api/utenti/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? 'Errore upload';
      const updated = { ...user, avatarUrl: data.avatarUrl };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updated));
      setUser(updated);
      return null;
    } catch {
      return 'Impossibile raggiungere il server';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

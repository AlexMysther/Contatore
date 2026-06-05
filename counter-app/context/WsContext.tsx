import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API_BASE = 'https://contatore-production.up.railway.app';
const WS_BASE  = API_BASE.replace(/^http/, 'ws');

export type WsMessage =
  | { type: 'chiusura'; avviata: boolean }
  | { type: 'chore'; chore: Record<string, unknown> }
  | { type: 'segnalazione_nuova'; segnalazione: Record<string, unknown> }
  | { type: 'segnalazione_aggiornata'; id: string; stato: string }
  | { type: 'segnalazione_rimossa'; id: string };

interface WsContextValue {
  lastMessage: WsMessage | null;
}

const WsContext = createContext<WsContextValue>({ lastMessage: null });

export function WsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const wsRef     = useRef<WebSocket | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destroyedRef = useRef(false);

  useEffect(() => {
    if (!user?.token) return;

    destroyedRef.current = false;
    let delay = 1000;

    function connect() {
      if (destroyedRef.current) return;

      const ws = new WebSocket(`${WS_BASE}?token=${user!.token}`);
      wsRef.current = ws;

      ws.onopen = () => { delay = 1000; };

      ws.onmessage = (e) => {
        try { setLastMessage(JSON.parse(e.data) as WsMessage); } catch {}
      };

      ws.onerror = () => ws.close();

      ws.onclose = () => {
        if (destroyedRef.current) return;
        timerRef.current = setTimeout(() => {
          delay = Math.min(delay * 2, 30_000);
          connect();
        }, delay);
      };
    }

    connect();

    return () => {
      destroyedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [user?.token]);

  return (
    <WsContext.Provider value={{ lastMessage }}>
      {children}
    </WsContext.Provider>
  );
}

export const useWs = () => useContext(WsContext);

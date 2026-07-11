import { useEffect, useState } from 'react';
import { LayoutAnimation, Platform, UIManager } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useWs } from '@/context/WsContext';
import { apiFetch, apiUrl, authHeaders } from '@/utils/api';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export type SottoTask = { titolo: string; descrizione?: string; completato: boolean };
export type Chore = {
  _id: string; titolo: string; descrizione?: string;
  assegnato_a?: string; completato: boolean;
  sotto_task?: SottoTask[]; _expanded: boolean;
};
export type Pending       = { choreId: string; titolo: string; sottoIdx?: number } | null;
export type Account       = { _id: string; nome: string; cognome: string; ruolo: string };
export type AssignPending = { choreId: string } | null;

function mergeRemote(remote: Omit<Chore, '_expanded'>[], local: Chore[]): Chore[] {
  return remote.map(r => {
    const existing = local.find(l => l._id === r._id);
    return { ...r, _expanded: existing?._expanded ?? false };
  });
}

export function useChiusura() {
  const { user }        = useAuth();
  const { lastMessage } = useWs();
  const canEdit = user?.permessi?.includes('chiusura') ?? false;
  const hdrs    = () => authHeaders(user?.token ?? '');

  const [avviata, setAvviata]   = useState(false);
  const [chores, setChores]     = useState<Chore[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [pending, setPending]   = useState<Pending>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [assignPending, setAssignPending] = useState<AssignPending>(null);
  const [confirmReset, setConfirmReset]   = useState(false);
  const [resetLoading, setResetLoading]   = useState(false);

  const patchChore = (id: string, body: object) =>
    apiFetch(apiUrl(`/api/chores/${id}`), { method: 'PATCH', headers: hdrs(), body: JSON.stringify(body) });

  useEffect(() => {
    if (!user?.token) return;
    apiFetch(apiUrl('/api/accounts'), { headers: hdrs() })
      .then(r => r.json())
      .then((data: Account[]) => Array.isArray(data) && setAccounts(data))
      .catch(() => {});
  }, [user?.token]);

  useEffect(() => {
    if (!user?.token) return;
    apiFetch(apiUrl('/api/chiusura/stato'), { headers: hdrs() })
      .then(r => r.json())
      .then((data: { avviata: boolean }) => setAvviata(data.avviata))
      .catch(() => {});
  }, [user?.token]);

  useEffect(() => {
    if (!avviata || !user?.token) {
      if (!avviata) { setChores([]); setConfirmReset(false); }
      return;
    }
    setLoading(true);
    apiFetch(apiUrl('/api/chores'), { headers: hdrs() })
      .then(r => r.json())
      .then((data: Omit<Chore, '_expanded'>[]) => {
        setChores(prev => mergeRemote(Array.isArray(data) ? data : [], prev));
        setError(null);
      })
      .catch(e => setError(e?.name === 'AbortError' ? 'Server non raggiungibile.' : e.message))
      .finally(() => setLoading(false));
  }, [avviata, user?.token]);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === 'chiusura') {
      setAvviata(lastMessage.avviata);
    } else if (lastMessage.type === 'chore') {
      const incoming = lastMessage.chore as any;
      const id = String(incoming._id);
      setChores(prev => {
        if (!prev.find(c => c._id === id)) return prev;
        return prev.map(c => c._id === id ? { ...incoming, _id: id, _expanded: c._expanded } : c);
      });
    }
  }, [lastMessage]);

  const confirm = () => {
    if (!pending) return;
    const { choreId, sottoIdx } = pending;
    setPending(null);
    if (sottoIdx !== undefined) {
      setChores(prev => {
        const next = prev.map(c => {
          if (c._id !== choreId) return c;
          const sotto_task = c.sotto_task?.map((st, i) => i === sottoIdx ? { ...st, completato: true } : st);
          const tuttiDone  = sotto_task?.every(st => st.completato) ?? false;
          return { ...c, sotto_task, completato: tuttiDone ? true : c.completato };
        });
        const chore = next.find(c => c._id === choreId);
        if (chore) patchChore(choreId, { sotto_task: chore.sotto_task, completato: chore.completato });
        return next;
      });
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setChores(prev => prev.map(c => {
        if (c._id !== choreId) return c;
        return { ...c, completato: true, sotto_task: c.sotto_task?.map(st => ({ ...st, completato: true })) };
      }));
      const chore     = chores.find(c => c._id === choreId);
      const sotto_task = chore?.sotto_task?.map(st => ({ ...st, completato: true }));
      patchChore(choreId, { completato: true, ...(sotto_task ? { sotto_task } : {}) });
    }
  };

  const tapChore = (id: string, titolo: string, currentDone: boolean) => {
    if (currentDone) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setChores(prev => prev.map(c => c._id === id
        ? { ...c, completato: false, sotto_task: c.sotto_task?.map(st => ({ ...st, completato: false })) }
        : c));
      const chore      = chores.find(c => c._id === id);
      const sotto_task = chore?.sotto_task?.map(st => ({ ...st, completato: false }));
      patchChore(id, { completato: false, ...(sotto_task ? { sotto_task } : {}) });
    } else {
      setPending({ choreId: id, titolo });
    }
  };

  const tapSotto = (choreId: string, idx: number, titolo: string, currentDone: boolean) => {
    if (currentDone) {
      setChores(prev => {
        const next = prev.map(c => {
          if (c._id !== choreId) return c;
          const sotto_task = c.sotto_task?.map((st, i) => i === idx ? { ...st, completato: false } : st);
          return { ...c, sotto_task };
        });
        const chore = next.find(c => c._id === choreId);
        if (chore) patchChore(choreId, { sotto_task: chore.sotto_task });
        return next;
      });
    } else {
      setPending({ choreId, titolo, sottoIdx: idx });
    }
  };

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setChores(prev => prev.map(c => c._id === id ? { ...c, _expanded: !c._expanded } : c));
  };

  const assignTo = (choreId: string, nome: string | null) => {
    setAssignPending(null);
    setChores(prev => prev.map(c => c._id === choreId ? { ...c, assegnato_a: nome ?? undefined } : c));
    patchChore(choreId, { assegnato_a: nome ?? '' });
  };

  const avvia = () => {
    setAvviata(true);
    apiFetch(apiUrl('/api/chiusura/avvia'), { method: 'POST', headers: hdrs() })
      .catch(() => setAvviata(false));
  };

  const retry = () => { setError(null); setLoading(true); };

  const closeResetModal = () => setConfirmReset(false);

  // Azzera tutti i task (e sotto-task) segnandoli come "non fatto".
  // La chiusura resta avviata; ogni chore viene aggiornata sul server via PATCH.
  const reset = () => {
    if (resetLoading || !avviata) return;
    setResetLoading(true);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const cleared = chores.map(c => ({
      ...c,
      completato: false,
      sotto_task: c.sotto_task?.map(st => ({ ...st, completato: false })),
    }));
    setChores(cleared);
    Promise.all(
      cleared.map(c =>
        patchChore(c._id, {
          completato: false,
          ...(c.sotto_task ? { sotto_task: c.sotto_task } : {}),
        }).catch(() => {})
      )
    ).finally(() => {
      setResetLoading(false);
      setConfirmReset(false);
    });
  };

  const doneCount = chores.filter(c => c.completato).length;
  const total     = chores.length;
  const progress  = total > 0 ? doneCount / total : 0;

  return {
    canEdit, avviata, chores, loading, error,
    pending, setPending,
    accounts,
    assignPending, setAssignPending,
    confirmReset, setConfirmReset, resetLoading,
    confirm, tapChore, tapSotto, toggleExpand, assignTo,
    avvia, retry, reset, closeResetModal,
    doneCount, total, progress,
  };
}

import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Modal, Pressable,
  StyleSheet, ActivityIndicator, LayoutAnimation, Platform, UIManager, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useWs } from '@/context/WsContext';
import { apiFetch, apiUrl, authHeaders } from '@/utils/api';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type SottoTask = { titolo: string; descrizione?: string; completato: boolean };
type Chore = {
  _id: string; titolo: string; descrizione?: string;
  assegnato_a?: string; completato: boolean;
  sotto_task?: SottoTask[]; _expanded: boolean;
};
type Pending      = { choreId: string; titolo: string; sottoIdx?: number } | null;
type Account      = { _id: string; nome: string; cognome: string; ruolo: string };
type AssignPending = { choreId: string } | null;

function mergeRemote(remote: Omit<Chore, '_expanded'>[], local: Chore[]): Chore[] {
  return remote.map(r => {
    const existing = local.find(l => l._id === r._id);
    return { ...r, _expanded: existing?._expanded ?? false };
  });
}

export default function Chiusura() {
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
  const [resetPin, setResetPin]           = useState('');
  const [resetPinError, setResetPinError] = useState<string | null>(null);
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
      if (!avviata) { setChores([]); setConfirmReset(false); setResetPin(''); setResetPinError(null); }
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
      setChores(prev => prev.map(c => c._id === id ? { ...c, completato: false } : c));
      patchChore(id, { completato: false });
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

  const closeResetModal = () => { setConfirmReset(false); setResetPin(''); setResetPinError(null); };

  const reset = () => {
    if (resetLoading || !avviata) return;
    setResetLoading(true);
    setResetPinError(null);
    apiFetch(apiUrl('/api/chiusura/reset'), {
      method: 'POST', headers: hdrs(), body: JSON.stringify({ pin: resetPin }),
    })
      .then(async r => {
        // Unico vero errore da mostrare tenendo aperto il popup: PIN rifiutato.
        if (r.status === 403) {
          const d = await r.json().catch(() => ({}));
          setResetPinError(d.error ?? 'PIN non corretto');
          return;
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setChores([]);
        closeResetModal();
        setAvviata(false);
      })
      // Errore di rete/timeout: l'operazione è probabilmente andata a buon fine
      // sul server. Chiudo comunque il popup e azzero il PIN; lo stato reale
      // viene riconciliato dal messaggio WebSocket 'chiusura'.
      .catch(() => closeResetModal())
      .finally(() => setResetLoading(false));
  };

  if (!avviata) {
    if (canEdit) {
      return (
        <SafeAreaView style={[s.container, s.center]}>
          <Text style={s.startIcon}>🔒</Text>
          <Text style={s.startTitle}>Chiusura</Text>
          <Text style={s.startSubtitle}>Avvia la procedura di chiusura del locale.</Text>
          <TouchableOpacity style={s.startBtn} onPress={avvia}>
            <Text style={s.startBtnLabel}>Avvia Chiusura</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <Text style={s.startIcon}>⏳</Text>
        <Text style={s.startTitle}>In attesa</Text>
        <Text style={s.startSubtitle}>La chiusura non è ancora stata avviata.{'\n'}Attendi che un amministratore la avvii.</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={RED} />
        <Text style={s.hint}>Caricamento attività…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <Text style={s.startIcon}>⚠️</Text>
        <Text style={s.startTitle}>Errore</Text>
        <Text style={s.startSubtitle}>{error}</Text>
        <TouchableOpacity style={s.startBtn} onPress={() => { setError(null); setLoading(true); }}>
          <Text style={s.startBtnLabel}>Riprova</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const doneCount = chores.filter(c => c.completato).length;
  const total     = chores.length;
  const progress  = total > 0 ? doneCount / total : 0;

  return (
    <SafeAreaView style={s.container}>
      {/* Modale conferma completamento */}
      <Modal transparent animationType="fade" visible={!!pending} onRequestClose={() => setPending(null)}>
        <Pressable style={s.overlay} onPress={() => setPending(null)}>
          <Pressable style={s.dialog} onPress={e => e.stopPropagation()}>
            <Text style={s.dialogTitle}>Conferma</Text>
            <Text style={s.dialogMsg}>Hai completato "{pending?.titolo}"?</Text>
            <View style={s.dialogBtns}>
              <TouchableOpacity style={s.dialogCancel} onPress={() => setPending(null)}>
                <Text style={s.dialogCancelLabel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.dialogConfirm} onPress={confirm}>
                <Text style={s.dialogConfirmLabel}>Sì, fatto!</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modale assegnazione */}
      <Modal transparent animationType="fade" visible={!!assignPending} onRequestClose={() => setAssignPending(null)}>
        <Pressable style={s.overlay} onPress={() => setAssignPending(null)}>
          <Pressable style={s.assignDialog} onPress={e => e.stopPropagation()}>
            <Text style={s.dialogTitle}>Assegna a…</Text>
            {assignPending && (
              <>
                <TouchableOpacity style={s.assignRow} onPress={() => assignTo(assignPending.choreId, null)}>
                  <Text style={s.assignNone}>Nessuno</Text>
                </TouchableOpacity>
                {accounts.map(a => (
                  <TouchableOpacity key={String(a._id)} style={s.assignRow} onPress={() => assignTo(assignPending.choreId, a.nome)}>
                    <Text style={s.assignName}>{a.nome}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modale reset con PIN */}
      <Modal transparent animationType="fade" visible={confirmReset} onRequestClose={closeResetModal}>
        <Pressable style={s.overlay} onPress={closeResetModal}>
          <Pressable style={s.dialog} onPress={e => e.stopPropagation()}>
            <Text style={s.dialogTitle}>Spegni Chiusura?</Text>
            <Text style={s.dialogMsg}>Tutti i progressi verranno azzerati. Inserisci il PIN per confermare.</Text>
            <TextInput
              style={[s.pinInput, resetPinError ? s.pinInputError : null]}
              placeholder="PIN numerico"
              placeholderTextColor="#aaa"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              value={resetPin}
              onChangeText={v => { setResetPin(v); setResetPinError(null); }}
            />
            {resetPinError && <Text style={s.pinErrorText}>{resetPinError}</Text>}
            <View style={s.dialogBtns}>
              <TouchableOpacity style={s.dialogCancel} onPress={closeResetModal}>
                <Text style={s.dialogCancelLabel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.dialogDanger, resetLoading && { opacity: 0.6 }]} onPress={reset} disabled={resetLoading}>
                {resetLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.dialogConfirmLabel}>Spegni</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>🔒 Chiusura</Text>
        {canEdit && (
          <TouchableOpacity style={s.resetBtn} onPress={() => setConfirmReset(true)}>
            <Text style={s.resetBtnLabel}>Spegni</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Barra progresso */}
      <View style={s.progressWrap}>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <Text style={s.progressLabel}>{doneCount}/{total}</Text>
      </View>

      <FlatList
        data={chores}
        keyExtractor={c => c._id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => {
          const sottoTask  = item.sotto_task ?? [];
          const hasSotto   = sottoTask.length > 0;
          const sottoFatti = sottoTask.filter(st => st.completato).length;
          const acc        = item.assegnato_a ? accounts.find(a => a.nome === item.assegnato_a) : null;
          const badgeStyle = !item.assegnato_a ? s.badgeRed : acc?.ruolo === 'admin' ? s.badgeBlue : s.badgeGreen;
          const assignLabel = item.assegnato_a ? `👤 ${item.assegnato_a}` : canEdit ? '👤 Assegna…' : '👤 Nessuno';

          return (
            <View style={[s.card, item.completato && s.cardDone]}>
              <View style={s.cardRow}>
                <TouchableOpacity
                  onPress={() => tapChore(item._id, item.titolo, item.completato)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View style={[s.check, item.completato && s.checkDone]}>
                    {item.completato && <Text style={s.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[s.label, item.completato && s.labelDone]}>{item.titolo}</Text>
                  {item.descrizione ? <Text style={[s.desc, item.completato && s.descDone]}>{item.descrizione}</Text> : null}
                  <View style={s.meta}>
                    {canEdit ? (
                      <TouchableOpacity onPress={() => setAssignPending({ choreId: item._id })}>
                        <Text style={[s.badge, badgeStyle]}>{assignLabel}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={[s.badge, badgeStyle]}>{assignLabel}</Text>
                    )}
                    {hasSotto && <Text style={s.badge}>📋 {sottoFatti}/{sottoTask.length}</Text>}
                  </View>
                </View>

                {hasSotto && (
                  <TouchableOpacity onPress={() => toggleExpand(item._id)} style={s.expandBtn}>
                    <Text style={s.expandIcon}>{item._expanded ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {hasSotto && item._expanded && (
                <View style={s.sottoList}>
                  {sottoTask.map((st, idx) => (
                    <View key={idx} style={s.sottoRow}>
                      <TouchableOpacity
                        onPress={() => tapSotto(item._id, idx, st.titolo, st.completato)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <View style={[s.sottoCheck, st.completato && s.sottoCheckDone]}>
                          {st.completato && <Text style={s.sottoMark}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.sottoLabel, st.completato && s.labelDone]}>{st.titolo}</Text>
                        {st.descrizione ? <Text style={[s.desc, st.completato && s.descDone]}>{st.descrizione}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const RED   = '#c0392b';
const GREEN = '#27ae60';

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f2f2f2', paddingTop: 24 },
  center:        { justifyContent: 'center', alignItems: 'center', gap: 16 },
  startIcon:     { fontSize: 64 },
  startTitle:    { fontSize: 30, fontWeight: '800', color: '#1a1a1a' },
  startSubtitle: { fontSize: 15, color: '#888', textAlign: 'center', paddingHorizontal: 40 },
  startBtn:      { marginTop: 8, backgroundColor: RED, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 14 },
  startBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 17 },
  hint:          { fontSize: 14, color: '#aaa', marginTop: 8 },

  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title:         { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  resetBtn:      { backgroundColor: RED, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  resetBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },

  progressWrap:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, marginBottom: 14 },
  progressBg:    { flex: 1, height: 8, backgroundColor: '#ddd', borderRadius: 4, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: GREEN, borderRadius: 4 },
  progressLabel: { fontSize: 13, color: '#888', minWidth: 36, textAlign: 'right' },

  list:          { paddingHorizontal: 14, paddingBottom: 32, gap: 10 },
  card:          { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2 },
  cardDone:      { backgroundColor: '#f0fff4' },
  cardRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },

  check:         { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: RED, alignItems: 'center', justifyContent: 'center' },
  checkDone:     { backgroundColor: GREEN, borderColor: GREEN },
  checkMark:     { color: '#fff', fontSize: 14, fontWeight: '700' },

  label:         { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  labelDone:     { color: '#aaa', textDecorationLine: 'line-through' },
  desc:          { fontSize: 13, color: '#777' },
  descDone:      { color: '#bbb' },

  meta:          { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  badge:         { fontSize: 12, color: '#555', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeRed:      { color: RED,      backgroundColor: '#fdecea', borderWidth: 1, borderColor: RED },
  badgeGreen:    { color: '#1e8449', backgroundColor: '#eafaf1', borderWidth: 1, borderColor: GREEN },
  badgeBlue:     { color: '#1a5276', backgroundColor: '#eaf2ff', borderWidth: 1, borderColor: '#2980b9' },

  expandBtn:     { padding: 4 },
  expandIcon:    { fontSize: 12, color: '#aaa' },
  sottoList:     { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  sottoRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sottoCheck:    { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#aaa', alignItems: 'center', justifyContent: 'center' },
  sottoCheckDone:{ backgroundColor: GREEN, borderColor: GREEN },
  sottoMark:     { color: '#fff', fontSize: 11, fontWeight: '700' },
  sottoLabel:    { fontSize: 14, color: '#333' },

  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  dialog:        { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 300, gap: 12 },
  assignDialog:  { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: 300, gap: 4 },
  assignRow:     { paddingVertical: 13, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  assignName:    { fontSize: 16, color: '#1a1a1a' },
  assignNone:    { fontSize: 16, color: '#aaa', fontStyle: 'italic' },
  dialogTitle:   { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  dialogMsg:     { fontSize: 15, color: '#444', lineHeight: 22 },
  dialogBtns:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  dialogCancel:  { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  dialogCancelLabel: { fontSize: 15, color: '#555' },
  dialogConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: GREEN, alignItems: 'center' },
  dialogDanger:  { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: RED,   alignItems: 'center' },
  dialogConfirmLabel: { fontSize: 15, color: '#fff', fontWeight: '700' },

  pinInput:      { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 18, letterSpacing: 4, color: '#1a1a1a', textAlign: 'center', marginTop: 4 },
  pinInputError: { borderColor: RED },
  pinErrorText:  { fontSize: 13, color: RED, textAlign: 'center' },
});

import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Modal, Pressable,
  StyleSheet, ActivityIndicator, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const API_URL = 'https://silver-cod-jjrpr6wgwpxpc5p7w-3000.app.github.dev/api/chores';
const POLL_MS = 5000;

type SottoTask = { titolo: string; descrizione?: string; completato: boolean };

type Chore = {
  _id: string;
  titolo: string;
  descrizione?: string;
  assegnato_a?: string;
  completato: boolean;
  sotto_task?: SottoTask[];
  _expanded: boolean;
};

type Pending = { choreId: string; titolo: string; sottoIdx?: number } | null;

function mergeRemote(remote: Omit<Chore, '_expanded'>[], local: Chore[]): Chore[] {
  return remote.map(r => {
    const existing = local.find(l => l._id === r._id);
    return { ...r, _expanded: existing?._expanded ?? false };
  });
}

export default function Chiusura() {
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [chores, setChores]   = useState<Chore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const pollRef               = useRef<ReturnType<typeof setInterval> | null>(null);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user?.token ?? ''}`,
  });

  const fetchChores = (isFirstLoad = false) => {
    fetch(API_URL, { headers: authHeaders() })
      .then(r => r.json())
      .then((data: Omit<Chore, '_expanded'>[]) => {
        setChores(prev => mergeRemote(data, prev));
        if (isFirstLoad) setLoading(false);
        setError(null);
      })
      .catch(e => {
        if (isFirstLoad) { setError(e.message); setLoading(false); }
      });
  };

  useEffect(() => {
    if (!started || !user?.token) return;
    setLoading(true);
    fetchChores(true);
    pollRef.current = setInterval(() => fetchChores(false), POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [started]);

  const patchChore = (id: string, body: object) =>
    fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

  const confirm = () => {
    if (!pending) return;
    const { choreId, sottoIdx } = pending;
    setPending(null);

    if (sottoIdx !== undefined) {
      setChores(prev => {
        const next = prev.map(c => {
          if (c._id !== choreId) return c;
          const sotto_task = c.sotto_task?.map((st, i) =>
            i === sottoIdx ? { ...st, completato: true } : st
          );
          const tuttiDone = sotto_task?.every(st => st.completato) ?? false;
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
        const sotto_task = c.sotto_task?.map(st => ({ ...st, completato: true }));
        return { ...c, completato: true, sotto_task };
      }));
      const chore = chores.find(c => c._id === choreId);
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
          const sotto_task = c.sotto_task?.map((st, i) =>
            i === idx ? { ...st, completato: false } : st
          );
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

  const reset = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    chores.forEach(c => {
      const sotto_task = c.sotto_task?.map(st => ({ ...st, completato: false }));
      patchChore(c._id, { completato: false, ...(sotto_task ? { sotto_task } : {}) });
    });
    setChores(prev => prev.map(c => ({
      ...c,
      completato: false,
      _expanded: false,
      sotto_task: c.sotto_task?.map(st => ({ ...st, completato: false })),
    })));
    setStarted(false);
  };

  // ── Start screen ──────────────────────────────────────────────────────────
  if (!started) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <Text style={s.startIcon}>🔒</Text>
        <Text style={s.startTitle}>Chiusura</Text>
        <Text style={s.startSubtitle}>Avvia la procedura di chiusura del locale.</Text>
        <TouchableOpacity style={s.startBtn} onPress={() => setStarted(true)}>
          <Text style={s.startBtnLabel}>Avvia Chiusura</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={RED} />
        <Text style={s.hint}>Caricamento attività…</Text>
      </SafeAreaView>
    );
  }

  // ── Errore ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <Text style={s.errorIcon}>⚠️</Text>
        <Text style={s.errorTitle}>Impossibile caricare le attività</Text>
        <Text style={s.errorDetail}>{error}</Text>
        <TouchableOpacity style={s.redBtn} onPress={() => fetchChores(true)}>
          <Text style={s.btnLabel}>Riprova</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const doneCount = chores.filter(c => c.completato).length;
  const total     = chores.length;
  const progress  = total > 0 ? doneCount / total : 0;
  const allDone   = total > 0 && doneCount === total;

  // ── Tutto fatto ───────────────────────────────────────────────────────────
  if (allDone) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <Text style={{ fontSize: 64 }}>🎉</Text>
        <Text style={s.doneTitle}>Tutto fatto!</Text>
        <Text style={s.doneSubtitle}>Hai completato tutte le {total} attività.</Text>
        <TouchableOpacity style={s.greenBtn} onPress={reset}>
          <Text style={s.btnLabel}>Ricomincia</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Checklist ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      {/* Modale di conferma */}
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

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Chiusura</Text>
        <TouchableOpacity onPress={reset}>
          <Text style={s.resetLink}>Annulla</Text>
        </TouchableOpacity>
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
                  {item.descrizione
                    ? <Text style={[s.desc, item.completato && s.descDone]}>{item.descrizione}</Text>
                    : null}
                  <View style={s.meta}>
                    {item.assegnato_a
                      ? <Text style={s.badge}>👤 {item.assegnato_a}</Text>
                      : null}
                    {hasSotto
                      ? <Text style={s.badge}>📋 {sottoFatti}/{sottoTask.length}</Text>
                      : null}
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
                        {st.descrizione
                          ? <Text style={[s.desc, st.completato && s.descDone]}>{st.descrizione}</Text>
                          : null}
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

const GREEN = '#27ae60';
const RED   = '#c0392b';

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f2f2f2' },
  center:        { justifyContent: 'center', alignItems: 'center', gap: 16 },

  // Start screen
  startIcon:     { fontSize: 64 },
  startTitle:    { fontSize: 30, fontWeight: '800', color: '#1a1a1a' },
  startSubtitle: { fontSize: 15, color: '#888', textAlign: 'center', paddingHorizontal: 40 },
  startBtn:      { marginTop: 8, backgroundColor: RED, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 14 },
  startBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 17 },

  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title:         { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  resetLink:     { fontSize: 14, color: RED },

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

  expandBtn:     { padding: 4 },
  expandIcon:    { fontSize: 12, color: '#aaa' },

  sottoList:     { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  sottoRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sottoCheck:    { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#aaa', alignItems: 'center', justifyContent: 'center' },
  sottoCheckDone:{ backgroundColor: GREEN, borderColor: GREEN },
  sottoMark:     { color: '#fff', fontSize: 11, fontWeight: '700' },
  sottoLabel:    { fontSize: 14, color: '#333' },

  hint:          { fontSize: 14, color: '#aaa', marginTop: 8 },
  errorIcon:     { fontSize: 40 },
  errorTitle:    { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  errorDetail:   { fontSize: 13, color: '#888', textAlign: 'center', paddingHorizontal: 32 },

  doneTitle:     { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  doneSubtitle:  { fontSize: 15, color: '#888' },

  redBtn:        { marginTop: 8, backgroundColor: RED, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  greenBtn:      { marginTop: 12, backgroundColor: GREEN, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  btnLabel:      { color: '#fff', fontWeight: '700', fontSize: 15 },

  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  dialog:        { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 300, gap: 12 },
  dialogTitle:   { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  dialogMsg:     { fontSize: 15, color: '#444', lineHeight: 22 },
  dialogBtns:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  dialogCancel:  { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  dialogCancelLabel: { fontSize: 15, color: '#555' },
  dialogConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: GREEN, alignItems: 'center' },
  dialogConfirmLabel: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

import { useEffect, useRef, useState } from 'react';
import { useWs } from '@/context/WsContext';
import {
  View, Text, TouchableOpacity, FlatList,
  Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PressScale, Pop, ColorFade, Enter, smoothLayout } from '@/components/motion';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, apiUrl, authHeaders } from '@/utils/api';
import {
  s, RED, RED_DEEP, GREEN_DEEP, GREEN_CARD, GREEN_LINE, INK_SOFT, MUTED, OPEN_CARD, OPEN_LINE,
} from './segnalazioni.styles';

type Confirm = { title: string; message: string; onConfirm: () => void; confirmLabel?: string; destructive?: boolean } | null;
type Categoria    = { _id: string; nome: string; order: number };
type Segnalazione = {
  _id: string; categoria: string; testo: string;
  autoreId: string; autoreNome: string;
  stato: 'aperta' | 'risolta'; createdAt: string;
};

export default function SegnalazioniScreen() {
  const { user }       = useAuth();
  const { lastMessage } = useWs();
  const token   = user?.token ?? '';
  const hdrs    = () => authHeaders(token);
  const isAdmin = user?.ruolo === 'admin';

  const [list, setList]           = useState<Segnalazione[]>([]);
  const [categorie, setCategorie] = useState<Categoria[]>([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirm, setConfirm]           = useState<Confirm>(null);
  const confirmRef                      = useRef<Confirm>(null);
  const [selectedCat, setSelectedCat]   = useState<string | null>(null);
  const [testo, setTesto]   = useState('');
  const [error, setError]   = useState<string | null>(null);
  // Cascata d'ingresso solo all'apertura: le card montate dopo entrano subito.
  const introUntil = useRef(0);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch(apiUrl('/api/categorie'),    { headers: hdrs() }),
      apiFetch(apiUrl('/api/segnalazioni'), { headers: hdrs() }),
    ])
      .then(async ([r1, r2]) => {
        const [cats, segs] = await Promise.all([r1.json(), r2.json()]);
        setCategorie(Array.isArray(cats) ? cats : []);
        setList(Array.isArray(segs) ? segs : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === 'segnalazione_nuova') {
      const seg = lastMessage.segnalazione as any;
      const id  = String(seg._id);
      smoothLayout();
      setList(prev => prev.find(s => s._id === id) ? prev : [{ ...seg, _id: id }, ...prev]);
    } else if (lastMessage.type === 'segnalazione_aggiornata') {
      setList(prev => prev.map(s => s._id === lastMessage.id ? { ...s, stato: lastMessage.stato as any } : s));
    } else if (lastMessage.type === 'segnalazione_rimossa') {
      smoothLayout();
      setList(prev => prev.filter(s => s._id !== lastMessage.id));
    }
  }, [lastMessage]);

  const openModal = () => {
    setSelectedCat(null);
    setTesto('');
    setError(null);
    setModalVisible(true);
  };

  const submit = () => {
    if (!selectedCat)  { setError('Seleziona una categoria.'); return; }
    if (!testo.trim()) { setError('Scrivi una descrizione.'); return; }
    setSubmitting(true);
    apiFetch(apiUrl('/api/segnalazioni'), {
      method: 'POST',
      headers: hdrs(),
      body: JSON.stringify({ categoria: selectedCat, testo: testo.trim() }),
    })
      .then(r => r.json())
      .then(newSeg => {
        const id = String(newSeg._id);
        smoothLayout();
        setList(prev => prev.find(s => s._id === id) ? prev : [{ ...newSeg, _id: id }, ...prev]);
        setModalVisible(false);
      })
      .catch(() => setError('Errore di rete'))
      .finally(() => setSubmitting(false));
  };

  const showConfirm = (data: NonNullable<Confirm>) => {
    confirmRef.current = data;
    setConfirm(data);
  };

  const risolvi = (id: string) => showConfirm({
    title: 'Segna come risolta',
    message: 'Vuoi segnare questa segnalazione come risolta?',
    confirmLabel: 'Risolvi',
    onConfirm: () => {
      setList(prev => prev.map(s => s._id === id ? { ...s, stato: 'risolta' } : s));
      apiFetch(apiUrl(`/api/segnalazioni/${id}/risolvi`), { method: 'PATCH', headers: hdrs() });
    },
  });

  const chiudi = (id: string) => showConfirm({
    title: 'Elimina segnalazione',
    message: 'Vuoi eliminare questa segnalazione?',
    confirmLabel: 'Elimina',
    destructive: true,
    onConfirm: () => {
      smoothLayout();
      setList(prev => prev.filter(s => s._id !== id));
      apiFetch(apiUrl(`/api/segnalazioni/${id}/chiudi`), { method: 'PATCH', headers: hdrs() });
    },
  });

  const aperte = list.filter(x => x.stato !== 'risolta').length;
  const subtitle = loading
    ? 'Avvisi per il team'
    : aperte === 0 ? 'Nessuna aperta' : aperte === 1 ? '1 aperta' : `${aperte} aperte`;

  return (
    <SafeAreaView style={s.container}>
      {/* Modale conferma */}
      <Modal transparent animationType="fade" visible={!!confirm} onRequestClose={() => setConfirm(null)}>
        <Pressable style={s.overlay} onPress={() => setConfirm(null)}>
          <Enter style={s.dialogWrap} fromY={10} fromScale={0.94}>
          <Pressable style={s.dialog} onPress={e => e.stopPropagation()}>
            <Text style={s.dialogTitle}>{confirmRef.current?.title}</Text>
            <Text style={s.dialogMsg}>{confirmRef.current?.message}</Text>
            <View style={s.dialogBtns}>
              <TouchableOpacity style={s.dialogCancel} onPress={() => setConfirm(null)}>
                <Text style={s.dialogCancelLabel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={confirmRef.current?.destructive ? s.dialogDanger : s.dialogConfirm}
                onPress={() => { setConfirm(null); confirmRef.current?.onConfirm(); }}
              >
                <Text style={s.dialogConfirmLabel}>{confirmRef.current?.confirmLabel ?? 'Conferma'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
          </Enter>
        </Pressable>
      </Modal>

      {/* Header */}
      <Enter style={s.header} fromY={-8}>
        <View style={s.headerLeft}>
          <View style={s.logo}>
            <Ionicons name="warning" size={22} color="#fff" />
          </View>
          <View style={s.headerText}>
            <Text style={s.title} numberOfLines={1}>Segnalazioni</Text>
            <Pop trigger={aperte} amount={1.06}>
              <Text style={s.subtitle}>{subtitle}</Text>
            </Pop>
          </View>
        </View>
        <PressScale style={s.addBtn} onPress={openModal} accessibilityRole="button" accessibilityLabel="Nuova segnalazione">
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.addBtnText}>Nuova</Text>
        </PressScale>
      </Enter>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={RED} />
          <Text style={s.hint}>Caricamento segnalazioni…</Text>
        </View>
      ) : list.length === 0 ? (
        <View style={s.center}>
          <Enter bouncy fromY={0} fromScale={0.6} style={s.stateBadge}>
            <Ionicons name="checkmark-done" size={34} color={GREEN_DEEP} />
          </Enter>
          <Enter delay={80}><Text style={s.stateTitle}>Tutto tranquillo</Text></Enter>
          <Enter delay={140}>
            <Text style={s.stateSubtitle}>Nessuna segnalazione attiva.{'\n'}Tocca «Nuova» per avvisare il team.</Text>
          </Enter>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={i => i._id}
          contentContainerStyle={s.list}
          renderItem={({ item, index }) => {
            if (introUntil.current === 0) introUntil.current = Date.now() + 500;
            const enterDelay = Date.now() < introUntil.current ? 120 + Math.min(index, 8) * 50 : 0;
            const isCreator  = item.autoreId === user?.id;
            const risolta    = item.stato === 'risolta';
            const canAct     = isAdmin || isCreator;
            return (
              <Enter delay={enterDelay}>
              <ColorFade
                style={s.card}
                active={risolta}
                off={{ bg: OPEN_CARD, border: OPEN_LINE }}
                on={{ bg: GREEN_CARD, border: GREEN_LINE }}
              >
                <View style={s.cardHeader}>
                  <Pop trigger={risolta} style={[s.badge, risolta ? s.badgeRisolta : s.badgeAperta]}>
                    <Ionicons name={risolta ? 'checkmark-circle' : 'alert-circle'} size={16} color={risolta ? '#fff' : RED_DEEP} />
                    <Text style={[s.badgeText, risolta ? s.badgeTextRisolta : s.badgeTextAperta]}>
                      {risolta ? 'Risolta' : 'Aperta'}
                    </Text>
                  </Pop>
                  <View style={s.categoria}>
                    <Text style={s.categoriaText}>{item.categoria}</Text>
                  </View>
                </View>

                <Text style={[s.testo, risolta && s.testoRisolta]}>{item.testo}</Text>

                <View style={s.footer}>
                  <View style={s.autoreRow}>
                    <Ionicons name="person" size={14} color={MUTED} />
                    <Text style={s.autore} numberOfLines={1}>{item.autoreNome}</Text>
                  </View>
                  {canAct && !risolta && (
                    <PressScale style={s.btnRisolvi} onPress={() => risolvi(item._id)} accessibilityRole="button" accessibilityLabel="Segna come risolta">
                      <Ionicons name="checkmark" size={18} color="#fff" />
                      <Text style={s.btnRisolviText}>Risolta</Text>
                    </PressScale>
                  )}
                  {canAct && risolta && (
                    <PressScale
                      style={s.btnTrash}
                      scaleTo={0.9}
                      onPress={() => chiudi(item._id)}
                      accessibilityRole="button"
                      accessibilityLabel="Elimina segnalazione"
                    >
                      <Ionicons name="trash-outline" size={20} color={INK_SOFT} />
                    </PressScale>
                  )}
                </View>
              </ColorFade>
              </Enter>
            );
          }}
        />
      )}

      {/* Modale nuova segnalazione */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={s.overlay} onPress={() => setModalVisible(false)}>
            <Enter style={s.formWrap} fromY={10} fromScale={0.94}>
            <Pressable style={s.dialog} onPress={e => e.stopPropagation()}>
              <Text style={s.dialogTitle}>Nuova segnalazione</Text>

              <Text style={s.label}>Categoria</Text>
              <View style={s.catList}>
                {categorie.map(c => {
                  const sel = selectedCat === c.nome;
                  return (
                    <PressScale
                      key={String(c._id)}
                      style={[s.catChip, sel && s.catChipSel]}
                      onPress={() => { setSelectedCat(c.nome); setError(null); }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: sel }}
                    >
                      <Text style={[s.catChipText, sel && s.catChipTextSel]}>{c.nome}</Text>
                    </PressScale>
                  );
                })}
              </View>

              <Text style={s.label}>Descrizione</Text>
              <TextInput
                style={s.input}
                placeholder="Descrivi il problema…"
                placeholderTextColor={MUTED}
                value={testo}
                onChangeText={setTesto}
                multiline
                numberOfLines={3}
                accessibilityLabel="Descrizione"
              />

              {error && <Text style={s.errorText} accessibilityLiveRegion="polite">{error}</Text>}

              <View style={s.dialogBtns}>
                <TouchableOpacity style={s.dialogCancel} onPress={() => setModalVisible(false)}>
                  <Text style={s.dialogCancelLabel}>Annulla</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.dialogDanger, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting}>
                  {submitting
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.dialogConfirmLabel}>Invia</Text>}
                </TouchableOpacity>
              </View>
            </Pressable>
            </Enter>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

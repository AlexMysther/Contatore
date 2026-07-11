import { useEffect, useRef, useState } from 'react';
import { useWs } from '@/context/WsContext';
import {
  View, Text, TouchableOpacity, FlatList,
  Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, apiUrl, authHeaders } from '@/utils/api';
import { s, RED } from './segnalazioni.styles';

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
      setList(prev => prev.find(s => s._id === id) ? prev : [{ ...seg, _id: id }, ...prev]);
    } else if (lastMessage.type === 'segnalazione_aggiornata') {
      setList(prev => prev.map(s => s._id === lastMessage.id ? { ...s, stato: lastMessage.stato as any } : s));
    } else if (lastMessage.type === 'segnalazione_rimossa') {
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
      setList(prev => prev.filter(s => s._id !== id));
      apiFetch(apiUrl(`/api/segnalazioni/${id}/chiudi`), { method: 'PATCH', headers: hdrs() });
    },
  });

  return (
    <SafeAreaView style={s.safe}>
      {/* Modale conferma */}
      <Modal transparent animationType="fade" visible={!!confirm} onRequestClose={() => setConfirm(null)}>
        <Pressable style={s.overlay} onPress={() => setConfirm(null)}>
          <Pressable style={s.dialog} onPress={e => e.stopPropagation()}>
            <Text style={s.dialogTitle}>{confirmRef.current?.title}</Text>
            <Text style={s.dialogMsg}>{confirmRef.current?.message}</Text>
            <View style={s.dialogRow}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setConfirm(null)}>
                <Text style={s.cancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, confirmRef.current?.destructive && s.destructiveBtn]}
                onPress={() => { setConfirm(null); confirmRef.current?.onConfirm(); }}
              >
                <Text style={s.confirmText}>{confirmRef.current?.confirmLabel ?? 'Conferma'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={s.header}>
        <Text style={s.title}>Segnalazioni</Text>
        <TouchableOpacity style={s.addBtn} onPress={openModal}>
          <Text style={s.addBtnText}>+ Nuova</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={RED} style={{ marginTop: 40 }} />
      ) : list.length === 0 ? (
        <Text style={s.empty}>Nessuna segnalazione attiva.</Text>
      ) : (
        <FlatList
          data={list}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isCreator = item.autoreId === user?.id;
            const risolta   = item.stato === 'risolta';
            return (
              <View style={[s.card, risolta && s.cardRisolta]}>
                <View style={s.cardHeader}>
                  <View style={[s.badge, risolta ? s.badgeRisolta : s.badgeAperta]}>
                    <Text style={s.badgeText}>{risolta ? 'Risolta' : 'Aperta'}</Text>
                  </View>
                  <Text style={s.categoria}>{item.categoria}</Text>
                </View>
                <Text style={s.testo}>{item.testo}</Text>
                <Text style={s.autore}>— {item.autoreNome}</Text>
                <View style={s.actions}>
                  {(isAdmin || isCreator) && !risolta && (
                    <TouchableOpacity style={s.btnRisolvi} onPress={() => risolvi(item._id)}>
                      <Text style={s.btnText}>Segna come risolta</Text>
                    </TouchableOpacity>
                  )}
                  {(isCreator || isAdmin) && risolta && (
                    <TouchableOpacity style={s.btnTrash} onPress={() => chiudi(item._id)}>
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modale nuova segnalazione */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Nuova segnalazione</Text>

            <Text style={s.label}>Categoria</Text>
            <View style={s.catList}>
              {categorie.map(c => (
                <TouchableOpacity
                  key={String(c._id)}
                  style={[s.catChip, selectedCat === c.nome && s.catChipSel]}
                  onPress={() => setSelectedCat(c.nome)}
                >
                  <Text style={[s.catChipText, selectedCat === c.nome && s.catChipTextSel]}>{c.nome}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Descrizione</Text>
            <TextInput
              style={s.input}
              placeholder="Descrivi il problema..."
              value={testo}
              onChangeText={setTesto}
              multiline
              numberOfLines={3}
            />

            {error && <Text style={s.errorText}>{error}</Text>}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={s.btnCancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnSubmit, submitting && { opacity: 0.7 }]} onPress={submit} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.btnText}>Invia</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
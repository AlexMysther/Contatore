import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const API_BASE = 'http://localhost:3000/api';
const POLL_MS  = 5000;

type Confirm      = { title: string; message: string; onConfirm: () => void; confirmLabel?: string; destructive?: boolean } | null;
type Categoria    = { _id: string; nome: string; order: number };
type Segnalazione = {
  _id: string;
  categoria: string;
  testo: string;
  autoreId: string;
  autoreNome: string;
  stato: 'aperta' | 'risolta';
  createdAt: string;
};

export default function SegnalazioniScreen() {
  const { user } = useAuth();
  const token   = user?.token ?? '';
  const isAdmin = user?.ruolo === 'admin';

  const [list, setList]           = useState<Segnalazione[]>([]);
  const [categorie, setCategorie] = useState<Categoria[]>([]);
  const [loading, setLoading]     = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirm, setConfirm]           = useState<Confirm>(null);
  const confirmData                     = useRef<Confirm>(null);
  const [selectedCat, setSelectedCat]   = useState<string | null>(null);
  const [testo, setTesto]         = useState('');
  const [error, setError]         = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  });

  const fetchList = (first = false) => {
    fetch(`${API_BASE}/segnalazioni`, { headers: headers() })
      .then(r => r.json())
      .then(data => {
        setList(Array.isArray(data) ? data : []);
        if (first) setLoading(false);
      })
      .catch(() => { if (first) setLoading(false); });
  };

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/categorie`, { headers: headers() })
      .then(r => r.json())
      .then(data => setCategorie(Array.isArray(data) ? data : []));
    fetchList(true);
    pollRef.current = setInterval(() => fetchList(), POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token]);

  const openModal = () => {
    setSelectedCat(null);
    setTesto('');
    setError(null);
    setModalVisible(true);
  };

  const submit = () => {
    if (!selectedCat)    { setError('Seleziona una categoria.'); return; }
    if (!testo.trim())   { setError('Scrivi una descrizione.'); return; }
    fetch(`${API_BASE}/segnalazioni`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ categoria: selectedCat, testo: testo.trim() }),
    })
      .then(r => r.json())
      .then(newSeg => {
        setList(prev => [newSeg, ...prev]);
        setModalVisible(false);
      });
  };

  const showConfirm = (data: NonNullable<Confirm>) => {
    confirmData.current = data;
    setConfirm(data);
  };

  const hideConfirm = () => setConfirm(null);

  const risolvi = (id: string) => {
    showConfirm({
      title: 'Segna come risolta',
      message: 'Vuoi segnare questa segnalazione come risolta?',
      confirmLabel: 'Risolvi',
      onConfirm: () =>
        fetch(`${API_BASE}/segnalazioni/${id}/risolvi`, { method: 'PATCH', headers: headers() })
          .then(() => setList(prev => prev.map(s => s._id === id ? { ...s, stato: 'risolta' } : s))),
    });
  };

  const chiudi = (id: string) => {
    showConfirm({
      title: 'Elimina segnalazione',
      message: 'Vuoi eliminare questa segnalazione?',
      confirmLabel: 'Elimina',
      destructive: true,
      onConfirm: () =>
        fetch(`${API_BASE}/segnalazioni/${id}/chiudi`, { method: 'PATCH', headers: headers() })
          .then(() => setList(prev => prev.filter(s => s._id !== id))),
    });
  };

  const renderItem = ({ item }: { item: Segnalazione }) => {
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
  };

  return (
    <SafeAreaView style={s.safe}>
      <Modal transparent animationType="fade" visible={!!confirm} onRequestClose={hideConfirm}>
        <Pressable style={s.overlay} onPress={hideConfirm}>
          <Pressable style={s.dialog} onPress={e => e.stopPropagation()}>
            <Text style={s.dialogTitle}>{confirmData.current?.title}</Text>
            <Text style={s.dialogMsg}>{confirmData.current?.message}</Text>
            <View style={s.dialogRow}>
              <TouchableOpacity style={s.cancelBtn} onPress={hideConfirm}>
                <Text style={s.cancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, confirmData.current?.destructive && s.destructiveBtn]}
                onPress={() => { hideConfirm(); confirmData.current?.onConfirm(); }}
              >
                <Text style={s.confirmText}>{confirmData.current?.confirmLabel ?? 'Conferma'}</Text>
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
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : list.length === 0 ? (
        <Text style={s.empty}>Nessuna segnalazione attiva.</Text>
      ) : (
        <FlatList
          data={list}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

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
                  <Text style={[s.catChipText, selectedCat === c.nome && s.catChipTextSel]}>
                    {c.nome}
                  </Text>
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
              <TouchableOpacity style={s.btnSubmit} onPress={submit}>
                <Text style={s.btnText}>Invia</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 24 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title:      { fontSize: 20, fontWeight: '700' },
  addBtn:     { backgroundColor: '#c0392b', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  empty:      { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },

  card:         { backgroundColor: '#fdecea', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#ef9a9a', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardRisolta:  { backgroundColor: '#e8f5e9', borderColor: '#a5d6a7' },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  badge:        { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  badgeAperta:  { backgroundColor: '#fdecea', borderColor: '#ef9a9a' },
  badgeRisolta: { backgroundColor: '#e8f5e9', borderColor: '#a5d6a7' },
  badgeText:    { fontSize: 11, fontWeight: '600' },
  categoria:    { fontSize: 13, fontWeight: '600', color: '#555', borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  testo:        { fontSize: 15, color: '#222', marginBottom: 6, fontWeight: '600' },
  autore:       { fontSize: 12, color: '#999', fontWeight: '600' },
  actions:      { marginTop: 10, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  btnTrash:     { backgroundColor: '#aaa', borderRadius: 8, padding: 8, alignItems: 'center', justifyContent: 'center' },
  btnRisolvi:   { backgroundColor: '#c0392b', borderRadius: 7, paddingHorizontal: 14, paddingVertical: 7 },
  btnChiudi:    { backgroundColor: '#7f8c8d', borderRadius: 7, paddingHorizontal: 14, paddingVertical: 7 },
  btnText:      { color: '#fff', fontWeight: '600', fontSize: 13 },

  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  dialog:       { backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 8 },
  dialogTitle:  { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  dialogMsg:    { fontSize: 15, color: '#444' },
  dialogRow:    { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn:    { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center', backgroundColor: '#f0f0f0' },
  cancelText:   { fontSize: 15, color: '#555' },
  confirmBtn:   { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center', backgroundColor: '#c0392b' },
  confirmText:  { fontSize: 15, color: '#fff', fontWeight: '600' },
  destructiveBtn: { backgroundColor: '#7f8c8d' },
  modal:        { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  modalTitle:   { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label:        { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8 },
  catList:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catChip:      { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  catChipSel:   { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  catChipText:  { fontSize: 13, color: '#555' },
  catChipTextSel: { color: '#fff', fontWeight: '600' },
  input:        { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 12, minHeight: 80, textAlignVertical: 'top' },
  errorText:    { color: '#c0392b', fontSize: 13, marginBottom: 8 },
  modalActions: { flexDirection: 'row', gap: 10 },
  btnCancel:    { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnCancelText:{ color: '#555', fontWeight: '600' },
  btnSubmit:    { flex: 1, backgroundColor: '#c0392b', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
});

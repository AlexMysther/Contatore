import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, SafeAreaView, Modal, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';

const BANNER_IMAGE = require('@/assets/custom/Logo-pizzium-ROSSO-01-3.png');
const AVAILABLE_PRODUCTS = [
  'Frittatine Classiche',
  'Frittatine di Patate',
  'Crocchè di Patate',
  'Cheesecake',
  'Tortino al Cioccolato',
  'Tiramisù',
  'Pastiera',
];

const API_URL  = 'https://contatore-production.up.railway.app/api/prodotti';
const POLL_MS  = 5000;

type Item    = { _id: string; name: string; count: number };
type Pending = Record<string, number | 'delete'>;
type Confirm = { title: string; message: string; onConfirm: () => void; confirmLabel?: string; destructive?: boolean; delta?: number } | null;

export default function App() {
  const { user, logout, updateAvatar } = useAuth();
  const token = user?.token ?? '';

  const [items, setItems]           = useState<Item[]>([]);
  const [loading, setLoading]       = useState(true);
  const [pending, setPending]       = useState<Pending>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [confirm, setConfirm]       = useState<Confirm>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [inputQty, setInputQty]     = useState('');
  const [addError, setAddError]     = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permesso negato', 'Serve accesso alla galleria.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (result.canceled) return;
    const err = await updateAvatar(result.assets[0].uri);
    if (err) Alert.alert('Errore', err);
  };

  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  });

  const fetchItems = (isFirst = false) => {
    fetch(API_URL, { headers: headers() })
      .then(r => {
        if (r.status === 401) { logout(); return null; }
        return r.json();
      })
      .then((data: Item[] | null) => {
        if (data === null) return;
        setItems(Array.isArray(data) ? data : []);
        if (isFirst) setLoading(false);
      })
      .catch(() => { if (isFirst) setLoading(false); });
  };

  useEffect(() => {
    if (!token) return;
    fetchItems(true);
    pollRef.current = setInterval(() => fetchItems(false), POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [token]);

  const hasPending  = Object.keys(pending).length > 0;
  const isCustom    = selectedProduct === '__custom__';

  const displayCount = (item: Item): number =>
    typeof pending[item._id] === 'number' ? (pending[item._id] as number) : item.count;

  const openModal = () => {
    setSelectedProduct(null);
    setCustomName('');
    setInputQty('');
    setAddError(null);
    setModalVisible(true);
  };

  const confirmAdd = () => {
    if (!selectedProduct) { setAddError('Seleziona un prodotto dalla lista.'); return; }
    const name = isCustom ? customName.trim() : selectedProduct;
    if (!name) { setAddError('Inserisci il nome del prodotto personalizzato.'); return; }
    const qty = parseInt(inputQty, 10);
    if (isNaN(qty) || qty < 0) { setAddError('Inserisci un numero intero positivo.'); return; }

    fetch(API_URL, { method: 'POST', headers: headers(), body: JSON.stringify({ name, count: qty }) })
      .then(r => r.json())
      .then((newItem: Item) => setItems(prev => [...prev, newItem]));

    setAddError(null);
    setModalVisible(false);
  };

  const change = (id: string, delta: number) => {
    const current = displayCount(items.find(i => i._id === id)!);
    setPending(prev => ({ ...prev, [id]: Math.max(0, current + delta) }));
  };

  const remove = (id: string) =>
    setPending(prev => ({ ...prev, [id]: 'delete' }));

  const commitChanges = () => {
    const netDelta = Object.entries(pending).reduce((acc, [id, val]) => {
      const item = items.find(i => i._id === id);
      if (!item) return acc;
      if (val === 'delete') return acc - item.count;
      return acc + ((val as number) - item.count);
    }, 0);
    setConfirm({
      title: 'Invia modifiche',
      message: 'Vuoi applicare tutte le modifiche in sospeso?',
      confirmLabel: 'Invia',
      delta: netDelta,
      onConfirm: async () => {
        const ops = Object.entries(pending).map(([id, val]) => {
          if (val === 'delete') {
            return fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: headers() })
              .then(() => setItems(prev => prev.filter(i => i._id !== id)));
          } else {
            return fetch(`${API_URL}/${id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify({ count: val }) })
              .then(() => setItems(prev => prev.map(i => i._id === id ? { ...i, count: val as number } : i)));
          }
        });
        await Promise.all(ops);
        setPending({});
      },
    });
  };

  const discardChanges = () => {
    setConfirm({
      title: 'Annulla modifiche',
      message: 'Vuoi scartare tutte le modifiche in sospeso?',
      confirmLabel: 'Sì, scarta',
      destructive: true,
      onConfirm: () => setPending({}),
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <ActivityIndicator size="large" color="#c0392b" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Modale conferma */}
      <Modal transparent animationType="fade" visible={!!confirm} onRequestClose={() => setConfirm(null)}>
        <Pressable style={s.overlay} onPress={() => setConfirm(null)}>
          <Pressable style={s.dialog} onPress={e => e.stopPropagation()}>
            <Text style={s.dialogTitle}>{confirm?.title}</Text>
            {confirm?.delta !== undefined && confirm.delta !== 0 && (
              <Text style={[s.deltaNum, confirm.delta > 0 ? s.deltaPos : s.deltaNeg]}>
                {confirm.delta > 0 ? `+${confirm.delta}` : `${confirm.delta}`}
              </Text>
            )}
            <Text style={s.confirmMsg}>{confirm?.message}</Text>
            <View style={s.dialogRow}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setConfirm(null)}>
                <Text style={s.cancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, confirm?.destructive && s.destructiveBtn]}
                onPress={() => { confirm?.onConfirm(); setConfirm(null); }}
              >
                <Text style={s.confirmText}>{confirm?.confirmLabel ?? 'Conferma'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Image source={BANNER_IMAGE} style={s.banner} resizeMode="cover" />
      <View style={s.titleRow}>
        <View style={s.titleLeft}>
          <TouchableOpacity onPress={pickAvatar}>
            {user?.avatarUrl
              ? <Image source={{ uri: user.avatarUrl }} style={s.avatar} />
              : <View style={s.avatarPlaceholder}><Text style={s.avatarInitial}>{user?.nome?.[0]?.toUpperCase() ?? '?'}</Text></View>
            }
          </TouchableOpacity>
          <View>
            <Text style={s.title}>Contatore Prodotti</Text>
            {user && <Text style={s.userLabel}>{user.nome}</Text>}
          </View>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={logout}>
          <Text style={s.logoutText}>Esci</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.addBtn} onPress={openModal}>
        <Text style={s.addBtnText}>+ Aggiungi elemento</Text>
      </TouchableOpacity>

      <FlatList
        data={[...items].sort((a, b) => {
          const aFinito = a.count === 0;
          const bFinito = b.count === 0;
          if (aFinito !== bFinito) return aFinito ? 1 : -1;
          return a.name.localeCompare(b.name, 'it');
        })}
        keyExtractor={item => item._id}
        renderItem={({ item }) => {
          const isDeleted = pending[item._id] === 'delete';
          const isDirty   = pending[item._id] !== undefined;
          const diff      = isDirty && !isDeleted ? (displayCount(item) - item.count) : 0;
          const isSoldOut = !isDeleted && item.count === 0;
          const activeId  = Object.keys(pending).find(k => typeof pending[k] === 'number');
          const isLocked  = !!activeId && activeId !== item._id;
          return (
            <View style={[s.card, isDeleted && s.cardDeleted, isDirty && !isDeleted && s.cardDirty, isSoldOut && s.cardSoldOut, isLocked && s.cardLocked]}>
              <TouchableOpacity onPress={() => remove(item._id)} disabled={isDeleted || isLocked}>
                <Text style={[s.del, isDeleted && s.delActive]}>✕</Text>
              </TouchableOpacity>
              <View style={s.cardBody}>
                <View style={s.nameRow}>
                  <Text style={[s.name, isDeleted && s.nameDeleted]}>{item.name}</Text>
                  {isSoldOut && <View style={s.soldOutBadge}><Text style={s.soldOutText}>Finito</Text></View>}
                </View>
                {diff !== 0 && (
                  <Text style={[s.diff, diff > 0 ? s.diffPos : s.diffNeg]}>
                    {diff > 0 ? `+${diff}` : `${diff}`} rispetto all'originale ({item.count})
                  </Text>
                )}
              </View>
              {isDeleted ? (
                <Text style={s.deletedLabel}>Da eliminare</Text>
              ) : isSoldOut ? null : (
                <View style={s.counter}>
                  <TouchableOpacity style={[s.btn, isLocked && s.btnDisabled]} onPress={() => change(item._id, -1)} disabled={isLocked}>
                    <Text style={[s.btnText, isLocked && s.btnTextDisabled]}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.count}>{displayCount(item)}</Text>
                  <TouchableOpacity style={[s.btn, isLocked && s.btnDisabled]} onPress={() => change(item._id, +1)} disabled={isLocked}>
                    <Text style={[s.btnText, isLocked && s.btnTextDisabled]}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      {hasPending && (
        <View style={s.bar}>
          <TouchableOpacity style={s.discardBtn} onPress={discardChanges}>
            <Text style={s.discardText}>Scarta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.commitBtn} onPress={commitChanges}>
            <Text style={s.commitText}>Invia modifiche</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modale aggiungi prodotto */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={s.overlay} onPress={() => setModalVisible(false)}>
            <Pressable style={s.dialog} onPress={e => e.stopPropagation()}>
              <Text style={s.dialogTitle}>Nuovo elemento</Text>

              <Text style={s.label}>Prodotto</Text>
              <ScrollView style={s.productList} nestedScrollEnabled>
                {AVAILABLE_PRODUCTS.map(product => {
                  const alreadyAdded = items.some(i => i.name === product);
                  return (
                    <TouchableOpacity
                      key={product}
                      style={[s.productItem, selectedProduct === product && s.productItemSelected, alreadyAdded && s.productItemDisabled]}
                      onPress={() => !alreadyAdded && setSelectedProduct(product)}
                      disabled={alreadyAdded}
                    >
                      <Text style={[s.productItemText, selectedProduct === product && s.productItemTextSelected, alreadyAdded && s.productItemTextDisabled]}>
                        {product}{alreadyAdded ? ' (già aggiunto)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[s.productItem, isCustom && s.productItemSelected]}
                  onPress={() => setSelectedProduct('__custom__')}
                >
                  <Text style={[s.productItemText, isCustom && s.productItemTextSelected]}>
                    ✏️ Personalizzato
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {isCustom && (
                <TextInput
                  style={s.dialogInput}
                  placeholder="Nome prodotto personalizzato"
                  value={customName}
                  onChangeText={setCustomName}
                  autoFocus
                />
              )}

              <Text style={s.label}>Quantità iniziale</Text>
              <View style={s.qtyRow}>
                <TextInput
                  style={[s.dialogInput, s.qtyInput]}
                  placeholder="es. 0"
                  value={inputQty}
                  onChangeText={setInputQty}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={confirmAdd}
                />
                <TouchableOpacity
                  style={[s.finitoBtn, inputQty === '0' && s.finitoBtnActive]}
                  onPress={() => setInputQty('0')}
                >
                  <Text style={[s.finitoText, inputQty === '0' && s.finitoTextActive]}>Finito</Text>
                </TouchableOpacity>
              </View>

              {addError && <Text style={s.addErrorText}>{addError}</Text>}
              <View style={s.dialogRow}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => { setModalVisible(false); setAddError(null); }}>
                  <Text style={s.cancelText}>Annulla</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.confirmBtn} onPress={confirmAdd}>
                  <Text style={s.confirmText}>Aggiungi</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  center:       { justifyContent: 'center', alignItems: 'center' },
  banner:       { width: '100%', height: 180 },
  titleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 16, marginBottom: 16 },
  titleLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:       { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#c0392b', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  title:        { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  userLabel:    { fontSize: 12, color: '#888', marginTop: 2 },
  logoutBtn:    { backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  logoutText:   { fontSize: 14, color: '#c0392b', fontWeight: '600' },
  addBtn:       { backgroundColor: '#c0392b', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16, marginHorizontal: 16 },
  addBtnText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, boxShadow: '0px 2px 4px rgba(0,0,0,0.06)', elevation: 2 } as any,
  cardDirty:    { borderWidth: 1.5, borderColor: '#c0392b' },
  cardDeleted:  { backgroundColor: '#fff0f0', borderWidth: 1.5, borderColor: '#c0392b' },
  del:          { color: '#ccc', fontSize: 14 },
  delActive:    { color: '#c0392b' },
  cardBody:     { flex: 1, gap: 2 },
  name:         { fontSize: 16, color: '#1a1a1a' },
  nameDeleted:  { color: '#aaa', textDecorationLine: 'line-through' },
  diff:         { fontSize: 12, fontWeight: '600' },
  diffPos:      { color: '#27ae60' },
  diffNeg:      { color: '#c0392b' },
  cardSoldOut:  { backgroundColor: '#fff7e6', borderWidth: 1.5, borderColor: '#e67e22' },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  soldOutBadge: { backgroundColor: '#e67e22', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  soldOutText:  { fontSize: 11, fontWeight: '700', color: '#fff' },
  deletedLabel: { fontSize: 13, color: '#c0392b', fontWeight: '600' },
  counter:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn:          { backgroundColor: '#fdecea', borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  btnText:      { fontSize: 20, color: '#c0392b', lineHeight: 24 },
  btnDisabled:      { backgroundColor: '#f5f5f5' },
  btnTextDisabled:  { color: '#ccc' },
  cardLocked:   { opacity: 0.45 },
  count:        { fontSize: 18, fontWeight: '600', minWidth: 28, textAlign: 'center', color: '#1a1a1a' },
  bar:          { flexDirection: 'row', gap: 10, paddingTop: 12, paddingBottom: 16, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 4 },
  discardBtn:   { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center', backgroundColor: '#f0f0f0' },
  discardText:  { fontSize: 15, color: '#555' },
  commitBtn:    { flex: 2, borderRadius: 10, padding: 13, alignItems: 'center', backgroundColor: '#c0392b' },
  commitText:   { fontSize: 15, color: '#fff', fontWeight: '600' },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  dialog:       { backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 8 },
  dialogTitle:  { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  confirmMsg:   { fontSize: 15, color: '#444' },
  deltaNum:     { fontSize: 52, fontWeight: '800', textAlign: 'center', marginVertical: 4 },
  deltaPos:     { color: '#27ae60' },
  deltaNeg:     { color: '#c0392b' },
  label:        { fontSize: 13, color: '#666', marginTop: 4 },
  dialogInput:  { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#ddd', color: '#1a1a1a', marginBottom: 4 },
  dialogRow:    { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn:    { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center', backgroundColor: '#f0f0f0' },
  cancelText:   { fontSize: 15, color: '#555' },
  confirmBtn:   { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center', backgroundColor: '#c0392b' },
  confirmText:  { fontSize: 15, color: '#fff', fontWeight: '600' },
  destructiveBtn: { backgroundColor: '#c0392b' },
  addErrorText: { fontSize: 13, color: '#c0392b', textAlign: 'center' },
  productList:          { maxHeight: 160, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginBottom: 4 },
  productItem:          { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  productItemSelected:  { backgroundColor: '#c0392b' },
  productItemText:      { fontSize: 15, color: '#1a1a1a' },
  productItemTextSelected: { color: '#fff', fontWeight: '600' },
  productItemDisabled:  { backgroundColor: '#f9f9f9' },
  productItemTextDisabled: { color: '#bbb' },
  qtyRow:       { flexDirection: 'row', gap: 8, alignItems: 'center' },
  qtyInput:     { flex: 1, marginBottom: 0 },
  finitoBtn:    { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  finitoBtnActive: { backgroundColor: '#c0392b' },
  finitoText:   { fontSize: 14, fontWeight: '600', color: '#555' },
  finitoTextActive: { color: '#fff' },
});

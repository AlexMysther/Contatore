import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, SafeAreaView, Alert, Modal, KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native';

// ─── Sostituisci con il path della tua immagine banner ────────────────────────
const BANNER_IMAGE = require('@/assets/custom/Logo-pizzium-ROSSO-01-3.png');
// ──────────────────────────────────────────────────────────────────────────────

// ─── Modifica qui la lista dei prodotti disponibili ───────────────────────────
const AVAILABLE_PRODUCTS = [
  'Frittatine Classiche',
  'Frittatine di Patate',
  'Crocchè di Patate',
  'Cheesecake',
  'Tortino al Cioccolato',
  'Tiramisù',
  'Pastiera',
];
// ──────────────────────────────────────────────────────────────────────────────

type Item = { id: string; name: string; count: number };
type Pending = Record<string, number | 'delete'>;

export default function App() {
  const [items, setItems] = useState<Item[]>([]);
  const [pending, setPending] = useState<Pending>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [inputQty, setInputQty] = useState('');

  const hasPending = Object.keys(pending).length > 0;

  // Returns the displayed count for an item (with pending applied)
  const displayCount = (item: Item): number =>
    typeof pending[item.id] === 'number' ? (pending[item.id] as number) : item.count;

  const isCustom = selectedProduct === '__custom__';

  const openModal = () => {
    setSelectedProduct(null);
    setCustomName('');
    setInputQty('');
    setModalVisible(true);
  };

  const confirmAdd = () => {
    if (!selectedProduct) {
      Alert.alert('Prodotto mancante', 'Seleziona un prodotto dalla lista.');
      return;
    }
    const name = isCustom ? customName.trim() : selectedProduct;
    if (!name) {
      Alert.alert('Nome mancante', 'Inserisci il nome del prodotto personalizzato.');
      return;
    }
    const qty = parseInt(inputQty, 10);
    if (isNaN(qty) || qty < 0) {
      Alert.alert('Quantità non valida', 'Inserisci un numero intero positivo.');
      return;
    }
    setItems(prev => [...prev, { id: Date.now().toString(), name, count: qty }]);
    setModalVisible(false);
  };

  const change = (id: string, delta: number) => {
    const current = displayCount(items.find(i => i.id === id)!);
    const next = Math.max(0, current + delta);
    setPending(prev => ({ ...prev, [id]: next }));
  };

  const remove = (id: string) => {
    setPending(prev => ({ ...prev, [id]: 'delete' }));
  };

  const commitChanges = () => {
    Alert.alert(
      'Invia modifiche',
      'Vuoi applicare tutte le modifiche in sospeso?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Invia',
          onPress: () => {
            setItems(prev =>
              prev
                .filter(item => pending[item.id] !== 'delete')
                .map(item =>
                  typeof pending[item.id] === 'number'
                    ? { ...item, count: pending[item.id] as number }
                    : item
                )
            );
            setPending({});
          },
        },
      ]
    );
  };

  const discardChanges = () => {
    Alert.alert(
      'Annulla modifiche',
      'Vuoi scartare tutte le modifiche in sospeso?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sì, scarta', style: 'destructive', onPress: () => setPending({}) },
      ]
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <Image source={BANNER_IMAGE} style={s.banner} resizeMode="cover" />
      <Text style={s.title}>Contatore Prodotti</Text>

      <TouchableOpacity style={s.addBtn} onPress={openModal}>
        <Text style={s.addBtnText}>+ Aggiungi elemento</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isDeleted = pending[item.id] === 'delete';
          const isDirty = pending[item.id] !== undefined;
          const diff = isDirty && !isDeleted ? (displayCount(item) - item.count) : 0;
          const isSoldOut = !isDeleted && item.count === 0;
          return (
            <View style={[s.card, isDeleted && s.cardDeleted, isDirty && !isDeleted && s.cardDirty, isSoldOut && s.cardSoldOut]}>
              <TouchableOpacity onPress={() => remove(item.id)} disabled={isDeleted}>
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
                  <TouchableOpacity style={s.btn} onPress={() => change(item.id, -1)}>
                    <Text style={s.btnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={s.count}>{displayCount(item)}</Text>
                  <TouchableOpacity style={s.btn} onPress={() => change(item.id, +1)}>
                    <Text style={s.btnText}>+</Text>
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

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={s.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.dialog}>
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

            <View style={s.dialogRow}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={s.cancelText}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={confirmAdd}>
                <Text style={s.confirmText}>Aggiungi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  banner:       { width: '100%', height: 180 },
  title:        { fontSize: 28, fontWeight: '700', marginTop: 24, marginBottom: 20, color: '#1a1a1a', paddingHorizontal: 16 },
  addBtn:       { backgroundColor: '#c0392b', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 16, marginHorizontal: 16 },
  addBtnText:   { color: '#fff', fontSize: 16, fontWeight: '600' },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardDirty:    { borderWidth: 1.5, borderColor: '#c0392b' },
  cardDeleted:  { backgroundColor: '#fff0f0', borderWidth: 1.5, borderColor: '#e74c3c' },
  del:          { color: '#ccc', fontSize: 14 },
  delActive:    { color: '#e74c3c' },
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
  deletedLabel: { fontSize: 13, color: '#e74c3c', fontWeight: '600' },
  counter:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn:          { backgroundColor: '#fdecea', borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  btnText:      { fontSize: 20, color: '#c0392b', lineHeight: 24 },
  count:        { fontSize: 18, fontWeight: '600', minWidth: 28, textAlign: 'center', color: '#1a1a1a' },
  // bottom bar
  bar:          { flexDirection: 'row', gap: 10, paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 4 },
  discardBtn:   { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center', backgroundColor: '#f0f0f0' },
  discardText:  { fontSize: 15, color: '#555' },
  commitBtn:    { flex: 2, borderRadius: 10, padding: 13, alignItems: 'center', backgroundColor: '#c0392b' },
  commitText:   { fontSize: 15, color: '#fff', fontWeight: '600' },
  // modal
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  dialog:       { backgroundColor: '#fff', borderRadius: 16, padding: 24, gap: 8 },
  dialogTitle:  { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  label:        { fontSize: 13, color: '#666', marginTop: 4 },
  dialogInput:  { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, fontSize: 16, borderWidth: 1, borderColor: '#ddd', color: '#1a1a1a', marginBottom: 4 },
  dialogRow:    { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn:    { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center', backgroundColor: '#f0f0f0' },
  cancelText:   { fontSize: 15, color: '#555' },
  confirmBtn:   { flex: 1, borderRadius: 10, padding: 13, alignItems: 'center', backgroundColor: '#c0392b' },
  confirmText:          { fontSize: 15, color: '#fff', fontWeight: '600' },
  productList:          { maxHeight: 160, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginBottom: 4 },
  productItem:          { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  productItemSelected:  { backgroundColor: '#c0392b' },
  productItemText:      { fontSize: 15, color: '#1a1a1a' },
  productItemTextSelected:  { color: '#fff', fontWeight: '600' },
  productItemDisabled:      { backgroundColor: '#f9f9f9' },
  productItemTextDisabled:  { color: '#bbb' },
  qtyRow:        { flexDirection: 'row', gap: 8, alignItems: 'center' },
  qtyInput:      { flex: 1, marginBottom: 0 },
  finitoBtn:     { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  finitoBtnActive: { backgroundColor: '#c0392b' },
  finitoText:    { fontSize: 14, fontWeight: '600', color: '#555' },
  finitoTextActive: { color: '#fff' },
});

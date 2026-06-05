import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Modal, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';

const BANNER_IMAGE = require('@/assets/custom/Logo-pizzium-ROSSO-01-3.png');

const API_URL  = 'http://localhost:3000/api/prodotti';
const API_DISPONIBILI = 'http://localhost:3000/api/prodotti-disponibili';
type Item      = { _id: string; name: string; count: number; categoria?: string | null; prodotti_legati?: string[] };
type Disponibile = { _id: string; name: string; categoria: string; prodotti_legati?: string[] };
type Pending   = Record<string, number | 'delete'>;
type Confirm   = { title: string; message: string; onConfirm: () => void; confirmLabel?: string; destructive?: boolean; delta?: number } | null;

export default function App() {
  const { user, logout } = useAuth();
  const { setHideNav } = useNav();
  const token = user?.token ?? '';

  const [items, setItems]           = useState<Item[]>([]);
  const [disponibili, setDisponibili] = useState<Disponibile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [pending, setPending]       = useState<Pending>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [confirm, setConfirm]       = useState<Confirm>(null);
  const [selectedProduct, setSelectedProduct] = useState<Disponibile | null>(null);
  const [customName, setCustomName] = useState('');
  const [customCategoria, setCustomCategoria] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'prodotti' | 'ingredienti'>('prodotti');
  const [inputQty, setInputQty]     = useState('');
  const [addError, setAddError]     = useState<string | null>(null);

  const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [itemsRes, dispRes] = await Promise.all([
        fetch(API_URL, { headers: headers() }),
        fetch(API_DISPONIBILI, { headers: headers() }),
      ]);
      if (itemsRes.status === 401) { logout(); return; }
      const [itemsData, dispData] = await Promise.all([itemsRes.json(), dispRes.json()]);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setDisponibili(Array.isArray(dispData) ? dispData : []);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(API_URL, { headers: headers() }),
      fetch(API_DISPONIBILI, { headers: headers() }),
    ])
      .then(async ([itemsRes, dispRes]) => {
        if (itemsRes.status === 401) { logout(); return; }
        const [itemsData, dispData] = await Promise.all([itemsRes.json(), dispRes.json()]);
        setItems(Array.isArray(itemsData) ? itemsData : []);
        setDisponibili(Array.isArray(dispData) ? dispData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const catColor: Record<string, { bg: string; border: string; text: string }> = {
    antipasto:    { bg: '#fdecea', border: '#ef9a9a', text: '#c0392b' },
    pizza:        { bg: '#e8f5e9', border: '#a5d6a7', text: '#27ae60' },
    dolci:        { bg: '#e3f2fd', border: '#90caf9', text: '#1565c0' },
    bevanda:      { bg: '#f3e5f5', border: '#ce93d8', text: '#7b1fa2' },
    'M.autunno':  { bg: '#fff3e0', border: '#ffb74d', text: '#e65100' },
    ingrediente:  { bg: '#f1f8e9', border: '#aed581', text: '#558b2f' },
  };

  const hasPending  = Object.keys(pending).length > 0;
  const isCustom    = selectedProduct?.name === '__custom__';

  useEffect(() => { setHideNav(hasPending); }, [hasPending]);

  const displayCount = (item: Item): number =>
    typeof pending[item._id] === 'number' ? (pending[item._id] as number) : item.count;

  const openModal = () => {
    setSelectedProduct(null);
    setCustomName('');
    setCustomCategoria(null);
    setInputQty('');
    setAddError(null);
    setModalTab('prodotti');
    setModalVisible(true);
  };

  const confirmAdd = () => {
    if (!selectedProduct) { setAddError('Seleziona un prodotto dalla lista.'); return; }
    const name = isCustom ? customName.trim() : selectedProduct.name;
    const categoria = isCustom ? customCategoria : selectedProduct.categoria;
    const prodotti_legati = isCustom ? undefined : selectedProduct.prodotti_legati;
    if (!name) { setAddError('Inserisci il nome del prodotto personalizzato.'); return; }
    const qty = parseInt(inputQty, 10);
    if (isNaN(qty) || qty < 0) { setAddError('Inserisci un numero intero positivo.'); return; }

    const tempId = `temp_${Date.now()}`;
    setItems(prev => [...prev, { _id: tempId, name, count: qty, categoria: categoria ?? null, ...(prodotti_legati ? { prodotti_legati } : {}) }]);
    setAddError(null);
    setModalVisible(false);

    fetch(API_URL, { method: 'POST', headers: headers(), body: JSON.stringify({ name, count: qty, categoria, prodotti_legati }) })
      .then(r => r.json())
      .then((newItem: Item) => setItems(prev => prev.map(i => i._id === tempId ? newItem : i)));
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
        setSaving(true);
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
        setSaving(false);
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
        <Text style={s.title}>{user?.nome ?? 'Ciao!'}</Text>
        {user && (user.avatarUrl
          ? <Image source={{ uri: user.avatarUrl }} style={s.avatar} />
          : <View style={s.avatarPlaceholder}><Text style={s.avatarInitial}>{user.nome?.[0]?.toUpperCase() ?? '?'}</Text></View>
        )}
      </View>

      <TouchableOpacity style={s.addBtn} onPress={openModal}>
        <Text style={s.addBtnText}>+ Aggiungi elemento</Text>
      </TouchableOpacity>

      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#c0392b']} tintColor="#c0392b" />}
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
          const c = catColor[item.categoria ?? ''] ?? catColor.antipasto;
          return (
            <View style={[
              s.card,
              !isDeleted && { backgroundColor: c.bg, borderWidth: 1.5, borderColor: c.text },
              isDeleted && s.cardDeleted,
              isDirty && !isDeleted && s.cardDirty,

              isLocked && s.cardLocked,
            ]}>
              <TouchableOpacity onPress={() => remove(item._id)} disabled={isDeleted || isLocked}>
                <Text style={[s.del, isDeleted && s.delActive]}>✕</Text>
              </TouchableOpacity>
              <View style={s.cardBody}>
                <View style={s.nameRow}>
                  <Text style={[s.name, isDeleted && s.nameDeleted]}>{item.name}</Text>
                  {item.categoria && (() => { const c = catColor[item.categoria!] ?? catColor.antipasto; return <View style={[s.catBadge, { backgroundColor: c.bg, borderColor: c.border }]}><Text style={[s.catBadgeText, { color: c.text }]}>{item.categoria}</Text></View>; })()}
                  {isSoldOut && <View style={s.soldOutBadge}><Text style={s.soldOutText}>Finito</Text></View>}
                </View>
                {item.prodotti_legati && item.prodotti_legati.length > 0 && (
                  <View style={s.legatiBox}>
                    {item.prodotti_legati.map(p => (
                      <Text key={p} style={s.legatiItem}>• {p}</Text>
                    ))}
                  </View>
                )}
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
          <TouchableOpacity style={s.discardBtn} onPress={discardChanges} disabled={saving}>
            <Text style={[s.discardText, saving && { color: '#bbb' }]}>Scarta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.commitBtn} onPress={commitChanges} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.commitText}>Invia modifiche</Text>}
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
              <View style={s.tabRow}>
                {(['prodotti', 'ingredienti'] as const).map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[s.tabBtn, modalTab === tab && s.tabBtnActive]}
                    onPress={() => { setModalTab(tab); setSelectedProduct(null); }}
                  >
                    <Text style={[s.tabBtnText, modalTab === tab && s.tabBtnTextActive]}>
                      {tab === 'prodotti' ? 'Prodotti' : 'Ingredienti'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <ScrollView style={s.productList} nestedScrollEnabled>
                {disponibili.filter(p => modalTab === 'ingredienti' ? p.categoria === 'ingrediente' : p.categoria !== 'ingrediente').map(product => {
                  const alreadyAdded = items.some(i => i.name === product.name);
                  const isSelected = selectedProduct?._id === product._id;
                  const c = catColor[product.categoria] ?? catColor.antipasto;
                  return (
                    <TouchableOpacity
                      key={String(product._id)}
                      style={[
                        s.productItem,
                        !isSelected && !alreadyAdded && { backgroundColor: c.bg, borderLeftWidth: 3, borderLeftColor: c.border },
                        isSelected && s.productItemSelected,
                        alreadyAdded && s.productItemDisabled,
                      ]}
                      onPress={() => !alreadyAdded && setSelectedProduct(product)}
                      disabled={alreadyAdded}
                    >
                      <Text style={[s.productItemText, !isSelected && !alreadyAdded && { color: c.text }, isSelected && s.productItemTextSelected, alreadyAdded && s.productItemTextDisabled]}>
                        {product.name}{alreadyAdded ? ' (già aggiunto)' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  style={[s.productItem, isCustom && s.productItemSelected]}
                  onPress={() => setSelectedProduct({ _id: '__custom__', name: '__custom__', categoria: '' })}
                >
                  <Text style={[s.productItemText, isCustom && s.productItemTextSelected]}>
                    ✏️ Personalizzato
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {isCustom && (
                <>
                  <TextInput
                    style={s.dialogInput}
                    placeholder="Nome prodotto personalizzato"
                    value={customName}
                    onChangeText={setCustomName}
                    autoFocus
                  />
                  <Text style={s.label}>Categoria</Text>
                  <View style={s.catChipRow}>
                    {(['antipasto', 'pizza', 'dolci', 'bevanda', 'M.autunno', 'ingrediente'] as const).map(cat => {
                      const c = catColor[cat];
                      const sel = customCategoria === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[s.catChip, { borderColor: c.border }, sel && { backgroundColor: c.bg }]}
                          onPress={() => setCustomCategoria(cat)}
                        >
                          <Text style={[s.catChipText, { color: sel ? c.text : '#555' }, sel && { fontWeight: '600' }]}>{cat}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
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
  container:    { flex: 1, backgroundColor: '#fff', paddingTop: 24 },
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
  cardHasQty:   { borderWidth: 1, borderColor: '#1a1a1a' },
  cardDirty:    { borderWidth: 1.5, borderColor: '#c0392b' },
  cardDeleted:  { backgroundColor: '#fff0f0', borderWidth: 1.5, borderColor: '#c0392b' },
  del:          { color: '#ccc', fontSize: 14 },
  delActive:    { color: '#c0392b' },
  cardBody:     { flex: 1, gap: 2 },
  name:         { fontSize: 20, color: '#1a1a1a', fontWeight: '500', flex: 1 },
  nameDeleted:  { color: '#aaa', textDecorationLine: 'line-through' },
  diff:         { fontSize: 12, fontWeight: '600' },
  diffPos:      { color: '#27ae60' },
  diffNeg:      { color: '#c0392b' },
  cardSoldOut:  { backgroundColor: '#fff7e6', borderWidth: 1.5, borderColor: '#e67e22' },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catBadge:     { backgroundColor: '#eef2ff', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#c5cae9' },
  catBadgeText: { fontSize: 11, fontWeight: '600', color: '#5c6bc0' },
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
  tabRow:           { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tabBtn:           { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center', backgroundColor: '#f0f0f0' },
  tabBtnActive:     { backgroundColor: '#c0392b' },
  tabBtnText:       { fontSize: 14, color: '#555', fontWeight: '600' },
  tabBtnTextActive: { color: '#fff' },
  productList:          { maxHeight: 160, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginBottom: 4 },
  productItem:          { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  productItemSelected:  { backgroundColor: '#c0392b' },
  productItemText:      { fontSize: 16, color: '#1a1a1a' },
  productItemTextSelected: { color: '#fff', fontWeight: '600' },
  productItemDisabled:  { backgroundColor: '#f9f9f9' },
  productItemTextDisabled: { color: '#bbb' },
  legatiBox:    { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e0e0e0', marginTop: 6, marginBottom: 4 },
  legatiTitle:  { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 4 },
  legatiItem:   { fontSize: 13, color: '#444', lineHeight: 20, fontWeight: '700' },
  catChipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  catChip:          { borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  catChipSel:       { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  catChipText:      { fontSize: 13, color: '#555' },
  catChipTextSel:   { color: '#fff', fontWeight: '600' },
  qtyRow:       { flexDirection: 'row', gap: 8, alignItems: 'center' },
  qtyInput:     { flex: 1, marginBottom: 0 },
  finitoBtn:    { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  finitoBtnActive: { backgroundColor: '#c0392b' },
  finitoText:   { fontSize: 14, fontWeight: '600', color: '#555' },
  finitoTextActive: { color: '#fff' },
});

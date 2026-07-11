import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, Modal, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useNav } from '@/context/NavContext';
import { apiFetch, apiUrl, authHeaders } from '@/utils/api';
import { RED, CAT_COLORS, DEFAULT_COLOR, s } from './index.styles';

const BANNER_IMAGE = require('@/assets/custom/Logo-pizzium-ROSSO-01-3.png');

type Item        = { _id: string; name: string; count: number; categoria?: string | null; prodotti_legati?: string[] };
type Disponibile = { _id: string; name: string; categoria: string; prodotti_legati?: string[] };
type Pending     = Record<string, number | 'delete'>;
type Confirm     = { title: string; message: string; onConfirm: () => void; confirmLabel?: string; destructive?: boolean; delta?: number } | null;

// ─── helpers ─────────────────────────────────────────────────────────────────

function sortItems(list: Item[]): Item[] {
  return [...list].sort((a, b) => {
    if (a.count === 0 && b.count !== 0) return 1;
    if (a.count !== 0 && b.count === 0) return -1;
    return a.name.localeCompare(b.name, 'it');
  });
}

// ─── component ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { setHideNav }   = useNav();
  const token  = user?.token ?? '';
  const hdrs   = () => authHeaders(token);
  const listRef = useRef<FlatList<Item>>(null);

  // data
  const [items, setItems]             = useState<Item[]>([]);
  const [disponibili, setDisponibili] = useState<Disponibile[]>([]);

  // ui states
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [loadError, setLoadError]   = useState<string | null>(null);
  const [saveError, setSaveError]   = useState<string | null>(null);

  // pending changes
  const [pending, setPending] = useState<Pending>({});

  // confirm dialog
  const [confirm, setConfirm] = useState<Confirm>(null);

  // add modal
  const [modalVisible, setModalVisible]       = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Disponibile | null>(null);
  const [customName, setCustomName]           = useState('');
  const [customCategoria, setCustomCategoria] = useState<string | null>(null);
  const [modalTab, setModalTab]               = useState<'prodotti' | 'ingredienti'>('prodotti');
  const [inputQty, setInputQty]               = useState('');
  const [addError, setAddError]               = useState<string | null>(null);

  // ─── derived ───────────────────────────────────────────────────────────────

  const hasPending = Object.keys(pending).length > 0;
  const isCustom   = selectedProduct?.name === '__custom__';
  // id of the item currently being count-edited (only one at a time)
  const activeId   = Object.keys(pending).find(k => typeof pending[k] === 'number');

  useEffect(() => { setHideNav(hasPending); }, [hasPending]);

  const displayCount = (item: Item) =>
    typeof pending[item._id] === 'number' ? (pending[item._id] as number) : item.count;

  // ─── data loading ──────────────────────────────────────────────────────────

  const loadData = async () => {
    try {
      const [r1, r2] = await Promise.all([
        apiFetch(apiUrl('/api/prodotti'),             { headers: hdrs() }),
        apiFetch(apiUrl('/api/prodotti-disponibili'), { headers: hdrs() }),
      ]);
      if (r1.status === 401 || r2.status === 401) { logout(); return; }
      if (!r1.ok || !r2.ok) throw new Error();
      const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
      setItems(Array.isArray(d1) ? d1 : []);
      setDisponibili(Array.isArray(d2) ? d2 : []);
      setLoadError(null);
    } catch {
      setLoadError('Impossibile raggiungere il server. Riprova.');
    }
  };

  useEffect(() => {
    if (!token) return;
    loadData().finally(() => setLoading(false));
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Silent re-sync of just the items list (no full-screen loader/error).
  // Used to reconcile after a write whose outcome is uncertain (e.g. a
  // client-side timeout that may still have succeeded on the server).
  const refetchItems = async (): Promise<Item[] | null> => {
    try {
      const r = await apiFetch(apiUrl('/api/prodotti'), { headers: hdrs() });
      if (r.status === 401) { logout(); return null; }
      if (!r.ok) return null;
      const d = await r.json();
      if (!Array.isArray(d)) return null;
      setItems(d);
      return d;
    } catch {
      return null;
    }
  };

  const retryLoad = () => {
    setLoadError(null);
    setLoading(true);
    loadData().finally(() => setLoading(false));
  };

  // ─── add item ──────────────────────────────────────────────────────────────

  const openModal = () => {
    setSelectedProduct(null);
    setCustomName('');
    setCustomCategoria(null);
    setInputQty('');
    setAddError(null);
    setModalTab('prodotti');
    setModalVisible(true);
  };

  const confirmAdd = async () => {
    if (!selectedProduct) { setAddError('Seleziona un prodotto.'); return; }
    const name      = isCustom ? customName.trim() : selectedProduct.name;
    const categoria = isCustom ? customCategoria : selectedProduct.categoria;
    if (!name) { setAddError('Inserisci il nome del prodotto.'); return; }
    const qty = parseInt(inputQty, 10);
    if (isNaN(qty) || qty < 0) { setAddError('Inserisci una quantità valida.'); return; }

    // optimistic insert
    const tempId = `temp_${Date.now()}`;
    setItems(prev => [...prev, { _id: tempId, name, count: qty, categoria: categoria ?? null }]);
    setModalVisible(false);
    // scroll to end so the new item is always visible
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const r = await apiFetch(apiUrl('/api/prodotti'), {
        method: 'POST',
        headers: hdrs(),
        body: JSON.stringify({
          name, count: qty, categoria,
          prodotti_legati: isCustom ? undefined : selectedProduct.prodotti_legati,
        }),
      }, 25000); // longer timeout: a write must not be given up on too early
      if (r.status === 401) { logout(); return; }
      if (!r.ok) throw new Error();
      const newItem: Item = await r.json();
      setItems(prev => prev.map(i => i._id === tempId ? newItem : i));
    } catch {
      // A client-side timeout/abort does NOT mean the server rejected the
      // write — the insert may well have gone through. Re-sync with the
      // server so a successfully-saved item shows up automatically, instead
      // of forcing the user to pull-to-refresh.
      const synced = await refetchItems();
      if (synced) {
        // reconciled list is now the source of truth; if the item isn't in it
        // the write really failed, otherwise it's already shown correctly
        if (!synced.some(i => i.name === name)) {
          setSaveError('Impossibile aggiungere il prodotto. Riprova.');
        }
      } else {
        // couldn't reach the server at all → rollback the optimistic insert
        setItems(prev => prev.filter(i => i._id !== tempId));
        setSaveError('Impossibile aggiungere il prodotto. Riprova.');
      }
    }
  };

  // ─── pending changes ───────────────────────────────────────────────────────

  const change = (id: string, delta: number) => {
    const current = displayCount(items.find(i => i._id === id)!);
    setPending(prev => ({ ...prev, [id]: Math.max(0, current + delta) }));
  };

  // toggling ✕ on an already-deleted item cancels the deletion
  const remove = (id: string) => setPending(prev => {
    if (prev[id] === 'delete') {
      const next = { ...prev };
      delete next[id];
      return next;
    }
    return { ...prev, [id]: 'delete' };
  });

  // ─── commit / discard ──────────────────────────────────────────────────────

  const commitChanges = () => {
    const netDelta = Object.entries(pending).reduce((acc, [id, val]) => {
      const item = items.find(i => i._id === id);
      if (!item) return acc;
      return val === 'delete' ? acc - item.count : acc + ((val as number) - item.count);
    }, 0);

    setConfirm({
      title: 'Invia modifiche',
      message: 'Vuoi applicare tutte le modifiche in sospeso?',
      confirmLabel: 'Invia',
      delta: netDelta,
      onConfirm: async () => {
        setSaving(true);
        setSaveError(null);

        const entries = Object.entries(pending);
        const results = await Promise.allSettled(
          entries.map(([id, val]) =>
            val === 'delete'
              ? apiFetch(apiUrl(`/api/prodotti/${id}`), { method: 'DELETE', headers: hdrs() })
                  .then(r => { if (r.status === 401) { logout(); throw new Error(); } if (!r.ok) throw new Error(); })
              : apiFetch(apiUrl(`/api/prodotti/${id}`), { method: 'PATCH', headers: hdrs(), body: JSON.stringify({ count: val }) })
                  .then(r => { if (r.status === 401) { logout(); throw new Error(); } if (!r.ok) throw new Error(); })
          )
        );

        const failedIds: string[] = [];
        results.forEach((result, i) => {
          const [id, val] = entries[i];
          if (result.status === 'fulfilled') {
            if (val === 'delete') setItems(prev => prev.filter(item => item._id !== id));
            else setItems(prev => prev.map(item => item._id === id ? { ...item, count: val as number } : item));
          } else {
            failedIds.push(id);
          }
        });

        if (failedIds.length === 0) {
          setPending({});
        } else {
          setPending(() => {
            const kept: Pending = {};
            failedIds.forEach(id => { kept[id] = pending[id]; });
            return kept;
          });
          setSaveError(`${failedIds.length} modifica non salvata. Riprova.`);
        }

        setSaving(false);
      },
    });
  };

  const discardChanges = () => setConfirm({
    title: 'Annulla modifiche',
    message: 'Vuoi scartare tutte le modifiche?',
    confirmLabel: 'Sì, scarta',
    destructive: true,
    onConfirm: () => setPending({}),
  });

  // ─── render guards ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={RED} />
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <Text style={s.errorText}>{loadError}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={retryLoad}>
          <Text style={s.retryBtnText}>Riprova</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── main render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.container}>

      {/* ── confirm dialog ── */}
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
        {user?.avatarUrl
          ? <Image source={{ uri: user.avatarUrl }} style={s.avatar} />
          : <View style={s.avatarPlaceholder}>
              <Text style={s.avatarInitial}>{user?.nome?.[0]?.toUpperCase() ?? '?'}</Text>
            </View>
        }
      </View>

      <TouchableOpacity style={s.addBtn} onPress={openModal}>
        <Text style={s.addBtnText}>+ Aggiungi elemento</Text>
      </TouchableOpacity>

      {/* ── save error banner ── */}
      {saveError && (
        <View style={s.saveErrorBanner}>
          <Text style={s.saveErrorText}>{saveError}</Text>
          <TouchableOpacity onPress={() => setSaveError(null)}>
            <Text style={s.saveErrorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── items list ── */}
      <FlatList<Item>
        ref={listRef}
        extraData={pending}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[RED]} tintColor={RED} />}
        data={sortItems(items)}
        keyExtractor={item => item._id}
        renderItem={({ item }) => {
          const isDeleted = pending[item._id] === 'delete';
          const isDirty   = pending[item._id] !== undefined;
          const diff      = isDirty && !isDeleted ? (displayCount(item) - item.count) : 0;
          const isSoldOut = !isDeleted && item.count === 0;
          const isLocked  = !!activeId && activeId !== item._id;
          const c = CAT_COLORS[item.categoria ?? ''] ?? DEFAULT_COLOR;
          return (
            <View style={[
              s.card,
              !isDeleted && { backgroundColor: c.bg, borderWidth: 1.5, borderColor: c.text },
              isDeleted && s.cardDeleted,
              isDirty && !isDeleted && s.cardDirty,
              isLocked && s.cardLocked,
            ]}>
              <TouchableOpacity onPress={() => remove(item._id)} disabled={isLocked}>
                <Text style={[s.del, isDeleted && s.delActive]}>✕</Text>
              </TouchableOpacity>
              <View style={s.cardBody}>
                <View style={s.nameRow}>
                  <Text style={[s.name, isDeleted && s.nameDeleted]}>{item.name}</Text>
                  {item.categoria && (
                    <View style={[s.catBadge, { backgroundColor: c.bg, borderColor: c.border }]}>
                      <Text style={[s.catBadgeText, { color: c.text }]}>{item.categoria}</Text>
                    </View>
                  )}
                  {isSoldOut && <View style={s.soldOutBadge}><Text style={s.soldOutText}>Finito</Text></View>}
                </View>
                {item.prodotti_legati && item.prodotti_legati.length > 0 && (
                  <View style={s.legatiBox}>
                    {item.prodotti_legati.map(p => <Text key={p} style={s.legatiItem}>• {p}</Text>)}
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
              ) : !isSoldOut && (
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

      {/* ── bottom action bar ── */}
      {hasPending && (
        <View style={s.bar}>
          <TouchableOpacity style={s.discardBtn} onPress={discardChanges} disabled={saving}>
            <Text style={[s.discardText, saving && { color: '#bbb' }]}>Scarta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.commitBtn} onPress={commitChanges} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.commitText}>Invia modifiche</Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* ── add product modal ── */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
                {disponibili
                  .filter(p => modalTab === 'ingredienti' ? p.categoria === 'ingrediente' : p.categoria !== 'ingrediente')
                  .map(product => {
                    const alreadyAdded = items.some(i => i.name === product.name);
                    const isSelected   = selectedProduct?._id === product._id;
                    const c = CAT_COLORS[product.categoria] ?? DEFAULT_COLOR;
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
                        <Text style={[
                          s.productItemText,
                          !isSelected && !alreadyAdded && { color: c.text },
                          isSelected && s.productItemTextSelected,
                          alreadyAdded && s.productItemTextDisabled,
                        ]}>
                          {product.name}{alreadyAdded ? ' (già aggiunto)' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                <TouchableOpacity
                  style={[s.productItem, isCustom && s.productItemSelected]}
                  onPress={() => setSelectedProduct({ _id: '__custom__', name: '__custom__', categoria: '' })}
                >
                  <Text style={[s.productItemText, isCustom && s.productItemTextSelected]}>✏️ Personalizzato</Text>
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
                    {Object.keys(CAT_COLORS).map(cat => {
                      const c   = CAT_COLORS[cat];
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

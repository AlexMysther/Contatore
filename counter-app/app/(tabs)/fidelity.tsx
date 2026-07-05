import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Pressable,
  ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, apiUrl, authHeaders } from '@/utils/api';

type Dolce = { _id: string; nome: string };

function Dropdown({ items, value, onChange, placeholder }: {
  items: Dolce[]; value: string; onChange: (id: string) => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find(d => d._id === value);
  return (
    <View style={dd.wrapper}>
      <TouchableOpacity style={[dd.trigger, open && dd.triggerOpen]} onPress={() => setOpen(o => !o)} activeOpacity={0.8}>
        <Text style={[dd.triggerText, !selected && dd.placeholder]}>
          {selected ? selected.nome : placeholder}
        </Text>
        <Text style={[dd.chevron, open && dd.chevronUp]}>›</Text>
      </TouchableOpacity>
      {open && (
        <View style={dd.list}>
          <ScrollView bounces={false} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {items.length === 0 ? (
              <Text style={dd.emptyItem}>Nessun dolce disponibile</Text>
            ) : items.map(d => (
              <TouchableOpacity
                key={d._id}
                style={[dd.item, d._id === value && dd.itemSelected]}
                onPress={() => { onChange(d._id); setOpen(false); }}
                activeOpacity={0.7}
              >
                {d._id === value && <Text style={dd.itemDot}>●</Text>}
                <Text style={[dd.itemText, d._id === value && dd.itemTextSelected]}>{d.nome}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function FidelityScreen() {
  const { user, logout } = useAuth();
  const token    = user?.token ?? '';
  const isAdmin  = user?.ruolo === 'admin';
  const hdrs     = () => authHeaders(token);

  const [catalogo, setCatalogo]       = useState<Dolce[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState<string | null>(null);
  const [adminModal, setAdminModal]   = useState(false);
  const [pickerValue, setPickerValue] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoadError(null);
    try {
      const [r1, r2] = await Promise.all([
        apiFetch(apiUrl('/api/dolci'),           { headers: hdrs() }),
        apiFetch(apiUrl('/api/fidelity/config'), { headers: hdrs() }),
      ]);
      if (r1.status === 401 || r2.status === 401) { logout(); return; }
      if (!r1.ok) { setLoadError(`Errore server (${r1.status})`); return; }
      const [dolciData, configData] = await Promise.all([r1.json(), r2.json()]);
      setCatalogo(Array.isArray(dolciData) ? dolciData : []);
      setSelectedIds(configData.selectedIds ?? []);
    } catch (e: any) {
      setLoadError(e?.name === 'AbortError' ? 'Server non raggiungibile. Riprova.' : 'Impossibile raggiungere il server');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const saveConfig = async (next: string[]) => {
    try {
      await apiFetch(apiUrl('/api/fidelity/config'), {
        method: 'PATCH', headers: hdrs(),
        body: JSON.stringify({ selectedIds: next }),
      });
    } catch { Alert.alert('Errore', 'Impossibile salvare'); }
  };

  const aggiungiDolce = () => {
    if (!pickerValue) return;
    const next = [...selectedIds, pickerValue];
    setSelectedIds(next);
    setPickerValue('');
    saveConfig(next);
  };

  const aggiungiTutti = () => {
    if (catalogo.length === 0) return;
    const next = catalogo.map(d => d._id);
    setSelectedIds(next);
    setPickerValue('');
    saveConfig(next);
  };

  const rimuoviDolce = (id: string) => {
    const next = selectedIds.filter(x => x !== id);
    setSelectedIds(next);
    saveConfig(next);
  };

  const disponibili   = catalogo.filter(d => !selectedIds.includes(d._id));
  const selectedDolci = selectedIds.map(id => catalogo.find(d => d._id === id) ?? null);

  if (loading) {
    return <SafeAreaView style={s.center}><ActivityIndicator size="large" color={RED} /></SafeAreaView>;
  }

  if (loadError) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={{ fontSize: 40 }}>⚠️</Text>
        <Text style={s.errorTitle}>Errore di caricamento</Text>
        <Text style={s.errorMsg}>{loadError}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => { setLoading(true); load(); }}>
          <Text style={s.retryBtnText}>Riprova</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Dolci Gratis Fidelity</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.grid}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={[RED]} tintColor={RED} />}
      >
        {catalogo.length > 0 && selectedIds.length === catalogo.length && (
          <Text style={s.tuttiLabel}>Tutti</Text>
        )}
        {selectedDolci.map((dolce, i) => (
          <View key={i} style={[s.cell, dolce ? s.cellFilled : s.cellEmpty]}>
            {dolce ? (
              <>
                <View style={s.cellBadge}><Text style={s.cellBadgeText}>{i + 1}</Text></View>
                <Text style={s.cellName}>{dolce.nome}</Text>
                <Text style={s.cellStar}>★</Text>
              </>
            ) : (
              <Text style={s.cellNameEmpty}>—</Text>
            )}
          </View>
        ))}
      </ScrollView>

      {isAdmin && (
        <TouchableOpacity style={s.gestisciBtn} onPress={() => setAdminModal(true)}>
          <Text style={s.gestisciBtnText}>Gestisci</Text>
        </TouchableOpacity>
      )}

      {isAdmin && (
        <Modal visible={adminModal} animationType="fade" transparent>
          <View style={s.overlay}>
            <View style={s.modal}>
              <Text style={s.modalTitle}>Gestione Fidelity</Text>

              <Text style={s.sectionLabel}>Aggiungi dolce ({selectedIds.length}/{catalogo.length})</Text>
              <Dropdown items={disponibili} value={pickerValue} onChange={setPickerValue} placeholder="Seleziona un dolce…" />
              <View style={s.row}>
                <TouchableOpacity
                  style={[s.aggiungiBtn, !pickerValue && s.btnOff, { flex: 1 }]}
                  onPress={aggiungiDolce}
                  disabled={!pickerValue}
                >
                  <Text style={s.aggiungiBtnText}>+ Aggiungi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tuttiBtn, disponibili.length === 0 && s.btnOff]}
                  onPress={aggiungiTutti}
                  disabled={disponibili.length === 0}
                >
                  <Text style={s.aggiungiBtnText}>Tutti</Text>
                </TouchableOpacity>
              </View>

              {selectedIds.length > 0 && (
                <>
                  <Text style={s.sectionLabel}>Dolci in tabella</Text>
                  <ScrollView style={s.selectedList} nestedScrollEnabled>
                    {selectedIds.map((id, i) => {
                      const d = catalogo.find(x => x._id === id);
                      if (!d) return null;
                      return (
                        <View key={id} style={s.selectedRow}>
                          <View style={s.selectedBadge}><Text style={s.selectedBadgeText}>{i + 1}</Text></View>
                          <Text style={s.selectedName}>{d.nome}</Text>
                          <Pressable onPress={() => rimuoviDolce(id)} hitSlop={10}>
                            <Text style={s.removeBtn}>✕</Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              <TouchableOpacity style={s.closeBtn} onPress={() => setAdminModal(false)}>
                <Text style={s.closeBtnText}>Chiudi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const RED = '#c0392b';

const dd = StyleSheet.create({
  wrapper:          { marginBottom: 12, zIndex: 10 },
  trigger:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13 },
  triggerOpen:      { borderColor: RED, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  triggerText:      { fontSize: 15, color: '#1a1a1a', flex: 1 },
  placeholder:      { color: '#aaa' },
  chevron:          { fontSize: 22, color: '#999', transform: [{ rotate: '90deg' }] },
  chevronUp:        { transform: [{ rotate: '-90deg' }], color: RED },
  list:             { backgroundColor: '#fff', borderWidth: 1.5, borderTopWidth: 0, borderColor: RED, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, maxHeight: 200, overflow: 'hidden' },
  item:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 8 },
  itemSelected:     { backgroundColor: '#fff5f5' },
  itemDot:          { fontSize: 8, color: RED },
  itemText:         { fontSize: 15, color: '#1a1a1a' },
  itemTextSelected: { color: RED, fontWeight: '600' },
  emptyItem:        { padding: 16, color: '#aaa', textAlign: 'center' },
});

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 24 },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:           { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title:            { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  errorTitle:       { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginTop: 8 },
  errorMsg:         { fontSize: 14, color: '#888', marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:         { marginTop: 20, backgroundColor: RED, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },

  grid:             { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  cell:             { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  cellFilled:       { backgroundColor: '#fff', borderWidth: 2, borderColor: RED, elevation: 3 },
  cellEmpty:        { backgroundColor: '#fff', borderWidth: 2, borderColor: '#e0e0e0' },
  cellBadge:        { width: 34, height: 34, borderRadius: 17, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  cellBadgeText:    { color: '#fff', fontWeight: '800', fontSize: 15 },
  cellName:         { fontSize: 18, fontWeight: '700', color: RED, flex: 1 },
  cellNameEmpty:    { color: '#bbb', fontWeight: '400', fontSize: 18 },
  cellStar:         { fontSize: 16, color: 'rgba(192,57,43,0.3)' },
  tuttiLabel:       { fontSize: 36, fontWeight: '900', color: RED, textAlign: 'center', marginBottom: 12 },

  gestisciBtn:      { backgroundColor: '#27ae60', marginHorizontal: 16, marginBottom: 16, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  gestisciBtnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },

  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:            { backgroundColor: '#f5f5f5', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '60%' },
  modalTitle:       { fontSize: 20, fontWeight: '700', marginBottom: 20, color: '#1a1a1a' },
  sectionLabel:     { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  row:              { flexDirection: 'row', gap: 10 },
  aggiungiBtn:      { backgroundColor: RED, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnOff:           { backgroundColor: '#ddd' },
  aggiungiBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  tuttiBtn:         { backgroundColor: '#333', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  selectedList:     { maxHeight: 220, overflow: 'hidden' },
  selectedRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 6, gap: 12 },
  selectedBadge:    { width: 24, height: 24, borderRadius: 12, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  selectedBadgeText:{ color: '#fff', fontSize: 12, fontWeight: '700' },
  selectedName:     { flex: 1, fontSize: 15, color: '#1a1a1a' },
  removeBtn:        { fontSize: 15, color: RED, fontWeight: '700' },
  closeBtn:         { marginTop: 20, backgroundColor: '#1a1a1a', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  closeBtnText:     { color: '#fff', fontWeight: '600', fontSize: 16 },
});

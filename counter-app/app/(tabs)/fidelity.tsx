import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Platform, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

const API = 'https://contatore-production.up.railway.app/api';

type Dolce = { _id: string; nome: string };

// ── Dropdown custom ──────────────────────────────────────────────────────────
function Dropdown({
  items, value, onChange, placeholder,
}: {
  items: Dolce[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find(d => d._id === value);

  return (
    <View style={dd.wrapper}>
      <TouchableOpacity
        style={[dd.trigger, open && dd.triggerOpen]}
        onPress={() => setOpen(o => !o)}
        activeOpacity={0.8}
      >
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
            ) : (
              items.map(d => (
                <TouchableOpacity
                  key={d._id}
                  style={[dd.item, d._id === value && dd.itemSelected]}
                  onPress={() => { onChange(d._id); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  {d._id === value && <Text style={dd.itemDot}>●</Text>}
                  <Text style={[dd.itemText, d._id === value && dd.itemTextSelected]}>
                    {d.nome}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FidelityScreen() {
  const { user, logout } = useAuth();
  const token = user?.token ?? '';
  const isAdmin = user?.ruolo === 'admin';

  const [catalogo, setCatalogo]       = useState<Dolce[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState<string | null>(null);

  const [adminModal, setAdminModal]   = useState(false);
  const [pickerValue, setPickerValue] = useState('');

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const load = useCallback(async () => {
    if (!token) return;
    setLoadError(null);
    try {
      const [resDolci, resConfig] = await Promise.all([
        fetch(`${API}/dolci`,           { headers: headers() }),
        fetch(`${API}/fidelity/config`, { headers: headers() }),
      ]);
      if (resDolci.status === 401 || resConfig.status === 401) { logout(); return; }
      if (!resDolci.ok) { setLoadError(`Errore server (${resDolci.status})`); return; }
      const [dolciData, configData] = await Promise.all([resDolci.json(), resConfig.json()]);
      setCatalogo(Array.isArray(dolciData) ? dolciData : []);
      setSelectedIds(configData.selectedIds ?? []);
    } catch {
      setLoadError('Impossibile raggiungere il server');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const selectedDolci: (Dolce | null)[] = Array.from({ length: catalogo.length }, (_, i) => {
    const id = selectedIds[i];
    return id ? (catalogo.find(d => d._id === id) ?? null) : null;
  });

  const disponibili = catalogo.filter(d => !selectedIds.includes(d._id));

  const aggiungiDolce = async () => {
    if (!pickerValue) return;
    if (selectedIds.length >= catalogo.length) {
      Alert.alert('Tabella piena', 'Tutti i dolci sono già in tabella.');
      return;
    }
    const next = [...selectedIds, pickerValue];
    setSelectedIds(next);
    setPickerValue('');
    try {
      await fetch(`${API}/fidelity/config`, {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify({ selectedIds: next }),
      });
    } catch { Alert.alert('Errore', 'Impossibile salvare'); }
  };

  const aggiungiTutti = async () => {
    if (catalogo.length === 0) return;
    const tuttiIds = catalogo.map(d => d._id);
    setSelectedIds(tuttiIds);
    setPickerValue('');
    try {
      await fetch(`${API}/fidelity/config`, {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify({ selectedIds: tuttiIds }),
      });
    } catch { Alert.alert('Errore', 'Impossibile salvare'); }
  };

  const rimuoviDolce = async (id: string) => {
    const next = selectedIds.filter(x => x !== id);
    setSelectedIds(next);
    try {
      await fetch(`${API}/fidelity/config`, {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify({ selectedIds: next }),
      });
    } catch { Alert.alert('Errore', 'Impossibile salvare'); }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator size="large" color="#c0392b" />
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={{ fontSize: 40 }}>⚠️</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginTop: 8 }}>Errore di caricamento</Text>
        <Text style={{ fontSize: 14, color: '#888', marginTop: 4, textAlign: 'center', paddingHorizontal: 32 }}>{loadError}</Text>
        <TouchableOpacity
          style={[s.aggiungiBtn, { marginTop: 20, paddingHorizontal: 28 }]}
          onPress={() => { setLoading(true); load(); }}
        >
          <Text style={s.aggiungiBtnText}>Riprova</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Dolci Gratis Fidelity</Text>
        {Platform.OS === 'web' && (
          <TouchableOpacity onPress={load} style={s.refreshBtn}>
            <Text style={s.refreshBtnText}>↻</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={s.grid}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={['#c0392b']} tintColor="#c0392b" />}
      >
        {catalogo.length > 0 && selectedIds.length === catalogo.length && (
          <Text style={s.tuttiLabel}>Tutti</Text>
        )}
        {selectedDolci.map((dolce, i) => (
          <View key={i} style={[s.cell, dolce ? s.cellFilled : s.cellEmpty]}>
            {dolce ? (
              <>
                <View style={s.cellBadge}>
                  <Text style={s.cellBadgeText}>{i + 1}</Text>
                </View>
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
        <TouchableOpacity
          style={s.gestisciBtn}
          onPress={() => setAdminModal(true)}
        >
          <Text style={s.gestisciBtnText}>Gestisci</Text>
        </TouchableOpacity>
      )}

      {isAdmin && (
        <Modal visible={adminModal} animationType="fade" transparent>
          <View style={s.overlay}>
            <View style={s.modal}>
              <Text style={s.modalTitle}>Gestione Fidelity</Text>

              {/* Dropdown */}
              <Text style={s.sectionLabel}>
                Aggiungi dolce ({selectedIds.length}/{catalogo.length})
              </Text>
              <Dropdown
                items={disponibili}
                value={pickerValue}
                onChange={setPickerValue}
                placeholder="Seleziona un dolce…"
              />
              <View style={s.row}>
                <TouchableOpacity
                  style={[s.aggiungiBtn, !pickerValue && s.aggiungiBtnOff, { flex: 1 }]}
                  onPress={aggiungiDolce}
                  disabled={!pickerValue}
                >
                  <Text style={s.aggiungiBtnText}>+ Aggiungi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tuttiBtn, disponibili.length === 0 && s.aggiungiBtnOff]}
                  onPress={aggiungiTutti}
                  disabled={disponibili.length === 0}
                >
                  <Text style={s.aggiungiBtnText}>Tutti</Text>
                </TouchableOpacity>
              </View>

              {/* Selezione corrente */}
              {selectedIds.length > 0 && (
                <>
                  <Text style={s.sectionLabel}>Dolci in tabella</Text>
                  <ScrollView style={s.selectedList} nestedScrollEnabled>
                    {selectedIds.map((id, i) => {
                      const d = catalogo.find(x => x._id === id);
                      if (!d) return null;
                      return (
                        <View key={id} style={s.selectedRow}>
                          <View style={s.selectedBadge}>
                            <Text style={s.selectedBadgeText}>{i + 1}</Text>
                          </View>
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

// ── Stili dropdown ────────────────────────────────────────────────────────────
const dd = StyleSheet.create({
  wrapper:          { marginBottom: 12, zIndex: 10 },
  trigger:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13 },
  triggerOpen:      { borderColor: '#c0392b', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  triggerText:      { fontSize: 15, color: '#1a1a1a', flex: 1 },
  placeholder:      { color: '#aaa' },
  chevron:          { fontSize: 22, color: '#999', transform: [{ rotate: '90deg' }] },
  chevronUp:        { transform: [{ rotate: '-90deg' }], color: '#c0392b' },
  list:             { backgroundColor: '#fff', borderWidth: 1.5, borderTopWidth: 0, borderColor: '#c0392b', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, maxHeight: 200, overflow: 'hidden' },
  item:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 8 },
  itemSelected:     { backgroundColor: '#fff5f5' },
  itemDot:          { fontSize: 8, color: '#c0392b' },
  itemText:         { fontSize: 15, color: '#1a1a1a' },
  itemTextSelected: { color: '#c0392b', fontWeight: '600' },
  emptyItem:        { padding: 16, color: '#aaa', textAlign: 'center' },
});

// ── Stili pagina ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 24 },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title:            { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  subtitle:         { fontSize: 13, color: '#888', paddingHorizontal: 20, marginBottom: 16 },
  adminBtn:         { backgroundColor: '#c0392b', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  gestisciBtn:      { backgroundColor: '#27ae60', marginHorizontal: 16, marginBottom: 16, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  gestisciBtnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
  adminBtnText:     { color: '#fff', fontWeight: '600', fontSize: 14 },

  grid:             { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  cell:             { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  cellFilled:       { backgroundColor: '#fff', borderWidth: 2, borderColor: '#c0392b', shadowColor: '#c0392b', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
  cellEmpty:        { backgroundColor: '#fff', borderWidth: 2, borderColor: '#e0e0e0' },
  cellBadge:        { width: 34, height: 34, borderRadius: 17, backgroundColor: '#c0392b', alignItems: 'center', justifyContent: 'center' },
  cellBadgeText:    { color: '#fff', fontWeight: '800', fontSize: 15 },
  cellName:         { fontSize: 18, fontWeight: '700', color: '#c0392b', flex: 1 },
  cellNameEmpty:    { color: '#bbb', fontWeight: '400', fontSize: 18 },
  cellStar:         { fontSize: 16, color: 'rgba(192,57,43,0.3)' },

  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:            { backgroundColor: '#f5f5f5', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '60%' },
  modalTitle:       { fontSize: 20, fontWeight: '700', marginBottom: 20, color: '#1a1a1a' },
  sectionLabel:     { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },

  row:              { flexDirection: 'row', gap: 10 },
  input:            { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff' },
  saveBtn:          { backgroundColor: '#c0392b', borderRadius: 12, paddingHorizontal: 18, justifyContent: 'center' },
  saveBtnText:      { color: '#fff', fontWeight: '700', fontSize: 15 },

  aggiungiBtn:      { backgroundColor: '#c0392b', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  aggiungiBtnOff:   { backgroundColor: '#ddd' },
  aggiungiBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  tuttiBtn:         { backgroundColor: '#333', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },

  selectedList:     { maxHeight: 220, overflow: 'hidden' },
  selectedRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 6, gap: 12 },
  selectedBadge:    { width: 24, height: 24, borderRadius: 12, backgroundColor: '#c0392b', alignItems: 'center', justifyContent: 'center' },
  selectedBadgeText:{ color: '#fff', fontSize: 12, fontWeight: '700' },
  selectedName:     { flex: 1, fontSize: 15, color: '#1a1a1a' },
  removeBtn:        { fontSize: 15, color: '#c0392b', fontWeight: '700' },

  tuttiLabel:       { fontSize: 36, fontWeight: '900', color: '#c0392b', textAlign: 'center', marginBottom: 12 },
  refreshBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  refreshBtnText:   { fontSize: 20, color: '#c0392b', lineHeight: 22 },
  closeBtn:         { marginTop: 20, backgroundColor: '#1a1a1a', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  closeBtnText:     { color: '#fff', fontWeight: '600', fontSize: 16 },
});

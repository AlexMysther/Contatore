import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Pressable,
  ScrollView, Text, TouchableOpacity, View, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, apiUrl, authHeaders } from '@/utils/api';
import { dd, s, RED } from './fidelity.styles';

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

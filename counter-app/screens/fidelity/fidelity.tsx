import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, Pressable,
  ScrollView, Text, TouchableOpacity, View, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PressScale, Pop, Enter, EnterUp, smoothLayout } from '@/components/motion';
import { useAuth } from '@/context/AuthContext';
import { apiFetch, apiUrl, authHeaders } from '@/utils/api';
import { dd, s, RED, RED_DEEP, AMBER, INK_SOFT, MUTED } from './fidelity.styles';

type Dolce = { _id: string; nome: string };

function Dropdown({ items, value, onChange, placeholder }: {
  items: Dolce[]; value: string; onChange: (id: string) => void; placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find(d => d._id === value);
  const toggle = (next: boolean) => { smoothLayout(); setOpen(next); };
  return (
    <View style={dd.wrapper}>
      <TouchableOpacity
        style={[dd.trigger, open && dd.triggerOpen]}
        onPress={() => toggle(!open)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={selected ? selected.nome : placeholder}
      >
        <Text style={[dd.triggerText, !selected && dd.placeholder]} numberOfLines={1}>
          {selected ? selected.nome : placeholder}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={open ? RED : INK_SOFT} />
      </TouchableOpacity>
      {open && (
        <View style={dd.list}>
          <ScrollView bounces={false} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {items.length === 0 ? (
              <Text style={dd.emptyItem}>Nessun dolce disponibile</Text>
            ) : items.map(d => {
              const sel = d._id === value;
              return (
                <TouchableOpacity
                  key={d._id}
                  style={[dd.item, sel && dd.itemSelected]}
                  onPress={() => { onChange(d._id); toggle(false); }}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: sel }}
                >
                  <Text style={[dd.itemText, sel && dd.itemTextSelected]}>{d.nome}</Text>
                  {sel && <Ionicons name="checkmark" size={18} color={RED_DEEP} />}
                </TouchableOpacity>
              );
            })}
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
  const [refreshing, setRefreshing]   = useState(false);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

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
    smoothLayout();
    setSelectedIds(next);
    setPickerValue('');
    saveConfig(next);
  };

  const aggiungiTutti = () => {
    if (catalogo.length === 0) return;
    const next = catalogo.map(d => d._id);
    smoothLayout();
    setSelectedIds(next);
    setPickerValue('');
    saveConfig(next);
  };

  const rimuoviDolce = (id: string) => {
    const next = selectedIds.filter(x => x !== id);
    smoothLayout();
    setSelectedIds(next);
    saveConfig(next);
  };

  const disponibili   = catalogo.filter(d => !selectedIds.includes(d._id));
  const selectedDolci = selectedIds.map(id => catalogo.find(d => d._id === id) ?? null);
  const tutti         = catalogo.length > 0 && selectedIds.length === catalogo.length;
  const subtitle      = selectedIds.length === 0
    ? 'Dolci gratis'
    : selectedIds.length === 1 ? '1 dolce gratis' : `${selectedIds.length} dolci gratis`;

  if (loading) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={RED} />
        <Text style={s.hint}>Caricamento dolci…</Text>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <Enter bouncy fromY={0} fromScale={0.6} style={s.stateBadge}>
          <Ionicons name="alert-circle-outline" size={34} color={RED} />
        </Enter>
        <Enter delay={80}><Text style={s.stateTitle}>Qualcosa è andato storto</Text></Enter>
        <Enter delay={140}><Text style={s.stateSubtitle}>{loadError}</Text></Enter>
        <Enter delay={200}>
          <PressScale style={s.retryBtn} onPress={() => { setLoading(true); load(); }} accessibilityRole="button">
            <Text style={s.retryBtnText}>Riprova</Text>
          </PressScale>
        </Enter>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <Enter style={s.header} fromY={-8}>
        <View style={s.headerLeft}>
          <View style={s.logo}>
            <Ionicons name="star" size={22} color="#fff" />
          </View>
          <View style={s.headerText}>
            <Text style={s.title} numberOfLines={1}>Fidelity</Text>
            <Pop trigger={selectedIds.length} amount={1.06}>
              <Text style={s.subtitle}>{subtitle}</Text>
            </Pop>
          </View>
        </View>
        {isAdmin && (
          <PressScale style={s.gestisciBtn} onPress={() => setAdminModal(true)} accessibilityRole="button">
            <Ionicons name="options-outline" size={16} color={INK_SOFT} />
            <Text style={s.gestisciBtnText}>Gestisci</Text>
          </PressScale>
        )}
      </Enter>

      <ScrollView
        contentContainerStyle={s.grid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[RED]} tintColor={RED} />}
      >
        {selectedIds.length === 0 && (
          <View style={[s.fill, s.center]}>
            <Enter bouncy fromY={0} fromScale={0.6} style={s.stateBadge}>
              <Ionicons name="star-outline" size={32} color={RED} />
            </Enter>
            <Enter delay={80}><Text style={s.stateTitle}>Nessun dolce</Text></Enter>
            <Enter delay={140}>
              <Text style={s.stateSubtitle}>
                {isAdmin
                  ? 'Tocca «Gestisci» per scegliere i dolci gratis.'
                  : 'I dolci gratis non sono ancora stati scelti.'}
              </Text>
            </Enter>
          </View>
        )}

        {tutti && (
          <Enter delay={100} fromY={10} fromScale={0.96} style={s.tuttiBanner}>
            <Ionicons name="star" size={20} color={AMBER} />
            <Text style={s.tuttiLabel}>Tutti</Text>
            <Ionicons name="star" size={20} color={AMBER} />
          </Enter>
        )}

        {selectedDolci.map((dolce, i) => (
          <Enter key={selectedIds[i]} delay={120 + Math.min(i, 8) * 50}>
            <View style={[s.cell, !dolce && s.cellEmpty]}>
              {dolce ? (
                <>
                  <View style={s.cellBadge}><Text style={s.cellBadgeText}>{i + 1}</Text></View>
                  <Text style={s.cellName}>{dolce.nome}</Text>
                  <Ionicons name="star" size={18} color={AMBER} />
                </>
              ) : (
                <Text style={s.cellNameEmpty}>—</Text>
              )}
            </View>
          </Enter>
        ))}
      </ScrollView>

      {isAdmin && (
        <Modal visible={adminModal} animationType="fade" transparent onRequestClose={() => setAdminModal(false)}>
          <Pressable style={s.overlay} onPress={() => setAdminModal(false)}>
            <EnterUp style={s.sheetWrap}>
            <Pressable style={s.modal} onPress={e => e.stopPropagation()}>
              <Text style={s.modalTitle}>Gestione Fidelity</Text>

              <Text style={s.sectionLabel}>Aggiungi dolce ({selectedIds.length}/{catalogo.length})</Text>
              <Dropdown items={disponibili} value={pickerValue} onChange={setPickerValue} placeholder="Seleziona un dolce…" />
              <View style={s.row}>
                <TouchableOpacity
                  style={[s.aggiungiBtn, !pickerValue && s.btnOff]}
                  onPress={aggiungiDolce}
                  disabled={!pickerValue}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !pickerValue }}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={s.aggiungiBtnText}>Aggiungi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tuttiBtn, disponibili.length === 0 && s.btnOff]}
                  onPress={aggiungiTutti}
                  disabled={disponibili.length === 0}
                  accessibilityRole="button"
                  accessibilityLabel="Aggiungi tutti"
                  accessibilityState={{ disabled: disponibili.length === 0 }}
                >
                  <Text style={s.tuttiBtnText}>Tutti</Text>
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
                          <TouchableOpacity
                            style={s.removeBtn}
                            onPress={() => rimuoviDolce(id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Rimuovi ${d.nome}`}
                          >
                            <Ionicons name="close" size={20} color={MUTED} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              <TouchableOpacity style={s.closeBtn} onPress={() => setAdminModal(false)}>
                <Text style={s.closeBtnText}>Chiudi</Text>
              </TouchableOpacity>
            </Pressable>
            </EnterUp>
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

import {
  View, Text, TouchableOpacity, FlatList, Modal, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChiusura } from '@/hooks/use-chiusura';
import { RED, s } from './chiusura.styles';

export default function Chiusura() {
  const {
    canEdit, avviata, chores, loading, error,
    pending, setPending,
    accounts,
    assignPending, setAssignPending,
    confirmReset, setConfirmReset, resetLoading,
    confirm, tapChore, tapSotto, toggleExpand, assignTo,
    avvia, retry, reset, closeResetModal,
    doneCount, total, progress,
  } = useChiusura();

  if (!avviata) {
    if (canEdit) {
      return (
        <SafeAreaView style={[s.container, s.center]}>
          <Text style={s.startIcon}>🔒</Text>
          <Text style={s.startTitle}>Chiusura</Text>
          <Text style={s.startSubtitle}>Avvia la procedura di chiusura del locale.</Text>
          <TouchableOpacity style={s.startBtn} onPress={avvia}>
            <Text style={s.startBtnLabel}>Avvia Chiusura</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <Text style={s.startIcon}>⏳</Text>
        <Text style={s.startTitle}>In attesa</Text>
        <Text style={s.startSubtitle}>La chiusura non è ancora stata avviata.{'\n'}Attendi che un amministratore la avvii.</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <ActivityIndicator size="large" color={RED} />
        <Text style={s.hint}>Caricamento attività…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <Text style={s.startIcon}>⚠️</Text>
        <Text style={s.startTitle}>Errore</Text>
        <Text style={s.startSubtitle}>{error}</Text>
        <TouchableOpacity style={s.startBtn} onPress={retry}>
          <Text style={s.startBtnLabel}>Riprova</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Modale conferma completamento */}
      <Modal transparent animationType="fade" visible={!!pending} onRequestClose={() => setPending(null)}>
        <Pressable style={s.overlay} onPress={() => setPending(null)}>
          <Pressable style={s.dialog} onPress={e => e.stopPropagation()}>
            <Text style={s.dialogTitle}>Conferma</Text>
            <Text style={s.dialogMsg}>Hai completato "{pending?.titolo}"?</Text>
            <View style={s.dialogBtns}>
              <TouchableOpacity style={s.dialogCancel} onPress={() => setPending(null)}>
                <Text style={s.dialogCancelLabel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.dialogConfirm} onPress={confirm}>
                <Text style={s.dialogConfirmLabel}>Sì, fatto!</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modale assegnazione */}
      <Modal transparent animationType="fade" visible={!!assignPending} onRequestClose={() => setAssignPending(null)}>
        <Pressable style={s.overlay} onPress={() => setAssignPending(null)}>
          <Pressable style={s.assignDialog} onPress={e => e.stopPropagation()}>
            <Text style={s.dialogTitle}>Assegna a…</Text>
            {assignPending && (
              <>
                <TouchableOpacity style={s.assignRow} onPress={() => assignTo(assignPending.choreId, null)}>
                  <Text style={s.assignNone}>Nessuno</Text>
                </TouchableOpacity>
                {accounts.map(a => (
                  <TouchableOpacity key={String(a._id)} style={s.assignRow} onPress={() => assignTo(assignPending.choreId, a.nome)}>
                    <Text style={s.assignName}>{a.nome}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modale azzera */}
      <Modal transparent animationType="fade" visible={confirmReset} onRequestClose={closeResetModal}>
        <Pressable style={s.overlay} onPress={closeResetModal}>
          <Pressable style={s.dialog} onPress={e => e.stopPropagation()}>
            <Text style={s.dialogTitle}>Azzera i task?</Text>
            <Text style={s.dialogMsg}>Tutti i task verranno segnati come non completati.</Text>
            <View style={s.dialogBtns}>
              <TouchableOpacity style={s.dialogCancel} onPress={closeResetModal}>
                <Text style={s.dialogCancelLabel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.dialogDanger, resetLoading && { opacity: 0.6 }]} onPress={reset} disabled={resetLoading}>
                {resetLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.dialogConfirmLabel}>Azzera</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>🔒 Chiusura</Text>
        {canEdit && (
          <TouchableOpacity style={s.resetBtn} onPress={() => setConfirmReset(true)}>
            <Text style={s.resetBtnLabel}>Azzera</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Barra progresso */}
      <View style={s.progressWrap}>
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>
        <Text style={s.progressLabel}>{doneCount}/{total}</Text>
      </View>

      <FlatList
        data={chores}
        keyExtractor={c => c._id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => {
          const sottoTask  = item.sotto_task ?? [];
          const hasSotto   = sottoTask.length > 0;
          const sottoFatti = sottoTask.filter(st => st.completato).length;
          const acc        = item.assegnato_a ? accounts.find(a => a.nome === item.assegnato_a) : null;
          const badgeStyle = !item.assegnato_a ? s.badgeRed : acc?.ruolo === 'admin' ? s.badgeBlue : s.badgeGreen;
          const assignLabel = item.assegnato_a ? `👤 ${item.assegnato_a}` : canEdit ? '👤 Assegna…' : '👤 Nessuno';

          return (
            <View style={[s.card, item.completato && s.cardDone]}>
              <View style={s.cardRow}>
                <TouchableOpacity
                  onPress={() => tapChore(item._id, item.titolo, item.completato)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <View style={[s.check, item.completato && s.checkDone]}>
                    {item.completato && <Text style={s.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[s.label, item.completato && s.labelDone]}>{item.titolo}</Text>
                  {item.descrizione ? <Text style={[s.desc, item.completato && s.descDone]}>{item.descrizione}</Text> : null}
                  <View style={s.meta}>
                    {canEdit ? (
                      <TouchableOpacity onPress={() => setAssignPending({ choreId: item._id })}>
                        <Text style={[s.badge, badgeStyle]}>{assignLabel}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={[s.badge, badgeStyle]}>{assignLabel}</Text>
                    )}
                    {hasSotto && <Text style={s.badge}>📋 {sottoFatti}/{sottoTask.length}</Text>}
                  </View>
                </View>

                {hasSotto && (
                  <TouchableOpacity onPress={() => toggleExpand(item._id)} style={s.expandBtn}>
                    <Text style={s.expandIcon}>{item._expanded ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {hasSotto && item._expanded && (
                <View style={s.sottoList}>
                  {sottoTask.map((st, idx) => (
                    <View key={idx} style={s.sottoRow}>
                      <TouchableOpacity
                        onPress={() => tapSotto(item._id, idx, st.titolo, st.completato)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <View style={[s.sottoCheck, st.completato && s.sottoCheckDone]}>
                          {st.completato && <Text style={s.sottoMark}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.sottoLabel, st.completato && s.labelDone]}>{st.titolo}</Text>
                        {st.descrizione ? <Text style={[s.desc, st.completato && s.descDone]}>{st.descrizione}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

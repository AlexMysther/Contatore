import {
  View, Text, TouchableOpacity, FlatList, Modal, Pressable, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChiusura } from '@/hooks/use-chiusura';
import { PressScale, Pop, ColorFade, ProgressFill, Enter, Pulse, smoothLayout } from '@/components/motion';
import { RED, GREEN_DEEP, INK_SOFT, BLUE, RED_DEEP, SURFACE, LINE, GREEN_CARD, GREEN_LINE, s } from './chiusura.styles';

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
          <Enter bouncy fromY={0} fromScale={0.6} style={s.stateBadge}>
            <Ionicons name="lock-closed" size={32} color="#fff" />
          </Enter>
          <Enter delay={80}><Text style={s.startTitle}>Chiusura</Text></Enter>
          <Enter delay={140}><Text style={s.startSubtitle}>Avvia la procedura di chiusura del locale.</Text></Enter>
          <Enter delay={200}>
            <PressScale style={s.startBtn} onPress={avvia} accessibilityRole="button">
              <Text style={s.startBtnLabel}>Avvia chiusura</Text>
            </PressScale>
          </Enter>
        </SafeAreaView>
      );
    }
    return (
      <SafeAreaView style={[s.container, s.center]}>
        <Enter bouncy fromY={0} fromScale={0.6}>
          <Pulse style={[s.stateBadge, s.stateBadgeSoft]}>
            <Ionicons name="hourglass-outline" size={32} color={RED} />
          </Pulse>
        </Enter>
        <Enter delay={80}><Text style={s.startTitle}>In attesa</Text></Enter>
        <Enter delay={140}>
          <Text style={s.startSubtitle}>La chiusura non è ancora stata avviata.{'\n'}Attendi che un amministratore la avvii.</Text>
        </Enter>
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
        <Enter bouncy fromY={0} fromScale={0.6} style={[s.stateBadge, s.stateBadgeSoft]}>
          <Ionicons name="alert-circle-outline" size={34} color={RED} />
        </Enter>
        <Enter delay={80}><Text style={s.startTitle}>Qualcosa è andato storto</Text></Enter>
        <Enter delay={140}><Text style={s.startSubtitle}>{error}</Text></Enter>
        <Enter delay={200}>
          <PressScale style={s.startBtn} onPress={retry} accessibilityRole="button">
            <Text style={s.startBtnLabel}>Riprova</Text>
          </PressScale>
        </Enter>
      </SafeAreaView>
    );
  }

  const allDone = total > 0 && doneCount === total;

  return (
    <SafeAreaView style={s.container}>
      {/* Modale conferma completamento */}
      <Modal transparent animationType="fade" visible={!!pending} onRequestClose={() => setPending(null)}>
        <Pressable style={s.overlay} onPress={() => setPending(null)}>
          <Enter style={s.dialogWrap} fromY={10} fromScale={0.94}>
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
          </Enter>
        </Pressable>
      </Modal>

      {/* Modale assegnazione */}
      <Modal transparent animationType="fade" visible={!!assignPending} onRequestClose={() => setAssignPending(null)}>
        <Pressable style={s.overlay} onPress={() => setAssignPending(null)}>
          <Enter style={s.dialogWrap} fromY={10} fromScale={0.94}>
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
          </Enter>
        </Pressable>
      </Modal>

      {/* Modale azzera */}
      <Modal transparent animationType="fade" visible={confirmReset} onRequestClose={closeResetModal}>
        <Pressable style={s.overlay} onPress={closeResetModal}>
          <Enter style={s.dialogWrap} fromY={10} fromScale={0.94}>
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
          </Enter>
        </Pressable>
      </Modal>

      {/* Header */}
      <Enter style={s.header} fromY={-8}>
        <View style={s.headerLeft}>
          <View style={s.logo}>
            <Ionicons name="lock-closed" size={22} color="#fff" />
          </View>
          <View>
            <Text style={s.title}>Chiusura</Text>
            <Text style={s.subtitle}>Checklist di fine turno</Text>
          </View>
        </View>
        {canEdit && (
          <PressScale style={s.resetBtn} onPress={() => setConfirmReset(true)} accessibilityRole="button">
            <Ionicons name="refresh" size={16} color={INK_SOFT} />
            <Text style={s.resetBtnLabel}>Azzera</Text>
          </PressScale>
        )}
      </Enter>

      {/* Progresso */}
      <Enter style={s.progressWrap} delay={60}>
        <View style={s.progressTop}>
          <Pop trigger={allDone} amount={1.08}>
            <Text style={s.progressText}>
              {allDone ? 'Tutto pronto!' : total - doneCount === 1 ? 'Manca 1 attività' : `Mancano ${total - doneCount} attività`}
            </Text>
          </Pop>
          <Pop trigger={doneCount}>
            <Text style={[s.progressCount, allDone && s.progressCountDone]}>
              {doneCount}<Text style={s.progressTotal}>/{total}</Text>
            </Text>
          </Pop>
        </View>
        <View style={s.progressBg}>
          <ProgressFill progress={progress} style={s.progressFill} />
        </View>
      </Enter>

      <FlatList
        data={chores}
        keyExtractor={c => c._id}
        contentContainerStyle={s.list}
        renderItem={({ item, index }) => {
          const sottoTask  = item.sotto_task ?? [];
          const hasSotto   = sottoTask.length > 0;
          const sottoFatti = sottoTask.filter(st => st.completato).length;
          const sottoAll   = hasSotto && sottoFatti === sottoTask.length;
          const acc        = item.assegnato_a ? accounts.find(a => a.nome === item.assegnato_a) : null;
          const isAdmin    = acc?.ruolo === 'admin';
          const pillStyle  = !item.assegnato_a ? s.pillNone : isAdmin ? s.pillAdmin : s.pillUser;
          const pillText   = !item.assegnato_a ? s.pillNoneText : isAdmin ? s.pillAdminText : s.pillUserText;
          const pillColor  = !item.assegnato_a ? RED_DEEP : isAdmin ? BLUE : GREEN_DEEP;
          const assignLabel = item.assegnato_a ?? (canEdit ? 'Assegna' : 'Nessuno');

          const pill = (
            <View style={[s.assignPill, pillStyle]}>
              <Ionicons name="person" size={14} color={pillColor} />
              <Text style={[s.assignPillText, pillText]}>{assignLabel}</Text>
            </View>
          );

          return (
            <Enter delay={120 + Math.min(index, 8) * 50}>
            <ColorFade
              style={s.card}
              active={!!item.completato}
              off={{ bg: SURFACE, border: LINE }}
              on={{ bg: GREEN_CARD, border: GREEN_LINE }}
            >
              <View style={s.cardRow}>
                <PressScale
                  onPress={() => tapChore(item._id, item.titolo, item.completato)}
                  scaleTo={0.88}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.completato }}
                  accessibilityLabel={item.titolo}
                >
                  <Pop trigger={!!item.completato} style={[s.check, item.completato && s.checkDone]}>
                    {item.completato && <Ionicons name="checkmark" size={18} color="#fff" />}
                  </Pop>
                </PressScale>

                <View style={s.cardBody}>
                  <View style={s.cardTop}>
                    <Text style={[s.label, item.completato && s.labelDone]}>{item.titolo}</Text>
                    {hasSotto && (
                      <TouchableOpacity
                        onPress={() => { smoothLayout(); toggleExpand(item._id); }}
                        style={s.expandBtn}
                        accessibilityLabel={item._expanded ? 'Nascondi sotto-attività' : 'Mostra sotto-attività'}
                      >
                        <Ionicons name={item._expanded ? 'chevron-up' : 'chevron-down'} size={20} color={INK_SOFT} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {item.descrizione ? <Text style={s.desc}>{item.descrizione}</Text> : null}

                  <View style={s.meta}>
                    {canEdit ? (
                      <TouchableOpacity onPress={() => setAssignPending({ choreId: item._id })} accessibilityRole="button">
                        {pill}
                      </TouchableOpacity>
                    ) : pill}
                    {hasSotto && (
                      <Pop trigger={sottoFatti} style={[s.counter, sottoAll && s.counterDone]}>
                        <Text style={[s.counterText, sottoAll && s.counterTextDone]}>{sottoFatti}/{sottoTask.length}</Text>
                      </Pop>
                    )}
                  </View>
                </View>
              </View>

              {hasSotto && item._expanded && (
                <View style={s.sottoList}>
                  {sottoTask.map((st, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={s.sottoRow}
                      onPress={() => tapSotto(item._id, idx, st.titolo, st.completato)}
                      activeOpacity={0.7}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: st.completato }}
                    >
                      <Pop trigger={!!st.completato} style={[s.sottoCheck, st.completato && s.sottoCheckDone]}>
                        {st.completato && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </Pop>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.sottoLabel, st.completato && s.labelDone]}>{st.titolo}</Text>
                        {st.descrizione ? <Text style={s.desc}>{st.descrizione}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ColorFade>
            </Enter>
          );
        }}
      />
    </SafeAreaView>
  );
}

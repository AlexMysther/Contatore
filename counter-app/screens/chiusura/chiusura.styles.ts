import { StyleSheet } from 'react-native';

import {
  RED, RED_DEEP, RED_TINT, GREEN, GREEN_DEEP, GREEN_CARD, GREEN_LINE,
  BLUE, BLUE_TINT, GROUND, SURFACE, LINE, INK, INK_SOFT, MUTED,
} from '@/constants/palette';

export { RED, RED_DEEP, RED_TINT, GREEN, GREEN_DEEP, GREEN_CARD, GREEN_LINE, BLUE, BLUE_TINT, GROUND, SURFACE, LINE, INK, INK_SOFT, MUTED };

export const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: GROUND, paddingTop: 24 },
  center:        { justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 32 },

  // Stati a schermo intero (avvia / attesa / errore)
  stateBadge:    { width: 72, height: 72, borderRadius: 22, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: RED_DEEP, marginBottom: 6 },
  stateBadgeSoft:{ backgroundColor: RED_TINT, borderBottomColor: LINE },
  startTitle:    { fontSize: 30, fontWeight: '900', color: INK, letterSpacing: -0.3 },
  startSubtitle: { fontSize: 16, fontWeight: '600', color: INK_SOFT, textAlign: 'center', lineHeight: 23 },
  startBtn:      { marginTop: 10, minHeight: 52, backgroundColor: RED, paddingHorizontal: 36, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: RED_DEEP },
  startBtnLabel: { color: '#fff', fontWeight: '800', fontSize: 17 },
  hint:          { fontSize: 15, fontWeight: '600', color: MUTED, marginTop: 4 },

  // Header
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: LINE },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  logo:          { width: 46, height: 46, borderRadius: 14, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: RED_DEEP },
  title:         { fontSize: 26, fontWeight: '900', color: INK, letterSpacing: -0.3 },
  subtitle:      { fontSize: 14, fontWeight: '700', color: MUTED, marginTop: 1 },
  resetBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 13, borderWidth: 2, borderColor: LINE, backgroundColor: GROUND },
  resetBtnLabel: { color: INK_SOFT, fontWeight: '800', fontSize: 14 },

  // Progresso
  progressWrap:  { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  progressTop:   { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 },
  progressText:  { fontSize: 15, fontWeight: '800', color: INK },
  progressCount: { fontSize: 17, fontWeight: '900', color: INK },
  progressCountDone: { color: GREEN_DEEP },
  progressTotal: { fontWeight: '700', color: MUTED },
  progressBg:    { height: 12, backgroundColor: LINE, borderRadius: 99, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: GREEN, borderRadius: 99 },

  // Lista e card
  list:          { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32, gap: 12 },
  card:          { backgroundColor: SURFACE, borderRadius: 18, borderWidth: 2, borderColor: LINE, overflow: 'hidden' },
  cardDone:      { backgroundColor: GREEN_CARD, borderColor: GREEN_LINE },
  cardRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  cardBody:      { flex: 1, minWidth: 0 },
  cardTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },

  check:         { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: RED, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE },
  checkDone:     { backgroundColor: GREEN, borderColor: GREEN },

  label:         { flex: 1, fontSize: 18, fontWeight: '800', color: INK },
  labelDone:     { color: INK_SOFT },
  desc:          { marginTop: 3, fontSize: 14.5, fontWeight: '600', color: INK_SOFT, lineHeight: 20 },

  meta:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  assignPill:    { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 14, borderRadius: 99 },
  assignPillText:{ fontSize: 14, fontWeight: '800' },
  pillNone:      { backgroundColor: RED_TINT },
  pillNoneText:  { color: RED_DEEP },
  pillUser:      { backgroundColor: GREEN_CARD, borderWidth: 1.5, borderColor: GREEN_LINE },
  pillUserText:  { color: GREEN_DEEP },
  pillAdmin:     { backgroundColor: BLUE_TINT },
  pillAdminText: { color: BLUE },
  counter:       { paddingHorizontal: 13, paddingVertical: 6, borderRadius: 99, backgroundColor: LINE },
  counterDone:   { backgroundColor: GREEN },
  counterText:   { fontSize: 14, fontWeight: '900', color: INK_SOFT },
  counterTextDone:{ color: '#fff' },

  expandBtn:     { width: 44, height: 44, marginRight: -10, marginTop: -8, alignItems: 'center', justifyContent: 'center' },

  sottoList:     { borderTopWidth: 2, borderTopColor: LINE, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,251,245,0.6)' },
  sottoRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 4 },
  sottoCheck:    { width: 24, height: 24, borderRadius: 12, borderWidth: 2.5, borderColor: MUTED, alignItems: 'center', justifyContent: 'center' },
  sottoCheckDone:{ backgroundColor: GREEN, borderColor: GREEN },
  sottoLabel:    { fontSize: 15.5, fontWeight: '700', color: INK },

  // Modali
  overlay:       { flex: 1, backgroundColor: 'rgba(43,33,28,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialogWrap:    { width: '100%', maxWidth: 340 },
  dialog:        { backgroundColor: GROUND, borderRadius: 22, padding: 24, width: '100%', maxWidth: 340, gap: 12 },
  assignDialog:  { backgroundColor: GROUND, borderRadius: 22, padding: 20, width: '100%', maxWidth: 340, gap: 2 },
  assignRow:     { minHeight: 52, justifyContent: 'center', paddingHorizontal: 8, borderBottomWidth: 2, borderBottomColor: LINE },
  assignName:    { fontSize: 17, fontWeight: '700', color: INK },
  assignNone:    { fontSize: 17, fontWeight: '700', color: MUTED },
  dialogTitle:   { fontSize: 20, fontWeight: '900', color: INK, marginBottom: 4 },
  dialogMsg:     { fontSize: 16, fontWeight: '600', color: INK_SOFT, lineHeight: 23 },
  dialogBtns:    { flexDirection: 'row', gap: 10, marginTop: 8 },
  dialogCancel:  { flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 2, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  dialogCancelLabel: { fontSize: 16, fontWeight: '800', color: INK_SOFT },
  dialogConfirm: { flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: GREEN_DEEP },
  dialogDanger:  { flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: RED_DEEP },
  dialogConfirmLabel: { fontSize: 16, color: '#fff', fontWeight: '800' },
});

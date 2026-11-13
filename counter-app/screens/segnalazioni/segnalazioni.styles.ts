import { StyleSheet } from 'react-native';

import {
  RED, RED_DEEP, RED_TINT, GREEN, GREEN_DEEP, GREEN_CARD, GREEN_LINE,
  GROUND, SURFACE, LINE, INK, INK_SOFT, MUTED,
} from '@/constants/palette';

export { RED, RED_DEEP, GREEN_DEEP, GREEN_CARD, GREEN_LINE, INK_SOFT, MUTED };

// Card "aperta": carta calda con bordo rosato, richiama l'attenzione senza gridare.
export const OPEN_CARD = '#FFF4F0';
export const OPEN_LINE = '#F0C3B6';

export const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: GROUND, paddingTop: 24 },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 32 },

  // Header
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: LINE },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  logo:          { width: 46, height: 46, borderRadius: 14, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: RED_DEEP },
  headerText:    { flexShrink: 1 },
  title:         { fontSize: 26, fontWeight: '900', color: INK, letterSpacing: -0.3 },
  subtitle:      { fontSize: 14, fontWeight: '700', color: MUTED, marginTop: 1 },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 46, paddingLeft: 12, paddingRight: 16, borderRadius: 14, backgroundColor: RED, borderBottomWidth: 3, borderBottomColor: RED_DEEP },
  addBtnText:    { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Stati a schermo intero (vuoto / caricamento)
  stateBadge:    { width: 72, height: 72, borderRadius: 22, backgroundColor: GREEN_CARD, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: GREEN_LINE, borderBottomWidth: 4, marginBottom: 6 },
  stateTitle:    { fontSize: 26, fontWeight: '900', color: INK, letterSpacing: -0.3, textAlign: 'center' },
  stateSubtitle: { fontSize: 16, fontWeight: '600', color: INK_SOFT, textAlign: 'center', lineHeight: 23 },
  hint:          { fontSize: 15, fontWeight: '600', color: MUTED, marginTop: 4 },

  // Lista e card
  list:          { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 12 },
  card:          { borderRadius: 18, borderWidth: 2, padding: 16 },
  cardHeader:    { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  badge:         { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 28, paddingLeft: 8, paddingRight: 11, borderRadius: 99 },
  badgeAperta:   { backgroundColor: RED_TINT },
  badgeRisolta:  { backgroundColor: GREEN },
  badgeText:     { fontSize: 13, fontWeight: '900' },
  badgeTextAperta:  { color: RED_DEEP },
  badgeTextRisolta: { color: '#fff' },
  categoria:     { minHeight: 28, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 99, borderWidth: 2, borderColor: LINE, backgroundColor: SURFACE },
  categoriaText: { fontSize: 13, fontWeight: '800', color: INK_SOFT },
  testo:         { fontSize: 17, fontWeight: '700', color: INK, lineHeight: 24 },
  testoRisolta:  { color: INK_SOFT },

  footer:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12 },
  autoreRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, minHeight: 24 },
  autore:        { fontSize: 14, fontWeight: '700', color: MUTED, flexShrink: 1 },
  btnRisolvi:    { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingLeft: 12, paddingRight: 16, borderRadius: 14, backgroundColor: GREEN, borderBottomWidth: 3, borderBottomColor: GREEN_DEEP },
  btnRisolviText:{ color: '#fff', fontWeight: '800', fontSize: 14.5 },
  btnTrash:      { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 2, borderColor: GREEN_LINE },

  // Modali
  overlay:       { flex: 1, backgroundColor: 'rgba(43,33,28,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialogWrap:    { width: '100%', maxWidth: 340 },
  formWrap:      { width: '100%', maxWidth: 400 },
  dialog:        { backgroundColor: GROUND, borderRadius: 22, padding: 24, width: '100%', gap: 12 },
  dialogTitle:   { fontSize: 20, fontWeight: '900', color: INK, marginBottom: 4 },
  dialogMsg:     { fontSize: 16, fontWeight: '600', color: INK_SOFT, lineHeight: 23 },
  dialogBtns:    { flexDirection: 'row', gap: 10, marginTop: 8 },
  dialogCancel:  { flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 2, borderColor: LINE, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  dialogCancelLabel: { fontSize: 16, fontWeight: '800', color: INK_SOFT },
  dialogConfirm: { flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: GREEN_DEEP },
  dialogDanger:  { flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: RED_DEEP },
  dialogConfirmLabel: { fontSize: 16, color: '#fff', fontWeight: '800' },

  // Form nuova segnalazione
  label:         { fontSize: 14, fontWeight: '800', color: INK_SOFT, marginBottom: -4 },
  catList:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip:       { minHeight: 40, justifyContent: 'center', borderWidth: 2, borderColor: LINE, borderRadius: 99, paddingHorizontal: 14, backgroundColor: SURFACE },
  catChipSel:    { backgroundColor: RED, borderColor: RED },
  catChipText:   { fontSize: 14.5, fontWeight: '700', color: INK_SOFT },
  catChipTextSel:{ color: '#fff', fontWeight: '800' },
  input:         { backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, minHeight: 96, fontSize: 17, fontWeight: '600', borderWidth: 2, borderColor: LINE, color: INK, textAlignVertical: 'top' },
  errorText:     { fontSize: 14, fontWeight: '700', color: RED_DEEP, textAlign: 'center' },
});

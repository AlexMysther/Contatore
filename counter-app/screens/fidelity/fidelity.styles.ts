import { StyleSheet } from 'react-native';

import {
  RED, RED_DEEP, RED_TINT, AMBER, AMBER_TINT, AMBER_LINE,
  GROUND, SURFACE, LINE, INK, INK_SOFT, MUTED,
} from '@/constants/palette';

export { RED, RED_DEEP, AMBER, INK_SOFT, MUTED };

// Menu a tendina del pannello di gestione
export const dd = StyleSheet.create({
  wrapper:          { zIndex: 10 },
  trigger:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 50, backgroundColor: SURFACE, borderWidth: 2, borderColor: LINE, borderRadius: 14, paddingHorizontal: 14 },
  triggerOpen:      { borderColor: RED, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  triggerText:      { fontSize: 16, fontWeight: '700', color: INK, flex: 1 },
  placeholder:      { color: MUTED, fontWeight: '600' },
  list:             { backgroundColor: SURFACE, borderWidth: 2, borderTopWidth: 0, borderColor: RED, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, maxHeight: 200, overflow: 'hidden' },
  item:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: LINE },
  itemSelected:     { backgroundColor: RED_TINT },
  itemText:         { flex: 1, fontSize: 16, fontWeight: '700', color: INK },
  itemTextSelected: { color: RED_DEEP, fontWeight: '800' },
  emptyItem:        { padding: 16, fontSize: 15, fontWeight: '600', color: MUTED, textAlign: 'center' },
});

export const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: GROUND, paddingTop: 24 },
  center:           { justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 32 },
  fill:             { flex: 1 },

  // Stati a schermo intero (errore / vuoto)
  stateBadge:       { width: 72, height: 72, borderRadius: 22, backgroundColor: RED_TINT, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: LINE, marginBottom: 6 },
  stateTitle:       { fontSize: 26, fontWeight: '900', color: INK, letterSpacing: -0.3, textAlign: 'center' },
  stateSubtitle:    { fontSize: 16, fontWeight: '600', color: INK_SOFT, textAlign: 'center', lineHeight: 23 },
  hint:             { fontSize: 15, fontWeight: '600', color: MUTED, marginTop: 4 },
  retryBtn:         { marginTop: 10, minHeight: 52, backgroundColor: RED, paddingHorizontal: 36, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: RED_DEEP },
  retryBtnText:     { color: '#fff', fontWeight: '800', fontSize: 17 },

  // Header
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: LINE },
  headerLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  logo:             { width: 46, height: 46, borderRadius: 14, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: RED_DEEP },
  headerText:       { flexShrink: 1 },
  title:            { fontSize: 26, fontWeight: '900', color: INK, letterSpacing: -0.3 },
  subtitle:         { fontSize: 14, fontWeight: '700', color: MUTED, marginTop: 1 },
  gestisciBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 14, borderRadius: 13, borderWidth: 2, borderColor: LINE, backgroundColor: GROUND },
  gestisciBtnText:  { color: INK_SOFT, fontWeight: '800', fontSize: 14 },

  // Lista dolci
  grid:             { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 12, flexGrow: 1 },
  tuttiBanner:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, borderRadius: 18, borderWidth: 2, borderColor: AMBER_LINE, backgroundColor: AMBER_TINT, paddingHorizontal: 16 },
  tuttiLabel:       { fontSize: 20, fontWeight: '900', color: AMBER, letterSpacing: -0.2 },
  cell:             { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: SURFACE, borderWidth: 2, borderColor: LINE },
  cellEmpty:        { borderStyle: 'dashed' },
  cellBadge:        { width: 38, height: 38, borderRadius: 12, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: RED_DEEP },
  cellBadgeText:    { color: '#fff', fontWeight: '900', fontSize: 16, fontVariant: ['tabular-nums'] },
  cellName:         { fontSize: 19, fontWeight: '800', color: INK, flex: 1 },
  cellNameEmpty:    { color: MUTED, fontWeight: '700', fontSize: 18 },

  // Pannello di gestione (admin)
  overlay:          { flex: 1, backgroundColor: 'rgba(43,33,28,0.5)', justifyContent: 'flex-end' },
  sheetWrap:        { maxHeight: '88%' },
  modal:            { backgroundColor: GROUND, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24, gap: 10, maxHeight: '100%' },
  modalTitle:       { fontSize: 21, fontWeight: '900', color: INK, marginBottom: 2 },
  sectionLabel:     { fontSize: 14, fontWeight: '800', color: INK_SOFT, marginTop: 6 },
  row:              { flexDirection: 'row', gap: 10 },
  aggiungiBtn:      { flex: 1, minHeight: 50, flexDirection: 'row', gap: 6, backgroundColor: RED, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: RED_DEEP },
  aggiungiBtnText:  { color: '#fff', fontWeight: '800', fontSize: 16 },
  tuttiBtn:         { minHeight: 50, borderRadius: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 2, borderColor: LINE },
  tuttiBtnText:     { color: INK, fontWeight: '800', fontSize: 16 },
  btnOff:           { opacity: 0.45 },
  selectedList:     { maxHeight: 230, flexShrink: 1 },
  selectedRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 14, borderWidth: 2, borderColor: LINE, paddingLeft: 12, minHeight: 52, marginBottom: 8, gap: 12 },
  selectedBadge:    { width: 26, height: 26, borderRadius: 9, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  selectedBadgeText:{ color: '#fff', fontSize: 13, fontWeight: '900' },
  selectedName:     { flex: 1, fontSize: 16, fontWeight: '700', color: INK },
  removeBtn:        { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  closeBtn:         { marginTop: 6, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 2, borderColor: LINE },
  closeBtnText:     { color: INK_SOFT, fontWeight: '800', fontSize: 16 },
});

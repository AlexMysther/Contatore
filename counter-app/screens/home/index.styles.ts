import { StyleSheet } from 'react-native';
import {
  RED, RED_DEEP, RED_TINT, GREEN_DEEP, AMBER, AMBER_TINT, AMBER_LINE,
  GROUND, SURFACE, LINE, INK, INK_SOFT, MUTED,
} from '@/constants/palette';

export { RED };

// Un colore per categoria: sfondo tenue, bordo, testo scuro (contrasto AA).
export const CAT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  antipasto:   { bg: '#FBEAEE', border: '#F0C4CE', text: '#A3294A' },
  pizza:       { bg: '#FBE9E3', border: '#F0C3B6', text: '#A63A22' },
  dolci:       { bg: '#EAF3FC', border: '#C6DCF2', text: '#2F6690' },
  bevanda:     { bg: '#F3EBF7', border: '#DCC7E7', text: '#6F3C8A' },
  'M.autunno': { bg: AMBER_TINT, border: AMBER_LINE, text: AMBER },
  ingrediente: { bg: '#F0F7EC', border: '#CDE6CE', text: '#3A7D44' },
};
export const DEFAULT_COLOR = CAT_COLORS.antipasto;

export const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: GROUND, paddingTop: 24 },
  center:       { justifyContent: 'center', alignItems: 'center' },

  // Logo (PNG) centrato, mai ritagliato
  // Il file è già rifilato ai bordi del marchio (rapporto 1232:628), quindi
  // width/height qui sono le dimensioni reali della scritta.
  logoWrap:     { alignItems: 'center', paddingTop: 4, paddingBottom: 6 },
  logo:         { width: 176, height: 90 },

  titleRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: LINE },
  title:        { fontSize: 30, fontWeight: '900', letterSpacing: -0.4, color: INK, flexShrink: 1 },
  avatar:       { width: 46, height: 46, borderRadius: 23 },
  avatarPlaceholder: { width: 46, height: 46, borderRadius: 23, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: RED_DEEP },
  avatarInitial: { color: '#fff', fontSize: 20, fontWeight: '900' },

  errorText:    { fontSize: 16, fontWeight: '600', color: INK_SOFT, textAlign: 'center', paddingHorizontal: 32, marginBottom: 16, lineHeight: 23 },
  retryBtn:     { minHeight: 50, backgroundColor: RED, borderRadius: 14, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: RED_DEEP },
  retryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  actionRow:    { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 14, marginHorizontal: 20 },
  addBtn:       { flex: 1, minHeight: 50, backgroundColor: RED, borderRadius: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: RED_DEEP },
  addBtnText:   { color: '#fff', fontSize: 16, fontWeight: '800' },
  filterBtn:    { minHeight: 50, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 2, borderColor: LINE },
  filterBtnActive: { backgroundColor: RED_TINT, borderColor: RED },
  filterBtnText:   { color: INK, fontSize: 16, fontWeight: '800' },
  filterBtnTextActive: { color: RED_DEEP },

  emptyText:    { textAlign: 'center', color: MUTED, fontSize: 16, fontWeight: '600', marginTop: 40, paddingHorizontal: 32 },

  // Card prodotto
  card:         { backgroundColor: SURFACE, borderRadius: 18, paddingLeft: 8, paddingRight: 14, paddingVertical: 12, marginBottom: 12, marginHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 2, borderColor: LINE },
  cardDirty:    { borderColor: RED },
  cardDeleted:  { backgroundColor: '#FFF1EE', borderColor: RED, borderStyle: 'dashed' },
  cardLocked:   { opacity: 0.45 },
  del:          { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cardBody:     { flex: 1, gap: 2, paddingRight: 4 },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name:         { fontSize: 19, color: INK, fontWeight: '800', flexShrink: 1 },
  nameDeleted:  { color: MUTED, textDecorationLine: 'line-through' },
  catLabel:     { fontSize: 14.5, fontWeight: '800' },

  soldOutBadge: { borderRadius: 99, paddingHorizontal: 11, paddingVertical: 3, borderWidth: 2, borderColor: AMBER_LINE, backgroundColor: AMBER_TINT },
  soldOutText:  { fontSize: 13, fontWeight: '900', color: AMBER },
  deletedLabel: { fontSize: 14, color: RED_DEEP, fontWeight: '800' },
  diff:         { fontSize: 13, fontWeight: '800', lineHeight: 17 },
  diffPos:      { color: GREEN_DEEP },
  diffNeg:      { color: RED_DEEP },
  legatiBox:    { marginTop: 6, paddingLeft: 6 },
  legatiItem:   { fontSize: 15, fontWeight: '700', color: '#3A7D44', lineHeight: 22 },

  counter:      { flexDirection: 'row', alignItems: 'center', gap: 2 },
  btn:          { backgroundColor: GROUND, borderWidth: 2, borderColor: LINE, borderRadius: 14, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  btnText:      { fontSize: 22, fontWeight: '800', color: INK, lineHeight: 26 },
  btnDisabled:  { backgroundColor: 'transparent', borderColor: LINE },
  btnTextDisabled: { color: '#D6C9BC' },
  count:        { fontSize: 22, fontWeight: '900', minWidth: 36, textAlign: 'center', color: INK, fontVariant: ['tabular-nums'] },

  // Barra modifiche in sospeso
  bar:          { flexDirection: 'row', gap: 10, paddingTop: 12, paddingBottom: 16, paddingHorizontal: 20, borderTopWidth: 2, borderTopColor: LINE, backgroundColor: GROUND },
  discardBtn:   { flex: 1, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 2, borderColor: LINE },
  discardText:  { fontSize: 16, fontWeight: '800', color: INK_SOFT },
  commitBtn:    { flex: 2, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: RED, borderBottomWidth: 4, borderBottomColor: RED_DEEP },
  commitText:   { fontSize: 16, color: '#fff', fontWeight: '800' },

  // Modali
  overlay:      { flex: 1, backgroundColor: 'rgba(43,33,28,0.5)', justifyContent: 'center', padding: 24 },
  dialog:       { backgroundColor: GROUND, borderRadius: 22, padding: 24, gap: 8 },
  dialogTitle:  { fontSize: 21, fontWeight: '900', color: INK, marginBottom: 6 },
  confirmMsg:   { fontSize: 16, fontWeight: '600', color: INK_SOFT, lineHeight: 23 },
  deltaNum:     { fontSize: 52, fontWeight: '900', textAlign: 'center', marginVertical: 4 },
  deltaPos:     { color: GREEN_DEEP },
  deltaNeg:     { color: RED_DEEP },
  label:        { fontSize: 14, fontWeight: '800', color: INK_SOFT, marginTop: 6 },
  dialogInput:  { backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 14, minHeight: 50, fontSize: 17, fontWeight: '600', borderWidth: 2, borderColor: LINE, color: INK, marginBottom: 4 },
  dialogRow:    { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn:    { flex: 1, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 2, borderColor: LINE },
  cancelText:   { fontSize: 16, fontWeight: '800', color: INK_SOFT },
  confirmBtn:   { flex: 1, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: RED, borderBottomWidth: 3, borderBottomColor: RED_DEEP },
  confirmText:  { fontSize: 16, color: '#fff', fontWeight: '800' },
  destructiveBtn: { backgroundColor: RED },
  addErrorText: { fontSize: 14, fontWeight: '700', color: RED_DEEP, textAlign: 'center' },
  tabRow:       { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tabBtn:       { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, borderWidth: 2, borderColor: LINE },
  tabBtnActive: { backgroundColor: RED, borderColor: RED },
  tabBtnText:   { fontSize: 15, color: INK_SOFT, fontWeight: '800' },
  tabBtnTextActive: { color: '#fff' },
  productList:  { maxHeight: 180, borderWidth: 2, borderColor: LINE, borderRadius: 14, marginBottom: 4, backgroundColor: SURFACE },
  productItem:  { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: LINE },
  productItemSelected:  { backgroundColor: RED },
  productItemText:      { fontSize: 16, fontWeight: '700', color: INK },
  productItemTextSelected: { color: '#fff', fontWeight: '800' },
  productItemDisabled:  { backgroundColor: GROUND },
  productItemTextDisabled: { color: '#B8AA9D' },
  catChipRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  catChip:      { minHeight: 40, justifyContent: 'center', borderWidth: 2, borderColor: LINE, borderRadius: 99, paddingHorizontal: 14, backgroundColor: SURFACE },
  catChipText:  { fontSize: 14.5, fontWeight: '700', color: INK_SOFT },
  qtyRow:       { flexDirection: 'row', gap: 8, alignItems: 'center' },
  qtyInput:     { flex: 1, minWidth: 0, marginBottom: 0 },
  finitoBtn:    { flexShrink: 0, minHeight: 50, borderRadius: 14, paddingHorizontal: 16, backgroundColor: SURFACE, borderWidth: 2, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  finitoBtnActive: { backgroundColor: AMBER_TINT, borderColor: AMBER },
  finitoText:   { fontSize: 15, fontWeight: '800', color: INK_SOFT },
  finitoTextActive: { color: AMBER },

  saveErrorBanner:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF1EE', borderLeftWidth: 5, borderLeftColor: RED, marginHorizontal: 20, marginBottom: 10, borderRadius: 12, paddingLeft: 14, paddingVertical: 4 },
  saveErrorText:    { flex: 1, fontSize: 14, color: RED_DEEP, fontWeight: '700', paddingVertical: 8 },
  saveErrorDismiss: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});

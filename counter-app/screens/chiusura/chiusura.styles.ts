import { StyleSheet } from 'react-native';

export const RED   = '#c0392b';
export const GREEN = '#27ae60';

export const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f2f2f2', paddingTop: 24 },
  center:        { justifyContent: 'center', alignItems: 'center', gap: 16 },
  startIcon:     { fontSize: 64 },
  startTitle:    { fontSize: 30, fontWeight: '800', color: '#1a1a1a' },
  startSubtitle: { fontSize: 15, color: '#888', textAlign: 'center', paddingHorizontal: 40 },
  startBtn:      { marginTop: 8, backgroundColor: RED, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 14 },
  startBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 17 },
  hint:          { fontSize: 14, color: '#aaa', marginTop: 8 },

  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title:         { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  resetBtn:      { backgroundColor: RED, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  resetBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },

  progressWrap:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10, marginBottom: 14 },
  progressBg:    { flex: 1, height: 8, backgroundColor: '#ddd', borderRadius: 4, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: GREEN, borderRadius: 4 },
  progressLabel: { fontSize: 13, color: '#888', minWidth: 36, textAlign: 'right' },

  list:          { paddingHorizontal: 14, paddingBottom: 32, gap: 10 },
  card:          { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2 },
  cardDone:      { backgroundColor: '#f0fff4' },
  cardRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },

  check:         { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: RED, alignItems: 'center', justifyContent: 'center' },
  checkDone:     { backgroundColor: GREEN, borderColor: GREEN },
  checkMark:     { color: '#fff', fontSize: 14, fontWeight: '700' },

  label:         { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  labelDone:     { color: '#aaa', textDecorationLine: 'line-through' },
  desc:          { fontSize: 13, color: '#777' },
  descDone:      { color: '#bbb' },

  meta:          { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  badge:         { fontSize: 12, color: '#555', backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeRed:      { color: RED,      backgroundColor: '#fdecea', borderWidth: 1, borderColor: RED },
  badgeGreen:    { color: '#1e8449', backgroundColor: '#eafaf1', borderWidth: 1, borderColor: GREEN },
  badgeBlue:     { color: '#1a5276', backgroundColor: '#eaf2ff', borderWidth: 1, borderColor: '#2980b9' },

  expandBtn:     { padding: 4 },
  expandIcon:    { fontSize: 12, color: '#aaa' },
  sottoList:     { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  sottoRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sottoCheck:    { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#aaa', alignItems: 'center', justifyContent: 'center' },
  sottoCheckDone:{ backgroundColor: GREEN, borderColor: GREEN },
  sottoMark:     { color: '#fff', fontSize: 11, fontWeight: '700' },
  sottoLabel:    { fontSize: 14, color: '#333' },

  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  dialog:        { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 300, gap: 12 },
  assignDialog:  { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: 300, gap: 4 },
  assignRow:     { paddingVertical: 13, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  assignName:    { fontSize: 16, color: '#1a1a1a' },
  assignNone:    { fontSize: 16, color: '#aaa', fontStyle: 'italic' },
  dialogTitle:   { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  dialogMsg:     { fontSize: 15, color: '#444', lineHeight: 22 },
  dialogBtns:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  dialogCancel:  { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  dialogCancelLabel: { fontSize: 15, color: '#555' },
  dialogConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: GREEN, alignItems: 'center' },
  dialogDanger:  { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: RED,   alignItems: 'center' },
  dialogConfirmLabel: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

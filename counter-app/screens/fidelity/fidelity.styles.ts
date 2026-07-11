import { StyleSheet } from 'react-native';

export const RED = '#c0392b';

export const dd = StyleSheet.create({
  wrapper:          { marginBottom: 12, zIndex: 10 },
  trigger:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13 },
  triggerOpen:      { borderColor: RED, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  triggerText:      { fontSize: 15, color: '#1a1a1a', flex: 1 },
  placeholder:      { color: '#aaa' },
  chevron:          { fontSize: 22, color: '#999', transform: [{ rotate: '90deg' }] },
  chevronUp:        { transform: [{ rotate: '-90deg' }], color: RED },
  list:             { backgroundColor: '#fff', borderWidth: 1.5, borderTopWidth: 0, borderColor: RED, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, maxHeight: 200, overflow: 'hidden' },
  item:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 8 },
  itemSelected:     { backgroundColor: '#fff5f5' },
  itemDot:          { fontSize: 8, color: RED },
  itemText:         { fontSize: 15, color: '#1a1a1a' },
  itemTextSelected: { color: RED, fontWeight: '600' },
  emptyItem:        { padding: 16, color: '#aaa', textAlign: 'center' },
});

export const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 24 },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:           { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title:            { fontSize: 26, fontWeight: '700', color: '#1a1a1a' },
  errorTitle:       { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginTop: 8 },
  errorMsg:         { fontSize: 14, color: '#888', marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn:         { marginTop: 20, backgroundColor: RED, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },

  grid:             { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  cell:             { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  cellFilled:       { backgroundColor: '#fff', borderWidth: 2, borderColor: RED, elevation: 3 },
  cellEmpty:        { backgroundColor: '#fff', borderWidth: 2, borderColor: '#e0e0e0' },
  cellBadge:        { width: 34, height: 34, borderRadius: 17, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  cellBadgeText:    { color: '#fff', fontWeight: '800', fontSize: 15 },
  cellName:         { fontSize: 18, fontWeight: '700', color: RED, flex: 1 },
  cellNameEmpty:    { color: '#bbb', fontWeight: '400', fontSize: 18 },
  cellStar:         { fontSize: 16, color: 'rgba(192,57,43,0.3)' },
  tuttiLabel:       { fontSize: 36, fontWeight: '900', color: RED, textAlign: 'center', marginBottom: 12 },

  gestisciBtn:      { backgroundColor: '#27ae60', marginHorizontal: 16, marginBottom: 16, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  gestisciBtnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },

  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:            { backgroundColor: '#f5f5f5', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, height: '60%' },
  modalTitle:       { fontSize: 20, fontWeight: '700', marginBottom: 20, color: '#1a1a1a' },
  sectionLabel:     { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  row:              { flexDirection: 'row', gap: 10 },
  aggiungiBtn:      { backgroundColor: RED, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnOff:           { backgroundColor: '#ddd' },
  aggiungiBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  tuttiBtn:         { backgroundColor: '#333', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  selectedList:     { maxHeight: 220, overflow: 'hidden' },
  selectedRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 6, gap: 12 },
  selectedBadge:    { width: 24, height: 24, borderRadius: 12, backgroundColor: RED, alignItems: 'center', justifyContent: 'center' },
  selectedBadgeText:{ color: '#fff', fontSize: 12, fontWeight: '700' },
  selectedName:     { flex: 1, fontSize: 15, color: '#1a1a1a' },
  removeBtn:        { fontSize: 15, color: RED, fontWeight: '700' },
  closeBtn:         { marginTop: 20, backgroundColor: '#1a1a1a', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  closeBtnText:     { color: '#fff', fontWeight: '600', fontSize: 16 },
});
import { StyleSheet } from 'react-native';


const RED = '#c0392b';

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: RED, justifyContent: 'center', alignItems: 'center' },
  card:      { alignItems: 'center', gap: 10 },
  avatar:    { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  emoji:     { fontSize: 72 },
  benvenuto: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 8 },
  nome:      { fontSize: 22, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  badge:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 4 },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btn:       { marginTop: 40, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 40, paddingVertical: 14 },
  btnText:   { color: RED, fontWeight: '800', fontSize: 16 },
});

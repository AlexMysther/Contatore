import { StyleSheet } from 'react-native';

export const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#fff' },
  banner:           { width: '100%', height: 180 },
  card:             { alignItems: 'center', paddingVertical: 32, gap: 8 },
  avatarWrap:       { position: 'relative', marginBottom: 4 },
  avatar:           { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder:{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#c0392b', alignItems: 'center', justifyContent: 'center' },
  avatarInitial:    { color: '#fff', fontSize: 38, fontWeight: '700' },
  editBadge:        { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd' },
  editBadgeText:    { fontSize: 13, color: '#555' },
  nome:             { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  ruolo:            { fontSize: 14, color: '#888' },
  logoutBtn:        { marginHorizontal: 24, borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#fdecea', borderWidth: 1, borderColor: '#ef9a9a' },
  logoutText:       { fontSize: 16, color: '#c0392b', fontWeight: '600' },
});

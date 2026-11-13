import { StyleSheet } from 'react-native';

import {
  RED, RED_DEEP, RED_TINT, GREEN_DEEP, GREEN_CARD, GREEN_LINE,
  BLUE, BLUE_TINT, GROUND, SURFACE, LINE, INK, MUTED,
} from '@/constants/palette';

export { RED, RED_DEEP, GREEN_DEEP, BLUE };

export const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: GROUND, paddingTop: 24 },

  // Logo (stesso marchio rifilato della Home)
  logoWrap:         { alignItems: 'center', paddingTop: 4, paddingBottom: 6 },
  logo:             { width: 176, height: 90 },

  // Scheda utente
  card:             { alignItems: 'center', marginHorizontal: 20, marginTop: 12, paddingVertical: 28, paddingHorizontal: 20, gap: 8, backgroundColor: SURFACE, borderRadius: 22, borderWidth: 2, borderColor: LINE },
  avatarWrap:       { marginBottom: 6 },
  avatar:           { width: 108, height: 108, borderRadius: 54, borderWidth: 3, borderColor: LINE },
  avatarPlaceholder:{ width: 108, height: 108, borderRadius: 54, backgroundColor: RED, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 4, borderBottomColor: RED_DEEP },
  avatarInitial:    { color: '#fff', fontSize: 44, fontWeight: '900' },
  editBadge:        { position: 'absolute', bottom: -2, right: -2, width: 38, height: 38, borderRadius: 19, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: LINE },
  nome:             { fontSize: 28, fontWeight: '900', color: INK, letterSpacing: -0.3, textAlign: 'center' },
  ruoloPill:        { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32, paddingHorizontal: 14, borderRadius: 99 },
  ruoloUser:        { backgroundColor: GREEN_CARD, borderWidth: 1.5, borderColor: GREEN_LINE },
  ruoloAdmin:       { backgroundColor: BLUE_TINT },
  ruoloText:        { fontSize: 14, fontWeight: '800', textTransform: 'capitalize' },
  ruoloTextUser:    { color: GREEN_DEEP },
  ruoloTextAdmin:   { color: BLUE },
  hint:             { fontSize: 14, fontWeight: '600', color: MUTED, marginTop: 6, textAlign: 'center' },

  logoutWrap:       { marginHorizontal: 20, marginTop: 16 },
  logoutBtn:        { minHeight: 52, borderRadius: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: RED_TINT, borderWidth: 2, borderColor: '#F0C3B6' },
  logoutText:       { fontSize: 16, color: RED_DEEP, fontWeight: '800' },
});

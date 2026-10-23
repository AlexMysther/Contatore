import { StyleSheet } from 'react-native';


const RED = '#c0392b';

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', justifyContent: 'center', alignItems: 'center' },
  card:      { backgroundColor: '#fff', borderRadius: 20, padding: 32, width: '90%', maxWidth: 380, alignItems: 'center', elevation: 4 },

  logo:     { width: 400, height: 200 },
  title:    { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 28 },

  form:  { width: '100%', gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#555' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#1a1a1a', backgroundColor: '#fafafa',
    marginBottom: 8,
  },

  pwdRow:   { position: 'relative', justifyContent: 'center', marginBottom: 8 },
  pwdInput: { marginBottom: 0, paddingRight: 44 },
  eyeBtn:   { position: 'absolute', right: 12, padding: 4 },
  eyeIcon:  {},

  error: { fontSize: 13, color: RED, textAlign: 'center' },

  btn:      { marginTop: 8, backgroundColor: RED, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnLabel: { color: '#fff', fontWeight: '700', fontSize: 16 },

  link:     { marginTop: 16, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#888' },
  linkBold: { color: RED, fontWeight: '700' },
});

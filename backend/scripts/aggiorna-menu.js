// Aggiorna il DB al nuovo menu Pizzium.
//   node scripts/aggiorna-menu.js            -> dry-run (non scrive nulla)
//   node scripts/aggiorna-menu.js --apply    -> backup + scrittura
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const APPLY = process.argv.includes('--apply');

// ── piatti del catalogo (non ingredienti) ───────────────────────────────────
const PIATTI = {
  antipasto: [
    'Bruschetta con Datterini Rossi',
    'Bruschetta con Caponatina Siciliana',
    'Bruschetta con Stracciatella Pugliese e Zucchine Fritte',
    'Crocchè Napoli',
    'Frittatina Classica',
    'Tagliere da Condividere',
    'Prosciutto Crudo San Daniele DOP e Mozzarella di Bufala Campana DOP',
  ],
  dolci: ['Caprese', 'Cannolo Siciliano', 'Nuvole Golose', 'Cheesecake', 'Tiramisù'],
  'M.autunno': ['Gnocchi alla Sorrentina', 'Sformato di Pasta', 'Polpette al Sugo', 'Parmigiana di Melanzane'],
};

// Stock: elementi da togliere e da rinominare
const STOCK_DA_ELIMINARE = ['Pollo', 'Lasagna'];
const STOCK_RINOMINA = { Parmigiana: { name: 'Parmigiana di Melanzane', categoria: 'M.autunno' } };

// ── parsing del markdown ────────────────────────────────────────────────────
const stripNote = s => s.replace(/\s*\([^)]*\)\s*$/, '').trim();

function parseIngredienti(md) {
  const out = [];
  let cur = null;
  let started = false;
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('## ')) {
      const title = line.slice(3).trim();
      if (title === 'Indice ingredienti') { started = true; cur = null; continue; }
      if (title.startsWith('Piatti senza ingredienti') || title.startsWith('Note sui simboli')) { cur = null; started = false; continue; }
      if (!started) continue;
      cur = { name: stripNote(title), categoria: 'ingrediente', prodotti_legati: [] };
      out.push(cur);
      continue;
    }
    if (cur && line.startsWith('- ')) {
      const dish = stripNote(line.slice(2).split(' — ')[0]);
      if (dish && !cur.prodotti_legati.includes(dish)) cur.prodotti_legati.push(dish);
    }
  }
  return out.filter(i => i.prodotti_legati.length > 0);
}

(async () => {
  const md = fs.readFileSync(path.join(__dirname, 'ingredienti_menu_pizzium.md'), 'utf8');
  const ingredienti = parseIngredienti(md);

  const nuovoCatalogo = [
    ...ingredienti,
    ...Object.entries(PIATTI).flatMap(([categoria, nomi]) => nomi.map(name => ({ name, categoria }))),
  ];
  const nomi = nuovoCatalogo.map(x => x.name);
  const dup = nomi.filter((n, i) => nomi.indexOf(n) !== i);
  if (dup.length) { console.error('Nomi duplicati nel nuovo catalogo:', dup); process.exit(1); }
  const byName = Object.fromEntries(nuovoCatalogo.map(x => [x.name, x]));

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.DB_NAME || 'contatore');
  const colCat = db.collection('prodotti_disponibili');
  const colStock = db.collection('prodotti');

  const vecchioCatalogo = await colCat.find().toArray();
  const stock = await colStock.find().toArray();

  const categorieNote = new Set(['ingrediente', 'antipasto', 'dolci', 'M.autunno']);
  const strane = vecchioCatalogo.filter(x => !categorieNote.has(x.categoria));
  if (strane.length) { console.error('Categorie inattese nel catalogo, mi fermo:', strane.map(x => x.categoria)); process.exit(1); }

  // ── piano per lo stock ────────────────────────────────────────────────────
  const stockPiano = stock.map(doc => {
    if (STOCK_DA_ELIMINARE.includes(doc.name)) return { doc, azione: 'elimina' };
    const rin = STOCK_RINOMINA[doc.name];
    const name = rin ? rin.name : doc.name;
    const categoria = rin ? rin.categoria : doc.categoria;
    const legati = byName[name]?.prodotti_legati;
    return { doc, azione: 'aggiorna', name, categoria, legati };
  });

  // ── report ────────────────────────────────────────────────────────────────
  console.log(`DB: ${db.databaseName}  (${APPLY ? 'APPLY' : 'DRY-RUN'})`);
  console.log(`Catalogo attuale: ${vecchioCatalogo.length} voci -> nuovo: ${nuovoCatalogo.length} voci`);
  console.log(`  ingredienti: ${ingredienti.length}`);
  for (const [c, l] of Object.entries(PIATTI)) console.log(`  ${c}: ${l.length}`);
  const legatiTot = ingredienti.reduce((a, i) => a + i.prodotti_legati.length, 0);
  console.log(`  collegamenti ingrediente->piatto: ${legatiTot}`);
  console.log('\nStock:');
  for (const p of stockPiano) {
    if (p.azione === 'elimina') console.log(`  ELIMINA   ${p.doc.name} (count ${p.doc.count})`);
    else console.log(`  AGGIORNA  ${p.doc.name}${p.name !== p.doc.name ? ' -> ' + p.name : ''} (count ${p.doc.count}) legati=${JSON.stringify(p.legati ?? [])}`);
  }
  const vecchiNomi = new Set(vecchioCatalogo.map(x => x.name));
  console.log('\nRimossi dal catalogo (piatti):', vecchioCatalogo.filter(x => x.categoria !== 'ingrediente' && !byName[x.name]).map(x => x.name).join(', ') || '-');
  console.log('Aggiunti al catalogo (piatti):', nuovoCatalogo.filter(x => x.categoria !== 'ingrediente' && !vecchiNomi.has(x.name)).map(x => x.name).join(', ') || '-');

  if (!APPLY) { console.log('\nDry-run: nessuna modifica. Rilancia con --apply.'); await client.close(); return; }

  // ── backup ────────────────────────────────────────────────────────────────
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(__dirname, `backup-${stamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({ prodotti_disponibili: vecchioCatalogo, prodotti: stock }, null, 2));
  console.log('\nBackup scritto:', backupFile);

  // ── scrittura: prima inserisco i nuovi, poi tolgo i vecchi ────────────────
  const ins = await colCat.insertMany(nuovoCatalogo.map(x => ({ ...x })));
  const del = await colCat.deleteMany({ _id: { $in: vecchioCatalogo.map(x => x._id) } });
  console.log(`Catalogo: inseriti ${ins.insertedCount}, eliminati ${del.deletedCount}`);

  for (const p of stockPiano) {
    if (p.azione === 'elimina') { await colStock.deleteOne({ _id: p.doc._id }); continue; }
    const upd = { $set: { name: p.name, categoria: p.categoria } };
    if (p.legati && p.legati.length) upd.$set.prodotti_legati = p.legati;
    else upd.$unset = { prodotti_legati: '' };
    await colStock.updateOne({ _id: p.doc._id }, upd);
  }
  console.log('Stock aggiornato.');
  await client.close();
})().catch(e => { console.error('ERRORE:', e.message); process.exit(1); });

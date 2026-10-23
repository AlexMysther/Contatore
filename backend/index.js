require('dotenv').config();
const http       = require('http');
const express    = require('express');
const cors       = require('cors');
const jwt        = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
const { MongoClient, ObjectId } = require('mongodb');
const cloudinary = require('cloudinary').v2;
const multer     = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key:    process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });

const wsClients = new Set();

wss.on('connection', (ws, req) => {
  const token = new URL(req.url, 'http://localhost').searchParams.get('token');
  try {
    jwt.verify(token, JWT_SECRET);
    wsClients.add(ws);
    ws.on('close', () => wsClients.delete(ws));
    ws.on('error', () => wsClients.delete(ws));
  } catch {
    ws.close(1008, 'Unauthorized');
  }
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const ws of wsClients) {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  }
}

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connect() {
  await client.connect();
  db = client.db(process.env.DB_NAME || 'contatore');
  console.log('Connesso a MongoDB');
  const count = await db.collection('categorie').countDocuments();
  if (count === 0) {
    await db.collection('categorie').insertMany([
      { nome: 'Tavolo',        order: 1 },
      { nome: 'Cucina',        order: 2 },
      { nome: 'Magazzino',     order: 3 },
      { nome: 'Pulizie',       order: 4 },
      { nome: 'Personalizzata', order: 99 },
    ]);
    console.log('Categorie inizializzate');
  }

  const dolciCount = await db.collection('dolci').countDocuments();
  if (dolciCount === 0) {
    await db.collection('dolci').insertMany([
      { nome: 'Sorbetto di Limone',    createdAt: new Date() },
      { nome: 'Baciata alla Nutella',  createdAt: new Date() },
      { nome: 'Cannolo Siciliano',     createdAt: new Date() },
      { nome: 'Tortino Cuore Caldo',   createdAt: new Date() },
      { nome: 'Delizia di Limone',     createdAt: new Date() },
      { nome: 'Cheesecake',            createdAt: new Date() },
      { nome: 'Tiramisù',              createdAt: new Date() },
      { nome: 'Pastiera Napoletana',   createdAt: new Date() },
    ]);
    console.log('Dolci inizializzati');
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_changeme';

// ── Middleware auth ──────────────────────────────────────────────────────────
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Non autenticato' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token non valido' });
  }
}

// ── POST /api/auth/login ─────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const account = await db.collection('accounts').findOne({ username, attivo: true });
    if (!account) return res.status(401).json({ error: 'Credenziali errate' });

    if (account.password !== password) return res.status(401).json({ error: 'Credenziali errate' });

    const token = jwt.sign(
      { id: account._id, username: account.username, ruolo: account.ruolo, permessi: account.permessi, nome: account.nome },
      JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.json({ token, id: String(account._id), nome: account.nome, ruolo: account.ruolo, permessi: account.permessi });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/register ──────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, nome, cognome } = req.body;
    if (!username || !password || !nome || !cognome)
      return res.status(400).json({ error: 'username, password, nome e cognome sono obbligatori' });

    const existing = await db.collection('accounts').findOne({ username });
    if (existing) return res.status(409).json({ error: 'Username già in uso' });

    const result = await db.collection('accounts').insertOne({
      username,
      password,
      nome,
      cognome,
      ruolo: 'staff',
      permessi: [],
      attivo: true,
      createdAt: new Date(),
    });

    const token = jwt.sign(
      { id: result.insertedId, username, ruolo: 'staff', permessi: [], nome },
      JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.status(201).json({ token, id: String(result.insertedId), nome, ruolo: 'dipendente', permessi: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/chiusura/stato ──────────────────────────────────────────────────
app.get('/api/chiusura/stato', auth, async (req, res) => {
  try {
    const doc = await db.collection('settings').findOne({ _id: 'chiusura' });
    res.json({ avviata: doc?.avviata ?? false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/chiusura/avvia ─────────────────────────────────────────────────
app.post('/api/chiusura/avvia', auth, async (req, res) => {
  if (!req.user.permessi?.includes('chiusura'))
    return res.status(403).json({ error: 'Non autorizzato' });
  try {
    await db.collection('settings').updateOne(
      { _id: 'chiusura' },
      { $set: { avviata: true } },
      { upsert: true }
    );
    broadcast({ type: 'chiusura', avviata: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/chiusura/reset ─────────────────────────────────────────────────
app.post('/api/chiusura/reset', auth, async (req, res) => {
  if (!req.user.permessi?.includes('chiusura'))
    return res.status(403).json({ error: 'Non autorizzato' });
  try {
    const doc = await db.collection('settings').findOne({ _id: 'chiusura' });
    if (doc?.pin) {
      const { pin } = req.body;
      if (!pin || String(pin) !== String(doc.pin))
        return res.status(403).json({ error: 'PIN non corretto' });
    }
    await db.collection('settings').updateOne(
      { _id: 'chiusura' },
      { $set: { avviata: false } },
      { upsert: true }
    );
    broadcast({ type: 'chiusura', avviata: false });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/chores ──────────────────────────────────────────────────────────
app.get('/api/chores', auth, async (req, res) => {
  try {
    const chores = await db.collection(process.env.DB_COLLECTION || 'chores').find().sort({ order: 1 }).toArray();
    res.json(chores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/chores/:id ────────────────────────────────────────────────────
app.patch('/api/chores/:id', auth, async (req, res) => {
  try {
    const { completato, sotto_task, assegnato_a } = req.body;
    const update = {};
    if (completato   !== undefined) update.completato   = completato;
    if (sotto_task   !== undefined) update.sotto_task   = sotto_task;
    if (assegnato_a  !== undefined) update.assegnato_a  = assegnato_a || null;
    const col = db.collection(process.env.DB_COLLECTION || 'chores');
    await col.updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });
    const chore = await col.findOne({ _id: new ObjectId(req.params.id) });
    if (chore) broadcast({ type: 'chore', chore });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/accounts ────────────────────────────────────────────────────────
app.get('/api/accounts', auth, async (req, res) => {
  try {
    const accounts = await db.collection('accounts')
      .find({ attivo: true }, { projection: { _id: 1, nome: 1, cognome: 1, ruolo: 1 } })
      .sort({ nome: 1 })
      .toArray();
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/prodotti-disponibili ────────────────────────────────────────────
app.get('/api/prodotti-disponibili', auth, async (req, res) => {
  try {
    const list = await db.collection('prodotti_disponibili').find().sort({ categoria: 1, name: 1 }).toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/prodotti/sync-categorie ────────────────────────────────────────
// Aggiorna la categoria dei prodotti esistenti basandosi su prodotti_disponibili
app.post('/api/prodotti/sync-categorie', auth, async (req, res) => {
  try {
    const disponibili = await db.collection('prodotti_disponibili').find().toArray();
    const nameToCategoria = {};
    for (const d of disponibili) nameToCategoria[d.name] = d.categoria;

    let updated = 0;
    for (const [name, categoria] of Object.entries(nameToCategoria)) {
      const result = await db.collection('prodotti').updateMany(
        { name, $or: [{ categoria: { $exists: false } }, { categoria: null }] },
        { $set: { categoria } }
      );
      updated += result.modifiedCount;
    }
    res.json({ ok: true, updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/prodotti ────────────────────────────────────────────────────────
app.get('/api/prodotti', auth, async (req, res) => {
  try {
    const prodotti = await db.collection('prodotti').find().sort({ createdAt: 1 }).toArray();
    res.json(prodotti);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/prodotti ───────────────────────────────────────────────────────
app.post('/api/prodotti', auth, async (req, res) => {
  try {
    const { name, count, categoria, prodotti_legati } = req.body;
    const doc = { name, count, categoria: categoria ?? null, createdAt: new Date() };
    if (prodotti_legati && Array.isArray(prodotti_legati)) doc.prodotti_legati = prodotti_legati;
    const result = await db.collection('prodotti').insertOne(doc);
    res.json({ _id: result.insertedId, name, count, categoria: categoria ?? null, prodotti_legati: doc.prodotti_legati });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/prodotti/:id ──────────────────────────────────────────────────
app.patch('/api/prodotti/:id', auth, async (req, res) => {
  try {
    const { count, categoria } = req.body;
    const update = { count };
    if (categoria !== undefined) update.categoria = categoria;
    await db.collection('prodotti').updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/prodotti/:id ─────────────────────────────────────────────────
app.delete('/api/prodotti/:id', auth, async (req, res) => {
  try {
    await db.collection('prodotti').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/categorie ───────────────────────────────────────────────────────
app.get('/api/categorie', auth, async (req, res) => {
  try {
    const cats = await db.collection('categorie').find().sort({ order: 1 }).toArray();
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/segnalazioni ────────────────────────────────────────────────────
app.get('/api/segnalazioni', auth, async (req, res) => {
  try {
    const list = await db.collection('segnalazioni')
      .find({ stato: { $ne: 'chiusa' } })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/segnalazioni ───────────────────────────────────────────────────
app.post('/api/segnalazioni', auth, async (req, res) => {
  try {
    const { categoria, testo } = req.body;
    const doc = {
      categoria,
      testo,
      autoreId: String(req.user.id),
      autoreNome: req.user.nome,
      stato: 'aperta',
      createdAt: new Date(),
    };
    const result = await db.collection('segnalazioni').insertOne(doc);
    const newSeg = { _id: result.insertedId, ...doc };
    broadcast({ type: 'segnalazione_nuova', segnalazione: newSeg });
    res.json(newSeg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/segnalazioni/:id/risolvi ─────────────────────────────────────
app.patch('/api/segnalazioni/:id/risolvi', auth, async (req, res) => {
  const seg = await db.collection('segnalazioni').findOne({ _id: new ObjectId(req.params.id) });
  if (!seg) return res.status(404).json({ error: 'Non trovata' });
  const isAdmin   = req.user.ruolo === 'admin';
  const isCreator = seg.autoreId === String(req.user.id);
  if (!isAdmin && !isCreator)
    return res.status(403).json({ error: 'Solo il creatore o un admin può risolvere' });
  try {
    await db.collection('segnalazioni').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { stato: 'risolta', risoltaAt: new Date() } }
    );
    broadcast({ type: 'segnalazione_aggiornata', id: req.params.id, stato: 'risolta' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/segnalazioni/:id/chiudi ──────────────────────────────────────
app.patch('/api/segnalazioni/:id/chiudi', auth, async (req, res) => {
  try {
    const seg = await db.collection('segnalazioni').findOne({ _id: new ObjectId(req.params.id) });
    if (!seg) return res.status(404).json({ error: 'Non trovata' });
    const isAdmin   = req.user.ruolo === 'admin';
    const isCreator = seg.autoreId === String(req.user.id);
    if (!isAdmin && !isCreator)
      return res.status(403).json({ error: 'Solo il creatore o un admin può chiudere' });
    if (seg.stato !== 'risolta')
      return res.status(400).json({ error: 'Puoi chiudere solo segnalazioni risolte' });
    await db.collection('segnalazioni').deleteOne({ _id: new ObjectId(req.params.id) });
    broadcast({ type: 'segnalazione_rimossa', id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/utenti/me ───────────────────────────────────────────────────────
app.get('/api/utenti/me', auth, async (req, res) => {
  try {
    const account = await db.collection('accounts').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );
    if (!account) return res.status(404).json({ error: 'Utente non trovato' });
    res.json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/utenti/avatar ──────────────────────────────────────────────────
app.post('/api/utenti/avatar', auth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessun file ricevuto' });
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'avatars', public_id: `user_${req.user.id}`, overwrite: true, transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }] },
        (err, result) => err ? reject(err) : resolve(result)
      ).end(req.file.buffer);
    });
    await db.collection('accounts').updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: { avatarUrl: result.secure_url } }
    );
    res.json({ avatarUrl: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/dolci ───────────────────────────────────────────────────────────
app.get('/api/dolci', auth, async (req, res) => {
  try {
    const dolci = await db.collection('dolci').find().sort({ createdAt: 1 }).toArray();
    res.json(dolci);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/dolci ──────────────────────────────────────────────────────────
app.post('/api/dolci', auth, async (req, res) => {
  if (req.user.ruolo !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: 'nome obbligatorio' });
    const result = await db.collection('dolci').insertOne({ nome, createdAt: new Date() });
    res.json({ _id: result.insertedId, nome });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/dolci/:id ────────────────────────────────────────────────────
app.delete('/api/dolci/:id', auth, async (req, res) => {
  if (req.user.ruolo !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  try {
    await db.collection('dolci').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/fidelity/config ─────────────────────────────────────────────────
app.get('/api/fidelity/config', auth, async (req, res) => {
  try {
    const doc = await db.collection('settings').findOne({ _id: 'fidelity' });
    res.json({ numSlots: doc?.numSlots ?? 6, selectedIds: doc?.selectedIds ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/fidelity/config ───────────────────────────────────────────────
app.patch('/api/fidelity/config', auth, async (req, res) => {
  if (req.user.ruolo !== 'admin') return res.status(403).json({ error: 'Solo admin' });
  try {
    const { numSlots, selectedIds } = req.body;
    const update = {};
    if (numSlots !== undefined) {
      if (!Number.isInteger(numSlots) || numSlots < 1)
        return res.status(400).json({ error: 'numSlots deve essere un intero >= 1' });
      update.numSlots = numSlots;
    }
    if (selectedIds !== undefined) {
      if (!Array.isArray(selectedIds))
        return res.status(400).json({ error: 'selectedIds deve essere un array' });
      update.selectedIds = selectedIds;
    }
    await db.collection('settings').updateOne(
      { _id: 'fidelity' },
      { $set: update },
      { upsert: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
connect().then(() => server.listen(PORT, () => console.log(`Server in ascolto su porta ${PORT}`)));

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const jwt        = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const cloudinary = require('cloudinary').v2;
const multer     = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key:    process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const app = express();
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
    await db.collection('settings').updateOne(
      { _id: 'chiusura' },
      { $set: { avviata: false } },
      { upsert: true }
    );
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
    const { completato, sotto_task } = req.body;
    const update = {};
    if (completato !== undefined) update.completato = completato;
    if (sotto_task  !== undefined) update.sotto_task  = sotto_task;
    await db.collection(process.env.DB_COLLECTION || 'chores')
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });
    res.json({ ok: true });
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
    const { name, count } = req.body;
    const result = await db.collection('prodotti').insertOne({ name, count, createdAt: new Date() });
    res.json({ _id: result.insertedId, name, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/prodotti/:id ──────────────────────────────────────────────────
app.patch('/api/prodotti/:id', auth, async (req, res) => {
  try {
    const { count } = req.body;
    await db.collection('prodotti').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { count } });
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
    res.json({ _id: result.insertedId, ...doc });
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

const PORT = process.env.PORT || 3000;
connect().then(() => app.listen(PORT, () => console.log(`Server in ascolto su porta ${PORT}`)));

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const jwt        = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connect() {
  await client.connect();
  db = client.db(process.env.DB_NAME || 'contatore');
  console.log('Connesso a MongoDB');
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
    res.json({ token, nome: account.nome, ruolo: account.ruolo, permessi: account.permessi });
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

const PORT = process.env.PORT || 3000;
connect().then(() => app.listen(PORT, () => console.log(`Server in ascolto su porta ${PORT}`)));

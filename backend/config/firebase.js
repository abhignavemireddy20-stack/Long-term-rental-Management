import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

let db;

// File path for mock database persistence
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.join(__dirname, 'mock-firestore.json');

function readDb() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      return JSON.parse(fs.readFileSync(DB_FILE_PATH, 'utf8'));
    }
  } catch (err) {
    console.error("Failed to read mock DB file:", err);
  }
  return {};
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to write mock DB file:", err);
  }
}

// In-Memory/File-Persisted Mock implementation of Firestore API
class MockDocRef {
  constructor(collection, id) {
    this.collection = collection;
    this.id = id;
  }
  async get() {
    const dbData = readDb();
    const data = dbData[this.collection.name]?.[this.id];
    return {
      exists: !!data,
      id: this.id,
      data: () => data ? JSON.parse(JSON.stringify(data)) : undefined
    };
  }
  async set(data) {
    const dbData = readDb();
    if (!dbData[this.collection.name]) dbData[this.collection.name] = {};
    dbData[this.collection.name][this.id] = JSON.parse(JSON.stringify(data));
    writeDb(dbData);
  }
  async update(data) {
    const dbData = readDb();
    if (!dbData[this.collection.name]) dbData[this.collection.name] = {};
    const existing = dbData[this.collection.name][this.id] || {};
    dbData[this.collection.name][this.id] = { ...existing, ...JSON.parse(JSON.stringify(data)) };
    writeDb(dbData);
  }
  async delete() {
    const dbData = readDb();
    if (dbData[this.collection.name]) {
      delete dbData[this.collection.name][this.id];
      writeDb(dbData);
    }
  }
}

class MockQuery {
  constructor(collection, docs) {
    this.collection = collection;
    this.docs = docs;
  }
  where(field, op, val) {
    const filtered = this.docs.filter(doc => {
      const data = doc.data();
      if (op === '==') return data[field] === val;
      return true;
    });
    return new MockQuery(this.collection, filtered);
  }
  limit(num) {
    return new MockQuery(this.collection, this.docs.slice(0, num));
  }
  orderBy(field, direction = 'asc') {
    const sorted = [...this.docs].sort((a, b) => {
      const valA = a.data()[field];
      const valB = b.data()[field];
      if (valA < valB) return direction === 'desc' ? 1 : -1;
      if (valA > valB) return direction === 'desc' ? -1 : 1;
      return 0;
    });
    return new MockQuery(this.collection, sorted);
  }
  async get() {
    return {
      empty: this.docs.length === 0,
      docs: this.docs,
      forEach: (cb) => this.docs.forEach(cb)
    };
  }
}

class MockCollection {
  constructor(name) {
    this.name = name;
  }
  doc(id) {
    const docId = id || `mock-id-${Math.random().toString(36).substring(2, 11)}`;
    return new MockDocRef(this, docId);
  }
  async add(data) {
    const id = `mock-id-${Math.random().toString(36).substring(2, 11)}`;
    const docRef = new MockDocRef(this, id);
    await docRef.set(data);
    return { id, ref: docRef };
  }
  where(field, op, val) {
    return this.toQuery().where(field, op, val);
  }
  limit(num) {
    return this.toQuery().limit(num);
  }
  orderBy(field, direction) {
    return this.toQuery().orderBy(field, direction);
  }
  async get() {
    return this.toQuery().get();
  }
  toQuery() {
    const dbData = readDb();
    const collectionStore = dbData[this.name] || {};
    const docs = Object.keys(collectionStore).map(id => {
      const data = collectionStore[id];
      return {
        id,
        ref: new MockDocRef(this, id),
        data: () => JSON.parse(JSON.stringify(data))
      };
    });
    return new MockQuery(this, docs);
  }
}

class MockFirestore {
  collection(name) {
    return new MockCollection(name);
  }
  batch() {
    const operations = [];
    return {
      delete: (docRef) => {
        operations.push(() => docRef.delete());
      },
      commit: async () => {
        for (const op of operations) {
          await op();
        }
      }
    };
  }
}

// Check configuration to determine whether to use real Firebase Admin SDK
const hasAccountKey = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const hasEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

if (hasAccountKey || hasEmulator) {
  try {
    if (hasAccountKey) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized with credentials from environment variable");
    } else {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'sd-digitals-crm'
      });
      console.log(`Firebase Admin initialized with emulator ProjectId: ${process.env.FIREBASE_PROJECT_ID || 'sd-digitals-crm'}`);
    }
    db = getFirestore();
  } catch (error) {
    console.error("Firebase Admin initialization failed. Falling back to local JSON database.", error);
    db = new MockFirestore();
  }
} else {
  console.log("⚠️ Firebase config not detected. Defaulting to file-persisted JSON Mock Database.");
  db = new MockFirestore();
}

export { db, admin };
export default db;

const DB_NAME = 'kkt-store';
const DB_STORE = 'clients';
const NOTIFIED_STORE = 'notified';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(NOTIFIED_STORE)) db.createObjectStore(NOTIFIED_STORE, { keyPath: 'key' });
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = reject;
  });
}

async function getClients() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = reject;
  });
}

async function isAlreadyNotified(key) {
  const db = await openDB();
  return new Promise((resolve) => {
    const req = db.transaction(NOTIFIED_STORE, 'readonly').objectStore(NOTIFIED_STORE).get(key);
    req.onsuccess = () => resolve(!!req.result);
    req.onerror = () => resolve(false);
  });
}

async function markNotified(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(NOTIFIED_STORE, 'readwrite').objectStore(NOTIFIED_STORE).put({ key });
    req.onsuccess = resolve;
    req.onerror = reject;
  });
}

async function checkAndNotify() {
  const clients = await getClients();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayKey = today.toISOString().split('T')[0];

  for (const client of clients) {
    const exp = new Date(client.expirationDate);
    exp.setHours(0, 0, 0, 0);
    const isToday = exp.getTime() === today.getTime();
    const isTomorrow = exp.getTime() === tomorrow.getTime();

    if (!isToday && !isTomorrow) continue;

    const op = (client.operator || '').toUpperCase();
    const notifKey = `${client.id}_${todayKey}`;
    if (await isAlreadyNotified(notifKey)) continue;

    const title = isToday ? '⚠️ Illimité expire AUJOURD\'HUI' : '⏰ Illimité expire DEMAIN';
    await self.registration.showNotification(`KKT Store — ${title}`, {
      body: `${client.name} — ${op} · ${client.phone}`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: notifKey,
      vibrate: [200, 100, 200],
      requireInteraction: isToday,
    });
    await markNotified(notifKey);
  }
}

async function syncClients(clients) {
  const db = await openDB();
  const tx = db.transaction(DB_STORE, 'readwrite');
  const store = tx.objectStore(DB_STORE);
  store.clear();
  clients.forEach(c => store.put(c));
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
}

// Periodic Background Sync (Chrome Android)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'kkt-check-expiring') {
    event.waitUntil(checkAndNotify());
  }
});

// Messages depuis l'app principale
self.addEventListener('message', event => {
  if (event.data?.type === 'SYNC_CLIENTS') {
    syncClients(event.data.clients).catch(console.error);
  }
  if (event.data?.type === 'CHECK_NOW') {
    checkAndNotify().catch(console.error);
  }
});

// Alarm via setTimeout quand le SW reste actif
function scheduleMorningCheck() {
  const now = new Date();
  const next8h = new Date(now);
  next8h.setHours(8, 0, 0, 0);
  if (next8h <= now) next8h.setDate(next8h.getDate() + 1);
  const delay = next8h - now;
  setTimeout(() => {
    checkAndNotify().catch(console.error);
    scheduleMorningCheck();
  }, delay);
}

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
  scheduleMorningCheck();
});

self.addEventListener('install', () => self.skipWaiting());

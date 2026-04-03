const DB_NAME = "audit-offline-cache";
const DB_VERSION = 1;

const STORE_BUDGETS = "budgets";
const STORE_CONTRACTORS = "contractors";
const STORE_META = "meta";
const STORE_QUEUE = "queue";
const STORE_WORK_ORDERS = "workOrders";

function createStoreIfMissing(db, storeName, options) {
  if (!db.objectStoreNames.contains(storeName)) {
    db.createObjectStore(storeName, options);
  }
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionToPromise(tx, result) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

function isIndexedDbAvailable() {
  return typeof indexedDB !== "undefined";
}

async function openDb() {
  if (!isIndexedDbAvailable()) {
    throw new Error("IndexedDB is unavailable in this browser");
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      createStoreIfMissing(db, STORE_BUDGETS, { keyPath: "_id" });
      createStoreIfMissing(db, STORE_CONTRACTORS, { keyPath: "_id" });
      createStoreIfMissing(db, STORE_META, { keyPath: "key" });
      createStoreIfMissing(db, STORE_QUEUE, { keyPath: "id" });
      createStoreIfMissing(db, STORE_WORK_ORDERS, { keyPath: "localKey" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(storeName, mode, callback) {
  const db = await openDb();
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);
  const result = await callback(store, tx);
  return transactionToPromise(tx, result);
}

function toArray(result) {
  return Array.isArray(result) ? result : [];
}

function cloneRecord(record) {
  return record ? JSON.parse(JSON.stringify(record)) : record;
}

export function createLocalKey(prefix = "local") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}:${crypto.randomUUID()}`;
  }
  return `${prefix}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
}

export function normalizeCachedWorkOrder(record, overrides = {}) {
  const merged = {
    ...cloneRecord(record),
    ...cloneRecord(overrides)
  };

  const serverId = merged.serverId || (merged._id && !String(merged._id).startsWith("work-order:") ? merged._id : "");
  const localKey = merged.localKey || serverId || createLocalKey("work-order");

  return {
    ...merged,
    localKey,
    serverId,
    _id: serverId || localKey,
    syncStatus: merged.syncStatus || (serverId ? "synced" : "pending"),
    updatedAtLocal: merged.updatedAtLocal || new Date().toISOString()
  };
}

async function replaceCollection(storeName, items) {
  return withStore(storeName, "readwrite", async (store) => {
    store.clear();
    for (const item of items) {
      await requestToPromise(store.put(cloneRecord(item)));
    }
    return items;
  });
}

export async function getCachedContractors() {
  return withStore(STORE_CONTRACTORS, "readonly", async (store) =>
    toArray(await requestToPromise(store.getAll()))
  );
}

export async function saveCachedContractors(items) {
  return replaceCollection(STORE_CONTRACTORS, items);
}

export async function getCachedBudgets() {
  return withStore(STORE_BUDGETS, "readonly", async (store) =>
    toArray(await requestToPromise(store.getAll()))
  );
}

export async function saveCachedBudgets(items) {
  return replaceCollection(STORE_BUDGETS, items);
}

export async function getCachedWorkOrders() {
  return withStore(STORE_WORK_ORDERS, "readonly", async (store) =>
    toArray(await requestToPromise(store.getAll()))
  );
}

export async function saveCachedWorkOrders(items) {
  return replaceCollection(
    STORE_WORK_ORDERS,
    items.map((item) => normalizeCachedWorkOrder(item))
  );
}

export async function upsertCachedWorkOrder(record) {
  const normalized = normalizeCachedWorkOrder(record);
  return withStore(STORE_WORK_ORDERS, "readwrite", async (store) => {
    await requestToPromise(store.put(cloneRecord(normalized)));
    return normalized;
  });
}

export async function replaceCachedWorkOrder(localKey, record) {
  const normalized = normalizeCachedWorkOrder(record, { localKey });
  return withStore(STORE_WORK_ORDERS, "readwrite", async (store) => {
    await requestToPromise(store.delete(localKey));
    await requestToPromise(store.put(cloneRecord(normalized)));
    return normalized;
  });
}

export async function deleteCachedWorkOrder(localKey) {
  return withStore(STORE_WORK_ORDERS, "readwrite", async (store) => {
    await requestToPromise(store.delete(localKey));
    return true;
  });
}

export async function savePendingSync(localKey, payload, options = {}) {
  return withStore(STORE_QUEUE, "readwrite", async (store) => {
    const entry = {
      id: localKey,
      localKey,
      action: options.action || "upsert",
      serverId: options.serverId || payload?.serverId || "",
      payload: cloneRecord(payload),
      queuedAt: new Date().toISOString()
    };
    await requestToPromise(store.put(entry));
    return entry;
  });
}

export async function getPendingSyncs() {
  return withStore(STORE_QUEUE, "readonly", async (store) =>
    toArray(await requestToPromise(store.getAll()))
  );
}

export async function removePendingSync(localKey) {
  return withStore(STORE_QUEUE, "readwrite", async (store) => {
    await requestToPromise(store.delete(localKey));
    return true;
  });
}

export async function getMeta(key) {
  return withStore(STORE_META, "readonly", async (store) => {
    const item = await requestToPromise(store.get(key));
    return item?.value;
  });
}

export async function setMeta(key, value) {
  return withStore(STORE_META, "readwrite", async (store) => {
    await requestToPromise(store.put({ key, value: cloneRecord(value) }));
    return value;
  });
}

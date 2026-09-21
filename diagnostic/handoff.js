/* ============================================================
   GRE Quant Pro — landing-page → analyser handoff
   Phase 3b.

   The dropzone lives on the landing page, but the analyser (pdf.js +
   Tesseract + the engine) must NOT load there — that would put megabytes
   on the page that has to convert cold traffic fastest.

   So the landing page takes the file and parks it in IndexedDB, then
   navigates. diagnostic.html picks it up and starts parsing at once, so
   the student drops once and lands straight on their results.

   IndexedDB is used because File objects survive structured clone;
   sessionStorage cannot hold them. Everything stays on the device —
   this is a same-origin handoff between two pages, not an upload.

   Tiny and dependency-free on purpose: the landing page pays ~1KB.
   ============================================================ */

const DB_NAME = 'gqp-diagnostic';
const STORE = 'handoff';
const KEY = 'pending';

function openDb() {
  return new Promise((resolve, reject) => {
    let req;
    try { req = indexedDB.open(DB_NAME, 1); }
    catch (e) { return reject(e); }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('indexeddb blocked'));
  });
}

/** Park files for the analyser page. Resolves false if storage is
 *  unavailable (private mode, blocked site data) so the caller can still
 *  navigate rather than dead-end. */
export async function stash(files) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ files: [...files], at: Date.now() }, KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

/** Collect and clear anything parked. Returns [] when there is nothing,
 *  or when the handoff is stale (older than 5 minutes — a file left from
 *  a previous visit should not silently re-run). */
export async function take() {
  try {
    const db = await openDb();
    const rec = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const get = store.get(KEY);
      get.onsuccess = () => { store.delete(KEY); resolve(get.result); };
      get.onerror = () => reject(get.error);
    });
    db.close();
    if (!rec || !rec.files?.length) return [];
    if (Date.now() - (rec.at || 0) > 5 * 60 * 1000) return [];
    return rec.files;
  } catch {
    return [];
  }
}

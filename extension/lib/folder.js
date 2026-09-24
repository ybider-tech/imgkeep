// The folder chosen in Options, kept in local IndexedDB, plus a writer that never overwrites.

const DB_NAME = "imgkeep";
const STORE = "handles";
const KEY = "folder";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(mode, fn) {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req?.result);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export const getFolder = () => withStore("readonly", (s) => s.get(KEY)).then((h) => h || null);
export const setFolder = (handle) => withStore("readwrite", (s) => s.put(handle, KEY));
export const clearFolder = () => withStore("readwrite", (s) => s.delete(KEY));

// "granted" | "prompt" | "denied" | "none"
export async function folderPermission(handle) {
  if (!handle) return "none";
  try {
    return await handle.queryPermission({ mode: "readwrite" });
  } catch {
    return "prompt";
  }
}

async function exists(dir, name) {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch (e) {
    // A folder with the same name also counts as taken.
    return e.name !== "NotFoundError";
  }
}

// Writes blob to root/dirs/name.ext, adding " (2)", " (3)"… if the name is taken.
// Returns the relative path that was written.
export async function writeUnique(root, dirs, name, ext, blob) {
  let dir = root;
  for (const d of dirs) dir = await dir.getDirectoryHandle(d, { create: true });
  for (let n = 1; n < 10000; n++) {
    const fileName = `${name}${n > 1 ? ` (${n})` : ""}.${ext}`;
    if (await exists(dir, fileName)) continue;
    const file = await dir.getFileHandle(fileName, { create: true });
    const out = await file.createWritable();
    await out.write(blob);
    await out.close();
    return [...dirs, fileName].join("/");
  }
  throw new Error("Too many files with this name");
}

// data: URL -> Blob without a network call.
export function dataUrlToBlob(dataUrl) {
  const comma = dataUrl.indexOf(",");
  const meta = dataUrl.slice(5, comma);
  const mime = meta.split(";")[0] || "application/octet-stream";
  const body = dataUrl.slice(comma + 1);
  if (!meta.includes(";base64")) return new Blob([decodeURIComponent(body)], { type: mime });
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

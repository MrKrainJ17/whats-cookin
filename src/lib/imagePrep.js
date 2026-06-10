// Resize a user photo down to a sane size before shipping to the model.
// 1024px on the longest side keeps small labels and partially-hidden
// items legible (needed for the upgraded two-pass vision pipeline)
// while still meaningfully cutting image-token cost vs. a raw 12MP
// iPhone capture. Output is webp at quality 0.78 when supported,
// jpeg otherwise — also keeps the upload payload small for slower
// connections.
//
// Compression runs in a Web Worker (via OffscreenCanvas) when available so
// the loading UI thread isn't blocked. Falls back to main-thread canvas
// on browsers without OffscreenCanvas / module workers (older Safari).

const DEFAULT_MAX_DIM = 1024;
const DEFAULT_QUALITY = 0.78;

const workerSupported =
  typeof Worker !== "undefined" &&
  typeof OffscreenCanvas !== "undefined" &&
  typeof createImageBitmap !== "undefined";

let workerSingleton = null;
let nextRequestId = 0;
const pending = new Map();

function getWorker() {
  if (workerSingleton) return workerSingleton;
  workerSingleton = new Worker(
    new URL("./imagePrep.worker.js", import.meta.url),
    { type: "module" },
  );
  workerSingleton.onmessage = (e) => {
    const { id, ...rest } = e.data;
    const cb = pending.get(id);
    if (cb) {
      pending.delete(id);
      cb(rest);
    }
  };
  workerSingleton.onerror = (err) => {
    // Reject all pending and tear down so we'll fall back to main-thread next time.
    for (const cb of pending.values()) cb({ error: err.message ?? "worker error" });
    pending.clear();
    try {
      workerSingleton.terminate();
    } catch {
      /* ignore */
    }
    workerSingleton = null;
  };
  return workerSingleton;
}

export async function prepareImageForUpload(
  file,
  { maxDim = DEFAULT_MAX_DIM, quality = DEFAULT_QUALITY } = {},
) {
  if (workerSupported) {
    try {
      return await prepareInWorker(file, maxDim, quality);
    } catch (err) {
      console.warn(
        "[imagePrep] worker path failed, falling back to main thread:",
        err,
      );
      // fall through
    }
  }
  return prepareOnMainThread(file, maxDim, quality);
}

function prepareInWorker(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const id = ++nextRequestId;
    pending.set(id, (result) => {
      if (result.error) reject(new Error(result.error));
      else
        resolve({ base64: result.base64, mediaType: result.mediaType });
    });
    try {
      getWorker().postMessage({ id, file, maxDim, quality });
    } catch (err) {
      pending.delete(id);
      reject(err);
    }
  });
}

async function prepareOnMainThread(file, maxDim, quality) {
  const bitmap = await loadBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > maxDim ? maxDim / longest : 1;
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);
  if (typeof bitmap.close === "function") bitmap.close();

  const blob = await canvasToBlob(canvas, quality);
  const base64 = await blobToBase64(blob);
  return { base64, mediaType: blob.type };
}

async function loadBitmap(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall through */
    }
  }
  return loadViaImageElement(file);
}

function loadViaImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob && blob.type === "image/webp") {
          resolve(blob);
          return;
        }
        canvas.toBlob(
          (jpeg) =>
            jpeg ? resolve(jpeg) : reject(new Error("toBlob failed")),
          "image/jpeg",
          quality,
        );
      },
      "image/webp",
      quality,
    );
  });
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = reader.result;
      const comma = result.indexOf(",");
      resolve(comma === -1 ? result : result.slice(comma + 1));
    };
    reader.readAsDataURL(blob);
  });
}

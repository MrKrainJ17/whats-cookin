// OffscreenCanvas-based image resize/encode that runs off the main thread
// so the loading UI animates smoothly while a 12MP iPhone capture is being
// crunched. Bridged from the main thread via postMessage with `id` correlation.

self.onmessage = async (e) => {
  const { id, file, maxDim, quality } = e.data;
  try {
    const result = await prepare(file, maxDim, quality);
    self.postMessage({ id, ...result });
  } catch (err) {
    self.postMessage({ id, error: err?.message ?? String(err) });
  }
};

async function prepare(file, maxDim, quality) {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > maxDim ? maxDim / longest : 1;
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, w, h);
  if (typeof bitmap.close === "function") bitmap.close();

  let blob;
  try {
    const webp = await canvas.convertToBlob({ type: "image/webp", quality });
    if (webp && webp.type === "image/webp") blob = webp;
  } catch {
    /* webp not supported — fall through to jpeg */
  }
  if (!blob) {
    blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
  }

  const base64 = await blobToBase64(blob);
  return { base64, mediaType: blob.type };
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

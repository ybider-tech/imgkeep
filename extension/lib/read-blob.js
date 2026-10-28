// Runs in the page, injected with chrome.scripting only when the user right-clicked a blob: image and the
// page was allowed: reads that one image and returns it as a data: URL. blob: links point into the page's own
// memory, so this never touches the network; tests/static-check.mjs allows its one network-free fetch, for blob: links only.
// Self-contained (no imports, no outer variables): only this function's source is sent to the page.
export async function readBlobInPage(url) {
  if (typeof url !== "string" || !url.startsWith("blob:")) return { error: "blob" };
  try {
    const blob = await (await fetch(url)).blob();
    if (!blob.size) return { error: "decode" };
    if (blob.size > 60 * 1000 * 1000) return { error: "too-large" };
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ dataUrl: reader.result });
      reader.onerror = () => resolve({ error: "decode" });
      reader.readAsDataURL(blob);
    });
  } catch {
    return { error: "blob" };
  }
}

// Writes a one-page PDF that holds a single image, filling the page. No library needed:
// a PDF like this is a handful of objects, a cross-reference table and the image data.
//
// Opaque images go in as JPEG (DCTDecode). Images with transparency go in losslessly
// (FlateDecode RGB) with a soft mask for the alpha channel, so see-through areas stay see-through.

// PDF pages can be at most 14,400 units on a side (200 inches). One pixel is one unit (72 dpi);
// bigger images keep every pixel but their page is scaled down to fit.
export const MAX_PAGE = 14400;

export function pageSize(width, height) {
  const scale = Math.min(1, MAX_PAGE / Math.max(width, height));
  const round = (n) => Math.round(n * 100) / 100;
  return { width: round(width * scale), height: round(height * scale) };
}

const encoder = new TextEncoder();
const bytes = (text) => encoder.encode(text);

// zlib-compressed data, which is what PDF's FlateDecode expects.
export async function deflate(data) {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Splits canvas RGBA pixels into RGB and alpha planes. Returns alpha only if something is transparent.
export function splitAlpha(rgba) {
  const n = rgba.length / 4;
  const rgb = new Uint8Array(n * 3);
  const alpha = new Uint8Array(n);
  let transparent = false;
  for (let i = 0; i < n; i++) {
    rgb[i * 3] = rgba[i * 4];
    rgb[i * 3 + 1] = rgba[i * 4 + 1];
    rgb[i * 3 + 2] = rgba[i * 4 + 2];
    alpha[i] = rgba[i * 4 + 3];
    if (alpha[i] !== 255) transparent = true;
  }
  return { rgb, alpha: transparent ? alpha : null };
}

// Builds the PDF. image is either { jpeg } (JPEG file bytes) or { rgb, alpha? } (zlib-compressed planes).
export function buildPdf({ width, height, image, title = "" }) {
  const page = pageSize(width, height);
  const objects = []; // [number, header text, optional stream bytes]
  const imageDict = (extra) =>
    `<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /BitsPerComponent 8 ${extra}`;

  objects.push([1, "<< /Type /Catalog /Pages 2 0 R >>"]);
  objects.push([2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"]);
  objects.push([3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`]);
  if (image.jpeg) {
    objects.push([4, `${imageDict(`/ColorSpace /DeviceRGB /Filter /DCTDecode /Length ${image.jpeg.length}`)} >>`, image.jpeg]);
  } else {
    const mask = image.alpha ? " /SMask 6 0 R" : "";
    objects.push([4, `${imageDict(`/ColorSpace /DeviceRGB /Filter /FlateDecode /Length ${image.rgb.length}${mask}`)} >>`, image.rgb]);
  }
  const draw = bytes(`q ${page.width} 0 0 ${page.height} 0 0 cm /Im0 Do Q\n`);
  objects.push([5, `<< /Length ${draw.length} >>`, draw]);
  if (!image.jpeg && image.alpha) {
    objects.push([6, `${imageDict(`/ColorSpace /DeviceGray /Filter /FlateDecode /Length ${image.alpha.length}`)} >>`, image.alpha]);
  }
  const info = objects.length + 1;
  const safeTitle = title.replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7e]/g, "");
  objects.push([info, `<< /Producer (Imgkeep) /Title (${safeTitle}) >>`]);

  // Header, with a comment of high bytes so tools treat the file as binary.
  const parts = [bytes("%PDF-1.4\n%"), new Uint8Array([0xe2, 0xe3, 0xcf, 0xd3]), bytes("\n")];
  let offset = parts.reduce((n, p) => n + p.length, 0);
  const offsets = [];
  for (const [num, head, stream] of objects) {
    offsets[num] = offset;
    const chunk = stream
      ? [bytes(`${num} 0 obj\n${head}\nstream\n`), stream, bytes("\nendstream\nendobj\n")]
      : [bytes(`${num} 0 obj\n${head}\nendobj\n`)];
    for (const c of chunk) {
      parts.push(c);
      offset += c.length;
    }
  }
  // Cross-reference table: every entry is exactly 20 bytes.
  const size = objects.length + 1;
  let xref = `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (let n = 1; n < size; n++) xref += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  xref += `trailer\n<< /Size ${size} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${offset}\n%%EOF\n`;
  parts.push(bytes(xref));
  return new Blob(parts, { type: "application/pdf" });
}

// A store-only ZIP writer, so the 10-image frame's Download All (gemini.9b47fc30.js) saves one archive with no library.
// Layout per PKWARE APPNOTE 6.3.10: a local header (4.3.7) before each file, the central directory (4.3.12) after them,
// then the end-of-central-directory record (4.3.16). No compression (method 0): the entries are PNGs, already compressed.

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(bytes) {
  let c = ~0;
  for (let i = 0; i < bytes.length; i++) c = CRC[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

// MS-DOS time and date (APPNOTE 4.4.6), local time, two-second resolution
const dosStamp = (d) => ({
  time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
  date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
});

// files: [{ name, bytes: Uint8Array }] -> a Blob of type application/zip
export function zipStore(files) {
  const enc = new TextEncoder();
  const { time, date } = dosStamp(new Date());
  const body = [], dir = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.bytes), size = f.bytes.length;
    const loc = new DataView(new ArrayBuffer(30));
    loc.setUint32(0, 0x04034b50, true);
    loc.setUint16(4, 20, true); // version needed to extract: 2.0
    loc.setUint16(6, 0x0800, true); // general purpose flag bit 11: the name is UTF-8
    loc.setUint16(10, time, true); loc.setUint16(12, date, true);
    loc.setUint32(14, crc, true); loc.setUint32(18, size, true); loc.setUint32(22, size, true);
    loc.setUint16(26, name.length, true);
    body.push(loc, name, f.bytes);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true);
    cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
    cen.setUint16(12, time, true); cen.setUint16(14, date, true);
    cen.setUint32(16, crc, true); cen.setUint32(20, size, true); cen.setUint32(24, size, true);
    cen.setUint16(28, name.length, true);
    cen.setUint32(42, offset, true); // where this file's local header starts
    dir.push(cen, name);
    offset += 30 + name.length + size;
  }
  const dirSize = dir.reduce((s, p) => s + p.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, dirSize, true); end.setUint32(16, offset, true);
  return new Blob([...body, ...dir, end], { type: 'application/zip' });
}

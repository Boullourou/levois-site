import { open } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const MAX_INPUT_BYTES = 25_000_000;
const MAX_INPUT_PIXELS = 16_000_000;
const MAX_OUTPUT_BYTES = 500_000;
const QUALITIES = [88, 80, 72, 64, 56, 48];
const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');

/** PNG decoders can expose only the first APNG frame, so inspect its chunks. */
function animatedPng(buffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(signature)) return false;
  for (let offset = 8; offset + 12 <= buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    if (length > buffer.length - offset - 12) throw new Error('Couverture PNG tronquée.');
    const kind = buffer.toString('ascii', offset + 4, offset + 8);
    if (kind === 'acTL') return true;
    if (kind === 'IEND') return false;
    offset += length + 12;
  }
  return false;
}

/** Reject AVIF sequence brands even when a decoder exposes just one frame. */
function avifSequence(buffer) {
  if (buffer.length < 16 || buffer.toString('ascii', 4, 8) !== 'ftyp') return false;
  const length = buffer.readUInt32BE(0);
  if (length < 16 || length > buffer.length) throw new Error('Couverture AVIF invalide.');
  if (buffer.toString('ascii', 8, 12) === 'avis') return true;
  for (let offset = 16; offset + 4 <= length; offset += 4) {
    if (buffer.toString('ascii', offset, offset + 4) === 'avis') return true;
  }
  return false;
}

/** Compress an already composed cover. No crop, resize, write or source change.
 * @param {string} inputPath
 * @param {{width:number,height:number}} dimensions Exact dimensions after EXIF orientation.
 * @returns {Promise<{buffer:Buffer,report:{inputSha256:string,sha256:string,width:number,height:number,bytes:number,quality:number}}>}
 */
export async function prepareCover(inputPath, dimensions) {
  if (typeof inputPath !== 'string' || !inputPath.trim()) throw new Error('Chemin de couverture requis.');
  const { width, height } = dimensions || {};
  if (![width, height].every(value => Number.isSafeInteger(value) && value >= 1 && value <= 4000)) {
    throw new Error('Dimensions attendues : entiers de 1 à 4000 pixels.');
  }
  const handle = await open(inputPath, 'r');
  let input;
  try {
    const stat = await handle.stat();
    if (!stat.isFile()) throw new Error('La couverture doit être un fichier image fini.');
    if (stat.size < 1 || stat.size > MAX_INPUT_BYTES) throw new Error('Couverture source : maximum 25 000 000 octets, fichier non vide.');
    input = await handle.readFile();
    if (!input.length || input.length > MAX_INPUT_BYTES) throw new Error('Couverture source : maximum 25 000 000 octets, fichier non vide.');
  } finally {
    await handle.close();
  }

  if (animatedPng(input) || avifSequence(input)) throw new Error('Les couvertures animées ne sont pas acceptées.');
  const options = { limitInputPixels: MAX_INPUT_PIXELS, failOn: /** @type {const} */ ('error'), animated: false };
  let metadata;
  try { metadata = await sharp(input, options).metadata(); }
  catch { throw new Error('Couverture illisible ou dépassant 16 000 000 pixels.'); }
  const accepted = ['png', 'jpeg', 'webp'].includes(metadata.format)
    || (metadata.format === 'heif' && metadata.compression === 'av1');
  if (!accepted) throw new Error('Formats de couverture acceptés : PNG, JPEG, WebP ou AVIF.');
  if ((metadata.pages ?? 1) !== 1 || metadata.delay?.length || metadata.loop !== undefined) {
    throw new Error('Les couvertures animées ou multipages ne sont pas acceptées.');
  }
  if (metadata.width * metadata.height > MAX_INPUT_PIXELS) throw new Error('Couverture source : maximum 16 000 000 pixels.');
  const oriented = metadata.autoOrient;
  if (oriented.width !== width || oriented.height !== height) {
    throw new Error(`Couverture déjà composée attendue en ${width} × ${height} pixels après orientation EXIF ; reçue ${oriented.width} × ${oriented.height}. Aucun recadrage ou redimensionnement automatique.`);
  }

  const inputSha256 = sha256(input);
  for (const quality of QUALITIES) {
    // Sharp strips EXIF/ICC/XMP by default and converts colours to sRGB.
    // Every attempt starts with the source, never with a prior lossy encoding.
    const { data: buffer, info } = await sharp(input, options).autoOrient()
      .webp({ quality, effort: 6 }).toBuffer({ resolveWithObject: true });
    if (info.width !== width || info.height !== height) throw new Error('Dimensions de sortie incohérentes.');
    if (buffer.length <= MAX_OUTPUT_BYTES) {
      return { buffer, report: { inputSha256, sha256: sha256(buffer), width, height, bytes: buffer.length, quality } };
    }
  }
  throw new Error('La couverture dépasse 500 000 octets même à qualité 48. Fournir une composition moins lourde ; aucune réduction des dimensions n’a été appliquée.');
}

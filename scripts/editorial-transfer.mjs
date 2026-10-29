// Transport only. Node built-ins, no npm, credentials, network or content rewriting.
import { createHash, randomBytes, publicEncrypt, privateDecrypt, createCipheriv, createDecipheriv, constants } from 'node:crypto';
import { readFile, writeFile, mkdir, lstat, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';

export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export const canonical = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a],[b]) => a < b ? -1 : a > b ? 1 : 0)) : item);
export const MAX_BYTES = 140_000_000;
const CHUNK = 192_000;
const fail = code => { throw new Error(code); };
export function safePath(value) {
  if (typeof value !== 'string' || value.length > 200 || !/^[A-Za-z0-9_./-]+$/.test(value) || value.split('/').some(p => !p || p === '.' || p === '..' || p.startsWith('.'))) fail('PATH_INVALID');
  return value;
}
export async function boundedFile(root, name, limit = MAX_BYTES) {
  safePath(name);
  const base = await realpath(root), file = resolve(base, name);
  if ((await lstat(file)).isSymbolicLink()) fail('SYMLINK_FORBIDDEN');
  const actual = await realpath(file), rel = relative(base, actual);
  if (rel.startsWith('..') || isAbsolute(rel)) fail('PATH_OUTSIDE_ROOT');
  const info = await lstat(actual);
  if (!info.isFile() || info.size > limit) fail('FILE_SIZE_INVALID');
  return readFile(actual);
}
export function validateTransfer(payload) {
  const m = payload?.manifest;
  if (!m || m.schemaVersion !== 1 || !/^[a-z0-9-]{1,70}$/.test(m.batchId) || !['source','prepared-v3'].includes(m.mode) || m.lot !== 'LOT.json' || !Array.isArray(m.files) || !Array.isArray(payload.files) || m.files.length < 15 || m.files.length > 30 || m.files.length !== payload.files.length) fail('MANIFEST_INVALID');
  const seen = new Set(); let total = 0;
  for (let i = 0; i < m.files.length; i++) {
    const entry = m.files[i], file = payload.files[i];
    safePath(entry.path);
    if (seen.has(entry.path) || file.path !== entry.path || !Number.isSafeInteger(entry.bytes) || entry.bytes < 1 || entry.bytes > 25_000_000 || !/^[a-f0-9]{64}$/.test(entry.sha256) || typeof file.base64 !== 'string') fail('FILE_MANIFEST_INVALID');
    if (entry.path !== 'LOT.json' && !/^J\d{3}_\d{4}-\d{2}-\d{2}\/(PRODUCTION\.json|cover\.webp|EXPORTS\/article\/cover_J\d{3}\.png)$/.test(entry.path)) fail('FILE_TYPE_FORBIDDEN');
    const bytes = Buffer.from(file.base64, 'base64');
    if (bytes.toString('base64') !== file.base64 || bytes.length !== entry.bytes || digest(bytes) !== entry.sha256) fail('FILE_HASH_MISMATCH');
    total += bytes.length; if (total > 100_000_000) fail('TRANSFER_TOO_LARGE');
    seen.add(entry.path);
  }
  if (!seen.has('LOT.json')) fail('LOT_MISSING');
  return payload;
}
export function seal(bytes, publicKey) {
  if (bytes.length > MAX_BYTES) fail('TRANSFER_TOO_LARGE');
  const transferId = digest(bytes), key = randomBytes(32), iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(transferId));
  const encrypted = Buffer.concat([cipher.update(bytes), cipher.final()]);
  const chunks = [];
  for (let start = 0; start < encrypted.length; start += CHUNK) chunks.push(encrypted.subarray(start, start + CHUNK).toString('base64'));
  const header = { schemaVersion: 1, algorithm: 'RSA-OAEP-SHA256+AES-256-GCM', transferId,
    key: publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, key).toString('base64'),
    iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'),
    chunks: chunks.map((value, i) => ({ path: `chunk-${String(i).padStart(4,'0')}.txt`, bytes: Buffer.byteLength(value), sha256: digest(value) })) };
  key.fill(0);
  return { header, chunks };
}
export function unseal(header, chunks, privateKey) {
  if (header?.schemaVersion !== 1 || header.algorithm !== 'RSA-OAEP-SHA256+AES-256-GCM' || !/^[a-f0-9]{64}$/.test(header.transferId) || !Array.isArray(header.chunks) || header.chunks.length < 1 || header.chunks.length > 730 || chunks.length !== header.chunks.length) fail('ENVELOPE_INVALID');
  let length = 0;
  const buffers = chunks.map((value, i) => {
    const item = header.chunks[i];
    if (item.path !== `chunk-${String(i).padStart(4,'0')}.txt` || typeof value !== 'string' || value.length > CHUNK * 4 / 3 || Buffer.byteLength(value) !== item.bytes || digest(value) !== item.sha256) fail('CHUNK_INVALID');
    const buffer = Buffer.from(value, 'base64');
    if (buffer.toString('base64') !== value) fail('CHUNK_INVALID');
    length += buffer.length; if (length > MAX_BYTES) fail('TRANSFER_TOO_LARGE');
    return buffer;
  });
  try {
    const key = privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(header.key, 'base64'));
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(header.iv, 'base64'));
    decipher.setAAD(Buffer.from(header.transferId)); decipher.setAuthTag(Buffer.from(header.tag, 'base64'));
    const plain = Buffer.concat([decipher.update(Buffer.concat(buffers)), decipher.final()]); key.fill(0);
    if (digest(plain) !== header.transferId) fail('CONTENT_HASH_MISMATCH');
    return plain;
  } catch { fail('DECRYPTION_FAILED'); }
}
export async function writeEnvelope(directory, envelope) {
  await mkdir(directory, { recursive: true });
  // Immutable transport: an existing directory is never silently overwritten.
  for (let i = 0; i < envelope.chunks.length; i++) await writeFile(resolve(directory, envelope.header.chunks[i].path), envelope.chunks[i], { flag: 'wx' });
  await writeFile(resolve(directory, 'ENVELOPE.json'), JSON.stringify(envelope.header, null, 2) + '\n', { flag: 'wx' });
}
export async function pack(root, manifestFile, publicKeyFile, out) {
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  if (!Array.isArray(manifest.files) || manifest.files.length > 30) fail('MANIFEST_INVALID');
  manifest.files.sort((a,b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const files = [];
  for (const entry of manifest.files) files.push({ path: entry.path, base64: (await boundedFile(root, entry.path, 25_000_000)).toString('base64') });
  const payload = validateTransfer({ manifest, files });
  const bytes = Buffer.from(canonical(payload));
  const envelope = seal(bytes, await readFile(publicKeyFile, 'utf8'));
  await writeEnvelope(out, envelope);
  return { transferId: envelope.header.transferId, branch: `codex/article-intake-${envelope.header.transferId}`, chunks: envelope.chunks.length };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [root, manifest, key, out] = process.argv.slice(2);
    if (!out) fail('USAGE: node scripts/editorial-transfer.mjs ROOT TRANSFER.json PUBLIC_KEY OUT');
    console.log(JSON.stringify(await pack(root, manifest, key, out)));
  } catch (error) { console.error(/^[A-Z_]+$/.test(error.message) ? error.message : 'PACK_FAILED_CHECK_INPUT_FILES'); process.exitCode = 1; }
}

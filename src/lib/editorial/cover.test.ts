import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile, open } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { prepareCover } from '../../../scripts/editorial-cover.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const tempPrefix = resolve(root, '.cache/levois-cover-test-');
const directories: string[] = [];
const hash = (buffer: Buffer) => createHash('sha256').update(buffer).digest('hex');
async function directory() {
  await mkdir(resolve(root, '.cache'), { recursive: true });
  const path = await mkdtemp(tempPrefix);
  directories.push(path);
  return path;
}
async function fixture(buffer: Buffer, extension = 'png') {
  const dir = await directory();
  const path = resolve(dir, `source.${extension}`);
  await writeFile(path, buffer);
  return { dir, path };
}
function noise(width: number, height: number, channels: 3 | 4) {
  const buffer = Buffer.alloc(width * height * channels);
  let state = 123456789;
  for (let index = 0; index < buffer.length; index++) {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    buffer[index] = state & 255;
  }
  return buffer;
}
afterEach(async () => {
  vi.restoreAllMocks();
  for (const dir of directories.splice(0)) {
    if (!dir.startsWith(tempPrefix)) throw new Error('Unexpected test directory');
    await rm(dir, { recursive: true, force: true });
  }
});

describe('finished editorial cover compression', () => {
  it.each(['png', 'jpeg', 'webp', 'avif'] as const)('accepts a finished %s and returns a verified WebP without writes', async format => {
    const original = await sharp({ create: { width: 160, height: 90, channels: 3, background: '#aa7755' } }).toFormat(format).toBuffer();
    const { dir, path } = await fixture(original, format);
    const { buffer, report } = await prepareCover(path, { width: 160, height: 90 });
    const metadata = await sharp(buffer).metadata();
    expect(metadata.format).toBe('webp');
    expect([metadata.width, metadata.height]).toEqual([160, 90]);
    expect(report).toEqual({ inputSha256: hash(original), sha256: hash(buffer), width: 160, height: 90, bytes: buffer.length, quality: 88 });
    expect(buffer.length).toBeLessThanOrEqual(500_000);
    expect(await readFile(path)).toEqual(original);
    expect(await readdir(dir)).toEqual([`source.${format}`]);
  });

  it('applies EXIF orientation before exact-dimension validation and strips metadata', async () => {
    const original = await sharp({ create: { width: 90, height: 160, channels: 3, background: '#926444' } })
      .withMetadata({ orientation: 6 }).jpeg().toBuffer();
    const { path } = await fixture(original, 'jpg');
    expect((await sharp(original).metadata()).exif).toBeDefined();
    const { buffer } = await prepareCover(path, { width: 160, height: 90 });
    const metadata = await sharp(buffer).metadata();
    expect([metadata.width, metadata.height]).toEqual([160, 90]);
    expect(metadata.orientation).toBeUndefined();
    expect(metadata.exif).toBeUndefined();
    expect(metadata.icc).toBeUndefined();
    await expect(prepareCover(path, { width: 90, height: 160 })).rejects.toThrow(/après orientation EXIF/);
  });

  it('is deterministic and lowers quality, keeping the composition and source intact', async () => {
    const original = await sharp(noise(1024, 768, 3), { raw: { width: 1024, height: 768, channels: 3 } }).png().toBuffer();
    const { path } = await fixture(original);
    const first = await prepareCover(path, { width: 1024, height: 768 });
    const second = await prepareCover(path, { width: 1024, height: 768 });
    expect(first.buffer).toEqual(second.buffer);
    expect(first.report).toEqual(second.report);
    expect(first.report.quality).toBeLessThan(88);
    expect([80, 72, 64, 56, 48]).toContain(first.report.quality);
    expect(first.report.bytes).toBeLessThanOrEqual(500_000);
    expect([first.report.width, first.report.height]).toEqual([1024, 768]);
    expect(await readFile(path)).toEqual(original);
  }, 30_000);

  it('refuses to resize or crop an unfinished composition', async () => {
    const { path } = await fixture(await sharp({ create: { width: 320, height: 180, channels: 3, background: 'white' } }).png().toBuffer());
    await expect(prepareCover(path, { width: 160, height: 90 })).rejects.toThrow(/Aucun recadrage ou redimensionnement/);
    await expect(prepareCover(path, { width: 320, height: 200 })).rejects.toThrow(/Aucun recadrage ou redimensionnement/);
  });

  it.each([[0, 90], [160, 4001], [1.5, 90], [NaN, 90]])('rejects invalid dimensions %s × %s before reading input', async (width, height) => {
    await expect(prepareCover('not-read.png', { width, height })).rejects.toThrow(/entiers de 1 à 4000/);
  });

  it('rejects an input larger than 25 MB before decoding', async () => {
    const dir = await directory();
    const path = resolve(dir, 'too-large.png');
    const file = await open(path, 'w');
    try { await file.truncate(25_000_001); } finally { await file.close(); }
    await expect(prepareCover(path, { width: 160, height: 90 })).rejects.toThrow(/25 000 000 octets/);
  });

  it('rejects a compressed image that exceeds the input pixel budget', async () => {
    const original = await sharp({ create: { width: 4001, height: 4000, channels: 3, background: 'white' } }).png().toBuffer();
    const { path } = await fixture(original);
    await expect(prepareCover(path, { width: 4000, height: 4000 })).rejects.toThrow(/16 000 000 pixels/);
  });

  it('rejects non-raster formats and corrupt files', async () => {
    const svg = await fixture(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90"/></svg>'), 'svg');
    await expect(prepareCover(svg.path, { width: 160, height: 90 })).rejects.toThrow(/Formats de couverture/);
    const corrupt = await fixture(Buffer.from('not an image'));
    await expect(prepareCover(corrupt.path, { width: 160, height: 90 })).rejects.toThrow(/illisible/);
  });

  it('rejects animated WebP instead of extracting its first frame', async () => {
    const original = await sharp(noise(32, 64, 3), { raw: { width: 32, height: 64, channels: 3, pageHeight: 32 } })
      .webp({ delay: [100, 100], loop: 0 }).toBuffer();
    expect((await sharp(original, { animated: true }).metadata()).pages).toBe(2);
    const { path } = await fixture(original, 'webp');
    await expect(prepareCover(path, { width: 32, height: 32 })).rejects.toThrow(/animées ou multipages/);
  });

  it('rejects APNG animation control even if a PNG decoder would show only a static frame', async () => {
    const png = await sharp({ create: { width: 16, height: 9, channels: 3, background: 'white' } }).png().toBuffer();
    const control = Buffer.alloc(20);
    control.writeUInt32BE(8, 0); control.write('acTL', 4, 'ascii'); control.writeUInt32BE(2, 8);
    // Animation is rejected from the chunk header before raster decoding.
    const { path } = await fixture(Buffer.concat([png.subarray(0, 33), control, png.subarray(33)]));
    await expect(prepareCover(path, { width: 16, height: 9 })).rejects.toThrow(/animées/);
  });

  it('rejects AVIF sequence brands before decoding the first frame', async () => {
    const original = await sharp({ create: { width: 16, height: 9, channels: 3, background: 'white' } }).avif().toBuffer();
    const sequence = Buffer.from(original);
    sequence.write('avis', 8, 'ascii');
    const { path } = await fixture(sequence, 'avif');
    await expect(prepareCover(path, { width: 16, height: 9 })).rejects.toThrow(/animées/);
  });

  it('rejects a cover still above the delivery budget at minimum quality without altering it', async () => {
    const original = await sharp({ create: { width: 160, height: 90, channels: 3, background: 'white' } }).png().toBuffer();
    const { path } = await fixture(original);
    // Exercise encoder-budget exhaustion without six costly encodes of random
    // alpha. Real compression and quality fallback are covered above.
    vi.spyOn(sharp.prototype, 'toBuffer').mockResolvedValue({
      data: Buffer.alloc(500_001),
      info: { format: 'webp', width: 160, height: 90, channels: 3, premultiplied: false, size: 500_001 },
    });
    await expect(prepareCover(path, { width: 160, height: 90 })).rejects.toThrow(/500 000 octets même à qualité 48/);
    expect(await readFile(path)).toEqual(original);
  });
});

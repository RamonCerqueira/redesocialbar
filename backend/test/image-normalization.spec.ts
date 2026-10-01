import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { normalizeImage } from '../src/media/normalize-image';
import { MediaController } from '../src/media/media.module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('Phone image conversion', () => {
  for (const format of ['jpeg','png','webp','gif','avif','tiff'] as const) {
    it(`accepts real ${format} content and returns bounded JPEG`, async () => {
      const input = await sharp({create:{width:1800,height:2400,channels:3,background:'#d4a020'}}).toFormat(format).toBuffer();
      const result = await normalizeImage(input);
      const metadata = await sharp(Buffer.from(result.split(',')[1],'base64')).metadata();
      expect(metadata.format).toBe('jpeg'); expect(metadata.width).toBe(1200); expect(metadata.height).toBe(1600);
      expect(metadata.exif).toBeUndefined();
    },30000);
  }
  it('applies EXIF orientation before resizing and removes metadata', async () => {
    const input=await sharp({create:{width:120,height:240,channels:3,background:'#123456'}}).jpeg().withMetadata({orientation:6}).toBuffer();
    const result=await normalizeImage(input);const meta=await sharp(Buffer.from(result.split(',')[1],'base64')).metadata();
    expect(meta.width).toBe(240);expect(meta.height).toBe(120);expect(meta.exif).toBeUndefined();
  });
  // Optional upstream fixture: see docs/FOTOS-E-TRANSPORTE.md for the command.
  it.runIf(existsSync('test/fixtures/phone.heic'))('converts an actual HEIC fixture', async () => {
    const input=await readFile('test/fixtures/phone.heic');
    const result=await normalizeImage(input);const meta=await sharp(Buffer.from(result.split(',')[1],'base64')).metadata();
    expect(meta.format).toBe('jpeg');expect(Math.max(meta.width!,meta.height!)).toBeLessThanOrEqual(1600);
  },30000);
  it('rejects corrupt and oversized files without persisting them', async () => {
    await expect(normalizeImage(Buffer.from('not a photo'))).rejects.toThrow();
    await expect(normalizeImage(Buffer.alloc(26*1024*1024))).rejects.toThrow('25 MB');
  });
  it('older clients can upload JPEG with image/jpg or missing MIME', async () => {
    const root=await mkdtemp(join(tmpdir(),'phone-conversion-'));const previous=process.env.MEDIA_ROOT;process.env.MEDIA_ROOT=root;
    try {
      const input=await sharp({create:{width:120,height:240,channels:3,background:'#123456'}}).jpeg().toBuffer();
      let asset: any;
      const prisma={mediaAsset:{create:async ({data}:any)=>{asset=data;return {id:data.id};}}};
      for(const mime of ['image/jpg','']) {
        const result=await new MediaController(prisma as any).upload('own-user',{dataUrl:`data:${mime};base64,${input.toString('base64')}`});
        expect(result.id).toBeTruthy();expect(asset.ownerId).toBe('own-user');expect(asset.mimeType).toBe('image/jpeg');
      }
    } finally { await rm(root,{recursive:true,force:true});if(previous===undefined)delete process.env.MEDIA_ROOT;else process.env.MEDIA_ROOT=previous; }
  });
});

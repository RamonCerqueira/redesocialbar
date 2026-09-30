import { BadRequestException, Body, Controller, Get, Module, NotFoundException, Param, Post, Res, UseGuards } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';

export function mediaDirectory() { return resolve(process.env.MEDIA_ROOT || './uploads'); }
export async function persistImage(id: string, data: Buffer) {
  const root = mediaDirectory();
  await mkdir(root, { recursive: true, mode: 0o750 });
  const temporary = join(root, id + '.tmp');
  try { await writeFile(temporary, data, { flag: 'wx', mode: 0o640 }); await rename(temporary, join(root, id)); }
  catch (error) { await unlink(temporary).catch(()=>{}); throw error; }
}

class UploadDto {
  @IsString() @MaxLength(7000000) dataUrl!: string;
}
export function decodeImage(dataUrl: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new BadRequestException('Envie uma imagem JPEG, PNG ou WebP.');
  const data = Buffer.from(match[2], 'base64');
  if (!data.length || data.length > 5 * 1024 * 1024) throw new BadRequestException('A imagem deve ter até 5 MB.');
  const valid = match[1] === 'image/jpeg' ? data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff
    : match[1] === 'image/png' ? data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP';
  if (!valid) throw new BadRequestException('O arquivo não corresponde ao formato da imagem.');
  return { mimeType: match[1], data };
}
@Controller('media')
export class MediaController {
  constructor(private prisma: PrismaService) {}
  @Post() @UseGuards(JwtAuthGuard)
  async upload(@CurrentUser('id') ownerId: string, @Body() dto: UploadDto) {
    const image = decodeImage(dto.dataUrl);
    const id = randomUUID();
    await persistImage(id, image.data);
    let asset: { id: string };
    try {
      asset = await this.prisma.mediaAsset.create({ data: { id, mimeType: image.mimeType, data: Buffer.alloc(0), ownerId }, select: { id: true } });
    } catch (error) { await unlink(join(mediaDirectory(), id)).catch(()=>{}); throw error; }
    const base = (process.env.PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
    return { id: asset.id, url: base + '/media/' + asset.id };
  }
  @Get(':id')
  async read(@Param('id') id: string, @Res() response: Response) {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) throw new NotFoundException('Imagem não encontrada.');
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Imagem não encontrada.');
    let data: Buffer;
    try { data = await readFile(join(mediaDirectory(), id)); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      if (!asset.data.length) throw new NotFoundException('Imagem não encontrada.');
      data = Buffer.from(asset.data);
    }
    response.setHeader('Content-Type', asset.mimeType);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    response.send(data);
  }
}
@Module({ controllers: [MediaController] })
export class MediaModule {}

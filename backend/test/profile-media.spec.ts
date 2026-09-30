import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MediaController } from '../src/media/media.module';
import { UsersService } from '../src/users/users.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Response } from 'express';
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN0cAAAAASUVORK5CYII=';
let directory='';const previous=process.env.MEDIA_ROOT;
afterEach(async()=>{if(directory)await rm(directory,{recursive:true,force:true});directory='';if(previous===undefined)delete process.env.MEDIA_ROOT;else process.env.MEDIA_ROOT=previous;});
describe('Perfil e arquivos persistentes',()=>{
 it('grava o arquivo em disco e recupera após recriar o controlador',async()=>{
  directory=await mkdtemp(join(tmpdir(),'piramba-media-'));process.env.MEDIA_ROOT=directory;
  let record:any;const db={mediaAsset:{create:vi.fn(async({data}:any)=>{record=data;return {id:data.id};}),findUnique:vi.fn(async()=>record)}} as unknown as PrismaService;
  const uploaded=await new MediaController(db).upload('owner',{dataUrl:png});
  expect(record.ownerId).toBe('owner');expect(record.data.length).toBe(0);expect((await readFile(join(directory,uploaded.id))).length).toBeGreaterThan(8);
  const send=vi.fn();await new MediaController(db).read(uploaded.id,{setHeader:vi.fn(),send} as unknown as Response);expect(send.mock.calls[0][0]).toEqual(await readFile(join(directory,uploaded.id)));
 });
 it('remove arquivo órfão quando falha a gravação de metadados',async()=>{
  directory=await mkdtemp(join(tmpdir(),'piramba-media-'));process.env.MEDIA_ROOT=directory;
  const db={mediaAsset:{create:vi.fn().mockRejectedValue(new Error('offline'))}} as unknown as PrismaService;
  await expect(new MediaController(db).upload('owner',{dataUrl:png})).rejects.toThrow('offline');expect(await readdir(directory)).toEqual([]);
 });
 it('mantém leitura de uploads antigos e rejeita travessia de diretórios',async()=>{
  directory=await mkdtemp(join(tmpdir(),'piramba-media-'));process.env.MEDIA_ROOT=directory;
  const db={mediaAsset:{findUnique:vi.fn().mockResolvedValue({mimeType:'image/png',data:Buffer.from('legacy')})}} as unknown as PrismaService;
  const send=vi.fn();const controller=new MediaController(db);await controller.read('old-id',{setHeader:vi.fn(),send} as unknown as Response);expect(send.mock.calls[0][0].toString()).toBe('legacy');await expect(controller.read('../secret',{} as Response)).rejects.toThrow('não encontrada');
 });
 it('impede acesso paginado a perfil privado',async()=>{
  const query=vi.fn();const service=new UsersService({post:{findMany:query}} as unknown as PrismaService);vi.spyOn(service,'getProfileByUsername').mockResolvedValue({id:'owner',isPrivate:true} as any);
  expect(await service.profilePosts('private','visitor')).toEqual({items:[],nextCursor:null});expect(query).not.toHaveBeenCalled();
 });
 it('rejeita cursor de outro perfil',async()=>{
  const query=vi.fn();const service=new UsersService({post:{findMany:query,findFirst:vi.fn().mockResolvedValue(null)}} as unknown as PrismaService);vi.spyOn(service,'getProfileByUsername').mockResolvedValue({id:'owner',isPrivate:false} as any);
  await expect(service.profilePosts('public',undefined,'other-post')).rejects.toThrow('indisponível');expect(query).not.toHaveBeenCalled();
 });
});

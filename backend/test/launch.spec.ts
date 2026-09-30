import { describe, expect, it, vi } from 'vitest';
import { assertSocialAccess } from '../src/auth/social-access';
import { PrismaService } from '../src/prisma/prisma.service';
import { FlirtService } from '../src/flirt/flirt.service';
import { MeetupsService } from '../src/meetups/meetups.service';
import { PostsService } from '../src/posts/posts.service';
import { AccessService } from '../src/auth/access.service';

const prisma = (value: unknown) => value as PrismaService;
describe('Barreiras de lançamento', () => {
  it.each(['BANNED','SUSPENDED'])('nega interação com conta %s', async status => {
    await expect(assertSocialAccess(prisma({ user: { findUnique: vi.fn().mockResolvedValue({status}) } }), 'a','b')).rejects.toThrow('indisponível');
  });
  it('nega bloqueio em qualquer direção e perfil privado', async () => {
    for (const [block,isPrivate] of [[{id:'block'},false],[null,true]]) {
      await expect(assertSocialAccess(prisma({user:{findUnique:vi.fn().mockResolvedValue({status:'ACTIVE',profile:{isPrivate}})},block:{findFirst:vi.fn().mockResolvedValue(block)}}),'a','b')).rejects.toThrow('indisponível');
    }
  });
  it('não permite responder comentário de outra publicação', async () => {
    const create = vi.fn();
    const service = new PostsService(prisma({post:{findUnique:vi.fn().mockResolvedValue({id:'p',authorId:'a'})},user:{findUnique:vi.fn().mockResolvedValue({status:'ACTIVE'})},comment:{findFirst:vi.fn().mockResolvedValue(null),create}}), {} as AccessService);
    await expect(service.addComment('p','a',{content:'Teste',parentId:'other'})).rejects.toThrow('original indisponível');
    expect(create).not.toHaveBeenCalled();
  });
  it.each(['NONE','FOLLOWERS'])('respeita preferência de paquera %s', async allowFlirtFrom => {
    const upsert = vi.fn();
    const service = new FlirtService(prisma({restaurant:{findUnique:vi.fn().mockResolvedValue({id:'r'})},user:{findUnique:vi.fn().mockResolvedValue({id:'b',status:'ACTIVE',profile:{showInFlirtRadar:true,allowFlirtFrom}})},follow:{findUnique:vi.fn().mockResolvedValue(null)},interest:{upsert}}));
    await expect(service.expressInterest('a',{targetUserId:'b',restaurantSlug:'r'})).rejects.toThrow();
    expect(upsert).not.toHaveBeenCalled();
  });
  it('recusa encontro no passado antes de gravar', async () => {
    const create = vi.fn();
    const service = new MeetupsService(prisma({meetup:{create}}));
    await expect(service.create('a',{title:'T',description:'D',scheduledFor:'2020-01-01T00:00:00Z',restaurantSlug:'r'})).rejects.toThrow('data futura');
    expect(create).not.toHaveBeenCalled();
  });
});

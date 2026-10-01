import { describe, expect, it, vi } from 'vitest';
import { PostsService } from '../src/posts/posts.service';
describe('Official publications and profile privacy', () => {
  it('allows public official announcements without exposing personal private posts', async () => {
    const findMany=vi.fn().mockResolvedValue([]);
    const prisma={restaurant:{findUnique:vi.fn().mockResolvedValue({id:'bar'})},post:{findMany}};
    await new PostsService(prisma as any,{} as any).getFeed('pirambeira');
    const where=findMany.mock.calls[0][0].where;
    expect(where.author).toEqual({status:'ACTIVE'});
    expect(where.OR).toEqual([{isOfficial:true},{author:{OR:[{profile:{isPrivate:false}}]}}]);
    expect(where.isDeleted).toBe(false);expect(where.type).toEqual({not:'FLIRT'});
  });
  it('preserves block exclusions and only permits own private personal posts', async () => {
    const findMany=vi.fn().mockResolvedValue([]);
    const prisma={restaurant:{findUnique:vi.fn().mockResolvedValue({id:'bar'})},post:{findMany},block:{findMany:vi.fn().mockResolvedValue([{blockerId:'me',blockedId:'blocked'}])}};
    await new PostsService(prisma as any,{} as any).getFeed('pirambeira','me');
    const where=findMany.mock.calls[0][0].where;
    expect(where.authorId).toEqual({notIn:['blocked']});
    expect(where.OR[1].author.OR).toEqual([{profile:{isPrivate:false}},{id:'me'}]);
  });
});

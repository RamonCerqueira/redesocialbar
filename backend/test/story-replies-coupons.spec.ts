import { describe, expect, it, vi } from 'vitest';
import { StoriesController } from '../src/stories/stories.module';
import { PromotionsService } from '../src/promotions/promotions.service';
describe('Private story replies and coupon history', () => {
  function setup(blocked = false) {
    const tx = { conversation: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({id:'thread'}), update: vi.fn() }, message: {create:vi.fn()}, notification:{create:vi.fn()} };
    const prisma = { story:{findFirst:vi.fn().mockResolvedValue({id:'story',authorId:'owner',restaurantId:'bar'})}, block:{findFirst:vi.fn().mockResolvedValue(blocked ? {} : null)}, profile:{findUnique:vi.fn().mockResolvedValue({name:'Sender'})}, $transaction:vi.fn(fn => fn(tx)) };
    return { tx, prisma, controller:new StoriesController(prisma as any) };
  }
  it('persists reply and notification in the same transaction with exactly two participants', async () => {
    const {tx, controller}=setup();
    expect(await controller.reply('story','sender',{content:' hello '})).toEqual({success:true,conversationId:'thread'});
    expect(tx.conversation.create).toHaveBeenCalledWith({data:{restaurantId:'bar',type:'STORY:story',participants:{create:[{userId:'sender'},{userId:'owner'}]}}});
    expect(tx.message.create).toHaveBeenCalledWith({data:{conversationId:'thread',senderId:'sender',content:'hello'}});
    expect(tx.notification.create.mock.calls[0][0].data.link).toBe('/chat/thread');
  });
  it('rejects blocked interactions before creating a conversation', async () => {
    const {prisma,controller}=setup(true);
    await expect(controller.reply('story','sender',{content:'hi'})).rejects.toThrow('Interação indisponível');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
  it('scopes history to current user and keeps used coupons while deriving expired status', async () => {
    const findMany=vi.fn().mockResolvedValue([{status:'CLAIMED',promotion:{validUntil:new Date(0)}},{status:'USED',promotion:{validUntil:new Date(0)}}]);
    const result=await new PromotionsService({coupon:{findMany}} as any,{} as any).mine('me');
    expect(findMany.mock.calls[0][0].where).toEqual({userId:'me'});
    expect(result.map(c => c.status)).toEqual(['EXPIRED','USED']);
  });
});

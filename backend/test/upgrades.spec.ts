import {describe,it,expect,vi} from 'vitest';
import {AdsService} from '../src/ads/ads.service';
import {LegalService} from '../src/legal/legal.module';
describe('Scheduled news and privacy processing',()=>{
 it('filters by time window and stable editorial order',async()=>{
  const findMany=vi.fn().mockResolvedValue([]);const db={restaurant:{findUnique:vi.fn().mockResolvedValue({id:'bar'})},advertisement:{findMany}};
  await new AdsService(db as any).getActiveAds('bar');const query=findMany.mock.calls[0][0];expect(query.where.restaurantId).toBe('bar');expect(query.where.AND).toHaveLength(2);expect(query.orderBy[0]).toEqual({sortOrder:'asc'});expect(query.where.AND[1].OR[1].endsAt.gt).toBeInstanceOf(Date);
 });
 it('responds atomically, audits administrator and notifies only request owner',async()=>{
  const tx={auditLog:{findFirst:vi.fn().mockResolvedValue({userId:'owner',details:{type:'ACCESS'}}),update:vi.fn().mockResolvedValue({id:'request'}),create:vi.fn()},notification:{create:vi.fn()}};
  const db={$transaction:vi.fn(async cb=>cb(tx))};await new LegalService(db as any).respond('request','admin',{status:'IN_PROGRESS',response:' Em análise '});
  expect(tx.auditLog.update.mock.calls[0][0].data.details).toMatchObject({type:'ACCESS',status:'IN_PROGRESS',response:'Em análise'});expect(tx.auditLog.create.mock.calls[0][0].data.userId).toBe('admin');expect(tx.notification.create.mock.calls[0][0].data.userId).toBe('owner');
 });
 it('rejects empty replies before writing',async()=>{const db={$transaction:vi.fn()};await expect(new LegalService(db as any).respond('x','admin',{status:'COMPLETED',response:' '})).rejects.toThrow();expect(db.$transaction).not.toHaveBeenCalled();});
});

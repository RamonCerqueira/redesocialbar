import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccessService } from '../src/auth/access.service';
import { requireJwtSecret } from '../src/auth/jwt-secret';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/users/users.service';
import { decodeImage } from '../src/media/media.module';
import { PromotionsService } from '../src/promotions/promotions.service';
import { AdminService } from '../src/admin/admin.service';
import { validate } from 'class-validator';
import { AdminPostDto, PromotionDto } from '../src/admin/admin.dto';

function prisma(value: unknown) { return value as PrismaService; }
describe('Autorização por estabelecimento',()=>{
  it('nega um administrador sem vínculo', async()=>{
    const access=new AccessService(prisma({restaurantMember:{findUnique:vi.fn().mockResolvedValue(null)}}));
    await expect(access.restaurantId({id:'admin',role:'RESTAURANT_ADMIN'},'other')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('nega funcionário sem papel de gestor',async()=>{
    const access=new AccessService(prisma({restaurantMember:{findUnique:vi.fn().mockResolvedValue({role:'STAFF'})}}));
    await expect(access.restaurantId({id:'admin',role:'RESTAURANT_ADMIN'},'restaurant')).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('nega usuário comum mesmo com vínculo',async()=>{
    const findUnique=vi.fn().mockResolvedValue({role:'OWNER'});
    const access=new AccessService(prisma({restaurantMember:{findUnique}}));
    await expect(access.restaurantId({id:'user',role:'USER'},'restaurant')).rejects.toBeInstanceOf(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
  });
  it('permite gestor vinculado e superadministrador',async()=>{
    const access=new AccessService(prisma({restaurantMember:{findUnique:vi.fn().mockResolvedValue({role:'MANAGER'})}}));
    await expect(access.restaurantId({id:'admin',role:'RESTAURANT_ADMIN'},'restaurant')).resolves.toBeUndefined();
    await expect(access.restaurantId({id:'root',role:'SUPERADMIN'},'restaurant')).resolves.toBeUndefined();
  });
});

function profile(invisibleMode=true) {
  return {userId:'owner',name:'Pessoa',username:'pessoa',invisibleMode,isPrivate:false,checkInCount:1,
    user:{status:'ACTIVE',checkIns:[{startedAt:new Date(),restaurant:{name:'Bar',slug:'bar'}}],posts:[],_count:{followers:0,following:0,posts:0,checkIns:1}}};
}
describe('Privacidade do perfil',()=>{
  it('oculta check-in invisível de visitante anônimo',async()=>{
    const service=new UsersService(prisma({profile:{findUnique:vi.fn().mockResolvedValue(profile())}}));
    expect((await service.getProfileByUsername('pessoa')).activeCheckIn).toBeNull();
  });
  it('mantém o check-in acessível ao próprio usuário',async()=>{
    const service=new UsersService(prisma({profile:{findUnique:vi.fn().mockResolvedValue(profile())}}));
    expect((await service.getProfileByUsername('pessoa','owner')).activeCheckIn?.restaurantSlug).toBe('bar');
  });
  it('nega perfil a usuário bloqueado',async()=>{
    const service=new UsersService(prisma({profile:{findUnique:vi.fn().mockResolvedValue(profile(false))},follow:{findUnique:vi.fn().mockResolvedValue(null)},block:{findFirst:vi.fn().mockResolvedValue({id:'block'})}}));
    await expect(service.getProfileByUsername('pessoa','blocked')).rejects.toBeInstanceOf(NotFoundException);
  });
});
describe('Segredo JWT e uploads',()=>{
  it('recusa segredo ausente, curto ou padrão',()=>{
    for(const value of [undefined,'short','pirambeira-super-secret-key-2026-production-ready','REPLACE_WITH_RANDOM_SECRET_AT_LEAST_32_CHARACTERS']) expect(()=>requireJwtSecret(value)).toThrow();
    expect(requireJwtSecret('a'.repeat(48))).toHaveLength(48);
  });
  it('valida assinatura do arquivo e não aceita SVG',()=>{
    expect(()=>decodeImage('data:image/svg+xml;base64,PHN2Zz4=')).toThrow();
    expect(()=>decodeImage('data:image/png;base64,aGVsbG8=')).toThrow();
    expect(decodeImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=').mimeType).toBe('image/png');
  });
  it('recusa arquivo maior que 5 MB',()=>{
    expect(()=>decodeImage('data:image/png;base64,'+Buffer.alloc(5*1024*1024+1).toString('base64'))).toThrow();
  });
});
describe('Cupons e formulários administrativos',()=>{
  it('validação exige autorização antes de consultar código',async()=>{
    const findUnique=vi.fn();
    const access={restaurant:vi.fn().mockRejectedValue(new ForbiddenException())} as unknown as AccessService;
    const service=new PromotionsService(prisma({coupon:{findUnique}}),access);
    await expect(service.validateCoupon('code','other',{id:'admin',role:'RESTAURANT_ADMIN'})).rejects.toThrow();
    expect(findUnique).not.toHaveBeenCalled();
  });
  it('não aceita segunda validação quando atualização condicional perde a corrida',async()=>{
    const updateMany=vi.fn().mockResolvedValue({count:0});
    const access={restaurant:vi.fn().mockResolvedValue({id:'r'})} as unknown as AccessService;
    const service=new PromotionsService(prisma({coupon:{findUnique:vi.fn().mockResolvedValue({id:'c',promotion:{restaurantId:'r',validUntil:new Date(Date.now()+60000)},user:{}}),updateMany}}),access);
    await expect(service.validateCoupon('code','r',{id:'admin',role:'RESTAURANT_ADMIN'})).rejects.toThrow('já foi utilizado');
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({status:'CLAIMED'})}));
  });
  it('não permite reduzir estoque abaixo de emissões concorrentes',async()=>{
    const updateMany=vi.fn().mockResolvedValue({count:0});
    const access={restaurant:vi.fn().mockResolvedValue({id:'r'})} as unknown as AccessService;
    const service=new AdminService(prisma({promotion:{updateMany}}),access);
    await expect(service.savePromotion({id:'admin',role:'RESTAURANT_ADMIN'},'r',{title:'P',description:'D',discountText:'10%',totalCoupons:1,validUntil:new Date(Date.now()+60000).toISOString()},'p')).rejects.toThrow('quantidade inferior');
    expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({where:expect.objectContaining({redeemedCount:{lte:1}})}));
  });
  it('recusa javascript no endereço do botão',async()=>{
    const errors=await validate(Object.assign(new AdminPostDto(),{content:'Oferta',buttonText:'Ver',buttonUrl:'javascript:alert(1)'}));
    expect(errors.some(e=>e.property==='buttonUrl')).toBe(true);
  });
  it('recusa estoque negativo ou fracionário',async()=>{
    for(const totalCoupons of [-1,1.5]) {
      const errors=await validate(Object.assign(new PromotionDto(),{title:'P',description:'D',discountText:'10%',totalCoupons,validUntil:new Date().toISOString()}));
      expect(errors.some(e=>e.property==='totalCoupons')).toBe(true);
    }
  });
});

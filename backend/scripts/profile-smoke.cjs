const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
const {PrismaClient}=require('@prisma/client'),{JwtService}=require('@nestjs/jwt'),bcrypt=require('bcryptjs');
const statePath=path.resolve(process.env.QA_STATE_FILE||'.profile-qa.json');
let db,state;
async function main(){
 for(const line of (await fs.readFile(path.join(__dirname,'../.env'),'utf8')).split(/\r?\n/)){const m=line.match(/^([A-Z_]+)=["']?(.*?)["']?$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}
 db=new PrismaClient();const base=process.env.SMOKE_API_URL||'http://127.0.0.1:3211/api';const jwt=new JwtService({secret:process.env.JWT_SECRET});
 async function request(route,token,method='GET',body){const res=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,data:await res.json()};}
 if(process.argv[2]==='--prepare'){
  try{await fs.access(statePath);throw new Error('Fixture anterior ainda existe.');}catch(e){if(e.code!=='ENOENT')throw e;}
  const prefix='qa-profile-'+randomUUID().slice(0,8),password='Qa!'+randomUUID();state={prefix,password,users:[],restaurant:null};await fs.writeFile(statePath,JSON.stringify(state),{mode:0o600});
  for(const [suffix,role]of [['admin','RESTAURANT_ADMIN'],['user','USER']]){const u=await db.user.create({data:{email:prefix+suffix+'@example.test',passwordHash:await bcrypt.hash(password,10),role,profile:{create:{username:prefix+suffix,name:suffix==='admin'?'Gestão de teste':'Perfil de teste',city:'Salvador'}}}});state.users.push(u.id);await fs.writeFile(statePath,JSON.stringify(state));}
  const r=await db.restaurant.create({data:{name:'Validação mobile temporária',slug:prefix,address:'Teste',menuCategories:[{name:'Bebidas',items:[{name:'Chopp de teste',price:'14,00',description:'Produto temporário',tags:['2X','HOJE']}] }]}});state.restaurant=r.id;await fs.writeFile(statePath,JSON.stringify(state));await db.restaurantMember.create({data:{userId:state.users[0],restaurantId:r.id,role:'OWNER'}});
  const token=jwt.sign({sub:state.users[1],tokenVersion:0},{expiresIn:'30m'});
  const photo=await request('/media',token,'POST',{dataUrl:'data:image/png;base64,'+(await fs.readFile(path.join(__dirname,'../../frontend/public/hero-brinde-v2.png'))).toString('base64')});assert.equal(photo.status,201);
  state.asset=photo.data.id;state.photoUrl=photo.data.url;await fs.writeFile(statePath,JSON.stringify(state));
  for(let i=0;i<14;i++)await db.post.create({data:{authorId:state.users[1],restaurantId:r.id,content:'Momento de teste '+(i+1),media:{create:{url:photo.data.url}}}});
  console.log(JSON.stringify({admin:prefix+'admin@example.test',user:prefix+'user@example.test',password,slug:prefix}));return;
 }
 state=JSON.parse(await fs.readFile(statePath,'utf8'));assert.match(state.prefix,/^qa-profile-[a-f0-9]{8}$/);
 if(process.argv[2]==='--cleanup'){
  const assets=await db.mediaAsset.findMany({where:{ownerId:{in:state.users}},select:{id:true}});
  if(state.restaurant)await db.restaurant.delete({where:{id:state.restaurant}});await db.user.deleteMany({where:{id:{in:state.users},email:{startsWith:state.prefix}}});
  for(const asset of assets){assert.match(asset.id,/^[a-zA-Z0-9_-]{1,80}$/);await fs.unlink(path.join(process.env.MEDIA_ROOT||'uploads',asset.id)).catch(e=>{if(e.code!=='ENOENT')throw e;});}
  await fs.unlink(statePath);console.log('Fixture e uploads temporários removidos.');return;
 }
 const token=jwt.sign({sub:state.users[1],tokenVersion:0},{expiresIn:'10m'});let checks=0;function check(label,value){assert.ok(value,label);console.log('OK '+label);checks++;}
 const record=await db.mediaAsset.findUnique({where:{id:state.asset}});check('arquivo gravado na VPS, sem binário novo no banco',record.data.length===0&&(await fs.stat(path.join(process.env.MEDIA_ROOT,state.asset))).size>0);
 check('URL da imagem continua acessível',(await fetch(state.photoUrl)).status===200);
 const update=await request('/users/profile',token,'PUT',{name:'Perfil atualizado',bio:'Minha bio no Piramba',city:'Salvador',avatarUrl:state.photoUrl,interests:['Samba','Gastronomia'],showInFlirtRadar:false,invisibleMode:true,allowFlirtFrom:'NONE',isPrivate:false});check('edição de foto e informações',update.status===200);
 let publicProfile=await request('/users/profile/'+state.prefix+'user');check('perfil público mostra informações salvas',publicProfile.data.bio==='Minha bio no Piramba'&&publicProfile.data.avatarUrl===state.photoUrl);check('perfil não revela preferências privadas',!('allowFlirtFrom'in publicProfile.data)&&!('email'in publicProfile.data));
 const posts=publicProfile.data.recentPosts;check('primeira página da grade com 12 fotos',posts.length===12);const more=await request('/users/profile/'+state.prefix+'user/posts?cursor='+posts.at(-1).id);check('paginação sem repetir fotos',more.data.items.length===2&&!more.data.items.some(item=>posts.some(post=>post.id===item.id)));
 check('perfil comum não acessa painel',(await request('/admin/restaurants',token)).status===403);
 check('nome vazio é recusado',(await request('/users/profile',token,'PUT',{name:'  '})).status===400);
 await request('/users/profile',token,'PUT',{isPrivate:true});publicProfile=await request('/users/profile/'+state.prefix+'user');check('privacidade oculta grade pública',publicProfile.data.recentPosts.length===0);check('paginação também respeita privacidade',(await request('/users/profile/'+state.prefix+'user/posts')).data.items.length===0);
 check('titular mantém fotos e preferências',(await request('/users/profile/'+state.prefix+'user',token)).data.allowFlirtFrom==='NONE');await request('/users/profile',token,'PUT',{isPrivate:false});console.log(checks+' verificações aprovadas.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>db?.$disconnect());

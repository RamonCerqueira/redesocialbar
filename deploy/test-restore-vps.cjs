#!/usr/bin/env node
// Restores only into a disposable PostgreSQL container without published ports.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root='/opt/pirambeira',dir=root+'/backups';const meta=JSON.parse(fs.readFileSync(dir+'/latest.json','utf8'));
if(!/^\d{8}T\d{6}Z\.tar\.enc$/.test(meta.file))throw new Error('Invalid archive name');
const archive=dir+'/'+meta.file;const digest=crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');if(digest!==meta.sha256)throw new Error('Archive checksum mismatch');
const temp=fs.mkdtempSync(dir+'/.restore-'),name='pirambeira-restore-'+crypto.randomBytes(5).toString('hex');
function run(cmd,args){const r=spawnSync(cmd,args,{encoding:'utf8'});if(r.status!==0)throw new Error(cmd+' failed: '+(r.stderr||'').slice(0,500));return r.stdout||'';}
try{
 run('openssl',['enc','-d','-aes-256-cbc','-pbkdf2','-iter','200000','-in',archive,'-out',temp+'/bundle.tar','-pass','file:'+root+'/shared/backup.key']);
 run('tar',['-xf',temp+'/bundle.tar','-C',temp]);
 run('docker',['run','-d','--name',name,'--network','none','--memory','512m','--cpus','1','-e','POSTGRES_HOST_AUTH_METHOD=trust','-v',temp+':/restore:ro','postgres:17']);
 let ready=false;for(let i=0;i<30;i++){const r=spawnSync('docker',['exec',name,'pg_isready','-U','postgres']);if(r.status===0){ready=true;break;}spawnSync('sleep',['1']);}if(!ready)throw new Error('Temporary database did not start');
 run('docker',['exec',name,'psql','-U','postgres','-v','ON_ERROR_STOP=1','-c','DROP SCHEMA public; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;']);
 run('docker',['exec',name,'pg_restore','--exit-on-error','--no-owner','--no-acl','-U','postgres','-d','postgres','/restore/database.dump']);
 const tables=Number(run('docker',['exec',name,'psql','-U','postgres','-Atc',"SELECT count(*) FROM pg_tables WHERE schemaname='public'"]).trim());
 if(tables<10)throw new Error('Restored schema is unexpectedly empty');
 const entries=run('tar',['-tzf',temp+'/uploads.tar.gz']).split('\n').filter(s=>s && !s.endsWith('/')).length;if(entries!==meta.uploadFiles)throw new Error('Upload file count mismatch');
 const data={verifiedAt:new Date().toISOString(),file:meta.file,restoredTables:tables,uploadFiles:entries,productionModified:false};fs.writeFileSync(dir+'/restore-test.json',JSON.stringify(data));console.log(JSON.stringify(data));
}finally{spawnSync('docker',['rm','-f',name],{stdio:'ignore'});if(path.resolve(temp).startsWith(dir+'/.restore-'))fs.rmSync(temp,{recursive:true,force:true});}

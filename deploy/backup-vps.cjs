#!/usr/bin/env node
// Root-only backup: public application database + uploaded media, encrypted at rest.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const root='/opt/pirambeira',dir=root+'/backups';fs.mkdirSync(dir,{recursive:true,mode:0o700});
const temp=fs.mkdtempSync(dir+'/.work-');
function run(cmd,args,options={}){const r=spawnSync(cmd,args,{encoding:'utf8',...options});if(r.status!==0)throw new Error(cmd+' failed: '+(r.stderr||'').slice(0,500));return r.stdout||'';}
function countFiles(folder){let n=0;for(const e of fs.readdirSync(folder,{withFileTypes:true})){if(e.isDirectory())n+=countFiles(path.join(folder,e.name));else if(e.isFile())n++;}return n;}
try{
 process.loadEnvFile(root+'/shared/backend.env');
 const uri=new URL(process.env.DIRECT_URL||process.env.DATABASE_URL);
 // Session pooler avoids IPv6-only direct endpoints when necessary.
 if(uri.hostname.startsWith('db.') && new URL(process.env.DATABASE_URL).hostname.includes('pooler')){const pooled=new URL(process.env.DATABASE_URL);uri.hostname=pooled.hostname;uri.port='5432';uri.username=pooled.username;uri.password=pooled.password;}
 const env=['PGHOST='+uri.hostname,'PGPORT='+(uri.port||5432),'PGUSER='+decodeURIComponent(uri.username),'PGPASSWORD='+decodeURIComponent(uri.password),'PGDATABASE='+uri.pathname.slice(1),'PGSSLMODE=require','PGCONNECT_TIMEOUT=30'];
 const envFile=temp+'/pg.env';fs.writeFileSync(envFile,env.join('\n'),{mode:0o600});
 run('docker',['run','--rm','--env-file',envFile,'-v',temp+':/backup','postgres:17','pg_dump','--format=custom','--no-owner','--no-acl','--schema=public','--file=/backup/database.dump']);
 run('tar',['-czf',temp+'/uploads.tar.gz','-C',root+'/shared','uploads']);
 const key=root+'/shared/backup.key';if(!fs.existsSync(key))fs.writeFileSync(key,crypto.randomBytes(48).toString('base64'),{mode:0o600});
 const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z/,'Z');
 const archive=dir+'/'+stamp+'.tar.enc';
 const manifest={createdAt:new Date().toISOString(),databaseSchema:'public',uploadFiles:countFiles(root+'/shared/uploads'),revision:fs.readFileSync(root+'/current/REVISION','utf8').trim(),format:'pg_dump custom + uploads tar.gz'};
 fs.writeFileSync(temp+'/manifest.json',JSON.stringify(manifest));
 run('tar',['-cf',temp+'/bundle.tar','-C',temp,'database.dump','uploads.tar.gz','manifest.json']);
 run('openssl',['enc','-aes-256-cbc','-salt','-pbkdf2','-iter','200000','-in',temp+'/bundle.tar','-out',archive,'-pass','file:'+key]);
 const digest=crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');fs.writeFileSync(archive+'.sha256',digest);
 fs.writeFileSync(dir+'/latest.json',JSON.stringify({...manifest,file:path.basename(archive),bytes:fs.statSync(archive).size,sha256:digest}));
 // Keep the fourteen most recent successful encrypted snapshots.
 const snapshots=fs.readdirSync(dir).filter(n=>/^\d{8}T\d{6}Z\.tar\.enc$/.test(n)).sort().reverse();for(const name of snapshots.slice(14)){fs.unlinkSync(dir+'/'+name);if(fs.existsSync(dir+'/'+name+'.sha256'))fs.unlinkSync(dir+'/'+name+'.sha256');}
 console.log('Backup created: '+path.basename(archive));
}finally{if(path.resolve(temp).startsWith(dir+'/.work-'))fs.rmSync(temp,{recursive:true,force:true});}

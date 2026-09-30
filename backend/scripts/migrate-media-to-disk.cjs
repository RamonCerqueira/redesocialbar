// Copia uploads antigos para o volume persistente, mantendo o original no banco.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
async function main() {
  for (const line of (await fs.readFile(path.join(__dirname,'../.env'),'utf8')).split(/\r?\n/)) {
    const match=line.match(/^([A-Z_]+)=["']?(.*?)["']?$/); if(match&&!process.env[match[1]])process.env[match[1]]=match[2];
  }
  if(!process.env.MEDIA_ROOT||!path.isAbsolute(process.env.MEDIA_ROOT))throw new Error('MEDIA_ROOT absoluto obrigatório.');
  const root=process.env.MEDIA_ROOT;
  await fs.mkdir(root,{recursive:true,mode:0o750});
  const db=new PrismaClient();let cursor;let copied=0;
  try {
    while(true){const rows=await db.mediaAsset.findMany({orderBy:{id:'asc'},take:50,...(cursor?{cursor:{id:cursor},skip:1}:{})});if(!rows.length)break;
      for(const row of rows){if(!row.data.length)continue;if(!/^[a-zA-Z0-9_-]{1,80}$/.test(row.id))throw new Error('Identificador de mídia inválido.');const file=path.join(root,row.id);const data=Buffer.from(row.data);
        try{await fs.writeFile(file,data,{flag:'wx',mode:0o640});}catch(error){if(error.code!=='EEXIST')throw error;}
        const hash=value=>crypto.createHash('sha256').update(value).digest('hex');if(hash(await fs.readFile(file))!==hash(data))throw new Error('Falha de integridade na cópia.');copied++;
      }cursor=rows.at(-1).id;
    }
    console.log(`${copied} imagens antigas copiadas e verificadas. Originais preservados.`);
  }finally{await db.$disconnect();}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});

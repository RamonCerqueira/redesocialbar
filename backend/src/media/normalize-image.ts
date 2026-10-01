import { BadRequestException, HttpException } from '@nestjs/common';
import { Worker } from 'node:worker_threads';

let activeConversions = 0;
export async function normalizeImage(input: Buffer): Promise<string> {
  if (!input.length || input.length > 25 * 1024 * 1024) throw new BadRequestException('Escolha uma foto de até 25 MB.');
  if (activeConversions >= 1) throw new HttpException('Estamos preparando outra foto. Tente novamente em alguns segundos.', 429);
  activeConversions++;
  try {
    return await new Promise<string>((resolve, reject) => {
      const worker = new Worker(`
        const {parentPort,workerData}=require('node:worker_threads');
        const sharp=require(workerData.sharp); sharp.cache(false); sharp.concurrency(1);
        (async()=>{
          const input=Buffer.from(workerData.input);
          let pipeline;
          const brands=input.subarray(0,128).toString('latin1');
          if(input.subarray(4,8).toString()==='ftyp' && !/avif|avis/.test(brands) && /heic|heix|hevc|hevx|mif1|msf1/.test(brands)) {
            const decode=require(workerData.heic);
            const image=await decode({buffer:input});
            if(!image.width || !image.height || image.width*image.height>96000000) throw new Error('dimensions');
            pipeline=sharp(Buffer.from(image.data),{raw:{width:image.width,height:image.height,channels:4}});
          } else {
            // Content detection ignores missing/wrong MIME labels; first frame for animated files.
            pipeline=sharp(input,{limitInputPixels:96000000,pages:1,failOn:'warning'}).rotate();
          }
          const jpeg=await pipeline.resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality:85}).toBuffer();
          parentPort.postMessage({data:jpeg.toString('base64')});
        })().catch(()=>parentPort.postMessage({error:true}));
      `, { eval: true, workerData: { input, sharp: require.resolve('sharp'), heic: require.resolve('heic-decode') }, resourceLimits: { maxOldGenerationSizeMb: 384 } });
      let settled = false;
      const finish = (error?: Error, data?: string) => {
        if (settled) return; settled = true; clearTimeout(timer); void worker.terminate();
        if (error) reject(error); else resolve('data:image/jpeg;base64,' + data);
      };
      const timer = setTimeout(() => finish(new BadRequestException('A foto demorou demais para abrir. Tente outra foto ou tire novamente.')), 30000);
      worker.once('message', (message: { data?: string; error?: boolean }) => message.data ? finish(undefined, message.data) : finish(new BadRequestException('Não foi possível ler esta imagem. O arquivo pode estar incompleto; selecione a foto novamente.')));
      worker.once('error', () => finish(new BadRequestException('Não foi possível preparar esta foto. Tente novamente.')));
      worker.once('exit', () => { if (!settled) finish(new BadRequestException('Não foi possível preparar esta foto.')); });
    });
  } finally { activeConversions--; }
}

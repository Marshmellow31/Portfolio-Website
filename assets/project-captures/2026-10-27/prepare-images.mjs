import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

const portfolio = process.cwd();
const captureRoot = path.join(portfolio, 'assets/project-captures/2026-10-27');
const openSense = 'C:/Users/1080p/Desktop/personal projects/Blusense OpenSource';
const manifest = [];
async function convert(input, output, extra = {}) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  const result = await sharp(input).webp({ quality: 90, effort: 6 }).toFile(output);
  const metadata = await sharp(output).metadata();
  if (metadata.format !== 'webp') throw new Error('Expected WebP: ' + output);
  manifest.push({ file: path.relative(portfolio, output).replaceAll('\\', '/'), width:result.width, height:result.height, bytes:result.size, sha256:createHash('sha256').update(await fs.readFile(output)).digest('hex'), ...extra });
}
const openSenseNames=['vehicle-offline-dark','vehicle-demo-dark','climate-dark','media-dark','insights-dark','settings-dark','vehicle-light','climate-light'];
for(const name of openSenseNames) {
  const input=path.join(captureRoot,'opensense',name+'.png');
  const metadata=await sharp(input).metadata();
  if(metadata.width!==1080 || metadata.height!==2400) throw new Error('Rejected compact screenshot: '+input);
  const output=path.join(portfolio,'public/projects/opensense',name+'.webp');
  await convert(input,output,{project:'OpenSense',source:'Android emulator',fontScale:1,simulated:!name.includes('offline')});
  await fs.mkdir(path.join(openSense,'docs/screenshots/2026-10-27'),{recursive:true});
  await fs.copyFile(output,path.join(openSense,'docs/screenshots/2026-10-27',name+'.webp'));
}
const fruitSource='C:/Users/1080p/.codex/generated_images/01a17d76-cbb7-7e12-b944-e5ad8c5a124c/exec-fcd5824a-1525-49c5-9948-c04abd5d24ec.png';
await fs.mkdir(path.join(captureRoot,'pineapple-music'),{recursive:true});
await fs.copyFile(fruitSource,path.join(captureRoot,'pineapple-music/yellow-fruit-original.png'));
await convert(fruitSource,path.join(portfolio,'public/projects/pineapple-music/yellow-fruit-cover.webp'),{project:'Pineapple Music',source:'AI-generated illustration',screenshot:false});
const podiumDir=path.join(captureRoot,'podium');
for(const name of await fs.readdir(podiumDir)) {
  if(!name.endsWith('.jpg'))continue;
  await convert(path.join(podiumDir,name),path.join(portfolio,'public/projects/podium',name.replace('.jpg','.webp')),{project:'Podium',source:'Local browser capture',demoData:true});
}
for(const screen of ['connect','gallery','export','results'])for(const theme of ['light','dark']){
  const name=screen+'-'+theme;
  const input=path.join('C:/Users/1080p/Desktop/ITool/docs/screenshots',name+'.png');
  await convert(input,path.join(portfolio,'public/projects/itool',name+'.webp'),{project:'ITool',source:'Published README screenshot',sourceCommit:'4e4c4838bec8f1dc51fb8323f7389c02a3a09a33',demoData:true});
}
await fs.writeFile(path.join(captureRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({count:manifest.length,bytes:manifest.reduce((sum,x)=>sum+x.bytes,0),projects:Object.fromEntries([...new Set(manifest.map(x=>x.project))].map(project=>[project,manifest.filter(x=>x.project===project).length]))},null,2));

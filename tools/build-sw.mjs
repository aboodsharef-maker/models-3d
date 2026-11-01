import { createServiceWorker } from './sw-template.mjs';
import { readdir,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root=new URL('../dist/',import.meta.url),base='/models-3d/';
async function list(dir,prefix=''){let out=[];for(const entry of await readdir(dir,{withFileTypes:true})){const name=prefix+entry.name;if(entry.isDirectory())out.push(...await list(new URL(entry.name+'/',dir),name+'/'));else if(!['sw.js','version.json'].includes(name))out.push(name);}return out;}
const files=(await list(root)).sort(),hash=createHash('sha256');for(const f of files)hash.update(await readFile(new URL(f,root)));hash.update(await readFile(new URL('./sw-template.mjs',import.meta.url)));const revision=hash.digest('hex').slice(0,16),pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const assets=files.map(f=>base+f);
const sw=createServiceWorker(revision,assets,base);
await writeFile(new URL('sw.js',root),sw);await writeFile(new URL('version.json',root),JSON.stringify({version:pkg.version,revision}));console.log(`TALA offline cache: ${files.length} files, revision ${revision}`);

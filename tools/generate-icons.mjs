import { Resvg } from '@resvg/resvg-js';
import { readFile, writeFile } from 'node:fs/promises';
const svg=await readFile(new URL('../public/assets/app-icon.svg',import.meta.url));
for(const size of [180,192,512])await writeFile(new URL(`../public/assets/icon-${size}.png`,import.meta.url),new Resvg(svg,{fitTo:{mode:'width',value:size}}).render().asPng());
await writeFile(new URL('../public/assets/icon-maskable-512.png',import.meta.url),new Resvg(svg,{fitTo:{mode:'width',value:512}}).render().asPng());
console.log('Generated Android 192/512, maskable 512 and Apple 180 icons.');

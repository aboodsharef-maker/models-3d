(()=>{'use strict';const mv=document.getElementById('model'),svg=document.getElementById('dimension-lines'),ns='http://www.w3.org/2000/svg';let lines=[];
function hotspot(name,p,text){const e=document.createElement('span');e.slot='hotspot-'+name;e.dataset.position=p.map(v=>v+'m').join(' ');e.className=text?'model-label dimension-label':'dimension-anchor';if(text)e.textContent=text;else e.setAttribute('aria-hidden','true');mv.append(e);return e.slot;}
window.setupAnnotations=id=>{mv.querySelectorAll('[slot^="hotspot-"]').forEach(e=>e.remove());svg.replaceChildren();lines=[];document.getElementById('model-key').hidden=id!=='white-cage';if(id!=='white-cage')return;
const dims=[
['width',[-.75,-.1,.66],[.75,-.1,.66],'العرض 150 سم'],
['depth',[-.88,-.08,-.55],[-.88,-.08,.55],'العمق 110 سم'],
['rear',[-.88,0,-.55],[-.88,1.2,-.55],'الخلف 120 سم'],
['front',[.9,0,.55],[.9,1.1,.55],'الأمام 110 سم'],
['door',[-.4,1.115,.58],[.4,1.115,.58],'فتحة الباب 80 × 104 سم']
];
for(const [name,a,b,text]of dims){const sa=hotspot(name+'-a',a),sb=hotspot(name+'-b',b);hotspot(name+'-label',a.map((v,i)=>(v+b[i])/2),text);const path=document.createElementNS(ns,'path');svg.append(path);lines.push({a:sa,b:sb,path});}
const roof=hotspot('roof',[0,1.255,-.1],'سقف عشب · ميل 10 سم للأمام');mv.querySelector('[slot="'+roof+'"]').className='model-label detail-label roof-label';
};
function update(){if(mv.loaded&&mv.queryHotspot&&!document.hidden){for(const line of lines){const a=mv.queryHotspot(line.a)?.canvasPosition,b=mv.queryHotspot(line.b)?.canvasPosition;if(!a||!b)continue;const dx=b.x-a.x,dy=b.y-a.y,n=Math.hypot(dx,dy)||1,x=-dy/n*4,y=dx/n*4;line.path.setAttribute('d',`M${a.x},${a.y}L${b.x},${b.y} M${a.x-x},${a.y-y}L${a.x+x},${a.y+y} M${b.x-x},${b.y-y}L${b.x+x},${b.y+y}`);}}requestAnimationFrame(update);}requestAnimationFrame(update);
})();

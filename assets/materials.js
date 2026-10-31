(()=>{'use strict';
const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
const fixed=n=>Number(n.toFixed(4)).toLocaleString('en-US',{maximumFractionDigits:4});
function table(caption,headers,rows){const wrap=make('div',undefined,'table-scroll');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label',caption);const t=make('table'),cap=make('caption',caption),head=make('thead'),tr=make('tr');headers.forEach(h=>{const th=make('th',h);th.scope='col';tr.append(th);});head.append(tr);const body=make('tbody');rows.forEach(row=>{const tr=make('tr');row.forEach((v,i)=>{const cell=make(i?'td':'th',String(v));if(!i)cell.scope='row';tr.append(cell);});body.append(tr);});t.append(cap,head,body);wrap.append(t);return wrap;}
function section(title,children,open=false){const d=make('details');d.open=open;d.append(make('summary',title),...children);return d;}
window.renderMaterials=id=>{const host=document.getElementById('materials'),data=window.MATERIALS?.[id];host.replaceChildren();host.hidden=!data;if(!data)return;
const head=make('div',undefined,'materials-heading'),title=make('div');title.append(make('p','من العرض إلى التنفيذ','eyebrow'),make('h2',data.title),make('p',data.basis,'materials-basis'));const print=make('button','طباعة قائمة المواد');print.onclick=()=>{const states=[...host.querySelectorAll('details')].map(d=>[d,d.open]);states.forEach(([d])=>d.open=true);const restore=()=>states.forEach(([d,open])=>d.open=open);window.addEventListener('afterprint',restore,{once:true});window.print();};head.append(title,print);host.append(head);
const summary=make('div',undefined,'materials-summary');for(const [n,label]of data.summary){const box=make('div');box.append(make('strong',n),make('span',label));summary.append(box);}host.append(summary,table('قائمة الشراء والملحقات',['المادة','الكمية المطلوبة','ملاحظات التنفيذ'],data.shopping));
const total=data.cuts.reduce((s,r)=>s+r[1]*r[2],0);const cutRows=data.cuts.map(r=>[r[0],r[1],`${r[2]} سم`,`${fixed(r[1]*r[2]/100)} م`,r[3]]);cutRows.push(['الإجمالي',data.cuts.reduce((s,r)=>s+r[1],0),'—',`${fixed(total/100)} م`,'شامل دعامة سقف واحدة.']);
const barRows=data.bars.map((cuts,i)=>{const sum=cuts.reduce((a,b)=>a+b,0),kerf=cuts.length*data.kerfCm;return [`القضيب ${i+1}`,cuts.join(' + ')+' سم',`${fixed(sum)} سم`,`${fixed(kerf)} سم`,`${fixed(600-sum-kerf)} سم`];});
host.append(section('قصّات البوكس وتوزيع قضبان الـ 6 متر',[
table('قصات بوكس 3 × 3 سم',['الاستخدام','العدد','طول القطعة','المجموع','طريقة الحساب'],cutRows),
make('p','أربعة قضبان = 24 م. إجمالي القطع نحو 21.5686 م؛ الباقي النظري 2.4314 م قبل القص، ونحو 2.3744 م بعد احتساب 19 قصّة بعرض 3 مم، وقبل تسوية الأطراف وضبط الوصلات المائلة.','materials-explanation'),
table('خطة توزيع القص على القضبان',['القضيب / 600 سم','القطع المطلوبة','مجموع القطع','هدر الشفرة المفترض','الباقي التقريبي'],barRows)
],true));
const area=data.meshOpenings.reduce((s,r)=>s+r[1]*r[2]*r[3]/10000,0);const openings=data.meshOpenings.map(r=>[r[0],r[1],`${r[2]} × ${r[3]} سم`,`${fixed(r[1]*r[2]*r[3]/10000)} م²`,r[4]]);openings.push(['الإجمالي','—','—',`${fixed(area)} م²`,'أربعة ألواح شراء = 8 م²؛ متبقي المستطيلات نحو 2.6759 م² قبل تشذيب الميل وسماحات القص.']);
host.append(section('تفصيل ألواح الشبك 2 × 1 متر ووصلاتها',[
table('الشبك — أبعاد القص، والجنبان قبل تشذيب الميل',['المكان','العدد','أبعاد الفتحة','المساحة الإجمالية','تجزئة القطع'],openings),
table('خطة قص الألواح — كل لوح 200 × 100 سم',['اللوح','القطع المأخوذة منه / سم','توزيع القص'],data.meshSheets),
make('p','تدعيم الوصلات بالفلات: '+data.flatCuts.map(([l,n])=>`${n} × ${l} سم`).join(' + ')+' = 4.30 م من قضيب واحد بطول 6 م.','materials-explanation')
]));
const notes=make('ul',undefined,'materials-notes');data.notes.forEach(n=>notes.append(make('li',n)));host.append(section('افتراضات الحساب وما يراجع قبل القص',[notes]));
};
})();

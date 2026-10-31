(async()=>{'use strict';
const $=id=>document.getElementById(id),models=window.MODELS||[],mv=$('model');
let current=null,doorOpen=false,motionToken=0,viewerReady=false;
const status=s=>$('message').textContent=s;
function fail(){status('تعذّر تحميل المجسّم. اضغط إعادة المحاولة لتحميل نفس العرض.');$('retry').hidden=false;$('loading').textContent='تعذّر التحميل';}
function select(id,force=false){const item=models.find(x=>x.id===id)||models[0];if(!item)return;if(current?.id===item.id&&!force)return;
current=item;motionToken++;doorOpen=false;window.renderMaterials?.(item.id);$('name').textContent=item.name;$('category').textContent=item.category||'مجسّم ثلاثي الأبعاد';$('description').textContent=item.description||'';$('note').textContent=item.note||'';$('download').href=item.src;$('download').download=item.src.split('/').pop().split('?')[0];$('specs').replaceChildren(...(item.specs||[]).map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));
$('dimensions').classList.toggle('has-front-back',item.dimensions?.length===4);$('dimensions').replaceChildren(...(item.dimensions||[]).map((n,i)=>{const d=document.createElement('div'),v=document.createElement('strong'),l=document.createElement('small');v.textContent=n;l.textContent=(item.dimensionLabels||['العرض / سم','العمق / سم','الارتفاع / سم'])[i];d.append(v,l);return d;}));
mv.setAttribute('alt',item.name);mv.setAttribute('src',item.src);mv.setAttribute('animation-name',item.animation||'');$('motion').hidden=!item.animation;$('motion').textContent='فتح الباب';$('motion').setAttribute('aria-pressed','false');$('retry').hidden=true;
for(const b of $('library').children)b.setAttribute('aria-pressed',String(b.dataset.id===item.id));history.replaceState(null,'','#'+encodeURIComponent(item.id));window.setupAnnotations?.(item.id);status('جاري تحميل المجسّم…');
if(viewerReady){mv.pause();mv.currentTime=0;mv.removeAttribute('auto-rotate');mv.cameraOrbit='32deg 72deg auto';$('rotate').setAttribute('aria-pressed','false');}
}
for(const item of models){const b=document.createElement('button');b.className='model-card';b.dataset.id=item.id;const title=document.createElement('strong'),sub=document.createElement('small');title.textContent=item.name;sub.textContent=item.summaryDimensions||item.dimensions.join(' × ')+' سم';b.append(title,sub);b.onclick=()=>select(item.id);$('library').append(b);}
$('library').hidden=models.length<=1;$('count').textContent=String(models.length).padStart(2,'0');
mv.addEventListener('load',async()=>{mv.animationName=current.animation||'';await mv.updateComplete;if(current.animation)mv.play({repetitions:1});mv.pause();mv.currentTime=0;$('retry').hidden=true;status('المجسّم جاهز · القياسات على الرسم بالسنتيمتر');});mv.addEventListener('error',fail);
$('retry').onclick=()=>{if(!viewerReady){location.reload();return;}$('retry').hidden=true;status('جاري إعادة تحميل نفس المجسّم…');const u=new URL(current.src,location.href);u.searchParams.set('retry',Date.now());mv.src=u.href;};
$('motion').onclick=()=>{if(!viewerReady||!current?.animation)return;doorOpen=!doorOpen;mv.play({repetitions:1});mv.pause();const start=mv.currentTime,end=doorOpen?mv.duration:0,token=++motionToken,t0=performance.now();function step(t){if(token!==motionToken)return;const k=Math.min(1,(t-t0)/1000);mv.currentTime=start+(end-start)*k*k*(3-2*k);if(k<1)requestAnimationFrame(step);}requestAnimationFrame(step);$('motion').textContent=doorOpen?'إغلاق الباب':'فتح الباب';$('motion').setAttribute('aria-pressed',String(doorOpen));};
$('rotate').onclick=()=>{if(!viewerReady)return;const on=!mv.hasAttribute('auto-rotate');mv.toggleAttribute('auto-rotate',on);$('rotate').setAttribute('aria-pressed',String(on));};
$('front').onclick=()=>mv.setAttribute('camera-orbit','0deg 90deg auto');$('side').onclick=()=>mv.setAttribute('camera-orbit','90deg 85deg auto');$('top').onclick=()=>mv.setAttribute('camera-orbit','0deg 5deg auto');
$('reset').onclick=()=>{motionToken++;mv.removeAttribute('auto-rotate');$('rotate').setAttribute('aria-pressed','false');mv.setAttribute('camera-orbit','32deg 72deg auto');mv.setAttribute('field-of-view','auto');if(viewerReady){mv.jumpCameraToGoal();mv.pause();mv.currentTime=0;}doorOpen=false;$('motion').textContent='فتح الباب';$('motion').setAttribute('aria-pressed','false');};
$('show-dimensions').onchange=e=>$('stage').classList.toggle('hide-dimensions',!e.target.checked);$('show-details').onchange=e=>$('stage').classList.toggle('hide-details',!e.target.checked);
$('share').onclick=async()=>{try{await navigator.clipboard.writeText(location.href);status('تم نسخ رابط المجسّم.');}catch{status('انسخ رابط الصفحة من شريط العنوان.');}};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('stage').requestFullscreen();}catch{status('ملء الشاشة غير متاح في هذا المتصفح.');}};
select(decodeURIComponent(location.hash.slice(1)));window.addEventListener('hashchange',()=>select(decodeURIComponent(location.hash.slice(1))));
try{await import('../vendor/model-viewer.min.js');viewerReady=true;}catch{fail();}
})();

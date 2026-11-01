import { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, WifiOff, Check, Smartphone, X } from 'lucide-react';
import { Modal, asset } from './UI';
import { useApp } from '../context';
import { PullToRefresh } from './PullToRefresh';
interface InstallEvent extends Event { prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}> }
export function InstallApp(){const a=useApp(),[prompt,setPrompt]=useState<InstallEvent|null>(null),[help,setHelp]=useState(false),[installed,setInstalled]=useState(()=>matchMedia('(display-mode: standalone)').matches),[offline,setOffline]=useState(false),[updateReady,setUpdateReady]=useState(false),[checking,setChecking]=useState(false),[error,setError]=useState(''),[waiting,setWaiting]=useState<ServiceWorker|null>(null);const [dialogOpen,setDialogOpen]=useState(false);const registration=useRef<ServiceWorkerRegistration|null>(null),safe=useRef(false),changed=useRef(false);safe.current=a.saveStatus==='saved'&&!dialogOpen;
useEffect(()=>{const update=()=>setDialogOpen(!!document.querySelector('dialog[open]'));const observer=new MutationObserver(update);observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});update();return()=>observer.disconnect();},[]);
useEffect(()=>{const install=(e:Event)=>{e.preventDefault();setPrompt(e as InstallEvent);};const installed=()=>{setInstalled(true);setPrompt(null);};window.addEventListener('beforeinstallprompt',install);window.addEventListener('appinstalled',installed);return()=>{window.removeEventListener('beforeinstallprompt',install);window.removeEventListener('appinstalled',installed);};},[]);
useEffect(()=>{if(!('serviceWorker'in navigator)||!import.meta.env.PROD)return;let alive=true,hadController=!!navigator.serviceWorker.controller;const controller=()=>{if(!alive)return;if(!hadController){hadController=true;setOffline(true);return;}changed.current=true;setUpdateReady(true);if(safe.current)location.reload();};navigator.serviceWorker.addEventListener('controllerchange',controller);
navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js',{scope:import.meta.env.BASE_URL,updateViaCache:'none'}).then(reg=>{if(!alive)return;registration.current=reg;const ready=()=>{if(reg.waiting){setWaiting(reg.waiting);setUpdateReady(true);}};ready();reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){if(navigator.serviceWorker.controller)ready();else setOffline(true);}});});navigator.serviceWorker.ready.then(()=>{if(alive)setOffline(true);});void reg.update().catch(()=>{});}).catch(()=>{if(alive)setError('تعذّر تجهيز النسخة دون اتصال. افتحي التطبيق عند توفر الإنترنت.');});
const check=()=>{if(document.visibilityState==='visible'&&navigator.onLine)void registration.current?.update().catch(()=>{});};document.addEventListener('visibilitychange',check);window.addEventListener('online',check);const timer=setInterval(check,15*60*1000);return()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',check);window.removeEventListener('online',check);navigator.serviceWorker.removeEventListener('controllerchange',controller);};},[]);
const install=async()=>{if(!prompt){setHelp(true);return;}try{await prompt.prompt();const result=await prompt.userChoice;if(result.outcome==='accepted')setInstalled(true);setPrompt(null);}catch{setHelp(true);}};
const check=async()=>{setChecking(true);setError('');try{if(!navigator.onLine)throw new Error('اتصلي بالإنترنت للبحث عن تحديث.');if(registration.current){await registration.current.update();a.notify('تم البحث عن نسخة جديدة. سيظهر إشعار عند جاهزيتها.');}else a.notify('تجري تهيئة التحديثات؛ انتظري قليلًا ثم أعيدي المحاولة.');}catch(e){setError(e instanceof Error?e.message:'تعذّر البحث عن تحديث.');}finally{setChecking(false);}};
const refresh=async()=>{
  if(!safe.current||document.querySelector('dialog[open]'))return;
  setError('');
  try{
    if(navigator.onLine&&registration.current){
      const reg=registration.current;
      await reg.update();
      const worker=reg.installing;
      if(worker){
        const installed=await new Promise<boolean>(resolve=>{
          const done=()=>{if(worker.state==='installed'||worker.state==='redundant'){clearTimeout(timer);worker.removeEventListener('statechange',done);resolve(worker.state==='installed');}};
          const timer=setTimeout(()=>{worker.removeEventListener('statechange',done);resolve(false);},15000);
          worker.addEventListener('statechange',done);done();
        });
        if(!installed){a.notify('التحديث لم يجهز بعد؛ سيظهر إشعار عند اكتماله.');return;}
      }
      if(!safe.current||document.querySelector('dialog[open]'))return;
      if(reg.waiting){reg.waiting.postMessage({type:'SKIP_WAITING'});return;}
    }
    if(safe.current&&!document.querySelector('dialog[open]'))location.reload();
  }catch{setError('تعذّر البحث عن تحديث. بياناتكِ محفوظة؛ حاولي مجددًا عند توفر الإنترنت.');}
};
return <><PullToRefresh enabled={a.saveStatus==='saved'&&!dialogOpen&&!checking} onRefresh={refresh}/><section className="install-strip glass" aria-label="تطبيق أندرويد والتحديثات"><img src={asset('app-icon')} alt="أيقونة تطبيق تالا"/><div><strong>{installed?'تطبيق تالا على جهازكِ':'تطبيق تالا لأندرويد'}</strong><small>{offline?'جاهز دون اتصال · التحديث يحافظ على بياناتكِ':'ثبّتيه من Chrome · الأيقونة والدفتر والتحديثات في مكان واحد'}</small></div><small className="pull-refresh-hint">اسحبي من أعلى الصفحة للأسفل للتحديث</small><div className="install-actions">{!installed&&<button className="button soft" onClick={install}><Download size={15}/>تثبيت التطبيق</button>}<button className="icon-button" aria-label="البحث عن تحديث للتطبيق" title="البحث عن تحديث" disabled={checking} onClick={check}><RefreshCw size={17} className={checking?'spin':''}/></button></div></section>{error&&<p className="pwa-error" role="status">{error}</p>}{updateReady&&<div className="update-banner" role="status"><RefreshCw size={20}/><div><strong>نسخة جديدة من تالا جاهزة</strong><small>تظل بياناتكِ على الجهاز. احفظي أي نافذة تعديل قبل التحديث.</small></div><button className="button primary" disabled={a.saveStatus!=='saved'||dialogOpen} onClick={()=>{if(a.saveStatus!=='saved'||document.querySelector('dialog[open]'))return;const next=registration.current?.waiting||waiting;if(next&&next.state!=='activated'&&next.state!=='redundant'){changed.current=false;next.postMessage({type:'SKIP_WAITING'});}else location.reload();}}>تحديث الآن</button></div>}
{help&&<Modal title="تثبيت تالا على أندرويد" onClose={()=>setHelp(false)}><div className="install-help"><img src={asset('app-icon')} alt="أيقونة تالا"/><h3>TALA Study Planner</h3><p>افتحي هذا الرابط في <b>Chrome على جهاز أندرويد</b>، ثم من قائمة ⋮ اختاري <b>تثبيت التطبيق</b> أو <b>إضافة إلى الشاشة الرئيسية ← تثبيت</b>.</p><p>بعدها يفتح تالا من أيقونته كنافذة مستقلة. عند نشر تعديل جديد، افتحي التطبيق متصلة بالإنترنت ليظهر زر «تحديث الآن».</p><p>على الآيفون يمكنكِ استخدام الموقع كالمعتاد، أو إضافته للشاشة الرئيسية من قائمة المشاركة.</p><small>ظهور نافذة التثبيت المباشرة يعتمد على المتصفح. لا يلزم تنزيل ملف APK.</small></div></Modal>}</>;
}

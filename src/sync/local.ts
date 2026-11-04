import type {PlannerData} from '../types';
import {now,uid,validateData} from '../data';
import {equal,journalChanges,merge,type Choices} from './merge';
export const DB_NAME='tala-study-planner',STORE='planner';
export interface Journal {seq:number;changes:Record<string,{seq:number;kind:'upsert'|'delete'}>}
export interface Pending {mutationId:string;baseVersion:number;data:PlannerData;expected:PlannerData;seq:number}
export interface SyncState {protocol:1;endpoint:string;deviceId:string;backupId:string;base:PlannerData|null;version:number;migrated:boolean;pending:Pending|null;lastSynced:string|null}
export async function openLocal():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE);};r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('أغلقي تبويبات تالا الأخرى ثم أعيدي المحاولة.'));});}
export async function getLocal<T>(key:string):Promise<T|undefined>{const db=await openLocal();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}finally{db.close();}}
export async function putLocal(key:string,value:unknown){const db=await openLocal();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,key);tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error||new Error('تعذّر الحفظ المحلي'));});}finally{db.close();}}
export async function withLocalLock<T>(action:()=>Promise<T>):Promise<T>{if(typeof navigator!=='undefined'&&navigator.locks)return navigator.locks.request('tala-sync-storage',action);return action();}
const emptyJournal=():Journal=>({seq:0,changes:{}});
function addChanges(j:Journal,before:PlannerData|null,after:PlannerData){const changes=journalChanges(before,after);if(changes.length){j.seq++;for(const c of changes)j.changes[c.key]={seq:j.seq,kind:c.kind};}return j;}
export async function savePlanner(data:PlannerData,expected?:PlannerData|null):Promise<PlannerData>{return withLocalLock(async()=>{
 const db=await openLocal();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite'),s=tx.objectStore(STORE),read=s.get('personal'),journal=s.get('sync-journal');let result:PlannerData;let failure:Error|undefined;
 read.onsuccess=()=>{journal.onsuccess=save;if(journal.readyState==='done')save();};
 function save(){try{const current=read.result?validateData(read.result):null;result=validateData(data);if(expected!==undefined&&current&&!equal(current,expected)){
   if(!expected)throw new Error('وصل دفتر محفوظ من تبويب آخر؛ لن يُستبدل.');
   const m=merge(expected,result,current);if(!m.data){s.put(data,'backup:unsaved-conflict:'+uid());failure=new Error('تعارض مع تبويب أو جهاز آخر. احتفظنا بنسخة إضافية؛ صدّري نسختكِ قبل إعادة الفتح.');return;}
   result={...m.data,revision:Math.max(current.revision,data.revision)+1,updatedAt:now()};
 }
 s.put(result,'personal');s.put(addChanges(journal.result||emptyJournal(),current,result),'sync-journal');
 }catch(e){failure=e instanceof Error?e:new Error(String(e));tx.abort();}}
 tx.oncomplete=()=>failure?reject(failure):resolve(result);tx.onabort=tx.onerror=()=>reject(failure||tx.error||new Error('تعذّر حفظ الدفتر'));
 });}finally{db.close();}
 });}
export async function ensureSyncState(endpoint:string){const existing=await getLocal<SyncState>('sync-state');if(existing){if(existing.endpoint!==endpoint)throw new Error('عنوان مساحة المزامنة تغيّر؛ لن نربط الدفتر بمساحة أخرى تلقائيًا.');return existing;}const data=validateData(await getLocal('personal')),id=uid(),state:SyncState={protocol:1,endpoint,deviceId:uid(),backupId:id,base:null,version:0,migrated:false,pending:null,lastSynced:null};
 const db=await openLocal();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite'),s=tx.objectStore(STORE);s.put(structuredClone(data),'backup:pre-cloud:'+id);s.put(state,'sync-state');tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);});}finally{db.close();}return state;
}
export async function commitVerified(state:SyncState,sent:PlannerData,version:number,expected:PlannerData,seq:number,choices:Choices={}){
 const db=await openLocal();let adopted:PlannerData|undefined;
 try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite'),s=tx.objectStore(STORE),r=s.get('personal'),j=s.get('sync-journal');let failure:Error|undefined;
 r.onsuccess=()=>{j.onsuccess=commit;if(j.readyState==='done')commit();};
 function commit(){try{const current=validateData(r.result);const rebase=equal(current,expected)?{data:sent,conflicts:[]}:merge(expected,current,sent,[],choices);if(!rebase.data)throw new Error('تغيّر الدفتر أثناء النقل؛ ستُعاد مراجعته دون استبداله.');
 adopted=validateData({...rebase.data,deviceId:current.deviceId,revision:current.revision+1,updatedAt:now()});
 const journal:Journal=j.result||emptyJournal();for(const [key,change]of Object.entries(journal.changes))if(change.seq<=seq)delete journal.changes[key];addChanges(journal,sent,adopted);
 // A checkpoint and its notebook are one atomic transaction, after server read-back verification.
 s.put(adopted,'personal');s.put(journal,'sync-journal');s.put({...state,base:sent,version,migrated:true,pending:null,lastSynced:now()},'sync-state');
 }catch(e){failure=e as Error;tx.abort();}}
 tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(failure||tx.error);
 });}finally{db.close();}
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('tala-cloud-applied',{detail:adopted}));return adopted!;
}
export async function acknowledgeRemote(state:SyncState,remote:PlannerData,version:number,expected:PlannerData,seq:number){return commitVerified(state,remote,version,expected,seq);}
export async function getMigrationBackup(state:SyncState){return validateData(await getLocal('backup:pre-cloud:'+state.backupId));}

import type {PlannerData} from '../types';
import {uid,validateData} from '../data';
import {digest,equal,merge,pristine,emptyLike,journalChanges,type Remote,type Choices,type Conflict} from './merge';
import {ensureSyncState,getLocal,getMigrationBackup,putLocal,commitVerified,type SyncState,type Journal} from './local';
export interface SyncStore {
 read:()=>Promise<PlannerData>; state:()=>Promise<SyncState>; save:(state:SyncState)=>Promise<void>;
 backup:(state:SyncState)=>Promise<PlannerData>; journal:()=>Promise<Journal>;
 commit:(state:SyncState,sent:PlannerData,version:number,expected:PlannerData,seq:number,choices?:Choices)=>Promise<PlannerData>;
 preserve:(local:PlannerData,remote:PlannerData)=>Promise<void>;
}
export function browserStore(endpoint:string):SyncStore{return {read:async()=>validateData(await getLocal('personal')),state:()=>ensureSyncState(endpoint),save:s=>putLocal('sync-state',s),backup:getMigrationBackup,journal:async()=>await getLocal<Journal>('sync-journal')||{seq:0,changes:{}},commit:commitVerified,preserve:async(local,remote)=>{await putLocal('backup:conflict:'+uid(),{local,remote,createdAt:new Date().toISOString()});}};}
export class SyncError extends Error {constructor(public status:number,message:string){super(message);}}
export class Api {
 constructor(public endpoint:string,private fetcher:typeof fetch=(input,init)=>fetch(input,init)){}
 async request(path:string,body?:unknown){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);try{const response=await this.fetcher(this.endpoint+path,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json','X-Tala-Client':'1'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',signal:controller.signal});const json=await response.json();if(!response.ok)throw new SyncError(response.status,json.error||'تعذّر الاتصال بالمزامنة');return json;}finally{clearTimeout(timer);}}
 async remote(version?:number):Promise<Remote>{const value=await this.request('/v1/sync'+(version===undefined?'':'?version='+version));if(!Number.isSafeInteger(value.version)||value.version<0||!Array.isArray(value.tombstones)||value.tombstones.some((k:unknown)=>typeof k!=='string'))throw new Error('استجابة مزامنة غير صالحة');const data=value.data===null?null:validateData(value.data);if((value.version===0)!==(data===null))throw new Error('نسخة سحابية غير مكتملة');if(data&&await digest(data)!==value.digest)throw new Error('لم تتطابق بصمة بيانات السحابة');return {...value,data};}
}
export type SyncStatus='local'|'syncing'|'synced'|'pending'|'conflict'|'error';
export interface SyncView {status:SyncStatus;message:string;conflicts:Conflict[];lastSynced?:string|null}
export class SyncEngine {
 private running=false;
 private resolution:{version:number;hash:string;choices:Choices}|null=null;
 private context:{version:number;hash:string}|null=null;
 view:SyncView={status:'pending',message:'بانتظار المزامنة',conflicts:[]};
 constructor(private store:SyncStore,public api:Api,private changed:(view:SyncView)=>void=()=>{}){}
 private show(status:SyncStatus,message:string,conflicts:Conflict[]=[],lastSynced?:string|null){this.view={status,message,conflicts,lastSynced};this.changed(this.view);}
 resolve(choices:Choices){if(this.context)this.resolution={...this.context,choices};}
 private async choices(version:number,local:PlannerData){const hash=await digest(local);this.context={version,hash};return this.resolution?.version===version&&this.resolution.hash===hash?this.resolution.choices:{};}
 private async conflict(conflicts:Conflict[],local:PlannerData,remote:PlannerData){await this.store.preserve(local,remote);this.show('conflict','تعارض محفوظ يحتاج مراجعة',conflicts);}
 async run(safe:()=>boolean=()=>true){if(this.running||!safe())return;this.running=true;this.show('syncing','جارٍ المزامنة');try{
  let state=await this.store.state();
  // The immutable pre-migration backup is made locally before the first API write.
  const original=await this.store.backup(state),backupHash=await digest(original);
  if(!state.migrated){
   const receipt=await this.api.request('/v1/backups',{id:state.backupId,deviceId:state.deviceId,data:original});
   const saved=await this.api.request('/v1/backups/'+state.backupId);
   if(receipt.digest!==backupHash||saved.digest!==backupHash||await digest(validateData(saved.data))!==backupHash)throw new Error('لم يكتمل التحقق من نسخة الترحيل؛ الدفتر المحلي لم يتغير.');
  }
  let local=await this.store.read();
  if(state.pending){
   const p=state.pending;let receipt;
   try{receipt=await this.api.request('/v1/sync',{...p,expected:undefined,seq:undefined,deviceId:state.deviceId,backupId:state.backupId});}
   catch(e){if(e instanceof SyncError&&e.status===409){state={...state,pending:null};await this.store.save(state);}else throw e;}
   if(receipt){
    // Verify the immutable revision, not just a success response or the latest mutable head.
    const verified=await this.api.remote(receipt.version);if(!verified.data||verified.digest!==await digest(p.data)||receipt.digest!==verified.digest)throw new Error('لم يكتمل التحقق من النقل. ستُعاد نفس العملية بأمان.');
    const choices=await this.choices(verified.version,local),rebased=equal(local,p.expected)?{data:p.data,conflicts:[]}:merge(p.expected,local,p.data,[],choices);
    if(!rebased.data){await this.conflict(rebased.conflicts,local,p.data);return;}
    if(!safe()){this.show('pending','تغييرات محفوظة بانتظار إغلاق نافذة التعديل');return;}
    await this.store.commit(state,p.data,verified.version,p.expected,p.seq,choices);this.resolution=null;state=await this.store.state();local=await this.store.read();
   }
  }
  const remote=await this.api.remote();
  if(state.migrated&&remote.version===state.version&&!journalChanges(state.base,local).length){this.show('synced','تمت المزامنة',[],state.lastSynced);return;}
  // A pristine new browser must not upload the six sample subjects into the shared notebook.
  if(!remote.data&&pristine(local)){this.show('synced','بانتظار أول بيانات في المساحة المشتركة');return;}
  const choices=await this.choices(remote.version,local);
  const result=!remote.data?{data:local,conflicts:[]}:!state.migrated&&pristine(local)?{data:{...remote.data,deviceId:local.deviceId},conflicts:[]}:merge(state.base,local,remote.data,remote.tombstones,choices);
  if(!result.data){await this.conflict(result.conflicts,local,remote.data!);return;}
  if(!safe()){this.show('pending','تغييرات محفوظة بانتظار المزامنة');return;}
  const journal=await this.store.journal();
  if(remote.data&&!journalChanges(remote.data,result.data).length){await this.store.commit(state,remote.data,remote.version,local,journal.seq,choices);this.resolution=null;this.show('synced','تمت المزامنة',[],new Date().toISOString());return;}
  const pending={mutationId:uid(),baseVersion:remote.version,data:result.data,expected:local,seq:journal.seq};
  state={...state,pending};await this.store.save(state);
  const receipt=await this.api.request('/v1/sync',{mutationId:pending.mutationId,baseVersion:pending.baseVersion,data:pending.data,deviceId:state.deviceId,backupId:state.backupId});
  const verified=await this.api.remote(receipt.version);
  if(!verified.data||verified.digest!==await digest(pending.data)||receipt.digest!==verified.digest)throw new Error('لم يتم تأكيد النسخة السحابية بعد؛ البيانات المحلية كاملة ومحفوظة.');
  if(!safe()){this.show('pending','اكتمل النقل؛ بانتظار حفظ التعديل المفتوح');return;}
  await this.store.commit(state,pending.data,verified.version,local,journal.seq,choices);this.resolution=null;this.show('synced','تمت المزامنة',[],new Date().toISOString());
 }catch(e){this.show(e instanceof SyncError&&e.status===409?'pending':'error',e instanceof Error?e.message:'المزامنة بانتظار الاتصال');}finally{this.running=false;}}
}

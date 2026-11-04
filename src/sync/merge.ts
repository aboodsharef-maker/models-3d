import {validateData, initialData} from '../data';
import type {PlannerData} from '../types';
export const collections=['subjects','sections','tasks','notes','exams','prayers','plans','readings'] as const;
export type Collection=typeof collections[number];
export type Row={id:string;[key:string]:unknown};
export interface Conflict {key:string;label:string;local:unknown;remote:unknown}
export type Choices=Record<string,'local'|'remote'>;
export interface Remote {version:number;data:PlannerData|null;digest:string;tombstones:string[]}
export const equal=(a:unknown,b:unknown):boolean=>stable(a)===stable(b);
export function stable(x:unknown):string {if(x===undefined)return 'undefined';if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(stable).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable((x as Record<string,unknown>)[k])).join(',')+'}';}
export async function digest(data:unknown){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(stable(data))))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export function rows(d:PlannerData,c:Collection):Row[]{return (c==='prayers'||c==='plans'||c==='readings'?d.faith[c]:d[c]) as unknown as Row[];}
export const rowKey=(c:Collection,r:Row)=>c==='prayers'?String(r.date):r.id;
export function keys(d:PlannerData){return collections.flatMap(c=>rows(d,c).map(r=>c+'/'+rowKey(c,r)));}
export function emptyLike(d:PlannerData):PlannerData{return {...d,subjects:[],sections:[],tasks:[],notes:[],exams:[],faith:{prayers:[],plans:[],readings:[],activePlanId:null}};}
export function pristine(d:PlannerData){const initial=initialData();return d.revision===0&&equal(d.settings,initial.settings)&&!d.sections.length&&!d.tasks.length&&!d.notes.length&&!d.exams.length&&!d.faith.prayers.length&&!d.faith.plans.length&&!d.faith.readings.length&&equal(d.subjects.map(s=>({name:s.name,icon:s.icon,color:s.color,order:s.order})),initial.subjects.map(s=>({name:s.name,icon:s.icon,color:s.color,order:s.order})));}
export function merge(base:PlannerData|null,local:PlannerData,remote:PlannerData,tombstones:string[]=[],choices:Choices={}){
  const conflicts:Conflict[]=[];
  const choose=(key:string,b:unknown,l:unknown,r:unknown,label=key):unknown=>{
    if(equal(l,r))return l;if(equal(l,b))return r;if(equal(r,b))return l;
    if(choices[key])return choices[key]==='local'?l:r;
    conflicts.push({key,label,local:l,remote:r});return l;
  };
  const out=structuredClone(local),deleted=new Set(tombstones);
  for(const c of collections){
    const bm=new Map((base?rows(base,c):[]).map(r=>[rowKey(c,r),r])),lm=new Map(rows(local,c).map(r=>[rowKey(c,r),r])),rm=new Map(rows(remote,c).map(r=>[rowKey(c,r),r]));const result:Row[]=[];
    for(const id of new Set([...bm.keys(),...lm.keys(),...rm.keys()])){
      const b=bm.get(id),l=lm.get(id),r=rm.get(id),path=c+'/'+id;
      let value:Row|undefined;
      if(!l||!r){
        // A tombstone also protects deletions when this device has never linked before.
        if(l&&!b&&!r&&deleted.has(path)&&!base)value=choose(path,{deleted:true},l,undefined,'عنصر محلي حُذف من المساحة المشتركة') as Row|undefined;
        else value=choose(path,b,l,r,String(l?.title||l?.name||r?.title||r?.name||id)) as Row|undefined;
      }else{
        value={...r};
        for(const field of new Set([...Object.keys(l),...Object.keys(r),...Object.keys(b||{})])){
          if(['id','updatedAt','createdAt'].includes(field))continue;
          if(c==='prayers'&&field==='completed'){
            const bs=new Set((b?.completed||[]) as string[]),ls=new Set(l.completed as string[]),rs=new Set(r.completed as string[]);
            value.completed=['fajr','dhuhr','asr','maghrib','isha'].filter(p=>choose(path+'/completed/'+p,bs.has(p),ls.has(p),rs.has(p))===true);
          }else value[field]=choose(path+'/'+field,b?.[field],l[field],r[field],String(l.title||l.name||id)+' · '+field);
        }
        value.createdAt=[l.createdAt,r.createdAt].sort()[0];value.updatedAt=[l.updatedAt,r.updatedAt].sort().at(-1);
      }
      if(value)result.push(value);
    }
    result.sort((a,b)=>a.id.localeCompare(b.id));
    if(c==='prayers'||c==='plans'||c==='readings')(out.faith[c] as unknown)=result;else (out[c] as unknown)=result;
  }
  for(const k of Object.keys(local.settings) as (keyof PlannerData['settings'])[])(out.settings[k] as unknown)=choose('settings/'+k,base?.settings[k],local.settings[k],remote.settings[k]);
  out.faith.activePlanId=choose('activePlanId',base?.faith.activePlanId??null,local.faith.activePlanId,remote.faith.activePlanId) as string|null;
  // A plan deleted on another device is no longer a valid selection.
  if(!out.faith.plans.some(p=>p.id===out.faith.activePlanId))out.faith.activePlanId=out.faith.plans[0]?.id||null;
  out.createdAt=[local.createdAt,remote.createdAt].sort()[0];
  if(conflicts.length)return {data:null,conflicts};
  try{return {data:validateData(out),conflicts};}catch{
    // Concurrent moves/deletion can break parent links or create a cycle. Never drop descendants.
    if(choices.structure)return {data:validateData(choices.structure==='local'?local:remote),conflicts:[]};
    conflicts.push({key:'structure',label:'تعارض في بنية الأقسام أو حذف عنصر مرتبط. احتفظنا بنسختي الدفتر للاستعادة.',local,remote});
    return {data:null,conflicts};
  }
}
export function journalChanges(before:PlannerData|null,after:PlannerData){const changes:{key:string;kind:'upsert'|'delete'}[]=[];for(const c of collections){const a=new Map((before?rows(before,c):[]).map(r=>[rowKey(c,r),r])),b=new Map(rows(after,c).map(r=>[rowKey(c,r),r]));for(const id of new Set([...a.keys(),...b.keys()]))if(!equal(a.get(id),b.get(id)))changes.push({key:c+'/'+id,kind:b.has(id)?'upsert':'delete'});}if(!before||!equal(before.settings,after.settings))changes.push({key:'settings',kind:'upsert'});if(before?.faith.activePlanId!==after.faith.activePlanId)changes.push({key:'activePlanId',kind:'upsert'});return changes;}

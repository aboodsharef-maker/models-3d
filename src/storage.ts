import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlannerData } from './types';
import { initialData, now, validateData } from './data';
import {equal} from './sync/merge';
import {getLocal,openLocal,savePlanner} from './sync/local';
export const openDB=openLocal;
export async function readData():Promise<PlannerData|null>{const value=await getLocal('personal');return value?validateData(value):null;}
export async function writeData(data:PlannerData):Promise<void>{await savePlanner(data);}
export function usePlanner(){const [data,setData]=useState<PlannerData|null>(null),[error,setError]=useState(''),[saveStatus,setSaveStatus]=useState<'loading'|'saving'|'saved'|'error'>('loading');const queue=useRef(Promise.resolve()),ready=useRef(false),latest=useRef<PlannerData|null>(null),persisted=useRef<PlannerData|null>(null),adopted=useRef<PlannerData|null>(null);
useEffect(()=>{let alive=true;readData().then(value=>{if(!alive)return;const d=value||initialData();persisted.current=value;ready.current=true;latest.current=d;setData(d);setSaveStatus(value?'saved':'saving');}).catch(e=>{if(alive){setError(String(e instanceof Error?e.message:e));setSaveStatus('error');}});return()=>{alive=false;};},[]);
useEffect(()=>{if(!data||!ready.current)return;latest.current=data;if(adopted.current===data){adopted.current=null;return;}setSaveStatus('saving');queue.current=queue.current.catch(()=>{}).then(async()=>{const result=await savePlanner(data,persisted.current);persisted.current=result;if(latest.current===data){setSaveStatus('saved');setError('');if(!equal(result,data)){adopted.current=result;latest.current=result;setData(result);}}}).catch(e=>{setSaveStatus('error');setError('لم يتم الحفظ على الجهاز: '+String(e instanceof Error?e.message:e));});},[data]);
useEffect(()=>{const apply=(event:Event)=>{const next=(event as CustomEvent<PlannerData>).detail;if(latest.current&&persisted.current&&equal(latest.current,persisted.current)){persisted.current=next;adopted.current=next;latest.current=next;setData(next);setSaveStatus('saved');}};window.addEventListener('tala-cloud-applied',apply);return()=>window.removeEventListener('tala-cloud-applied',apply);},[]);
useEffect(()=>{const before=(e:BeforeUnloadEvent)=>{if(saveStatus==='saving'||saveStatus==='error'){e.preventDefault();}};window.addEventListener('beforeunload',before);return()=>window.removeEventListener('beforeunload',before);},[saveStatus]);
const update=useCallback((fn:(d:PlannerData)=>PlannerData)=>setData(prev=>{if(!prev)return prev;const next=fn(prev);return {...next,updatedAt:now(),revision:prev.revision+1};}),[]);
const retry=()=>{if(data){setData({...data});}else location.reload();};
return {data,update,saveStatus,error,retry};}

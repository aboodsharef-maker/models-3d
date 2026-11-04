import type { FaithData, Khatma, PrayerKey, Reading } from './types';
import { daysUntil, entity, now, shiftDate } from './data';
export const prayers:{id:PrayerKey;name:string;hint:string}[]=[{id:'fajr',name:'الفجر',hint:'بداية بنور'},{id:'dhuhr',name:'الظهر',hint:'وقفة سكينة'},{id:'asr',name:'العصر',hint:'وقت للطمأنينة'},{id:'maghrib',name:'المغرب',hint:'شكر آخر النهار'},{id:'isha',name:'العشاء',hint:'ختام بسكينة'}];
export const emptyFaith=():FaithData=>({prayers:[],plans:[],readings:[],activePlanId:null});
export function togglePrayer(faith:FaithData,date:string,prayer:PrayerKey):FaithData {const existing=faith.prayers.find(p=>p.date===date),row=existing||{...entity(),date,completed:[]};return {...faith,prayers:[...faith.prayers.filter(p=>p.date!==date),{...row,updatedAt:now(),completed:row.completed.includes(prayer)?row.completed.filter(p=>p!==prayer):[...row.completed,prayer]}]};}
export function readingProgress(plan:Khatma,readings:Reading[]){const intervals=readings.filter(r=>r.planId===plan.id).map(r=>[Math.max(1,r.fromPage),Math.min(plan.totalPages,r.toPage)]).filter(([a,b])=>a<=b).sort((a,b)=>a[0]-b[0]);const merged:number[][]=[];for(const [a,b]of intervals){const last=merged.at(-1);if(last&&a<=last[1]+1)last[1]=Math.max(last[1],b);else merged.push([a,b]);}const read=merged.reduce((s,[a,b])=>s+b-a+1,0);let next=1;for(const [a,b]of merged){if(a>next)break;next=Math.max(next,b+1);}return {read,remaining:plan.totalPages-read,percent:read===plan.totalPages?100:Math.floor(read/plan.totalPages*100),nextPage:next>plan.totalPages?null:next};}
export function dailyGoal(plan:Khatma,readings:Reading[],date:string){if(date<plan.startDate)return 0;const remaining=readingProgress(plan,readings.filter(r=>r.date<date)).remaining;if(!remaining)return 0;if(!plan.targetDate)return Math.min(20,remaining);return Math.ceil(remaining/Math.max(1,daysUntil(plan.targetDate,date)+1));}
export function deletePlan(faith:FaithData,id:string):FaithData{const plans=faith.plans.filter(p=>p.id!==id);return {...faith,plans,readings:faith.readings.filter(r=>r.planId!==id),activePlanId:faith.activePlanId===id?plans[0]?.id||null:faith.activePlanId};}

export function faithAchievements(f:FaithData,date:string){
 const past=f.prayers.filter(p=>p.date<=date),full=new Set(past.filter(p=>p.completed.length===5).map(p=>p.date));
 let prayerStreak=0;let day=full.has(date)?date:shiftDate(date,-1);while(full.has(day)){prayerStreak++;day=shiftDate(day,-1);}
 const plans=f.plans.map(plan=>({plan,...readingProgress(plan,f.readings.filter(r=>r.date<=date))}));
 const readingDays=new Set(f.readings.filter(r=>r.date<=date).map(r=>r.date)).size;
 return {todayPrayers:past.find(p=>p.date===date)?.completed.length||0,totalPrayers:past.reduce((sum,p)=>sum+p.completed.length,0),fullDays:full.size,prayerStreak,readingDays,plans,completedPlans:plans.filter(p=>p.remaining===0).length,totalPages:plans.reduce((sum,p)=>sum+p.read,0)};
}

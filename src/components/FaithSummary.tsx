import { MoonStar, BookOpen, ArrowUpLeft } from 'lucide-react';
import { useApp } from '../context';
import { today } from '../data';
import { readingProgress, dailyGoal } from '../faith';
export function FaithSummary(){const a=useApp(),f=a.data.faith,date=today(),done=f.prayers.find(p=>p.date===date)?.completed.length||0,plan=f.plans.find(p=>p.id===f.activePlanId)||f.plans[0],read=plan?readingProgress(plan,f.readings.filter(r=>r.date===date)).read:0;return <section className="faith-summary glass"><div><MoonStar size={20}/><span><strong>صلوات اليوم</strong><small>{done} من 5 مسجّلة</small></span></div><div><BookOpen size={20}/><span><strong>وردي من القرآن</strong><small>{plan?`${read} من ${dailyGoal(plan,f.readings,date)} صفحة`:'خطة صغيرة لختمة مباركة'}</small></span></div><button className="text-button" onClick={()=>a.navigate('faith')}>مساحتي الإيمانية <ArrowUpLeft size={15}/></button></section>;}

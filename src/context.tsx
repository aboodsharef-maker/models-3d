import { createContext, useContext } from 'react';
import type { PlannerData, Task, Page } from './types';
import type { Edit } from './components/Forms';
export interface AppContextValue { data:PlannerData; update:(fn:(d:PlannerData)=>PlannerData)=>void; edit:(e:Edit)=>void; confirm:(title:string,text:string,action:()=>void)=>void; notify:(s:string)=>void; toggle:(id:string)=>void; moveTask:(task:Task,n:number)=>void; page:Page; navigate:(p:Page)=>void; subjectId:string; selectSubject:(id:string)=>void; selectedDate:string; setSelectedDate:(d:string)=>void; query:string; saveStatus:string; storageError:string; retry:()=>void }
export const AppContext=createContext<AppContextValue|null>(null);
export function useApp(){const v=useContext(AppContext);if(!v)throw new Error('Missing TALA context');return v;}

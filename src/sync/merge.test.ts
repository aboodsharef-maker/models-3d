import {describe,it,expect} from 'vitest';
import {entity,initialData,emptyDoc} from '../data';
import {merge,pristine,journalChanges} from './merge';
import {emptyFaith,togglePrayer} from '../faith';
const clone=<T>(v:T):T=>structuredClone(v);
const task=()=>({...entity(),subjectId:null,sectionId:null,title:'مهمة قديمة',body:emptyDoc,date:null,done:false,completedAt:null,priority:'normal' as const});
describe('three-way merge without blind timestamp wins',()=>{
 it('merges different task fields and preserves formatting and order',()=>{const b=initialData();b.tasks=[task()];const l=clone(b),r=clone(b);l.tasks[0].done=true;l.tasks[0].completedAt=new Date().toISOString();r.tasks[0].body={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'ملاحظة',marks:[{type:'bold'}]}]}]};r.tasks[0].order=9;const m=merge(b,l,r);expect(m.conflicts).toEqual([]);expect(m.data?.tasks[0]).toMatchObject({done:true,order:9,body:r.tasks[0].body});});
 it('pauses on simultaneous edits to the same rich text',()=>{const b=initialData();b.tasks=[task()];const l=clone(b),r=clone(b);l.tasks[0].title='أ';r.tasks[0].title='ب';r.tasks[0].updatedAt='2099-01-01T00:00:00Z';const m=merge(b,l,r);expect(m.data).toBeNull();expect(m.conflicts).toHaveLength(1);expect(merge(b,l,r,[],{[m.conflicts[0].key]:'local'}).data?.tasks[0].title).toBe('أ');});
 it('never silently resurrects an offline item deleted in the cloud',()=>{const b=initialData();b.tasks=[task()];const l=clone(b),r=clone(b);r.tasks=[];expect(merge(b,l,r).data?.tasks).toEqual([]);l.tasks[0].title='offline edit';expect(merge(b,l,r).data).toBeNull();expect(merge(null,l,r,['tasks/'+l.tasks[0].id]).data).toBeNull();});
 it('deduplicates identical ids and same-day prayer rows across devices',()=>{const b=initialData(),l=clone(b),r=clone(b);l.faith=togglePrayer(emptyFaith(),'2026-11-04','fajr');r.faith=togglePrayer(emptyFaith(),'2026-11-04','dhuhr');const m=merge(b,l,r);expect(m.data?.faith.prayers).toHaveLength(1);expect(m.data?.faith.prayers[0].completed).toEqual(['fajr','dhuhr']);expect(m.data?.subjects).toHaveLength(b.subjects.length);});
 it('blocks invalid parent deletion versus new children instead of dropping them',()=>{const b=initialData(),l=clone(b),r=clone(b);l.sections=[{...entity(),name:'قسم جديد',parentId:null,subjectId:l.subjects[0].id}];r.subjects=r.subjects.slice(1);const m=merge(b,l,r);expect(m.data).toBeNull();expect(m.conflicts[0].key).toBe('structure');});
 it('recognizes only untouched seed notebooks and journals deletions',()=>{const b=initialData();expect(pristine(b)).toBe(true);b.tasks=[task()];expect(pristine(b)).toBe(false);const l=clone(b);l.tasks=[];expect(journalChanges(b,l)).toContainEqual({key:'tasks/'+b.tasks[0].id,kind:'delete'});});
});

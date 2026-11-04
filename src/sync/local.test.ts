import 'fake-indexeddb/auto';
import {beforeEach,describe,expect,it} from 'vitest';
import {initialData,entity,emptyDoc} from '../data';
import {savePlanner,getLocal,ensureSyncState,getMigrationBackup,commitVerified,type Journal,type SyncState,DB_NAME} from './local';
const remove=()=>new Promise<void>((resolve,reject)=>{const r=indexedDB.deleteDatabase(DB_NAME);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});
beforeEach(remove);
describe('durable local migration journal',()=>{
 it('keeps the old IndexedDB document and creates an immutable pre-cloud backup',async()=>{const d=initialData();d.tasks=[{...entity(),subjectId:null,sectionId:null,title:'واجب قديم',body:emptyDoc,date:null,done:false,completedAt:null,priority:'normal'}];await savePlanner(d);const s=await ensureSyncState('https://test.invalid');expect(await getMigrationBackup(s)).toEqual(d);expect(await getLocal('personal')).toEqual(d);await ensureSyncState('https://test.invalid');expect((await getLocal<SyncState>('sync-state'))?.backupId).toBe(s.backupId);});
 it('retains the journal until a verified cloud checkpoint is atomically committed',async()=>{const d=initialData();await savePlanner(d);const s=await ensureSyncState('https://test.invalid'),j=(await getLocal<Journal>('sync-journal'))!;expect(Object.keys(j.changes).length).toBeGreaterThan(0);await commitVerified(s,d,1,d,j.seq);expect(Object.keys((await getLocal<Journal>('sync-journal'))!.changes)).toEqual([]);expect((await getLocal<SyncState>('sync-state'))?.migrated).toBe(true);expect(await getMigrationBackup(s)).toEqual(d);});
 it('merges unsaved local edits arriving after a remote write rather than overwriting it',async()=>{const b=initialData();await savePlanner(b);const remote=structuredClone(b);remote.settings.name='اسم على الجهاز الثاني';await savePlanner(remote);const local=structuredClone(b);local.settings.fontSize=20;const result=await savePlanner(local,b);expect(result.settings).toMatchObject({name:'اسم على الجهاز الثاني',fontSize:20});});
});

import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { readData, writeData } from './storage';
import { initialData } from './data';
describe('IndexedDB persistence',()=>{
it('persists and retrieves a complete notebook without network storage',async()=>{const d=initialData();d.settings.name='اختبار تالا';await writeData(d);expect(await readData()).toEqual(d);});
it('commits a replacement atomically and preserves revisions',async()=>{const d=initialData();await writeData(d);const n={...d,revision:8,subjects:[],settings:{...d.settings,name:'دفتر مُستعاد'}};await writeData(n);const read=await readData();expect(read?.revision).toBe(8);expect(read?.subjects).toEqual([]);expect(read?.settings.name).toBe('دفتر مُستعاد');});
});

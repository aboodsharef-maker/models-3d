import {validateData} from '../src/data';
import {digest,keys,stable} from '../src/sync/merge';
interface Env {DB:D1Database;ALLOWED_ORIGIN:string;READ_ONLY:string}
class HttpError extends Error {constructor(public status:number,message:string){super(message);}}
function check(value:unknown,message='طلب غير صالح'):asserts value {if(!value)throw new HttpError(400,message);}
function identifier(v:unknown):string{if(typeof v!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(v))throw new HttpError(400,'معرف غير صالح');return v;}
const respond=(data:unknown,status=200)=>Response.json(data,{status});
async function body(request:Request){check(request.headers.get('content-type')?.startsWith('application/json'));const reader=request.body?.getReader();check(reader);let size=0;const chunks:Uint8Array[]=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>64_000_000){await reader.cancel();throw new HttpError(413,'الدفتر أكبر من حد النقل؛ لم تُحذف أي بيانات محلية');}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}const text=new TextDecoder().decode(bytes);check(text.length<15_100_000);try{return JSON.parse(text);}catch{throw new HttpError(400,'JSON غير صالح');}}
function pieces(text:string){const result:string[]=[];for(let i=0;i<text.length;i+=250000)result.push(text.slice(i,i+250000));return result;}
function chunkStatements(db:D1Database,table:'chunks'|'backup_chunks',column:'version'|'backup_id',id:number|string,text:string,guard:string,guardArgs:unknown[]){const parts=pieces(text),statements:D1PreparedStatement[]=[];for(let i=0;i<parts.length;i+=8){const group=parts.slice(i,i+8);statements.push(db.prepare(`INSERT INTO ${table} (${column},part,body) SELECT column1,column2,column3 FROM (VALUES ${group.map(()=>'(?,?,?)').join(',')}) WHERE ${guard}`).bind(...group.flatMap((p,j)=>[id,i+j,p]),...guardArgs));}return statements;}
async function getVersion(env:Env,requested?:number){const head=await env.DB.prepare('SELECT version FROM head WHERE id=1').first<{version:number}>();const version=requested??head!.version;if(!version)return {version:0,data:null,digest:'',tombstones:[]};const meta=await env.DB.prepare('SELECT digest,tombstones FROM versions WHERE version=?').bind(version).first<{digest:string;tombstones:string}>();if(!meta)throw new HttpError(404,'النسخة غير موجودة');const parts=await env.DB.prepare('SELECT body FROM chunks WHERE version=? ORDER BY part').bind(version).all<{body:string}>();const snapshot=JSON.parse(parts.results.map(p=>p.body).join(''));return {version,data:validateData(snapshot.data),digest:meta.digest,tombstones:snapshot.tombstones as string[]};}
async function rateLimit(request:Request,env:Env){const ip=request.headers.get('cf-connecting-ip')||'local-test';const key=await digest(ip),window=Math.floor(Date.now()/60000);const row=await env.DB.prepare('INSERT INTO rate_limits(key,window,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN window=excluded.window THEN count+1 ELSE 1 END,window=excluded.window RETURNING count').bind(key,window).first<{count:number}>();if(row!.count>180)throw new HttpError(429,'طلبات كثيرة؛ ستُعاد المحاولة لاحقًا');}
async function route(request:Request,env:Env){
 const url=new URL(request.url),path=url.pathname;
 if(path==='/health'&&request.method==='GET')return respond({app:'TALA shared sync',protocol:1,readOnly:env.READ_ONLY==='true'});
 if(request.method==='OPTIONS')return new Response(null,{status:204});
 if(path==='/v1/sync'&&request.method==='GET'){const version=url.searchParams.get('version');if(version!==null)check(/^\d+$/.test(version));return respond(await getVersion(env,version===null?undefined:Number(version)));}
 if(path==='/v1/history'&&request.method==='GET'){const rows=await env.DB.prepare('SELECT version,created_at,summary FROM versions ORDER BY version DESC LIMIT 30').all();return respond(rows.results);}
 if(path.startsWith('/v1/backups/')&&request.method==='GET'){const id=identifier(path.slice('/v1/backups/'.length));const meta=await env.DB.prepare('SELECT digest,device_id FROM backups WHERE id=?').bind(id).first<{digest:string;device_id:string}>();if(!meta)throw new HttpError(404,'النسخة الاحتياطية غير موجودة');const parts=await env.DB.prepare('SELECT body FROM backup_chunks WHERE backup_id=? ORDER BY part').bind(id).all<{body:string}>();return respond({id,digest:meta.digest,deviceId:meta.device_id,data:validateData(JSON.parse(parts.results.map(p=>p.body).join('')))});}
 if(request.method!=='POST')throw new HttpError(404,'المسار غير موجود');
 if(env.READ_ONLY==='true')throw new HttpError(503,'المزامنة متوقفة مؤقتًا؛ تبقى التعديلات محفوظة على جهازكِ');
 await rateLimit(request,env);
 const input=await body(request);
 if(path==='/v1/backups'){
   const id=identifier(input.id),device=identifier(input.deviceId),data=validateData(input.data),hash=await digest(data),text=JSON.stringify(data);
   const existing=await env.DB.prepare('SELECT digest,device_id FROM backups WHERE id=?').bind(id).first<{digest:string;device_id:string}>();
   if(existing){if(existing.digest!==hash||existing.device_id!==device)throw new HttpError(409,'معرف نسخة مستخدم بمحتوى مختلف');return respond({id,digest:hash});}
   const insert=env.DB.prepare('INSERT INTO backups(id,device_id,digest) VALUES(?,?,?)').bind(id,device,hash);
   await env.DB.batch([insert,...chunkStatements(env.DB,'backup_chunks','backup_id',id,text,'EXISTS(SELECT 1 FROM backups WHERE id=? AND digest=?)',[id,hash])]);
   return respond({id,digest:hash},201);
 }
 if(path==='/v1/sync'){
   const mutation=identifier(input.mutationId),device=identifier(input.deviceId),data=validateData(input.data),hash=await digest(data),backup=identifier(input.backupId);
   check(Number.isSafeInteger(input.baseVersion)&&input.baseVersion>=0);
   const receipt=await env.DB.prepare('SELECT digest,device_id FROM backups WHERE id=?').bind(backup).first<{digest:string;device_id:string}>();check(receipt&&receipt.device_id===device,'نسخة ما قبل الترحيل مطلوبة');
   const oldMutation=await env.DB.prepare('SELECT version,digest,device_id FROM versions WHERE mutation_id=?').bind(mutation).first<{version:number;digest:string;device_id:string}>();
   if(oldMutation){if(oldMutation.digest!==hash||oldMutation.device_id!==device)throw new HttpError(409,'عملية مكررة بمحتوى مختلف');return respond({version:oldMutation.version,digest:hash});}
   const current=await getVersion(env);if(current.version!==input.baseVersion)return respond({error:'VERSION_CONFLICT'},409);
   const version=current.version+1,ids=new Set(keys(data)),tombstones=new Set(current.tombstones);for(const id of current.data?keys(current.data):[])if(!ids.has(id))tombstones.add(id);for(const id of ids)tombstones.delete(id);
   const summary=JSON.stringify({subjects:data.subjects.length,tasks:data.tasks.length,notes:data.notes.length,deleted:current.data?keys(current.data).filter(k=>!ids.has(k)).length:0});
   const guard='EXISTS(SELECT 1 FROM versions WHERE version=? AND mutation_id=?)';
   const insert=env.DB.prepare('INSERT INTO versions(version,mutation_id,device_id,digest,tombstones,summary,backup_id) SELECT ?,?,?,?,?,?,? WHERE (SELECT version FROM head WHERE id=1)=?').bind(version,mutation,device,hash,'chunked',summary,backup,current.version);
   const statements=[insert,...chunkStatements(env.DB,'chunks','version',version,JSON.stringify({data,tombstones:[...tombstones]}),guard,[version,mutation]),env.DB.prepare(`INSERT INTO devices(id,backup_id) SELECT ?,? WHERE ${guard} ON CONFLICT(id) DO NOTHING`).bind(device,backup,version,mutation),env.DB.prepare(`UPDATE head SET version=? WHERE id=1 AND version=? AND ${guard}`).bind(version,current.version,version,mutation)];
   await env.DB.batch(statements);
   const result=await env.DB.prepare('SELECT digest FROM versions WHERE version=? AND mutation_id=?').bind(version,mutation).first();if(!result)return respond({error:'VERSION_CONFLICT'},409);
   return respond({version,digest:hash},201);
 }
 throw new HttpError(404,'المسار غير موجود');
}
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const origin=request.headers.get('origin'),allowed=env.ALLOWED_ORIGIN.split(',').map(s=>s.trim()).includes(origin||'')?origin:null;
 // This notebook is deliberately PUBLIC and shared. CORS is abuse reduction, not identity.
 if(origin&&!allowed)return respond({error:'ORIGIN_NOT_ALLOWED'},403);
 if(request.method==='POST'&&(!origin||!allowed||request.headers.get('x-tala-client')!=='1'))return respond({error:'ORIGIN_REQUIRED'},403);
 let response:Response;try{response=await route(request,env);}catch(e){response=respond({error:e instanceof HttpError?e.message:'تعذّر إتمام المزامنة؛ لم يُحذف الدفتر المحلي'},e instanceof HttpError?e.status:400);}
 const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');headers.set('Vary','Origin');if(allowed){headers.set('Access-Control-Allow-Origin',allowed);headers.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type,X-Tala-Client');headers.set('Access-Control-Max-Age','600');}
 return new Response(response.body,{status:response.status,headers});
}};

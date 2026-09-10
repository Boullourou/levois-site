import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A dedicated runtime excludes production D1 ids, .dev.vars and mail fallbacks.
// This launcher contains no deployment command.
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const runtime=path.join(root,'.wrangler','experience-local');
const assets=path.join(runtime,'site'),functions=path.join(runtime,'functions');
const state=path.join(root,'.wrangler','state','experience-local');
const wrangler=path.join(root,'node_modules','wrangler','bin','wrangler.js');
const astro=path.join(root,'node_modules','astro','bin','astro.mjs');
const args=process.argv.slice(2);
if(args.some(arg=>arg!=='--skip-build'))throw new Error('Only --skip-build is supported. Host and port are fixed to 127.0.0.1:4333.');
const env={...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_SANITIZE:'true'};
for(const name of Object.keys(env))if(/^(CLOUDFLARE_|CF_API_|CF_ACCESS_|COCKPIT_|EXPERIENCE_|RESEND_|LEAD_|FORMSPREE_)/i.test(name))delete env[name];
function run(script,parameters,cwd=root){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,[script,...parameters],{cwd,env,stdio:'inherit',windowsHide:true});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error('Local command failed with code '+code)));});}
function assertInsideRuntime(target){const relative=path.relative(runtime,path.resolve(target));if(!relative||relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Unsafe local runtime target.');}
async function replaceDirectory(target,source){assertInsideRuntime(target);try{const info=await fs.lstat(target);if(info.isSymbolicLink())throw new Error('A local runtime directory must not be a symbolic link.');}catch(error){if(error.code!=='ENOENT')throw error;}await fs.rm(target,{recursive:true,force:true});await fs.cp(source,target,{recursive:true,dereference:false});}
await new Promise((resolve,reject)=>{const server=net.createServer();server.once('error',()=>reject(new Error('Port 4333 is already used. Stop that local service before starting this one.')));server.listen(4333,'127.0.0.1',()=>server.close(resolve));});
if(!args.includes('--skip-build'))await run(astro,['build']);
await fs.access(path.join(root,'dist','index.html'));
await fs.mkdir(runtime,{recursive:true});
await fs.writeFile(path.join(runtime,'package.json'),JSON.stringify({name:'levois-experience-local',private:true,type:'module'}));
const realRoot=await fs.realpath(root),realRuntime=await fs.realpath(runtime);
if(!realRuntime.startsWith(realRoot+path.sep))throw new Error('Runtime directory resolved outside this worktree.');
await replaceDirectory(assets,path.join(root,'dist'));
await replaceDirectory(functions,path.join(root,'functions'));
await replaceDirectory(path.join(runtime,'src'),path.join(root,'src'));
try{await fs.access(path.join(functions,'_middleware.ts'));throw new Error('Root middleware exists; adapt the local guard before restarting.');}catch(error){if(error.code!=='ENOENT')throw error;}
const guard=[
 "export const onRequest=async(context:any)=>{",
 " const url=new URL(context.request.url);",
 " if(url.hostname!=='127.0.0.1')return new Response('Local demonstration is available only at 127.0.0.1.',{status:403});",
 " if(url.pathname==='/__mail-disabled')return new Response('Mail is disabled in the local demonstration.',{status:503});",
 " return context.next();",
 "};",
].join('\n');
await fs.writeFile(path.join(functions,'_middleware.ts'),guard);
// These generated secrets are local, transient between launches and never printed.
const localVars={
 COCKPIT_LOCAL_BYPASS:'1',COCKPIT_ALLOWED_HOSTS:'127.0.0.1',
 COCKPIT_CSRF_SECRET:randomBytes(32).toString('hex'),
 EXPERIENCE_ACCESS_SECRET:randomBytes(32).toString('hex'),
 EXPERIENCE_PUBLIC_ORIGIN:'http://127.0.0.1:4333',
 RESEND_API_KEY:'',FORMSPREE_ENDPOINT:'http://127.0.0.1:4333/__mail-disabled',
 LEAD_FROM:'LEVOIS local <local@example.test>',LEAD_TO:'local@example.test',
 LEAD_FROM_EMAIL:'LEVOIS local <local@example.test>',LEAD_TO_EMAIL:'local@example.test',
};
const config='name = "levois-experience-local"\npages_build_output_dir = "./site"\ncompatibility_date = "2026-08-15"\n\n[[d1_databases]]\nbinding = "RECHERCHE_DB"\ndatabase_name = "levois-experience-local"\ndatabase_id = "00000000-0000-4000-8000-000000004333"\n';
await fs.writeFile(path.join(runtime,'wrangler.toml'),config);
await fs.writeFile(path.join(runtime,'.dev.vars'),Object.entries(localVars).map(([key,value])=>key+'='+JSON.stringify(value)).join('\n')+'\n');
await fs.writeFile(path.join(runtime,'.env'),'');
for(const schema of ['db/schema.sql','db/experience.sql'])await run(wrangler,['d1','execute','levois-experience-local','--local','--persist-to',state,'--file',path.join(root,schema)],runtime);
console.log('\nLEVOIS — local demonstration only');
console.log('Public:   http://127.0.0.1:4333');
console.log('Operator: http://127.0.0.1:4333/cockpit/relectures/');
console.log('D1 persists locally. Mail and OTP delivery are disabled; no production secret is loaded.');
console.log('Re-run after source changes to rebuild this isolated snapshot. Stop with Ctrl+C.\n');
const child=spawn(process.execPath,[wrangler,'pages','dev','site','--local','--ip','127.0.0.1','--port','4333','--persist-to',state],{cwd:runtime,env,stdio:'inherit',windowsHide:true});
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>child.kill(signal));
child.once('error',error=>{console.error(error.message);process.exitCode=1;});
child.once('exit',code=>{process.exitCode=code??0;});

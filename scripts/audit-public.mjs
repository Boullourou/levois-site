import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const phase=process.argv.includes('--before')?'before':'after',out='artifacts/finalization/'+phase,base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4327';
await fs.mkdir(out,{recursive:true});
async function walk(dir){const list=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())list.push(...await walk(f));else if(f.endsWith('.html'))list.push(f)}return list}
const routes=(await walk('dist')).map(f=>f.replaceAll('\\','/').replace(/^dist/,'').replace(/\/index.html$/,'/')).filter(r=>!r.startsWith('/cockpit')).sort();
const b=await chromium.launch({headless:true}),report={phase,base,date:new Date().toISOString(),routes,states:[],errors:[],links:[]},checked=new Set();
try{for(const width of phase==='before'?[1440,390]:[1440,768,390,320]){
 const context=await b.newContext({viewport:{width,height:width===1440?900:width===768?1024:844},reducedMotion:'reduce'});
 const p=await context.newPage();p.setDefaultTimeout(7000);
 p.on('pageerror',e=>report.errors.push({route:p.url(),error:e.message}));
 await p.route(/https:\/\/[^/]*posthog\.com\//,r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
 await p.route('**/api/**',r=>r.request().method()==='POST'?r.fulfill({status:503,contentType:'application/json',body:'{"ok":false,"message":"Simulation locale"}'}):r.continue());
 for(const route of routes){
  try{
   const response=await p.goto(base+route,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
   const state=await p.evaluate(()=>({title:document.title,h1:[...document.querySelectorAll('h1')].map(x=>x.textContent.trim()),main:document.querySelectorAll('main').length,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,images:[...document.images].filter(i=>getComputedStyle(i).display!=='none'&&(!i.complete||!i.naturalWidth)).map(i=>i.currentSrc),forms:[...document.forms].map(f=>({id:f.id,fields:[...f.elements].map(e=>({id:e.id,name:e.name,type:e.type,required:e.required}))})),buttons:[...document.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.textContent.trim()),links:[...document.querySelectorAll('a[href]')].map(a=>({text:a.textContent.trim(),href:a.getAttribute('href')})),robots:document.querySelector('meta[name=robots]')?.content}));
   state.route=route;state.status=response.status();
   if(width===1440||width===390){const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();state.axe=a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));const name=route==='/'?'home':route.replaceAll('/','_').replace(/^_|_$/g,'').replace('.html','');await p.screenshot({path:out+'/'+name+'-'+width+'.png',fullPage:true,animations:'disabled'});}
   if(width===1440)for(const a of state.links){if(!a.href.startsWith('/')||checked.has(a.href))continue;checked.add(a.href);const u=new URL(a.href,base);const rr=await p.request.get(u.href,{maxRedirects:8});report.links.push({from:route,href:a.href,status:rr.status()});}
   report.states.push(state);console.log(width,route,state.status,state.scrollWidth>width?'OVERFLOW':'',state.axe?.map(x=>x.id).join(',')||'');
  }catch(e){report.errors.push({route,width,error:e.message});console.log('FAIL',width,route,e.message.slice(0,150))}
 }
 await context.close();
}}finally{await b.close();await fs.writeFile(out+'/audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({states:report.states.length,routes:routes.length,errors:report.errors.length,broken:report.links.filter(x=>x.status>=400)},null,2));}

if(report.errors.length||report.links.some(x=>x.status>=400)||report.states.some(s=>s.scrollWidth>s.width||s.images.length||s.main!==1||s.axe?.length))process.exitCode=1;

import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.LEVOIS_OBSERVE_URL || 'https://levois.fr';
const phase=process.env.LEVOIS_OBSERVE_PHASE || 'before';
if(!/^(before|after)$/.test(phase))throw Error('Invalid phase');
const local = ['127.0.0.1','localhost'].includes(new URL(base).hostname);
const dir=`artifacts/editorial-20261028/${local ? 'local-' : ''}${phase}`;
await mkdir(dir,{recursive:true});
const paths=['/','/ressources/','/ressources/marge-negociation-erreur-25000/','/situer-ma-vente/','/ma-recherche/','/vendre-et-acheter/','/contact/','/votre-rue/','/robots.txt','/sitemap-index.xml','/sitemap-0.xml','/api/lead','/api/experience/actions'];
const report={base,phase,at:new Date().toISOString(),http:[],mobile:[],performance:[]};
for(const path of paths){const r=await fetch(base+path),body=await r.text();report.http.push({path,status:r.status,url:r.url,headers:Object.fromEntries(['cache-control','cf-cache-status','content-type','x-robots-tag'].map(k=>[k,r.headers.get(k)])),title:body.match(/<title>(.*?)<\/title>/s)?.[1],canonical:body.match(/rel="canonical"[^>]*href="([^"]+)"/)?.[1],description:body.match(/name="description"[^>]*content="([^"]+)"/)?.[1],robots:body.match(/name="robots"[^>]*content="([^"]+)"/)?.[1]});if(path.endsWith('.xml')||path.endsWith('.txt'))await writeFile(`${dir}/${path.slice(1)}`,body);}
const browser=await chromium.launch({headless:true});
for(const width of [360,390,430]){
 const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 for(const path of ['/','/ressources/','/ressources/marge-negociation-erreur-25000/','/contact/']){
  await page.goto(base+path,{waitUntil:'load',timeout:60000});await page.waitForTimeout(1000);
  const state=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,mainCount:document.querySelectorAll('main').length,brokenImages:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src')),h1:[...document.querySelectorAll('h1')].map(e=>e.textContent.trim())}));
  const name=path==='/'?'home':path.split('/').filter(Boolean).at(-1);
  await page.screenshot({path:`${dir}/${name}-${width}.png`,fullPage:true});report.mobile.push({path,width,...state});
 }
 await context.close();
}
for(const path of ['/','/ressources/','/ressources/marge-negociation-erreur-25000/'])for(let run=1;run<=3;run++){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage(),cdp=await context.newCDPSession(page);
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.addInitScript(()=>{window.__metric={lcp:0,cls:0};new PerformanceObserver(l=>{for(const e of l.getEntries())window.__metric.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__metric.cls+=e.value;}).observe({type:'layout-shift',buffered:true});});
 await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(10000);
 const metrics=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0],r=performance.getEntriesByType('resource');return {...window.__metric,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime,ttfb:n.responseStart,encodedBytes:n.encodedBodySize+r.reduce((s,e)=>s+e.encodedBodySize,0),requests:1+r.length};});
 report.performance.push({path,run,...metrics});console.log(`${phase} ${path} run ${run}: LCP ${Math.round(metrics.lcp)} ms, CLS ${metrics.cls}`);await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));await context.close();
}
report.browser=browser.version();report.profile={viewport:'390 × 844',DPR:1,cache:'disabled / new browser context each run',latencyMs:150,downloadMbps:1.6,uploadMbps:.75,cpuSlowdown:4,runs:3,consent:'not granted',INP:'not measured'};
await browser.close();await writeFile(`${dir}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({base,phase,http:report.http,mobile:report.mobile,performance:report.performance},null,2));

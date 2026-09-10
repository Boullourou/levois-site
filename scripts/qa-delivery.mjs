import {chromium,expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true}),base='http://127.0.0.1:4332',dir='docs/design/cible-20260910/preuves',report={performance:[],checks:[],failures:[]};
await mkdir(dir,{recursive:true});
async function check(name,fn){const context=await browser.newContext({viewport:{width:390,height:430},reducedMotion:'reduce'});const page=await context.newPage();try{await fn(page,context);report.checks.push(name);}catch(e){report.failures.push({name,error:e.message.slice(0,1500)});}finally{await context.close();}}
await check('explicit QR Google and recommendation propagate without assuming unknown origins',async page=>{
 for(const[path,source]of [['/carte?src=qr','qr'],['/?src=google','google'],['/bienvenue','recommandation']]){await page.goto(base+path);await expect(page.locator('main a[href^="/ma-recherche"]').first()).toHaveAttribute('href',new RegExp('src='+source));}
 await page.goto(base+'/carte');await expect(page.locator('main a[href^="/ma-recherche"]').first()).not.toHaveAttribute('href',/src=qr/);
});
await check('modal keyboard small height reduced motion long text and print',async(page,context)=>{
 await page.goto(base+'/ma-recherche');await page.locator('input[type=radio]').first().check();await page.locator('[data-read]').click();await page.waitForURL('**/lecture');
 await page.evaluate(()=>{let c=JSON.parse(sessionStorage.getItem('levois:experience:v1'));c.humanNotes=[{id:'long-note',text:'Longue annotation à relire. '+ 'x'.repeat(1000),author:'Mouaad Boullourou',createdAt:c.updatedAt}];sessionStorage.setItem('levois:experience:v1',JSON.stringify(c));});await page.reload();
 await page.locator('[data-action=review]').click();await expect(page.locator('[data-action-dialog]')).toBeVisible();
 await page.locator('[name=question]').fill('Une question précise. '.repeat(100));await page.locator('[name=email]').fill('personne@example.test');await page.locator('[name=approved]').check();await page.locator('[data-action-dialog] [type=submit]').scrollIntoViewIfNeeded();await expect(page.locator('[data-action-dialog] [type=submit]')).toBeInViewport();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
 expect(await page.locator('[name=question]').evaluate(el=>getComputedStyle(el).fontSize)).toBe('16px');
 await page.keyboard.press('Escape');await expect(page.locator('[data-action-dialog]')).not.toBeVisible();await expect(page.locator('[data-action=review]')).toBeFocused();
 await page.setViewportSize({width:320,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(320);
 await page.emulateMedia({media:'print'});await expect(page.locator('.lv-human-notes')).toBeVisible();await expect(page.locator('.lv-keep')).not.toBeVisible();
 await page.screenshot({path:dir+'/impression-lecture.png',fullPage:true});
});
for(const route of ['/','/ma-recherche','/experiences/visites-sans-offre','/votre-rue']){
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),cdp=await context.newCDPSession(page);
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.addInitScript(()=>{window.__metric={lcp:0,cls:0};new PerformanceObserver(list=>{for(const e of list.getEntries())window.__metric.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__metric.cls+=e.value;}).observe({type:'layout-shift',buffered:true});});
 await page.goto(base+route);await page.waitForLoadState('networkidle');
 const measurements=await page.evaluate(()=>{const nav=performance.getEntriesByType('navigation')[0],resources=performance.getEntriesByType('resource');return {...window.__metric,domContentLoaded:nav.domContentLoadedEventEnd,encodedResourceBytes:resources.reduce((n,r)=>n+r.encodedBodySize,0),jsBytes:resources.filter(r=>r.name.endsWith('.js')).reduce((n,r)=>n+r.encodedBodySize,0),requestCount:resources.length};});report.performance.push({route,profile:'Chromium local, cache vide, réseau 1,6 Mb/s, latence 150 ms, CPU ×4',...measurements});await context.close();
}
await browser.close();await writeFile(dir+'/delivery-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;

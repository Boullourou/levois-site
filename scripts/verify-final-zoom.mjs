import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4327';
const root=path.resolve('.impeccable/zoom-extension');
await fs.mkdir(root,{recursive:true});
await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify({manifest_version:3,name:'LEVOIS local zoom verification',version:'1.0',permissions:['tabs'],background:{service_worker:'worker.js'}}));
await fs.writeFile(path.join(root,'worker.js'),`chrome.tabs.onUpdated.addListener((id,info,tab)=>{if(tab.url?.startsWith('${base}')&&info.status==='complete')chrome.tabs.setZoom(id,2);});`);
const context=await chromium.launchPersistentContext(path.resolve('.impeccable/zoom-profile'),{channel:'chromium',headless:true,viewport:null,reducedMotion:'reduce',args:['--window-size=1440,900',`--disable-extensions-except=${root}`,`--load-extension=${root}`]});
const page=context.pages()[0]||await context.newPage();
const results=[];
async function walk(dir){let paths=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())paths.push(...await walk(p));else if(p.endsWith('.html'))paths.push(p)}return paths}
const routes=(await walk('dist')).map(p=>p.replaceAll('\\','/').replace(/^dist/,'').replace(/\/index.html$/,'/')).filter(p=>!p.startsWith('/cockpit')).map(p=>[p,p==='/'?'home':p.replaceAll('/','_')]);
await page.route('https://**.posthog.com/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));

try{
  for(const [route,name] of routes){
    await page.goto(base+route,{waitUntil:'networkidle'});
    const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker',{timeout:10000});
    await worker.evaluate(async(base)=>{const tab=(await chrome.tabs.query({})).find(t=>t.url?.startsWith(base));await chrome.tabs.setZoom(tab.id,1);},base);
    const initial=await page.evaluate(()=>({innerWidth,innerHeight,outerWidth,outerHeight}));
    const session=await context.newCDPSession(page);
    const {windowId}=await session.send('Browser.getWindowForTarget');
    await session.send('Browser.setWindowBounds',{windowId,bounds:{width:initial.outerWidth+1440-initial.innerWidth,height:initial.outerHeight+900-initial.innerHeight}});
    const zoom=await worker.evaluate(async(base)=>{const tabs=await chrome.tabs.query({});const tab=tabs.find(t=>t.url?.startsWith(base));await chrome.tabs.setZoom(tab.id,2);return {tab:tab.id,zoom:await chrome.tabs.getZoom(tab.id)};},base);
    console.log(zoom);
    await expect.poll(()=>page.evaluate(()=>devicePixelRatio)).toBe(2);
    const geometry=await page.evaluate(()=>({innerWidth,innerHeight,devicePixelRatio,scrollWidth:document.documentElement.scrollWidth}));
    expect(geometry.innerWidth).toBe(720);expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.innerWidth);
    await page.screenshot({path:`artifacts/finalization/zoom/${name}-zoom200.png`,fullPage:true});
    if(name==='recherche'){await page.locator('#mr-start').click();await expect(page.locator('#mr-sits')).toBeVisible();}
    results.push({name,...geometry,pass:true});
  }
}finally{await context.close();await fs.writeFile('artifacts/finalization/zoom/zoom200.json',JSON.stringify(results,null,2));console.log(results);}

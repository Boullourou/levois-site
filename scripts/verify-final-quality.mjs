import { chromium, expect } from '@playwright/test';
import fs from 'node:fs/promises';
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4327';
const browser=await chromium.launch({headless:true});
const result={measurements:[],keyboard:[],links:[],assets:[]};
try{
  for(const width of [1440,390])for(const route of ['/','/ma-recherche','/votre-rue','/carte','/situer-ma-vente','/contact']){
    const context=await browser.newContext({viewport:{width,height:width===1440?900:844}});
    await context.addInitScript(()=>{window.__quality={cls:0,lcp:0};new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__quality.cls+=e.value;}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())window.__quality.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});});
    const page=await context.newPage();await page.goto(base+route,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
    const m=await page.evaluate(()=>({...window.__quality,transferBytes:performance.getEntriesByType('resource').reduce((s,r)=>s+r.transferSize,0),resources:performance.getEntriesByType('resource').length,infinite:[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().width>0&&getComputedStyle(el).animationIterationCount==='infinite').map(el=>el.className)}));
    expect(m.cls).toBeLessThan(0.1);expect(m.infinite).toEqual([]);result.measurements.push({route,width,...m});
    if(route==='/ma-recherche'){
      await page.locator('#mr-start').focus();await page.keyboard.press('Enter');await expect(page.locator('.mr-question')).toBeFocused();await page.keyboard.press('Tab');await expect(page.locator('#mr-sits button').first()).toBeFocused();await page.keyboard.press('Space');await expect(page.locator('#mr-types')).toBeVisible();await expect(page.locator('.mr-question')).toBeFocused();result.keyboard.push({width,task:'Start and auto-advance with Enter, Tab and Space',pass:true});
    }
    if(route==='/votre-rue'){
      await page.locator('[data-local-type="Appartement"]').focus();await page.keyboard.press('Space');await expect(page.locator('[data-local-type="Appartement"]')).toHaveAttribute('aria-pressed','true');await page.locator('#rp-commune').focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(page.locator('#rp-commune')).toHaveValue('Chartres');result.keyboard.push({width,task:'Native select and property choice with keyboard',pass:true});
    }
    if(route==='/'&&width===1440){
      const links=await page.locator('a[href^="/"]').evaluateAll(els=>[...new Set(els.map(el=>el.getAttribute('href').split('#')[0]).filter(Boolean))]);
      for(const link of links){const response=await page.request.get(base+link);result.links.push({link,status:response.status()});expect(response.status()).toBe(200);}
    }
    await context.close();
  }
  for(const file of ['public/images/levois-quartier-680.avif','public/images/levois-quartier-1672.avif','public/images/levois-mouaad.webp','public/fonts/satoshi-400.woff2','public/fonts/satoshi-500.woff2','public/fonts/satoshi-700.woff2','public/fonts/archivo-black-latin.woff2']){const s=await fs.stat(file);result.assets.push({file,bytes:s.size});}
}finally{await browser.close();await fs.writeFile('artifacts/finalization/flows/quality.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));}

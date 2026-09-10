import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const out=path.join(path.dirname(fileURLToPath(import.meta.url)),'preuves');
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://127.0.0.1:4340/');await page.waitForLoadState('networkidle');
 for(const screen of ['visites','recherche','lecture','accueil']){
  await page.locator(`.screens [data-screen="${screen}"]`).click();
  for(const frame of page.frames().slice(1))await frame.waitForFunction(s=>document.documentElement.dataset.screen===s,screen);
  if(await page.evaluate(()=>document.activeElement?.tagName==='IFRAME'))throw Error('Un cadre prend le focus de la commande commune');
 }
 for(const size of [320,390]){
  await page.locator(`[data-size="${size}"]`).click();
  await page.waitForFunction(w=>[...document.querySelectorAll('iframe')].every(e=>e.clientWidth===w),size);
 }
 await page.locator('#reset').click();await page.waitForLoadState('networkidle');
 await page.locator('.gallery').screenshot({path:path.join(out,'trois-directions-accueil.png')});
 const boardAxe=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
 const sizes=[];
 for(const width of [390,320,1440]){
  await page.setViewportSize({width,height:844});await page.goto('http://127.0.0.1:4340/');await page.waitForLoadState('networkidle');
  sizes.push({surface:'comparateur',width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  if(width<1000){await page.locator('[data-direction="a-portee"]').click();if(!(await page.locator('[data-id="a-portee"]').isVisible()))throw Error('Sélecteur mobile');}
  await page.goto('http://127.0.0.1:4340/comparaison.html');await page.waitForLoadState('networkidle');
  sizes.push({surface:'dossier',width,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  if(width===1440)await page.screenshot({path:path.join(out,'dossier-comparatif-1440.png')});
 }
 const docAxe=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));
 const links=await page.locator('a[href]').evaluateAll(es=>[...new Set(es.map(e=>e.href))]);
 const missing=[];for(const url of links){const r=await page.request.get(url);if(r.status()!==200)missing.push({url,status:r.status()});}
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4340/plan-vivant/?screen=transition');await page.waitForLoadState('networkidle');
 await page.screenshot({path:path.join(out,'plan-vivant-transition-390.png')});
 await page.screenshot({path:path.join(out,'plan-vivant-transition-390-complet.png'),fullPage:true});
 const report={date:new Date().toISOString(),errors,boardAxe,docAxe,sizes,missing};
 await writeFile(path.join(out,'comparateur-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(errors.length || boardAxe.length || docAxe.length || missing.length || sizes.some(s=>s.overflow))process.exitCode=1;
} finally {await browser.close();}

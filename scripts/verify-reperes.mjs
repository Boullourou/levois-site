import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4327';
const out=path.resolve('artifacts/perspective');
await fs.mkdir(out,{recursive:true});
const report={date:new Date().toISOString(),base,checks:[],console:[],accessibility:[],layouts:[],requests:[],notes:[]};
const browser=await chromium.launch({headless:true});
const sizes=[{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844},{name:'small',width:320,height:844},{name:'tablet',width:768,height:1024}];
async function check(name,fn){try{await fn();report.checks.push({name,pass:true});}catch(e){report.checks.push({name,pass:false,error:e.message});console.log('FAIL',name,e.message.slice(0,250));}}
async function pageFor(size,reducedMotion='reduce'){
  const context=await browser.newContext({viewport:{width:size.width,height:size.height},reducedMotion});
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror',error=>report.console.push({url:page.url(),message:error.message}));
  page.on('console',msg=>{if(msg.type()==='error')report.console.push({url:page.url(),message:msg.text()});});
  // Never transmit a test lead. Exercise the existing response contract locally.
  await page.route('**/api/**',route=>route.request().method()==='POST'?route.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}):route.continue());
  return page;
}
async function shot(page,name,fullPage=false){
  if(fullPage){const y=await page.evaluate(()=>scrollY);await page.evaluate(async()=>{for(const img of document.images){if(getComputedStyle(img).display!=='none'&&img.getBoundingClientRect().width>0){img.loading='eager';try{await img.decode();}catch{}}}});await page.evaluate(y=>scrollTo(0,y),y);}
  await page.mouse.move(0,0);await page.screenshot({path:path.join(out,name+'.png'),fullPage,animations:'disabled'});
}
async function layout(page,name){
  const data=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&s.position!=='fixed'&&s.visibility!=='hidden'&&(r.right>innerWidth+2||r.left< -2);}).slice(0,12).map(el=>({tag:el.tagName,class:el.className,id:el.id})),fonts:document.fonts.status,images:[...document.images].filter(i=>i.getBoundingClientRect().width>0&&i.getBoundingClientRect().top<innerHeight&&i.getBoundingClientRect().bottom>0&&(!i.complete||!i.naturalWidth)).map(i=>i.currentSrc||i.src)}));
  report.layouts.push({name,...data});
  expect(data.scrollWidth,`${name} horizontal overflow`).toBeLessThanOrEqual(data.width+1);
  expect(data.images,`${name} image failure`).toEqual([]);
}
async function axe(page,name){const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();report.accessibility.push({name,violations:r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});}
async function goto(page,route){await page.goto(base+route,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.mouse.move(0,0);}
async function step(page,n){await expect(page.locator('.mr-ecran-int')).toHaveAttribute('data-step',String(n));}
async function journey(page,{budget='280000',capturePrefix}={}){
  await goto(page,'/ma-recherche');await page.locator('#mr-start').click();await step(page,1);
  if(capturePrefix){await shot(page,capturePrefix+'-question');await layout(page,capturePrefix+'-question');await axe(page,capturePrefix+'-question');}
  await page.locator('#mr-sits [data-id="premier"]').click();await step(page,2);
  expect(await page.evaluate(()=>document.activeElement?.className)).toContain('mr-question');
  await page.locator('#mr-types [data-id="Maison"]').click();await step(page,3);
  await page.locator('#mr-cont [data-id="oui"]').click();
  await page.locator('#mr-sects [data-id="tout"]').click();
  await page.locator('#mr-communes').fill('Lèves, Chartres, Champhol');
  await page.locator('#mr-temps [data-id="15"]').click();await page.locator('#mr-nxt').click();await step(page,4);
  await page.locator('#mr-fin [data-id="estime"]').click();await page.locator('#mr-vente [data-id="non"]').click();await page.locator('#mr-horizon [data-id="3_6"]').click();await page.locator('#mr-nxt').click();await step(page,5);
  await page.locator('#mr-bgt').fill('-5');await expect(page.locator('#mr-nxt')).toBeDisabled();await expect(page.locator('#mr-bgt')).toHaveAttribute('aria-invalid','true');
  if(capturePrefix)await shot(page,capturePrefix+'-error');
  await page.locator('#mr-bgt').fill(budget);await page.locator('#mr-nxt').click();await step(page,6);
  await page.locator('#mr-surf').fill('100');await page.locator('#mr-nxt').click();await step(page,7);
  if(capturePrefix){await shot(page,capturePrefix+'-market');await layout(page,capturePrefix+'-market');await axe(page,capturePrefix+'-market');}
  await page.locator('#mr-nxt').click();await step(page,8);
  for(const id of ['localisation','cadre','budget'])await page.locator(`#mr-prs [data-id="${id}"]`).click();
  await page.locator('#mr-nxt').click();
  if(await page.locator('.mr-ecran-int').getAttribute('data-step')==='9'){if(capturePrefix)await shot(page,capturePrefix+'-tradeoff');await page.locator('#mr-chem [data-id="surface"]').click();}
  await step(page,10);
  await expect(page.locator('#mr-ecran')).toContainText('Lèves, Chartres, Champhol');
  await expect(page.locator('#mr-ecran input')).toHaveCount(0);
  if(capturePrefix){await shot(page,capturePrefix+'-summary');await shot(page,capturePrefix+'-summary-full',true);await layout(page,capturePrefix+'-summary');await axe(page,capturePrefix+'-summary');}
}
try{
  for(const size of sizes){
    for(const [route,slug] of [['/','home'],['/ma-recherche','recherche'],['/votre-rue','territoire']]){
      const page=await pageFor(size);
      await check(`${slug} ${size.name}`,async()=>{await goto(page,route);await layout(page,`${slug}-${size.name}`);await shot(page,`${slug}-${size.name}`);await shot(page,`${slug}-${size.name}-full`,true);if(['desktop','mobile'].includes(size.name))await axe(page,`${slug}-${size.name}`);});
      await page.context().close();
    }
  }
  for(const size of sizes){
    const page=await pageFor(size);
    await check(`Full buyer flow ${size.name}`,async()=>{await journey(page,{budget:size.name==='small'?'120000':'280000',capturePrefix:`recherche-${size.name}`});});
    await check(`Buyer consent gate ${size.name}`,async()=>{await page.locator('#mr-nxt').click();await step(page,11);await expect(page.locator('#mr-sub')).toBeDisabled();await layout(page,`contact-${size.name}`);});
    await page.context().close();
  }
  const dataPage=await pageFor(sizes[0]);
  await check('Commune and property selectors use real DVF series',async()=>{
    await goto(dataPage,'/votre-rue');
    const summary=JSON.parse(await fs.readFile('src/data/dvf-market-summary.json','utf8'));
    for(const commune of summary.selectors.communes){for(const type of summary.selectors.propertyTypes){await dataPage.selectOption('#rp-commune',commune);await dataPage.locator(`[data-local-type="${type}"]`).click();const series=summary.series.find(s=>s.commune===commune&&s.propertyType===type);await expect(dataPage.locator('#rp-local-median')).toHaveText(series.latest.pricePerSqm.median===null?'Non calculable':series.latest.pricePerSqm.median.toLocaleString('fr-FR'));}}
    await dataPage.locator('.rp-chart-table summary').click();await expect(dataPage.locator('#rp-local-table tr')).toHaveCount(5);
  });
  await check('Empty address gives recovery',async()=>{await dataPage.locator('#vr-submit').click();await expect(dataPage.locator('#vr-geo-erreur')).toBeVisible();});
  await check('Real address lookup and recorded sales',async()=>{
    await dataPage.locator('#vr-adresse').fill('9 allée du Clos Renault, Lèves');
    await dataPage.locator('#vr-submit').click();
    const choice=dataPage.locator('#vr-suggestions [role=option]').first();await expect(choice).toBeVisible({timeout:20000});const selectedLabel=await choice.locator('.vr-sug-sub').count()?await choice.evaluate(el=>el.childNodes[0].textContent):await choice.textContent();await choice.click();
    await expect(dataPage.locator('.vr-head-adr')).toBeVisible({timeout:25000});
    await dataPage.locator('.vr-details summary').click();await expect(dataPage.locator('.vr-autre')).not.toHaveCount(0);
    await shot(dataPage,'territoire-desktop-address');await shot(dataPage,'territoire-desktop-address-full',true);await layout(dataPage,'address-desktop');await axe(dataPage,'address-desktop');
    await dataPage.setViewportSize({width:390,height:844});await layout(dataPage,'address-mobile');await shot(dataPage,'territoire-mobile-address');
  });
  await dataPage.context().close();
  const keyPage=await pageFor(sizes[1]);
  await check('Keyboard skip, mobile menu and Escape',async()=>{await goto(keyPage,'/');await keyPage.keyboard.press('Tab');await expect(keyPage.locator('.rp-skip')).toBeFocused();await keyPage.keyboard.press('Enter');await expect(keyPage.locator('#contenu')).toBeFocused();await keyPage.locator('.rp-menu-toggle').focus();await keyPage.keyboard.press('Enter');await expect(keyPage.locator('#rp-mobile-nav')).toBeVisible();await keyPage.keyboard.press('Escape');await expect(keyPage.locator('#rp-mobile-nav')).toBeHidden();await expect(keyPage.locator('.rp-menu-toggle')).toBeFocused();await shot(keyPage,'home-mobile-focus');});
  await keyPage.context().close();
  const motion=await pageFor(sizes[0],'no-preference');
  await check('Ordinary motion flow and visible default content',async()=>{await journey(motion);await expect(motion.locator('.mr-relecture')).toBeVisible();const infinite=await motion.evaluate(()=>[...document.querySelectorAll('body *')].filter(el=>el.getBoundingClientRect().width>0&&getComputedStyle(el).animationIterationCount==='infinite').map(el=>el.className));expect(infinite).toEqual([]);});
  await check('Editable summary retains answers and recalculates',async()=>{
    await motion.locator('[data-revisit="5"]').click();await step(motion,5);await expect(motion.locator('#mr-bgt')).toHaveValue('280000');await motion.locator('#mr-bgt').fill('310000');await motion.locator('#mr-nxt').click();await step(motion,6);await expect(motion.locator('#mr-surf')).toHaveValue('100');await motion.locator('#mr-nxt').click();await step(motion,7);await expect(motion.locator('.mr-pos-val')).toHaveText('3 100');await motion.locator('#mr-nxt').click();await step(motion,8);await expect(motion.locator('#mr-prs .actif')).toHaveCount(3);await motion.locator('#mr-nxt').click();await step(motion,10);
  });
  await check('Contact failure and recovery with intercepted API only',async()=>{
    await motion.locator('#mr-nxt').click();await step(motion,11);
    await motion.locator('#mr-prenom').fill('Test local');await motion.locator('#mr-contact').fill('qa@example.invalid');await motion.locator('#mr-consent-lecture').check();
    let attempts=0;await motion.route('**/api/recherche',async route=>{attempts++;const payload=route.request().postDataJSON();expect(payload.budget).toBe(310000);expect(payload.consents.lecture).toBe(true);expect(payload.consents.contact).toBe(false);await route.fulfill({status:200,contentType:'application/json',body:attempts===1?'{"ok":false,"message":"Test local"}':'{"ok":true}'});});
    await motion.locator('#mr-sub').click();await expect(motion.locator('#mr-err')).toBeVisible();await expect(motion.locator('#mr-contact')).toHaveValue('qa@example.invalid');await shot(motion,'recherche-desktop-submit-error');await motion.locator('#mr-sub').click();await step(motion,12);await expect(motion.locator('#mr-ecran')).toContainText('Votre recherche a changé de nature');expect(attempts).toBe(2);
  });
  await motion.context().close();
  const retry=await pageFor(sizes[1]);
  await check('Offline DVF preserves input and offers retry',async()=>{
    await retry.route('**/data/dvf-secteur.json',route=>route.fulfill({status:200,contentType:'application/json',body:'invalid-json'}));
    await goto(retry,'/ma-recherche');await retry.locator('#mr-start').click();await retry.locator('#mr-sits [data-id="premier"]').click();await retry.locator('#mr-types [data-id="Maison"]').click();await retry.locator('#mr-cont [data-id="non"]').click();await retry.locator('#mr-nxt').click();await retry.locator('#mr-fin [data-id="estime"]').click();await retry.locator('#mr-vente [data-id="non"]').click();await retry.locator('#mr-horizon [data-id="3_6"]').click();await retry.locator('#mr-nxt').click();await retry.locator('#mr-bgt').fill('280000');await retry.locator('#mr-nxt').click();await retry.locator('#mr-surf').fill('100');await retry.locator('#mr-nxt').click();await expect(retry.locator('.rp-data-error')).toBeVisible();await expect(retry.locator('#mr-surf')).toHaveValue('100');await retry.unroute('**/data/dvf-secteur.json');await retry.locator('#mr-nxt').click();await step(retry,7);
  });
  await retry.context().close();
} finally {
  await browser.close();
  await fs.writeFile(path.join(out,'verification.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({checks:report.checks,console:report.console,accessibility:report.accessibility.map(x=>({name:x.name,violations:x.violations.map(v=>v.id)})),out},null,2));
}
if(report.checks.some(c=>!c.pass)||report.console.length||report.accessibility.some(x=>x.violations.length))process.exitCode=1;

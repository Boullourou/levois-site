import {chromium,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const base='http://127.0.0.1:4327',out='artifacts/finalization/flows';
const browser=await chromium.launch({headless:true});
const report={checks:[],accessibility:[],errors:[],layouts:[]};
const features=[
 {type:'Feature',properties:{label:'9 Rue du Petit Réau 28300 Lèves',city:'Lèves',postcode:'28300',citycode:'28209'},geometry:{type:'Point',coordinates:[1.482,48.474]}},
 {type:'Feature',properties:{label:'9 Rue de la Paix 28300 Lèves',city:'Lèves',postcode:'28300',citycode:'28209'},geometry:{type:'Point',coordinates:[1.483,48.469]}}
];
async function check(name,fn){try{await fn();report.checks.push({name,pass:true});console.log('PASS',name)}catch(e){report.checks.push({name,pass:false,error:e.message});console.log('FAIL',name,e.message.slice(0,300))}}
async function open(width=1440){const context=await browser.newContext({viewport:{width,height:width===1440?900:844},reducedMotion:'reduce'});const p=await context.newPage();p.setDefaultTimeout(12000);p.on('pageerror',e=>report.errors.push(e.message));await p.route('**/api/**',r=>r.request().method()==='POST'?r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}):r.continue());return p}
async function axe(p,name){const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();report.accessibility.push({name,violations:a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});}
async function layout(p,name){const x=await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));report.layouts.push({name,...x});expect(x.scrollWidth).toBeLessThanOrEqual(x.width);}
try{
for(const width of [1440,390]){
 const p=await open(width);
 await p.route('https://data.geopf.fr/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({type:'FeatureCollection',features})}));
 await check('Explicit address, keyboard selection and source — '+width,async()=>{
  await p.goto(base+'/?src=video',{waitUntil:'networkidle'});await expect(p.locator('.rp-contact')).toBeVisible();await expect(p.locator('.rp-contact')).toContainText('Mouaad');
  await p.locator('#home-explore').click();await p.locator('#home-adresse').fill('9 rue');await expect(p.locator('#home-address-list')).toBeVisible();await axe(p,'address-suggestions-'+width);await layout(p,'suggestions-'+width);
  await p.screenshot({path:out+'/home-'+width+'-suggestions.png'});
  expect(p.url()).not.toContain('votre-rue');await p.locator('#home-adresse').press('ArrowDown');await p.locator('#home-adresse').press('ArrowDown');await p.locator('#home-adresse').press('Enter');
  await p.waitForURL('**/votre-rue?**');expect(new URL(p.url()).searchParams.get('q')).toBe(features[1].properties.label);expect(new URL(p.url()).searchParams.get('src')).toBe('video');
  await expect(p.locator('.vr-head-adr')).toHaveText(features[1].properties.label,{timeout:25000});await layout(p,'street-result-'+width);await axe(p,'street-result-'+width);
  await p.screenshot({path:out+'/rue-'+width+'-confirmed-result.png',fullPage:true});
  if(width===1440){const box=await p.locator('.vr-results>.vr-block').first().boundingBox();expect(box.width).toBeGreaterThan(500);expect(box.width).toBeLessThan(650);}
 });
 await check('No silent first geocoder hit — '+width,async()=>{
  await p.goto(base+'/votre-rue?q=9+rue&src=publicite',{waitUntil:'networkidle'});await expect(p.locator('#vr-suggestions')).toBeVisible();await expect(p.locator('.vr-head-adr')).toHaveCount(0);
  await p.locator('#vr-submit').click();await expect(p.locator('#vr-suggestions')).toBeVisible();await expect(p.locator('.vr-head-adr')).toHaveCount(0);
  await p.locator('#vr-suggestions [role=option]').nth(1).click();await expect(p.locator('.vr-head-adr')).toHaveText(features[1].properties.label,{timeout:25000});
 });
 await check('Map controls use the same real commune data — '+width,async()=>{
  const summary=JSON.parse(await fs.readFile('src/data/dvf-market-summary.json','utf8'));for(const name of ['Chartres','Lucé','Lèves','Luisant','Champhol','Mainvilliers','Le Coudray']){
   await p.locator('[data-map-choice="'+name+'"]').click();await expect(p.locator('#rp-commune')).toHaveValue(name);await expect(p.locator('[data-map-choice="'+name+'"]')).toHaveAttribute('aria-pressed','true');
   const s=summary.series.find(s=>s.commune===name&&s.propertyType==='Maison');await expect(p.locator('#rp-local-median')).toHaveText(s.latest.pricePerSqm.median.toLocaleString('fr-FR'));
  }
 });
 await check('Local fact, single action, marker and recommendation context — '+width,async()=>{
  await p.goto(base+'/?src=recommandation',{waitUntil:'networkidle'});await expect(p.locator('#votre-projet [role=tab]')).toHaveCount(0);await expect(p.locator('#votre-projet a')).toHaveCount(1);await expect(p.locator('#votre-projet a')).toHaveText('Explorer les ventes locales');await expect(p.locator('#votre-projet a')).toHaveAttribute('href','/votre-rue?src=recommandation');
  await expect(p.locator('#home-projects a').first()).toHaveAttribute('href','/ma-recherche?src=recommandation');await expect(p.locator('#home-projects a').nth(1)).toHaveAttribute('href','/situer-ma-vente?src=recommandation');
  await p.locator('.world-marker button').click();await expect(p.locator('#world-marker-detail')).toBeVisible();await p.keyboard.press('Escape');await expect(p.locator('#world-marker-detail')).toBeHidden();
 });
 await check('Business card actions and downloadable vCard — '+width,async()=>{
  await p.goto(base+'/carte',{waitUntil:'networkidle'});await expect(p.locator('.world-card-intro .world-button')).toHaveAttribute('href','/contact?src=carte');await expect(p.locator('.world-card-phone')).toHaveAttribute('href','tel:+33781380121');await expect(p.locator('.world-card-next a').first()).toHaveAttribute('href','/votre-rue?src=carte');
  const download=p.waitForEvent('download');await p.locator('.world-card-save').click();const d=await download;expect(d.suggestedFilename()).toBe('mouaad-boullourou.vcf');const content=await fs.readFile(await d.path(),'utf8');expect(content).toContain('+33781380121');expect(content).toContain('mouaad@levois.fr');await axe(p,'carte-'+width);
 });
 await check('Contact consent, intercepted failure and recovery — '+width,async()=>{
  await p.goto(base+'/contact?src=carte',{waitUntil:'networkidle'});await axe(p,'contact-'+width);let attempts=0;
  await p.route('**/api/lead',async r=>{attempts++;const body=r.request().postDataJSON();expect(body.email).toBe('qa@example.invalid');expect(body.type).toBe('contact');await r.fulfill({status:attempts===1?503:200,contentType:'application/json',body:attempts===1?'{"message":"Test local : réessayez."}':'{"ok":true}'})});
  for(const [id,value] of [['c-prenom','Test'],['c-nom','Local'],['c-email','qa@example.invalid'],['c-objet','Vérification locale'],['c-message','Message simulé, jamais transmis.']])await p.locator('#'+id).fill(value);
  await p.locator('#c-envoyer').click();expect(attempts).toBe(0);await p.locator('#c-consentement').check();await p.locator('#c-envoyer').click();await expect(p.locator('#c-erreur')).toBeVisible();await expect(p.locator('#c-message')).toHaveValue('Message simulé, jamais transmis.');await p.locator('#c-envoyer').click();await expect(p.locator('#c-succes')).toBeVisible();expect(attempts).toBe(2);
 });
 await check('Seller workflow to a useful result before contact — '+width,async()=>{
  await p.goto(base+'/situer-ma-vente?src=video',{waitUntil:'networkidle'});await axe(p,'seller-entry-'+width);await p.locator('#liste-situations button').first().click();await expect(p.locator('#vue-question')).toBeVisible();
  for(let n=0;n<15;n++){if(p.url().includes('/resultat'))break;if(await p.locator('#vue-transition').isVisible()){await p.waitForURL('**/situer-ma-vente/resultat?**');break;}await expect(p.locator('#q-options button').first()).toBeVisible();await p.locator('#q-options button').first().click();await p.waitForTimeout(220);}
  await p.waitForURL('**/situer-ma-vente/resultat?**');expect(new URL(p.url()).searchParams.get('src')).toBe('video');await expect(p.locator('#r-reformulation')).not.toBeEmpty();await expect(p.locator('#r-limite')).not.toBeEmpty();expect(await p.locator('.rp-header').count()).toBe(1);
  const before=await p.locator('#r-action').boundingBox(),after=await p.locator('#form-lead').boundingBox();expect(before.y).toBeLessThan(after.y);await layout(p,'seller-result-'+width);await axe(p,'seller-result-'+width);await p.screenshot({path:out+'/vente-'+width+'-result.png',fullPage:true});
 });
 await p.close();
}
const p=await open(390);
await check('Address service unavailable is actionable',async()=>{await p.route('https://data.geopf.fr/**',r=>r.fulfill({status:503,body:''}));await p.goto(base+'/',{waitUntil:'networkidle'});await p.locator('#home-explore').click();await p.locator('#home-adresse').fill('9 rue');await expect(p.locator('#home-address-status')).toContainText('Réessayez');await expect(p.locator('#home-adresse')).toHaveValue('9 rue');await expect(p.locator('#home-address-list')).toBeHidden();});
await p.close();
}finally{await browser.close();await fs.writeFile(out+'/conversion.json',JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks.length,failed:report.checks.filter(c=>!c.pass),accessibility:report.accessibility.filter(a=>a.violations.length),errors:report.errors},null,2));}
if(report.checks.some(c=>!c.pass)||report.accessibility.some(a=>a.violations.length)||report.errors.length)process.exitCode=1;

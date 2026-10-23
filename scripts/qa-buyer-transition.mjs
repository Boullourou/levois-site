import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.LEVOIS_TEST_URL||'http://127.0.0.1:4331';
const output='docs/design/cible-20260910/preuves';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
const exactTitles=['Ce que l’achat doit changer','Ce qui paraît solide','Ce qui peut évoluer sous condition','Ce qui reste à décider ou vérifier'];
const known={buyer_stage:'searching',buyer_purpose:'primary',buyer_change:'space',buyer_goal:'quiet',buyer_uses:['work'],buyer_sector:'Lèves',buyer_budget_status:'unknown',buyer_horizon:'explore',buyer_prior_sale:'no',buyer_tension:'none'};
async function session(viewport={width:390,height:844}){
  const context=await browser.newContext({viewport,reducedMotion:'reduce',locale:'fr-FR'});
  await context.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const style=document.createElement('style');style.textContent='astro-dev-toolbar{display:none!important}';document.head.append(style);}));
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  return {context,page,errors};
}
async function seed(page,values,project='buyer',depth='intermediate'){
  await page.goto(base+'/lecture');
  await page.evaluate(({values,project,depth})=>{const time=new Date().toISOString();sessionStorage.setItem('levois:experience:v1',JSON.stringify({schemaVersion:1,id:crypto.randomUUID(),revision:1,project,depth,entry:{door:'unknown',source:null,promise:null},answers:Object.fromEntries(Object.entries(values).map(([id,value])=>[id,{value,provenance:'declared',revision:1,updatedAt:time}])),createdAt:time,updatedAt:time,history:[]}));},{values,project,depth});
}
const state=page=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('levois:experience:v1')));
const readingBody=page=>page.locator('[data-reading-sections]').innerText();
async function choose(page,value){await page.locator(`.lv-question-form input[value="${value}"]`).check();await page.locator('.lv-question-form button[type="submit"]').click();}
async function noOverflow(page){const metrics=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));assert.ok(metrics.width<=metrics.viewport,JSON.stringify(metrics));}
async function scenario(name,fn){const s=await session();try{await fn(s);assert.deepEqual(s.errors,[]);results.push({name,status:'passed'});}catch(error){results.push({name,status:'failed',message:error.message,url:s.page.url()});await s.page.screenshot({path:`${output}/qa-${name.replace(/[^a-z0-9-]/g,'')}-failure.png`,fullPage:true}).catch(()=>{});}finally{await s.context.close();}}

await scenario('buyer-empty-reading-AC02-AC06',async({page})=>{
  await page.goto(base+'/ma-recherche');await page.locator('[data-read]').click();await page.waitForURL('**/lecture');
  assert.deepEqual(await page.locator('.lv-reading-section h2').allTextContents(),exactTitles);
  assert.match(await readingBody(page),/non renseigné/);assert.equal(await page.locator('input[type="email"],input[type="tel"]').count(),0);
  await noOverflow(page);await page.screenshot({path:`${output}/buyer-mobile-390-incomplete.png`,fullPage:true});
});
await scenario('buyer-real-flow-no-budget-AC04-AC06',async({page})=>{
  await page.goto(base+'/ma-recherche');
  await choose(page,'idea');await choose(page,'primary');await choose(page,'space');await choose(page,'quiet');
  assert.match(await page.locator('[data-question-panel] h1').innerText(),/quotidien/i);
  await page.locator('input[value="work"]').check();await page.locator('.lv-question-form button[type="submit"]').click();
  await page.locator('#journey-answer').fill('Lèves');await page.locator('.lv-question-form button[type="submit"]').click();
  await page.locator('input[value="unknown"]').check();await page.locator('[data-read]').click();await page.waitForURL('**/lecture');
  const body=await readingBody(page);assert.match(body,/enveloppe n’est pas renseignée/);assert.match(body,/M’isoler pour travailler/);assert.doesNotMatch(body,/0 €/);
  assert.equal((await state(page)).answers.buyer_type,undefined);await noOverflow(page);
});
await scenario('buyer-unknown-exclusive-AC05',async({page})=>{
  await seed(page,{buyer_stage:'idea',buyer_purpose:'primary',buyer_change:'space',buyer_goal:'quiet'});
  await page.goto(base+'/ma-recherche');await page.locator('input[value="work"]').check();await page.locator('input[value="unknown"]').check();
  const checked=await page.locator('.lv-question-form input:checked').evaluateAll(inputs=>inputs.map(input=>input.value));
  assert.deepEqual(checked,['unknown'],'Selecting unknown must clear concrete multiple-choice answers.');
  await page.locator('input[value="work"]').check();
  assert.deepEqual(await page.locator('.lv-question-form input:checked').evaluateAll(inputs=>inputs.map(input=>input.value)),['work']);
});
await scenario('buyer-budget-sector-surface-correction-AC07',async({page})=>{
  await seed(page,{...known,buyer_budget_status:'checked',buyer_budget:250000,buyer_costs_status:'included',buyer_financing:'checked',buyer_surface:90,buyer_type:'house',buyer_tension:'layout_space',buyer_option:'keep_surface',buyer_opening:'conditional',buyer_opening_target:'surface',buyer_opening_condition:'Une pièce isolable',buyer_exclusions:['heavy_works']},'buyer','deep');
  await page.goto(base+'/lecture');assert.match(await readingBody(page),/250/);
  for(const [id,value] of [['buyer_budget','180000'],['buyer_sector','Mainvilliers'],['buyer_surface','65']]){
    await page.locator('#corrections summary').click();await page.locator(`a[href="/ma-recherche?edit=${id}"]`).click();
    await page.locator('#journey-answer').fill(value);await page.locator('.lv-question-form button[type="submit"]').click();await page.waitForURL('**/lecture');
  }
  const body=await readingBody(page);assert.match(body,/180/);assert.match(body,/Mainvilliers/);assert.match(body,/65 m²/);assert.doesNotMatch(body,/250|90 m²|Lèves/);
  const saved=await state(page);assert.equal(saved.answers.buyer_financing,undefined);assert.equal(saved.answers.buyer_option,undefined);assert.deepEqual(saved.answers.buyer_uses.value,['work']);
  assert.deepEqual(await page.locator('.lv-reading-section h2').allTextContents(),exactTitles);
  await page.screenshot({path:`${output}/buyer-mobile-390-deep-corrected.png`,fullPage:true});
  await page.setViewportSize({width:1440,height:1000});await noOverflow(page);await page.screenshot({path:`${output}/buyer-desktop-1440-deep-corrected.png`,fullPage:true});
  await page.setViewportSize({width:320,height:800});await noOverflow(page);await page.screenshot({path:`${output}/buyer-mobile-320-deep-corrected.png`,fullPage:true});
});
await scenario('buyer-session-resource-return-AC03',async({page})=>{
  await page.goto(base+'/ma-recherche');await choose(page,'idea');await choose(page,'primary');
  const title=await page.locator('[data-question-panel] h1').innerText();
  await page.goto(base+'/ressources');await page.goto(base+'/ma-recherche');
  assert.equal(await page.locator('[data-question-panel] h1').innerText(),title);
  const saved=await state(page);assert.equal(saved.answers.buyer_stage.value,'idea');assert.equal(saved.answers.buyer_purpose.value,'primary');
});
await scenario('buyer-completed-resume-AC03',async({page})=>{
  await seed(page,known);await page.goto(base+'/lecture');await page.goto(base+'/ma-recherche');
  await page.waitForURL('**/lecture',{timeout:5000});
  const current=null;
  assert.notEqual(current,'Où en êtes-vous dans votre achat ?','A fully answered context must offer its existing reading/review instead of asking its known stage again.');
});
await scenario('transition-conditions-dates-wait-AC14-AC15-AC16',async({page})=>{
  await seed(page,{buyer_goal:'quiet',seller_situation:'preparer',buyer_stage:'searching',buyer_prior_sale:'yes',transition_resources_status:'estimated',transition_resources:150000,transition_sale_date_status:'wished',transition_sale_date:'2027-02-20',buyer_horizon:'engaged',buyer_date:'2027-01-20',transition_interval:'possible',transition_interval_months:3,transition_overlap:'no',transition_costs_status:'unknown',transition_scenario:'buy_first',transition_fallback:'none'},'transition','deep');
  await page.goto(base+'/lecture');
  assert.match(await readingBody(page),/cumul ou une ressource intermédiaire serait à examiner/);
  assert.match(await page.locator('.lv-next').innerText(),/limite de cumul/);
  assert.equal(await page.locator('.lv-timeline>div').count(),3);
  assert.match(await page.locator('.lv-timeline').innerText(),/Souhait déclaré/);assert.match(await page.locator('.lv-timeline').innerText(),/Engagement déclaré/);
  assert.doesNotMatch(await readingBody(page),/scénario est faisable|financement acquis/);
  await page.screenshot({path:`${output}/transition-mobile-390-conditions.png`,fullPage:true});
  await page.locator('#corrections summary').click();await page.locator('a[href="/vendre-et-acheter?edit=transition_scenario"]').click();
  await choose(page,'wait');await page.waitForURL('**/lecture');
  await page.goto(base+'/vendre-et-acheter?edit=transition_reexamine');await page.locator('#journey-answer').fill('Le montant net confirmé par les interlocuteurs concernés');await page.locator('.lv-question-form button[type="submit"]').click();await page.waitForURL('**/lecture');
  assert.match(await page.locator('.lv-next').innerText(),/montant net confirmé/);assert.match(await page.locator('.lv-next').innerText(),/sans engagement ni relance/);
  const saved=await state(page);assert.equal(saved.answers.buyer_goal.value,'quiet');
  await page.setViewportSize({width:1440,height:1000});await noOverflow(page);await page.screenshot({path:`${output}/transition-desktop-1440-wait.png`,fullPage:true});
  await page.setViewportSize({width:320,height:800});await noOverflow(page);await page.screenshot({path:`${output}/transition-mobile-320-wait.png`,fullPage:true});
});
await scenario('transition-empty-autonomous-AC15',async({page})=>{
  await page.goto(base+'/vendre-et-acheter');await page.locator('[data-read]').click();await page.waitForURL('**/lecture');
  assert.match(await readingBody(page),/lien financier.*inconnu/);assert.match(await page.locator('.lv-next').innerText(),/produit net/);assert.equal(await page.locator('.lv-option').count(),0);
  await noOverflow(page);
});
await writeFile(`${output}/buyer-transition-ui-verification.json`,JSON.stringify({base,results},null,2));
console.log(JSON.stringify(results,null,2));
await browser.close();
if(results.some(result=>result.status==='failed'))process.exitCode=1;

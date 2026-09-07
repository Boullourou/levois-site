import {chromium,expect} from '@playwright/test';import AxeBuilder from '@axe-core/playwright';import fs from 'node:fs/promises';
const b=await chromium.launch(),out='artifacts/finalization/seller';await fs.mkdir(out,{recursive:true});const report={checks:[],errors:[],accessibility:[]};
async function check(name,fn){try{await fn();report.checks.push({name,pass:true})}catch(e){report.checks.push({name,pass:false,error:e.message});console.log('FAIL',name,e.message.slice(0,180))}}
for(const width of [1440,390]){
 const c=await b.newContext({viewport:{width,height:width===1440?900:844},reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{"ok":false,"message":"Test local : envoi indisponible."}'}));await p.goto('http://127.0.0.1:4327/situer-ma-vente');const ids=await p.locator('#liste-situations button').evaluateAll(bs=>bs.map(b=>b.dataset.id));
 for(const id of ids)await check(`${id} complet, résultat, copie refusée et correction à ${width}`,async()=>{
  await p.evaluate(()=>sessionStorage.clear());await p.goto('http://127.0.0.1:4327/situer-ma-vente');await p.locator(`#liste-situations [data-id="${id}"]`).click();
  for(let i=0;i<12;i++){if(p.url().includes('/resultat'))break;await expect(p.locator('#vue-question')).toBeVisible();const title=await p.locator('#q-titre').textContent();await p.locator('#q-options button').first().click();await expect.poll(async()=>p.url().includes('/resultat')||await p.locator('#q-titre').textContent()!==title).toBe(true)}
  await p.waitForURL('**/resultat?**');await expect(p.locator('#resultat')).toBeVisible();const code=new URL(p.url()).searchParams.get('r');expect(code.split('.')[0]).toBe(id);
  if(width===390){const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();report.accessibility.push({id,violations:a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});expect(a.violations.map(v=>v.id)).toEqual([])}
  await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('refused'))},configurable:true}));await p.locator('#btn-copier').click();await expect(p.locator('#copie-ok')).toContainText('copie est bloquée');await expect(p.locator('#copie-ok')).toHaveAttribute('role','status');
  await p.screenshot({path:`${out}/${id}-${width}.png`,fullPage:true});await p.getByRole('link',{name:'Modifier mes réponses'}).click();await expect(p.locator('#q-options [aria-checked="true"]')).toHaveCount(1);await p.locator('#btn-modifier-situation').click();await expect(p.locator('#liste-situations')).toBeVisible();
 });
 await check(`Session périmée, URL incomplète et résultat absent à ${width}`,async()=>{
  await p.evaluate(()=>{sessionStorage.setItem('levois.parcours',JSON.stringify({situationId:'preparer',etape:99,reponses:null}));sessionStorage.setItem('levois.resultat','{"situationId":"obsolete"}')});await p.goto('http://127.0.0.1:4327/situer-ma-vente');await expect(p.locator('#liste-situations')).toBeVisible();await p.goto('http://127.0.0.1:4327/situer-ma-vente/resultat?r=preparer.0');await expect(p.locator('#resultat-vide')).toBeVisible();await expect(p.locator('#resultat-vide a')).toHaveAttribute('href','/situer-ma-vente');
 });await c.close();
}
await b.close();await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(report);if(report.checks.some(x=>!x.pass)||report.errors.length)process.exitCode=1;

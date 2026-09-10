import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const base=process.env.LEVOIS_QA_BASE||'http://127.0.0.1:4331';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Local only');
const dir='docs/design/cible-20260910/preuves';await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true}),report={passed:[],failed:[],external:[]};
async function test(name,fn){const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==new URL(base).origin){report.external.push(url.origin);return route.abort();}if(url.pathname.startsWith('/api/'))throw Error('Unexpected API call');return route.continue();});try{await fn(page,context);expect(errors).toEqual([]);report.passed.push(name);}catch(e){report.failed.push({name,error:e.message.slice(0,1600)});await page.screenshot({path:dir+'/failure-'+name.replaceAll(' ','-')+'.png',fullPage:true});}finally{await context.close();}}
await test('session refused keeps real reading and download',async(page,context)=>{
 await context.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error('denied')};});
 await page.goto(base+'/ma-recherche');await page.locator('input[type=radio]').first().check();await page.locator('[data-read]').click();
 await expect(page.locator('[data-memory-keep]')).toBeVisible();expect(page.url()).toContain('/ma-recherche');await expect(page.locator('.lv-reading-section')).toHaveCount(4);
 const pending=page.waitForEvent('download');await page.locator('[data-memory-keep]').click();const file=await pending;const html=await readFile(await file.path(),'utf8');expect(html).toContain('levois-context');
 await page.locator('[data-memory-back]').click();await expect(page.locator('input[type=radio]:checked')).toHaveCount(1);
});
await test('historical transition preserves dates costs and export',async(page)=>{
 await page.goto(base+'/');await page.evaluate(async()=>{const c=await import('/src/lib/experience/context.ts'),d=await import('/src/lib/experience/transition.ts');let x=c.createContext('transition');for(const[id,v]of Object.entries({transition_sale_date_status:'constraint',transition_sale_date:'2026-12-12',transition_costs_status:'partial',transition_cost_items:['moving'],transition_cost_moving:1234}))x=c.setAnswer(x,id,v);x.reading=d.buildTransitionReading(x);x=c.setAnswer(x,'transition_cost_moving',9876);x=c.setAnswer(x,'transition_sale_date','2027-01-20');x.reading=d.buildTransitionReading(x);c.saveContext(x);});
 await page.goto(base+'/lecture');const details=page.locator('section.lv-reading-limits').filter({has:page.getByRole('heading',{name:'Dates, dépendances et coûts renseignés'})});
 await expect(details).toContainText('2027-01-20');await page.getByText('Lectures précédentes de cette session',{exact:true}).click();await page.locator('[data-history]').first().click();
 await expect(details).toContainText('2026-12-12');await expect(details).not.toContainText('2027-01-20');await expect(details).toContainText('1 234 €');await expect(details).not.toContainText('9 876 €');
 const pending=page.waitForEvent('download');await page.locator('[data-keep]').click();const html=await readFile(await(await pending).path(),'utf8');expect(html).toContain('2026-12-12');expect(html).not.toContain('9876');
});
await test('audit HTML resumes its exact reading in fresh session',async(page)=>{
 await page.goto(base+'/');const html=await page.evaluate(async()=>{const c=await import('/src/lib/experience/context.ts'),a=await import('/src/lib/experience/audit.ts'),e=await import('/src/lib/experience/export.ts');const x=a.contextWithAudit(c.createContext('audit'),a.manualAuditPage(),{duration:'unknown',signal:'unknown',context:'unknown'});return e.exportReadingHTML(x,x.reading);});
 await page.goto(base+'/reprendre');await page.locator('#resume-file').setInputFiles({name:'audit.html',mimeType:'text/html',buffer:Buffer.from(html)});await page.locator('[data-resume-confirm]').click();await page.waitForURL('**/lecture');await expect(page.locator('.lv-reading-section')).toHaveCount(5);await expect(page.locator('[data-action=review]')).toBeVisible();
});
await test('corrected video answer removes stale seller inference',async(page)=>{
 await page.goto(base+'/experiences/visites-sans-offre?src=video');await page.locator('[name=micro-answer][value=vague]').check();await page.locator('[data-micro-continue]').click();await page.waitForURL('**/situer-ma-vente');
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('levois:experience:v1')).answers.seller_visites_remarques.value)).toBe('vagues');
 await page.goto(base+'/experiences/visites-sans-offre?src=video');await page.locator('[name=micro-answer][value=repeated]').check();await page.locator('[data-micro-continue]').click();await page.waitForURL('**/situer-ma-vente');
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('levois:experience:v1')).answers.seller_visites_remarques)).toBeUndefined();
});
await test('local HTML resumes without inventing new DVF extraction',async(page)=>{
 await page.goto(base+'/');const html=await page.evaluate(async()=>{const c=await import('/src/lib/experience/context.ts'),l=await import('/src/lib/experience/local-experience.ts'),e=await import('/src/lib/experience/export.ts');let x=c.setAnswer(c.createContext('local'),'local_intention','buyer');x=c.setAnswer(x,'local_focus','compare');x.reading=l.localJourney.buildReading(x);return e.exportReadingHTML(x,x.reading);});
 await page.goto(base+'/reprendre');await page.locator('#resume-file').setInputFiles({name:'local.html',mimeType:'text/html',buffer:Buffer.from(html)});await page.locator('[data-resume-confirm]').click();await page.waitForURL('**/lecture');await expect(page.locator('[data-action=review]')).toBeVisible();
});
await browser.close();await writeFile(dir+'/final-continuity-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.failed.length||report.external.length)process.exitCode=1;

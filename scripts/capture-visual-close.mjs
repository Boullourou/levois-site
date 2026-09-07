import {chromium,expect} from '@playwright/test';import fs from 'node:fs/promises';
const out='artifacts/visual-close/captures';await fs.mkdir(out,{recursive:true});const b=await chromium.launch({headless:true});
try{for(const width of [1440,390]){
 const c=await b.newContext({viewport:{width,height:width===1440?900:844},reducedMotion:'reduce'}),p=await c.newPage();
 for(const [route,name] of [['/','home'],['/votre-rue','data'],['/ma-recherche','journey'],['/mouaad','mouaad'],['/contact','contact']]){
  await p.goto('http://127.0.0.1:4327'+route,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.mouse.move(0,0);
  await p.screenshot({path:out+'/'+name+'-'+width+'.png',fullPage:name!=='home'});
  if(name==='home'){
   await p.locator('.rp-header').screenshot({path:out+'/header-logo-'+width+'.png'});
   await p.locator('#votre-projet').screenshot({path:out+'/local-section-'+width+'.png'});
   await p.evaluate(async()=>{for(const i of document.images){i.loading='eager';await i.decode().catch(()=>{});}scrollTo(0,0);});await p.screenshot({path:out+'/home-'+width+'-full.png',fullPage:true});
  }
  if(name==='journey'){await p.locator('#mr-start').click();await expect(p.locator('#mr-sits')).toBeVisible();await p.screenshot({path:out+'/journey-question-'+width+'.png'});}
 }
 await c.close();
}}finally{await b.close();}
console.log('Only requested page families captured.');

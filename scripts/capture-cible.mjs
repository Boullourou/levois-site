import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const dir='docs/design/cible-20260910/preuves';await mkdir(dir,{recursive:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const [name,url,width]of [['accueil-mobile','/',390],['accueil-320','/',320],['accueil-desktop','/',1440],['acheteur-mobile','/ma-recherche',390],['transition-mobile','/vendre-et-acheter',390]]){
 await page.setViewportSize({width,height:width>800?1000:844});await page.goto('http://127.0.0.1:4331'+url);await page.waitForLoadState('networkidle');await page.screenshot({path:dir+'/'+name+'.png',fullPage:true});}
await writeFile(dir+'/capture-initiale.json',JSON.stringify({errors},null,2));await browser.close();

import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
const base=process.env.LEVOIS_TEST_URL;
if(!base||!new URL(base).hostname.endsWith('.levois-site.pages.dev'))throw Error('A LEVOIS preview URL is required.');
const browser=await chromium.launch({headless:true});
await mkdir('artifacts/editorial-20261028',{recursive:true});
const results=[];
for(const width of [360,390,430]){
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'}),page=await context.newPage();
 const audience=[];
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.hostname.endsWith('posthog.com')){
   let raw=request.postDataBuffer()?.toString('utf8')||'';
   try{const data=request.postDataBuffer();if(data?.[0]===31&&data?.[1]===139)raw=gunzipSync(data).toString('utf8');else if(raw.startsWith('data=')){const p=new URLSearchParams(raw);const b=Buffer.from(p.get('data'),'base64');raw=p.get('compression')==='gzip-js'?gunzipSync(b).toString('utf8'):b.toString('utf8');}}catch{}
   audience.push({path:url.pathname,body:raw});
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({status:1})});
  }
  if(!['GET','HEAD'].includes(request.method()))return route.abort('blockedbyclient');
  return route.continue();
 });
 await page.goto(base+'/contact/?email=NE_PAS_MESURER&adresse=RUE_PRIVEE#secret');
 await page.waitForTimeout(800);expect(audience.length).toBe(0);
 await page.locator('[data-analytics-settings]').first().click();
 await expect(page.locator('#analytics-preferences')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 await expect(page.locator('[data-analytics-choice=refused]')).toBeInViewport();
 await page.locator('[data-analytics-choice=refused]').click();
 await page.keyboard.press('Escape');
 await page.waitForTimeout(400);expect(audience.length).toBe(0);
 await expect(page.locator('[data-direct-contact] [type=submit]')).toBeEnabled();
 await page.locator('[data-analytics-settings]').first().click();
 await page.locator('[data-analytics-choice=accepted]').click();await page.keyboard.press('Escape');
 await page.waitForTimeout(1000);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('levois:journey',{detail:{event:'contact_message_accepted',email:'NE_PAS_MESURER',step_name:'RUE_PRIVEE',answers:'REPONSES_PRIVEES',selected_journey:'seller'}})));
 await page.waitForTimeout(4500);
 const bodies=audience.map(r=>r.body).join('\n');
 expect(bodies).not.toMatch(/NE_PAS_MESURER|RUE_PRIVEE|REPONSES_PRIVEES/);
 expect(bodies).toContain('contact_message_accepted');
 await page.locator('[data-analytics-settings]').first().click();
 await page.screenshot({path:`artifacts/editorial-20261028/privacy-${width}.png`,fullPage:false});
 results.push({width,noAudienceBeforeConsent:true,refusalAllowsContact:true,modalNoOverflow:true,serverEventCapturedThroughMock:true,noPrivateValuesInMockAudience:true,posthogRequestsIntercepted:audience.length});await context.close();
}
await browser.close();await mkdir('artifacts/editorial-20261028',{recursive:true});await writeFile('artifacts/editorial-20261028/privacy.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));

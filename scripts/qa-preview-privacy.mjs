import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
const base=process.env.LEVOIS_TEST_URL;
if(!base||(!new URL(base).hostname.endsWith('.levois-site.pages.dev')&&!['127.0.0.1','localhost'].includes(new URL(base).hostname)))throw Error('A LEVOIS preview or local URL is required.');
const browser=await chromium.launch({headless:true});
// The installed PostHog SDK drops HeadlessChrome/webdriver events before
// before_send. This fixture models a visitor instead of disabling the site's
// bot filter. Every audience request still terminates in the mock below.
const visitorUserAgent=`Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Safari/537.36`;
await mkdir('artifacts/editorial-20261028',{recursive:true});
const results=[];
try {
for(const width of [360,390,430]){
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce',userAgent:visitorUserAgent});
 await context.addInitScript(()=>{
  Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false});
  Object.defineProperty(Navigator.prototype,'userAgentData',{get:()=>undefined});
 });
 const page=await context.newPage();
 const audience=[];
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.hostname.endsWith('posthog.com')){
   let raw=request.postDataBuffer()?.toString('utf8')||url.searchParams.get('data')||'';
   try{const data=request.postDataBuffer();if(data?.[0]===31&&data?.[1]===139)raw=gunzipSync(data).toString('utf8');else if(raw.startsWith('data=')){const p=new URLSearchParams(raw);const b=Buffer.from(p.get('data'),'base64');raw=p.get('compression')==='gzip-js'?gunzipSync(b).toString('utf8'):b.toString('utf8');}}catch{}
   audience.push({path:url.pathname,method:request.method(),queryKeys:[...url.searchParams.keys()],body:raw,referrer:request.headers().referer||''});
   if(url.pathname.endsWith('/config.js')){
    const token=url.pathname.split('/')[2];
    return route.fulfill({status:200,contentType:'application/javascript',body:`window._POSTHOG_REMOTE_CONFIG=window._POSTHOG_REMOTE_CONFIG||{};window._POSTHOG_REMOTE_CONFIG[${JSON.stringify(token)}]={config:{hasFeatureFlags:false}};`});
   }
   if(url.pathname.endsWith('/config'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({hasFeatureFlags:false})});
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
 await page.locator('[name=prenom]').fill('NE_PAS_MESURER');
 await page.locator('[name=email]').fill('NE_PAS_MESURER@example.invalid');
 await page.locator('[name=message]').fill('REPONSES_PRIVEES');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('levois:journey',{detail:{event:'contact_message_accepted',email:'NE_PAS_MESURER',step_name:'RUE_PRIVEE',answers:'REPONSES_PRIVEES',selected_journey:'seller'}})));
 await expect.poll(()=>audience.map(r=>r.body).join('\n'),{timeout:10000}).toContain('contact_message_accepted');
 const bodies=audience.map(r=>r.body).join('\n');
 await writeFile(`artifacts/editorial-20261028/privacy-debug-${width}.json`,JSON.stringify(audience,null,2));
 expect(bodies).not.toMatch(/NE_PAS_MESURER|RUE_PRIVEE|REPONSES_PRIVEES/);
 expect(audience.map(r=>r.referrer).join('\n')).not.toMatch(/NE_PAS_MESURER|RUE_PRIVEE|REPONSES_PRIVEES/);
 expect(bodies).toContain('contact_message_accepted');
 await page.locator('[data-analytics-settings]').first().click();
 await page.screenshot({path:`artifacts/editorial-20261028/privacy-${width}.png`,fullPage:false});
 await page.locator('[data-analytics-choice=refused]').click();await page.keyboard.press('Escape');
 await page.waitForTimeout(3500);const afterWithdrawal=audience.length;
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('levois:journey',{detail:{event:'contact_message_accepted'}})));
 await page.waitForTimeout(3500);expect(audience.length).toBe(afterWithdrawal);
 results.push({width,noAudienceBeforeConsent:true,refusalAllowsContact:true,modalNoOverflow:true,simulatedServerEventCapturedThroughMock:true,noPrivateValuesInMockAudience:true,withdrawalStopsCapture:true,posthogRequestsIntercepted:audience.length});await context.close();
}
await mkdir('artifacts/editorial-20261028',{recursive:true});await writeFile('artifacts/editorial-20261028/privacy.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
} finally { await browser.close(); }

import fs from 'node:fs/promises';import path from 'node:path';import {spawnSync} from 'node:child_process';
const out='artifacts/visual-close',qa=out+'/qa';await fs.mkdir(qa,{recursive:true});
for(const p of ['flows','contracts','seller','zoom','entry','after'])await fs.mkdir(out+'/'+p,{recursive:true});
// This final pass requests screenshots only of named families. Reuse all functional
// suites, but leave image production to capture-visual-close.mjs.
await fs.writeFile(qa+'/no-screenshots.mjs',`import {chromium} from '@playwright/test';
const quietPage=p=>{p.screenshot=async()=>Buffer.alloc(0);return p;};
const quietContext=c=>{c.pages().forEach(quietPage);c.on('page',quietPage);return c;};
const launch=chromium.launch.bind(chromium);chromium.launch=async(...args)=>{const b=await launch(...args);const context=b.newContext.bind(b),page=b.newPage.bind(b);b.newContext=async(...a)=>quietContext(await context(...a));b.newPage=async(...a)=>quietPage(await page(...a));return b;};
const persistent=chromium.launchPersistentContext.bind(chromium);chromium.launchPersistentContext=async(...args)=>quietContext(await persistent(...args));
`);
const suites=['audit-public.mjs','verify-final-flows.mjs','verify-final-conversion.mjs','verify-public-contracts.mjs','verify-seller-complete.mjs','verify-analytics-payload.mjs','verify-final-zoom.mjs','verify-home-entry.mjs','verify-final-quality.mjs'];
const selected=process.argv.slice(2);let failed=false;
for(const name of suites.filter(n=>!selected.length||selected.includes(n))){
 const text=await fs.readFile('scripts/'+name,'utf8');const copy=qa+'/'+name;
 await fs.writeFile(copy,`import './no-screenshots.mjs';\n`+text.replaceAll('artifacts/finalization',out).replaceAll('artifacts/home-entry',out+'/entry'));
 console.log('RUN',name);const result=spawnSync(process.execPath,[path.resolve(copy)],{encoding:'utf8',windowsHide:true});
 await fs.writeFile(out+'/'+name.replace('.mjs','.log'),result.stdout+(result.stderr||''));console.log(result.status===0?'PASS':'FAIL',name);
 if(result.status!==0){failed=true;console.log((result.stdout+result.stderr).slice(-4000));}
}
if(failed)process.exitCode=1;

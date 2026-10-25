import {spawnSync} from 'node:child_process';
const base=process.env.LEVOIS_TEST_URL||'http://127.0.0.1:4346';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Un serveur local est requis.');
// Historical recipes remain in verify-public-pre-diagnostics.mjs and
// verify-public-legacy.mjs. This recipe works against compiled preview or dev;
// the browser uses public DOM and does not import /src application modules.
const scripts=['scripts/qa-short-diagnostics.mjs'];
for(const script of scripts){console.log('Recette publique : '+script);const r=spawnSync(process.execPath,[script],{stdio:'inherit',env:{...process.env,LEVOIS_TEST_URL:base,LEVOIS_QA_BASE:base}});if(r.status!==0)process.exit(r.status||1);}

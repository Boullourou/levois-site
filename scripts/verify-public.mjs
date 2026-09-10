import {spawnSync} from 'node:child_process';
const base=process.env.LEVOIS_TEST_URL||'http://127.0.0.1:4331';
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw Error('Un serveur local est requis.');
// Historical DOM scripts remain in verify-public-legacy.mjs. Domain/API tests
// remain under npm test; these scenarios exercise the final public architecture.
const scripts=['scripts/qa-public-pages.mjs','scripts/qa-public-menu.mjs','scripts/qa-buyer-transition.mjs','scripts/verify-local-experience.mjs','scripts/verify-audit-experience.mjs','scripts/qa-final-continuity.mjs','tests/experience-public-contract.browser.mjs'];
for(const script of scripts){console.log('Recette publique : '+script);const r=spawnSync(process.execPath,[script],{stdio:'inherit',env:{...process.env,LEVOIS_TEST_URL:base,LEVOIS_QA_BASE:base}});if(r.status!==0)process.exit(r.status||1);}

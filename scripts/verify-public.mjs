import {spawnSync} from 'node:child_process';
// A local preview must already be running on port 4327. All lead transports are intercepted.
for(const script of ['audit-public.mjs','verify-final-flows.mjs','verify-final-conversion.mjs','verify-public-contracts.mjs','verify-seller-complete.mjs','verify-analytics-payload.mjs','verify-final-zoom.mjs']){
 console.log('\nPublic QA:',script);const result=spawnSync(process.execPath,['scripts/'+script],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}

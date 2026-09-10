import { chromium, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const base=process.env.LEVOIS_QA_BASE||'http://127.0.0.1:4396';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw new Error('Only a local server is allowed.');
const out='artifacts/continuite-operateur';await fs.mkdir(out,{recursive:true});
const date='2026-09-10T12:00:00.000Z',id='8c192096-f4dd-4cf0-b77e-b01062dc0f65';
const context={schemaVersion:1,id:'11111111-2222-4333-8444-555555555555',revision:1,project:'buyer',entry:{door:'direct',source:null,promise:null},createdAt:date,updatedAt:date,
 answers:{buyer_stage:{value:'reflecting',provenance:'declared',revision:1,updatedAt:date}},reading:{id:'lecture-fixture',revision:1,title:'Votre achat, au clair',sections:[],nextDecision:{text:'Faire vérifier le budget complet.',why:'L’enveloppe reste déclarée.'},limits:['Aucun financement confirmé.'],methodVersion:'fixture',generatedAt:date}};
const rows=[{id,action:'review',created_at:date,contact_email:'visiteur@example.test',contact_phone:null,channel:'email',first_name:'Camille',question:'Quelles informations vérifier avant les visites ?',context_json:JSON.stringify(context),synthesis:'Votre achat, au clair\n\nCe qui reste à vérifier\nL’enveloppe est estimée, et les frais annexes restent à réunir.\n\nProchaine décision utile\nFaire vérifier le budget complet avant de sélectionner les biens.\n\nLimite : cette lecture ne valide aucun financement.',consent_json:JSON.stringify({purpose:'review',textVersion:'2026-09-10',acceptedAt:date}),notification_state:'sent',status:'open'}];
const notes=[],accesses=[],calls=[],errors=[],forbidden=[];
const browser=await chromium.launch({headless:true});
const report={interactions:[],screenshots:[],axe:[],errors,forbidden};
try{
 const session=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await session.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.origin!==new URL(base).origin){forbidden.push(url.origin);return route.abort();}
  if(!url.pathname.startsWith('/api/'))return route.continue();
  if(url.pathname!=='/api/experience/operator')throw new Error('Unexpected API '+url.pathname);
  if(request.method()==='GET'){
   const selected=url.searchParams.get('id');
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(selected?{ok:true,csrfToken:'9999999999.test-token',request:rows.find(r=>r.id===selected),notes:notes.filter(n=>n.request_id===selected),accesses:accesses.filter(a=>a.request_id===selected)}:{ok:true,csrfToken:'9999999999.test-token',items:rows})});
  }
  const body=request.postDataJSON();calls.push(body);expect(request.headers()['x-levois-csrf']).toBeTruthy();
  if(body.operation==='annotate'){notes.push({id:body.noteId,request_id:body.requestId,created_at:date,text:body.text,reason:body.reason,evidence:body.evidence,context_json:body.context?JSON.stringify(body.context):null});}
  if(body.operation==='create-context'){rows.push({id:body.requestId,action:'exchange',created_at:date,first_name:body.firstName,contact_email:body.email,contact_phone:null,channel:'email',question:'Contexte établi après échange.',context_json:JSON.stringify(body.context),synthesis:body.synthesis,consent_json:JSON.stringify({purpose:'exchange',textVersion:'2026-09-10',acceptedAt:body.agreedAt,evidence:body.permissionEvidence}),notification_state:'not-requested',status:'open'});}
  if(body.operation==='create-access'){const accessId=crypto.randomUUID();accesses.push({id:accessId,request_id:body.requestId,created_at:date,expires_at:body.expiresAt,revoked_at:null});return route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({ok:true,url:base+'/reprendre#acces='+'a'.repeat(64),accessId,message:'Lien créé, aucun envoi.'})});}
  if(body.operation==='revoke-access')accesses.find(a=>a.id===body.accessId).revoked_at=date;
  if(body.operation==='set-status')rows.find(r=>r.id===body.requestId).status=body.status;
  if(body.operation==='delete'){const index=rows.findIndex(r=>r.id===body.requestId);rows.splice(index,1);}
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,saved:true,message:'Action enregistrée sans envoi.'})});
 });
 await page.goto(base+'/cockpit/relectures',{waitUntil:'networkidle'});
 await page.addStyleTag({content:'astro-dev-toolbar{display:none!important}'});
 await page.getByRole('button',{name:/Camille/}).click();
 await expect(page.locator('[data-synthesis]')).toContainText('cette lecture ne valide aucun financement');
 await expect(page.locator('[data-request-intent]')).toHaveText('Relecture écrite ciblée');
 await page.locator('[data-note-form] [name="text"]').fill('Faire confirmer les frais avant de réviser le secteur.');
 await page.locator('[data-note-form] [name="reason"]').fill('L’enveloppe disponible est encore estimée.');
 await page.locator('[data-note-form] [name="evidence"]').fill('Déclaration de la personne ; aucun document bancaire examiné.');
 await page.locator('[data-note-form] button[type="submit"]').click();
 await expect(page.locator('[data-notes]')).toContainText('Faire confirmer les frais');
 report.interactions.push('Exact approved reading; separate written note with reason and evidence');
 await page.locator('[data-access-form] [name="expiresAt"]').fill('2027-01-15T12:00');
 await page.locator('[data-access-form] [name="authorized"]').check();
 await page.locator('[data-access-form] button[type="submit"]').click();
 await expect(page.locator('[data-access-url]')).toHaveValue(/#acces=/);
 expect(calls.find(c=>c.operation==='create-access').authorized).toBe(true);
 await page.getByRole('button',{name:'Révoquer cet accès'}).click();
 await expect(page.locator('[data-access-list]')).toContainText('Révoqué');
 report.interactions.push('Explicit permission, access generation, no send, revocation');
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:width===1440?1000:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const screenshot=path.join(out,'relecture-'+width+'.png');await page.screenshot({path:screenshot,fullPage:true});report.screenshots.push(screenshot);
  const axe=await new AxeBuilder({page}).analyze();report.axe.push({width,violations:axe.violations.map(v=>({id:v.id,nodes:v.nodes.length}))});expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:'Reprendre ou corriger le contexte'}).click();
 const question=page.locator('[data-context-questions] select').first();await question.selectOption({index:1});
 await page.locator('[data-revision-fields] [name="revisionText"]').fill('La situation est reprise après échange.');
 await page.locator('[data-revision-fields] [name="revisionReason"]').fill('Une précision nouvelle a été apportée.');
 await page.locator('[data-revision-fields] [name="revisionEvidence"]').fill('Déclaration datée ; conditions encore à vérifier.');
 await page.locator('[data-context-form] [name="approved"]').check();
 await page.locator('[data-context-submit]').click();
 await expect(page.locator('[data-notes]')).toContainText('La situation est reprise après échange.');
 const revision=calls.findLast(c=>c.operation==='annotate'&&c.context);expect(revision.context.id).toBe(context.id);expect(revision.context.answers.buyer_stage.provenance).toBe('imported');expect(revision.context.revision).toBeGreaterThan(1);
 await expect(page.locator('[data-note-choice]')).toHaveValue(revision.noteId);
 await expect(page.locator('[data-share-preview]')).toContainText('La situation est reprise après échange.');
 report.interactions.push('Same semantic project; explicit correction imported; original version retained; exact latest sharing preview');
 await page.getByRole('button',{name:'Contexte après échange',exact:true}).click();
 await page.locator('[data-new-fields] [name="firstName"]').fill('Alex');
 await page.locator('[data-new-fields] [name="email"]').fill('alex@example.test');
 await page.locator('[data-new-fields] [name="agreedAt"]').fill('2026-09-10T12:00');
 await page.locator('[data-new-fields] [name="permissionEvidence"]').fill('Accord de reprendre le contexte par e-mail pendant notre échange.');
 await page.locator('[data-new-fields] [name="authorized"]').check();
 const editorAxe=await new AxeBuilder({page}).analyze();expect(editorAxe.violations.map(v=>v.id)).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#cr-editor-title').focus();
 const editorScreenshot=path.join(out,'contexte-apres-echange-390.png');await page.screenshot({path:editorScreenshot,fullPage:true});report.screenshots.push(editorScreenshot);
 await page.locator('[data-context-form] [name="approved"]').check();
 await page.locator('[data-context-submit]').click();
 await expect(page.locator('#cr-detail-title')).toHaveText('Alex');
 const created=calls.find(c=>c.operation==='create-context');expect(created.context.revision).toBe(0);expect(created.context.project).toBe('buyer');expect(created.authorized).toBe(true);
 report.interactions.push('Warm context without prior public request and without invented answers');
 await page.locator('[data-status-form] select').selectOption('closed');await page.locator('[data-status-form] button').click();await expect(page.locator('[data-request-facts]')).toContainText('Traitement terminé');
 await page.getByText('Supprimer le dossier opérationnel',{exact:true}).click();await page.locator('[data-delete-form] [name="confirm"]').check();await page.locator('[data-delete-form] button').click();
 await expect(page.locator('[data-detail]')).toBeHidden();expect(calls.find(c=>c.operation==='delete').confirm).toBe('delete-operational-request');
 report.interactions.push('Explicit status and deletion confirmation');
 expect(errors).toEqual([]);expect(forbidden).toEqual([]);
 await fs.writeFile(path.join(out,'rapport.json'),JSON.stringify({...report,mutations:calls.map(c=>c.operation)},null,2));
 console.log(JSON.stringify({passed:true,interactions:report.interactions,screenshots:report.screenshots,axe:report.axe,errors,forbidden},null,2));
}finally{await browser.close();}

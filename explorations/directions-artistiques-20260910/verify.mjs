// Captures reproductibles de la preuve locale, en complément de la revue IAB.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const dirArg = process.argv.indexOf('--directions');
const names = dirArg > -1 ? process.argv[dirArg + 1].split(',') : ['ligne-claire','plan-vivant','a-portee'];
const out = path.join(root, 'preuves');
await mkdir(out, { recursive:true });
const browser = await chromium.launch({ headless:true });
const reports = [];
const assert = (value, message) => { if (!value) throw new Error(message); };
try {
  for (const name of names) {
    const observations = [];
    const errors = [], failures = [], outbound = [];
    for (const width of [390,320,1440]) {
      const context = await browser.newContext({ viewport:{width,height:width === 1440 ? 1000 : 844}, reducedMotion:'reduce', acceptDownloads:true });
      await context.route('**/*', route => {
        if (!route.request().url().startsWith('http://127.0.0.1:4340/')) { outbound.push(route.request().url()); return route.abort(); }
        return route.continue();
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if(response.status() >= 400) failures.push({ url:response.url(),status:response.status() }); });
      const go = async screen => {
        await page.goto(`http://127.0.0.1:4340/${name}/?screen=${screen}`, {waitUntil:'networkidle'});
        await page.locator('h1').waitFor();
        await page.evaluate(() => document.fonts.ready);
      };
      const snap = async screen => {
        const metrics = await page.evaluate(() => ({
          viewport:innerWidth, width:document.documentElement.scrollWidth, h1:document.querySelector('h1')?.textContent.trim(),
          headings:document.querySelectorAll('h1').length, height:document.documentElement.scrollHeight,
          images:[...document.images].filter(i=>!i.complete || i.naturalWidth===0).map(i=>i.getAttribute('src')),
          smallButtons:[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().width>0 && (b.getBoundingClientRect().height<40 || b.getBoundingClientRect().width<40)).map(b=>({text:b.textContent.trim(),height:b.getBoundingClientRect().height,width:b.getBoundingClientRect().width})),
        }));
        assert(metrics.width <= metrics.viewport, `${name}/${screen} déborde à ${width}px : ${metrics.width}`);
        assert(metrics.headings === 1, `${name}/${screen} : ${metrics.headings} h1`);
        assert(metrics.images.length === 0, `${name}/${screen} image manquante`);
        const access = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
        observations.push({screen,width,...metrics,axe:access.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
        await page.screenshot({path:path.join(out,`${name}-${screen}-${width}.png`),fullPage:false});
        if(width === 390) await page.screenshot({path:path.join(out,`${name}-${screen}-${width}-complet.png`),fullPage:true});
      };
      await go('accueil'); await snap('accueil');
      for (const screen of ['recherche','visites','transition','local']) assert(await page.locator(`[data-action="navigate"][data-screen="${screen}"]`).count()>0, `${name} accès ${screen} absent`);
      await go('visites'); await snap('visites-entree');
      for (const [value,phrase] of [['inconnu','Un retour concret à construire.'],['commun','Un frein à examiner.'],['divers','Des raisons à distinguer.']]) {
        await page.locator(`[data-action="visit"][data-value="${value}"]`).click();
        assert((await page.locator('#impact').innerText()).includes(phrase), `${name} conséquence vendeur ${value} absente`);
        assert(await page.locator(`[data-action="visit"][data-value="${value}"]`).getAttribute('aria-pressed')==='true', `${name} état vendeur absent`);
      }
      await page.locator('[data-action="visit"][data-value="inconnu"]').click();
      await page.reload({waitUntil:'networkidle'}); await snap('visites');
      await page.locator('[data-action="question"]').click(); assert(await page.locator('dialog').isVisible(), 'Question suivante inaccessible');
      await page.keyboard.press('Escape'); await page.locator('dialog').waitFor({state:'detached'});
      await go('recherche'); await snap('recherche');
      for (const [value,phrase] of [['recevoir','La façon de se retrouver'],['dehors','L’usage de l’extérieur'],['calme','Une pièce qui ferme']]) {
        await page.locator(`[data-action="priority"][data-value="${value}"]`).click();
        assert((await page.locator('#impact').innerText()).includes(phrase), `${name} conséquence achat ${value} absente`);
      }
      await page.locator('[data-action="focus-impact"]').click();
      assert(await page.evaluate(()=>document.activeElement?.id)==='impact', `${name} focus signature absent`);
      await page.locator('[data-action="confirm"]').click(); await page.locator('[data-action="save"]').waitFor();
      assert((await page.locator('#app').innerText()).includes('Ce qui reste à vérifier'), 'Lecture non structurée');
      await page.reload({waitUntil:'networkidle'}); await snap('lecture');
      const readText = await page.locator('#app').innerText();
      const headings = ['Ce qui est compris','Ce qui paraît solide','Ce qui peut évoluer','Ce qui reste à vérifier','La prochaine décision utile'];
      for(let i=1;i<headings.length;i++) assert(readText.indexOf(headings[i])>readText.indexOf(headings[i-1]),`${name} ordre lecture incorrect`);
      const downloadPromise=page.waitForEvent('download'); await page.locator('[data-action="save"]').click(); const download=await downloadPromise;
      assert(download.suggestedFilename()==='LEVOIS-ma-lecture-exemple.txt','Nom téléchargement');
      const downloaded=await readFile(await download.path(),'utf8'); assert(downloaded.includes('Le calme pour travailler'),'Contenu téléchargement');
      for (const action of ['copy','reread','exchange']) {
        await page.locator(`[data-action="${action}"]`).click();
        assert((await page.locator('dialog').innerText()).includes('aucun envoi activé'), 'Simulation non déclarée');
        if(action==='reread') assert((await page.locator('dialog').innerText()).includes('relecture humaine écrite'), 'M1 absent');
        await page.locator('.dialog-submit').click();
        assert((await page.locator('.dialog-feedback').innerText()).includes(action==='copy'?'aucun e-mail':'Aucune demande'), 'Absence envoi non visible');
        await page.keyboard.press('Escape');
        await page.locator('dialog').waitFor({state:'detached'});
        assert(await page.evaluate(a=>document.activeElement?.dataset.action===a,action),'Focus non restauré');
      }
      await page.locator('[data-action="correct"]').click();
      assert(await page.locator('[data-action="priority"][data-value="calme"]').getAttribute('aria-pressed')==='true','Correction perd la réponse');
      await page.locator('[data-action="priority"][data-value="recevoir"]').click();
      await page.locator('[data-action="confirm"]').click();
      assert((await page.locator('#app').innerText()).includes('Recevoir vos proches est votre priorité'),'Lecture non actualisée');
      const storage=await page.evaluate(()=>({local:localStorage.length,session:Object.keys(sessionStorage),cookies:document.cookie}));
      assert(storage.local===0 && storage.cookies==='', 'Conservation inattendue');
      if(width === 390){
        await page.reload({waitUntil:'networkidle'});await page.screenshot({path:path.join(out,`${name}-lecture-corrigee-390-complet.png`),fullPage:true});
        for(const screen of ['transition','local']) { await go(screen); await snap(screen); }
      }
      await context.close();
    }
    assert(errors.length===0, `${name}: erreurs JS ${errors.join(',')}`);
    assert(failures.length===0, `${name}: ressources en erreur`);
    assert(outbound.length===0, `${name}: requêtes externes`);
    const report={direction:name,date:new Date().toISOString(),errors,failures,outbound,observations};
    await writeFile(path.join(out,`${name}-verification.json`),JSON.stringify(report,null,2));
    reports.push({direction:name,screens:observations.length,axeViolations:observations.reduce((n,o)=>n+o.axe.length,0),smallButtons:observations.reduce((n,o)=>n+o.smallButtons.length,0)});
    console.log(JSON.stringify(reports.at(-1)));
  }
} finally { await browser.close(); }

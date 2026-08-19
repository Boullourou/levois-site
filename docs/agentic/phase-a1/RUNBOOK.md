# Runbook local — Phase A1

Ce runbook concerne uniquement le worktree A1, une D1 locale jetable et des fixtures fictives. Il ne contient aucune commande distante.

## 1. Préconditions

- être sur `codex/levois-agentic-a1-control-plane` ;
- travailler dans `.impeccable/agentic-a1-worktree` ;
- utiliser Node conforme à `package.json` ;
- vérifier que `wrangler.cockpit.toml` contient l'UUID nul ;
- ne définir aucun binding D1 réel ;
- ne copier aucune donnée réelle dans les fixtures.

```powershell
git branch --show-current
git rev-parse --show-toplevel
Select-String -Path wrangler.cockpit.toml -Pattern "00000000-0000-0000-0000-000000000000"
```

## 2. Installation et tests rapides

```powershell
npm ci
npm run test:agentic
```

Cette commande exécute le noyau et l'intégration snapshot selon le script courant. `npm test` reste la commande exhaustive Vitest.

## 3. Préparer les secrets locaux

Le BFF exige deux secrets locaux distincts d'au moins 24 caractères. Les placer dans `.dev.vars`, qui reste non versionné :

```dotenv
COCKPIT_CSRF_SECRET=remplacer-par-un-secret-local-long-et-aleatoire
COCKPIT_AUDIT_SECRET=remplacer-par-un-second-secret-local-long-et-aleatoire
```

Ne jamais copier une valeur de production dans ce fichier.

## 4. Créer et charger la D1 A1 isolée

```powershell
npm run db:agentic:migrate:local
npm run db:agentic:seed:local
```

Les scripts appliquent `0001` à `0007`, chargent uniquement `agentic-a1.sql` et persistent sous `.wrangler/state/agentic-a1`. Ne pas rejouer le seed : recréer la base selon la section 10.

## 5. Inspecter D1 localement

```powershell
npx wrangler d1 execute levois-cockpit-local `
  --local `
  --config wrangler.cockpit.toml `
  --persist-to .wrangler/state/agentic-a1 `
  --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'agent_%' ORDER BY name"

npx wrangler d1 execute levois-cockpit-local `
  --local `
  --config wrangler.cockpit.toml `
  --persist-to .wrangler/state/agentic-a1 `
  --command "SELECT scope_kind, scope_key, state, version FROM agent_control_switch ORDER BY scope_kind, scope_key"
```

Après seed, cinq tables doivent apparaître et la requête de switches doit retourner zéro ligne.

## 6. Lancer le cockpit A1 local

```powershell
npm run dev:agentic
```

Le serveur utilise `127.0.0.1:8789`, l'état D1 A1 isolé, le bypass strictement local et `COCKPIT_AGENTIC_FIXTURE_ONLY=1`. Ne jamais exposer ce serveur sur un host public. Aucune preview Cloudflare n'est nécessaire ou autorisée par ce runbook.

Dans une autre console PowerShell, préparer une session BFF :

```powershell
$agenticBase = "http://127.0.0.1:8789"
$agenticWebSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$agenticSession = Invoke-RestMethod `
  -Uri "$agenticBase/api/cockpit/session" `
  -WebSession $agenticWebSession
$agenticCsrf = $agenticSession.data.csrfToken

function Invoke-AgenticPost {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][hashtable]$Body,
    [Parameter(Mandatory = $true)][string]$IdempotencyKey
  )
  Invoke-RestMethod `
    -Uri "$agenticBase/api/cockpit/agentic/$Path" `
    -Method Post `
    -WebSession $agenticWebSession `
    -Headers @{
      Origin = $agenticBase
      "X-LEVOIS-CSRF" = $agenticCsrf
      "Idempotency-Key" = $IdempotencyKey
    } `
    -ContentType "application/json" `
    -Body ($Body | ConvertTo-Json -Compress)
}
```

## 7. Start explicite et run OPS/COS

Lire les neuf switches puis activer chaque portée avec sa version courante :

```powershell
$switches = @((Invoke-RestMethod `
  -Uri "$agenticBase/api/cockpit/agentic/switches" `
  -WebSession $agenticWebSession).data.items)

foreach ($switch in $switches) {
  if ($switch.effectiveState -eq "enabled") { continue }
  $scopePath = if ($switch.scopeKind -eq "global") {
    "global"
  } else {
    "$($switch.scopeKind)/$($switch.scopeKey)"
  }
  Invoke-AgenticPost `
    -Path "switches/$scopePath/start" `
    -Body @{
      fixtureOnly = $true
      fixtureId = "agentic-a1-v1"
      expectedVersion = $switch.version
    } `
    -IdempotencyKey "start-$($switch.scopeKind)-$($switch.scopeKey)-$([guid]::NewGuid().ToString('N'))" | Out-Null
}
```

Exécuter ensuite le briefing :

```powershell
$run = Invoke-AgenticPost `
  -Path "briefing/run" `
  -Body @{ fixtureOnly = $true; fixtureId = "agentic-a1-v1" } `
  -IdempotencyKey "run-$([guid]::NewGuid().ToString('N'))"

$run.data.briefing
$opsMissionId = $run.data.opsMission.missionId
```

Le même payload avec la même clé retourne le résultat existant ; il ne crée pas une seconde paire OPS/COS. La contrainte d'idempotence D1 conserve cette garantie lorsque deux isolates traitent simultanément la même commande.

## 8. Inspecter mission, trace et briefing

```powershell
Invoke-RestMethod `
  -Uri "$agenticBase/api/cockpit/agentic/briefing/current" `
  -WebSession $agenticWebSession

Invoke-RestMethod `
  -Uri "$agenticBase/api/cockpit/agentic/missions/$opsMissionId" `
  -WebSession $agenticWebSession

Invoke-RestMethod `
  -Uri "$agenticBase/api/cockpit/agentic/missions/$opsMissionId/trace?cursor=0&limit=50" `
  -WebSession $agenticWebSession
```

Les réponses sont redacted et `private, no-store`. La trace est paginée avec une limite de 1 à 100.

## 9. Stop, réactivation et annulation

### Stop global immédiat

```powershell
$global = @((Invoke-RestMethod `
  -Uri "$agenticBase/api/cockpit/agentic/switches" `
  -WebSession $agenticWebSession).data.items) | Where-Object { $_.scopeKind -eq "global" }

Invoke-AgenticPost `
  -Path "switches/global/stop" `
  -Body @{
    fixtureOnly = $true
    fixtureId = "agentic-a1-v1"
    expectedVersion = $global.version
  } `
  -IdempotencyKey "stop-global-$([guid]::NewGuid().ToString('N'))"
```

Le stop annule les missions non terminales concernées et les trace. Il reste autorisé même si le gate d'activation est fermé.

### Réactivation explicite

Relire la version globale, puis utiliser la même commande avec le chemin `switches/global/start`. Une réactivation ne rouvre aucune mission annulée et ne restaure aucun briefing ancien.

### Annulation d'une mission

```powershell
$mission = (Invoke-RestMethod `
  -Uri "$agenticBase/api/cockpit/agentic/missions/$opsMissionId" `
  -WebSession $agenticWebSession).data

Invoke-AgenticPost `
  -Path "missions/$opsMissionId/cancel" `
  -Body @{ expectedVersion = $mission.version } `
  -IdempotencyKey "cancel-$opsMissionId-$([guid]::NewGuid().ToString('N'))"
```

Une mission déjà terminale reste terminale. Ne jamais modifier un switch ou une mission par SQL ad hoc.

## 10. Reset par recréation de la base locale

Le reset détruit uniquement `.wrangler/state/agentic-a1` dans le worktree courant. Il est interdit si le chemin résolu sort du worktree ou ne se termine pas par ce sous-dossier exact.

```powershell
$repoRoot = (Resolve-Path -LiteralPath ".").Path
$fixtureState = [System.IO.Path]::GetFullPath((Join-Path $repoRoot ".wrangler\state\agentic-a1"))
$allowedRoot = [System.IO.Path]::GetFullPath((Join-Path $repoRoot ".wrangler\state")) + [System.IO.Path]::DirectorySeparatorChar

if (-not $fixtureState.StartsWith($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refus : le state résolu sort de .wrangler/state."
}
if ((Split-Path -Leaf $fixtureState) -ne "agentic-a1") {
  throw "Refus : la cible n'est pas le state agentic-a1 attendu."
}
if (Test-Path -LiteralPath $fixtureState) {
  Remove-Item -LiteralPath $fixtureState -Recurse -Force
}

npm run db:agentic:migrate:local
npm run db:agentic:seed:local
```

Ce reset n'est pas une politique d'effacement réelle. Il ne répond pas à D-008 ou D-009.

## 11. Restauration

La restauration A1 consiste à recréer une base locale depuis les migrations versionnées puis à recharger les fixtures. Aucun dump réel, backup client ou export de production ne doit être utilisé.

## 12. Incidents

| Symptôme | Action sûre |
|---|---|
| `CP_SOURCE_STALE` | conserver le cockpit manuel ; Mouaad peut demander un nouveau run manuel |
| `CP_SOURCE_EMPTY` | ne pas afficher « aucune priorité » ; corriger la fixture/projection |
| `CP_KILL_SWITCH_ACTIVE` | rester en mode manuel ; ne pas contourner le switch |
| `CP_BUDGET_EXCEEDED` | arrêter ; ne pas augmenter automatiquement le budget |
| `CP_TIMEOUT` | arrêter ; zéro retry automatique |
| route agentique `404` | vérifier le chemin fermé ; aucune route métier agentique n'existe |
| base/runner agentique indisponible | continuer avec les vues cockpit natives |
| PII détectée | kill global, supprimer la base fixture locale et ouvrir un incident avant toute reprise |

## 13. Interdictions

- ne jamais remplacer `--local` par `--remote` ;
- ne jamais pointer vers une D1 production ;
- ne jamais importer une fixture réelle ;
- ne jamais activer un switch par SQL silencieux ;
- ne jamais lancer un modèle, un connecteur ou une action externe ;
- ne jamais interpréter un briefing comme une décision métier ;
- ne jamais démarrer A2 sans validation explicite.

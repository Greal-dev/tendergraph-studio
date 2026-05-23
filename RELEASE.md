# RELEASE — TenderGraph Studio

> Journal des releases Studio (tag `titan-v*`). La version OpenCode upstream
> reste inchangee (`packages/*/package.json` = `1.14.22`). Seule la version
> Studio dans `.tendergraph/config/tendergraph.config.json` est bumpee.

## Convention de tag

Format : `titan-v<major>.<minor>.<patch>` (semver).

- `major` : breaking change Studio (overlay incompatible avec versions precedentes,
  changement de format config, suppression de commands/agents publics).
- `minor` : nouvelles capabilities (commands, agents, providers, integrations).
- `patch` : fixes, refacto, alignement avec backend sans changement de surface.

Le tag declenche le workflow `.github/workflows/titan-release.yml` qui build
le binaire Windows x64 et publie une GitHub Release avec asset
`opencode-windows-x64.zip`.

L'installer PowerShell (`install.ps1`, sync auto vers `gh-pages` puis vers
le Worker Cloudflare `titan.tendergraph.app`) cherche par defaut le dernier
tag `titan-v*` via l'API GitHub Releases.

## Procedure release (operateur humain)

1. Merger la PR de la release sur `dev` (CI alignment + structure passe).
2. Verifier que `.tendergraph/config/tendergraph.config.json` porte bien la
   version cible (champ `version` racine + `tendergraph.version`).
3. Creer + pousser le tag depuis `dev` :

   ```bash
   git switch dev && git pull --ff-only origin dev
   git tag -a titan-v0.2.0 -m "Titan v0.2.0 — alignement 13 phases backend"
   git push origin titan-v0.2.0
   ```

4. Le workflow `titan-release` se declenche automatiquement sur le tag.
   Suivre via `gh run watch` ou l'onglet Actions.
5. Verifier la Release publiee : `gh release view titan-v0.2.0`.
6. Tester l'installer sur une machine Windows propre :

   ```powershell
   iwr -useb https://titan.tendergraph.app/install.ps1 | iex
   titan --version
   ```

## v0.2.0 (2026-05-23) — Alignement 13 phases backend

**Theme** : refonte complete de l'overlay TG pour absorber les 2 nouvelles
phases backend (`scoring_strategy`, `financial_analysis`), ajuster le
positionnement Desktop (variante TITAN Local pour users sans IDE IA), et
durcir le checker d'alignement.

### Commands (16 totales, 13 mappees phases backend, 3 utilities)

Renommees / mappees :
- `diagnostic-collecte` (ex-diagnostic)
- `materialisation-revision` (ex-maturation)

Nouvelles (alignees sur nouvelles phases backend) :
- `scoring-strategy` -> phase `scoring_strategy`
- `financial-analysis` -> phase `financial_analysis`
- `solution-design` -> phase `solution_design`
- `revue-coherence` -> phase `revue_coherence`
- `revue-evaluateur` -> phase `revue_evaluateur`

Supprimees : `solution`, `solutionning`, `revue` (redondantes).

Conservees (utilities cross-cutting, pas de phase_backend) :
`compare`, `resume`, `status`, `book-cv`, `briefs`, `cartographie`, `explore`,
`production`, `strategie`.

### Agents (7 totaux)

Nouveaux :
- `scoring-strategist` — strategie de scoring, simulate_composite_weighting,
  validate_scoring_strategy.
- `financial-analyst` — modele financier, generate_excel_financial_model.

Mis a jour : `bpu-analyst`, `dce-reviewer`, `mt-writer`, `risk-challenger`
recoivent les validators et tools manquants.

### Tooling

- `tools/check-tg-alignment.ts` : toolRegex etendu aux 71 tools publics du
  catalog backend ; parseur de frontmatter agent supporte le format YAML
  mapping (`tools:\n  X: true`) en plus du format inline CSV.
- `.tendergraph/config/tendergraph.config.json` : `version` 0.1.0 -> 0.2.0,
  `tendergraph.version` 0.1.0-alpha -> 0.2.0, MCP description "11 phases"
  -> "13 phases".

### Distribution

- Build matrix : Windows x64 uniquement (arm64 toujours en pause, cross-compile
  non finalise).
- Installer PS 5.1 compat preserve.
- Worker Cloudflare `titan.tendergraph.app/install.ps1` -> sync auto depuis `dev`.

### Doc

- `TENDERGRAPH.md`, `README.md`, `.tendergraph/docs/ARCHITECTURE.md`,
  `.tendergraph/docs/ALIGNMENT.md` refondus (pivot : Desktop = variante TITAN
  Local pour users sans IDE IA, pas de pricing public, pas de SaaS managed).

## v0.1.1 (2026-04-30)

- `install.ps1` PS 5.1 compat + gestion prefix `titan-v*`.
- Workflow `titan-release` : drop temporaire matrix arm64 (cross-compile
  echec sur `windows-latest`).
- Cloudflare Worker `titan-installer.js` pour servir `install.ps1` via
  `titan.tendergraph.app`.

## v0.1.0 (2026-04-29)

- Premiere release Windows x64 packagee `opencode-windows-x64.zip`.
- Overlay `.tendergraph/` initial : 3 agents, 11 commands, 2 hooks.
- Multi-provider config (Anthropic, OpenAI, Google, xAI, Moonshot, Zhipu).

# Alignment contract — Desktop ↔ Backend MCP

## Pourquoi

TenderGraph distribue le système cognitif **TITAN** sous deux fronts
techniques qui partagent le même pipeline métier et le même backend MCP :

- **TITAN Local dans un IDE IA** : configuration MCP greffée sur Claude
  Code, Cursor, Codex, Copilot, etc. déjà installé chez l'utilisateur.
- **TenderGraph Desktop** : client desktop dédié, fork OpenCode, pour
  les utilisateurs sans IDE IA — c'est ce repo, avec son overlay
  `.tendergraph/`.

Si une phase est ajoutée côté backend MCP, les deux fronts doivent suivre.
Sinon :

- Le backend expose un tool ou une phase que Desktop ne référence pas.
- L'utilisateur se retrouve avec une commande obsolète qui n'a plus de
  pendant côté serveur.
- Les livrables produits côté serveur deviennent invisibles dans le
  client.

## Source de vérité

**Backend TenderGraph MCP** via l'endpoint public :

```
GET https://tendergraph-v3.fly.dev/api/mcp/catalog

{
  "phases": [
    "explore",
    "cartographie",
    "diagnostic_collecte",
    "scoring_strategy",
    "strategie",
    "solution_design",
    "financial_analysis",
    "briefs",
    "production",
    "book_cv",
    "materialisation_revision",
    "revue_coherence",
    "revue_evaluateur"
  ],
  "tools_public": [
    {"name": "tendergraph_step", "description": "..."},
    {"name": "get_workspace_tree", ...},
    ...
  ],
  "validators": ["validate_anti_forcing", "validate_scoring_strategy"],
  "resources": ["tendergraph://workspace/...", "tendergraph://docs/..."]
}
```

Le pipeline backend compte **13 phases** dont 2 ajoutées récemment
(`scoring_strategy`, `financial_analysis`) avec leurs agents dédiés
(`scoring-strategist`, `financial-analyst`).

## Ce que Desktop doit garantir

1. **Chaque phase backend a un fichier `.tendergraph/commands/<phase>.md`**
   (frontmatter `phase_backend: <nom>` pour traçabilité) ou un alias
   documenté.
2. **Aucun slash command de phase n'existe** sans phase backend
   correspondante. Les commandes utilitaires transverses (`compare`,
   `resume`, `status`, `book-cv`, `briefs`, `cartographie`, `explore`,
   `production`, `strategie`) sont autorisées sans `phase_backend` quand
   elles couvrent des helpers cross-cutting.
3. **Chaque tool public MCP est référencé** dans au moins un agent ou
   une command (warning seulement — permet aux tools rarement utilisés
   d'exister).
4. **Les hooks pre/post-tool** ne référencent que des tools qui existent
   côté MCP.
5. **Les validators MCP** (`validate_anti_forcing`,
   `validate_scoring_strategy`, etc.) sont référencés par les agents
   pertinents (`mt-writer`, `risk-challenger`, `bpu-analyst`,
   `scoring-strategist`).

## Vérification automatique

Script `tools/check-tg-alignment.ts` :

```bash
bun run tools/check-tg-alignment.ts
# ou : npm run align
```

Exécuté :

- En CI sur chaque PR Desktop (GitHub Actions)
- En pre-commit local si le hook est activé
  (`git config core.hooksPath .githooks`)
- Proactivement par l'agent `tg-studio-aligner` côté backend quand une
  modif touche la liste des phases ou la config orchestrateur.

Output type :

```
[tg-align] OK — 13 phases, N tools, 2 validators, alignment green.
```

ou :

```
[tg-align] DIVERGENCE :
  - phase 'new_phase' backend sans command dans .tendergraph/commands/
  - command /legacy-step référence une phase absente du backend
  Fix : créer .tendergraph/commands/new-phase.md, retirer legacy-step.md
```

## Cycle de vie

```
┌─ dev backend MCP ──────┐   ┌─ dev Desktop ──────────┐
│ PR sur le repo backend  │   │ PR sur ce repo         │
│   - ajoute phase X      │   │   - ajoute             │
│   - update orchestrator │   │     commands/X.md      │
│   - update prompts      │──►│   - update agent role  │
│   - test_mcp_parity ok  │   │   - check-tg-align ok  │
└─────────────────────────┘   └────────────────────────┘
           │                             │
           └──────────── merge ──────────┘
                         │
                    Deploy prod
                 (MCP catalog à jour)
                         │
                    Desktop release (brew/scoop/npm)
```

## Breaking changes

Si un changement backend casse l'alignement (rename phase, suppression
tool public), la règle **doit** être :

1. **Grace period** : le backend continue d'exposer l'ancien nom en
   alias pendant 2 releases Desktop.
2. **Desktop v(n)** : ajoute le nouveau nom, marque l'ancien
   `@deprecated` dans la doc command.
3. **Desktop v(n+1)** : retire l'ancien nom, aligne sur le nouveau.
4. **Backend v(suivant)** : peut retirer l'alias.

Sinon : les utilisateurs qui n'ont pas fait `tendergraph update` cassent.

## Responsabilités

| Rôle | Responsabilité |
|---|---|
| PR author backend | S'assure que `check-tg-alignment` pourrait passer côté Desktop |
| PR author Desktop | Vérifie que `bun run align` passe avant merge |
| Agent `tg-studio-aligner` (backend) | PROACTIVELY ouvre un PR Desktop si une modif backend casserait l'alignement |
| Agent `tg-mcp-aligner` (backend) | Vérifie parité MCP↔serveur interne |
| CI backend | Bloque merge si `test_mcp_parity` fail |
| CI Desktop | Bloque merge si `check-tg-alignment` fail |

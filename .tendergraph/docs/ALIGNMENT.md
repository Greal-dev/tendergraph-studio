# Alignment contract — Studio ↔ Backend

## Pourquoi

TenderGraph a trois faces qui partagent le même pipeline métier :

- **SaaS managed** : pipeline piloté par serveur (`backend/src/chat/opus_runner.py`)
- **MCP server** : mêmes helpers exposés aux clients MCP
  (`backend/src/mcp/tools_mcp.py`, `backend/src/mcp/orchestrator.py`)
- **Studio** : client pré-configuré qui parle au MCP (`.tendergraph/` dans ce repo)

Si une phase est ajoutée cote backend, les trois doivent suivre. Sinon :

- SaaS continue de tourner mais produit un livrable invisible dans l'UI Studio
- MCP expose un tool que Studio ne référence pas
- User se retrouve avec une commande `/old-phase` obsolète

## Source de vérité

**Backend tendergraph-v3** via l'endpoint public :

```
GET https://tendergraph-v3.fly.dev/api/mcp/catalog

{
  "phases": ["explore", "cartographie", "strategie", "solutionning",
             "solution", "briefs", "production", "book_cv",
             "revue", "diagnostic_collecte", "materialisation_revision"],
  "tools_public": [
    {"name": "tendergraph_step", "description": "..."},
    {"name": "get_workspace_tree", ...},
    ...
  ],
  "validators": ["validate_anti_forcing", "validate_solutionning"],
  "resources": ["tendergraph://workspace/...", "tendergraph://docs/..."]
}
```

## Ce que Studio doit garantir

1. **Chaque phase backend a un fichier `.tendergraph/commands/<phase>.md`** ou
   un alias documenté.
2. **Aucun slash command n'existe** sans phase backend correspondante.
3. **Chaque tool public MCP est référencé** dans au moins un agent ou une
   command (warning seulement — permet aux tools rarement utilisés d'exister).
4. **Les hooks pre/post-tool** ne référencent que des tools qui existent
   côté MCP.

## Vérification automatique

Script `tools/check-tg-alignment.ts` :

```bash
bun run tools/check-tg-alignment.ts
# ou : npm run align
```

Exécuté :

- En CI sur chaque PR Studio (GitHub Actions)
- En pre-commit local si le hook est activé
  (`git config core.hooksPath .githooks`)
- Proactivement par l'agent `tg-studio-aligner` côté backend quand une modif
  touche `backend/src/chat/opus_runner.py::PHASE_NAMES` ou
  `backend/src/mcp/orchestrator.py::_PHASE_CONFIG`

Output type :

```
[tg-align] OK — 11 phases, 23 tools, 2 validators, alignment green.
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
┌─ dev backend ──────────┐   ┌─ dev studio ──────────┐
│ PR #N sur               │   │ PR #M sur              │
│ tendergraph-v3          │   │ tendergraph-studio     │
│   - ajoute phase X      │   │   - ajoute             │
│   - update _PHASE_CONFIG│   │     commands/X.md      │
│   - update prompts      │──►│   - update agent role  │
│   - test_mcp_parity ok  │   │   - check-tg-align ok  │
└─────────────────────────┘   └────────────────────────┘
           │                             │
           └──────────── merge ──────────┘
                         │
                    Deploy prod
                 (MCP catalog à jour)
                         │
                    Studio release (brew/scoop/npm)
```

## Breaking changes

Si un changement backend casse l'alignement (rename phase, suppression tool
public), la règle **doit** être :

1. **Grace period** : le backend continue d'exposer l'ancien nom en alias
   pendant 2 releases Studio.
2. **Studio v(n)** : ajoute le nouveau nom, marque l'ancien `@deprecated`
   dans la doc command.
3. **Studio v(n+1)** : retire l'ancien nom, aligne sur le nouveau.
4. **Backend v(suivant)** : peut retirer l'alias.

Sinon : les users qui n'ont pas fait `tendergraph update` cassent.

## Responsabilités

| Rôle | Responsabilité |
|---|---|
| PR author backend | S'assure que `tools/check-tg-alignment` pourrait passer côté Studio |
| PR author studio | Vérifie que `bun run align` passe avant merge |
| Agent `tg-studio-aligner` (backend) | PROACTIVELY ouvre un PR Studio si une modif backend casserait l'alignement |
| Agent `tg-mcp-aligner` (backend) | Vérifie parité MCP↔SaaS (existant, PR #78) |
| CI backend | Bloque merge si `test_mcp_parity` fail |
| CI studio | Bloque merge si `check-tg-alignment` fail |

# Architecture — TenderGraph Studio

## Vue d'ensemble

```
┌────────────────────────────────────────────────────────────────┐
│ TenderGraph Studio (ce repo, fork OpenCode)                     │
│                                                                  │
│  ┌──────────────────────────────────────┐                       │
│  │ OpenCode runtime (upstream)           │                       │
│  │   - CLI / TUI                         │                       │
│  │   - Multi-provider (Claude, GPT,      │                       │
│  │     Gemini, Grok, Kimi, GLM, local)   │                       │
│  │   - Tool-use loop                     │                       │
│  │   - Sub-agents, hooks, slash commands │                       │
│  └──────────────────────────────────────┘                       │
│                    ▲                                             │
│                    │ lit à chaque lancement                      │
│                    ▼                                             │
│  ┌──────────────────────────────────────┐                       │
│  │ .tendergraph/ (overlay)               │                       │
│  │   - agents/ (rôles TG, prompts courts)│                       │
│  │   - commands/ (slash commands phases) │                       │
│  │   - hooks/ (validation, lock auto)    │                       │
│  │   - config/ (endpoint MCP pré-câblé)  │                       │
│  └──────────────────────────────────────┘                       │
└────────────────────────────────────────────────────────────────┘
                        │ HTTPS (MCP Streamable)
                        ▼
┌────────────────────────────────────────────────────────────────┐
│ tendergraph-v3 (repo séparé, prod Fly.io)                       │
│                                                                  │
│  Backend FastAPI :                                               │
│   - Serveur MCP (workspace, helpers, validators, versioning)    │
│   - Prompts riches phase_*.md (IP)                              │
│   - Auth OAuth → token MCP                                      │
│   - /api/mcp/catalog (source de vérité phases + tools)          │
└────────────────────────────────────────────────────────────────┘
```

## Pourquoi un overlay ?

**Contrainte** : OpenCode évolue vite (148k stars, 16k forks, cadence mensuelle
upstream). Un fork invasif qui modifie le code OpenCode en profondeur devient
impossible à rebaser après quelques mois.

**Solution** : toute personnalisation TG vit dans `.tendergraph/`. Le runtime
OpenCode n'est pas modifié — il lit simplement ce dossier au démarrage (les
agents/commands/hooks y étant déjà compatibles avec le format OpenCode natif).

**Conséquence** : `git rebase upstream/dev` reste trivial. Les conflits ne se
produisent que sur `package.json`, `README.md`, et éventuellement dans les
fichiers de branding.

## Flux d'un run utilisateur

1. User lance `tendergraph` → le CLI démarre, charge `.tendergraph/config/` pour
   pré-remplir l'endpoint MCP et le provider par défaut.
2. `tendergraph login` → OAuth via https://tendergraph.app, récupère un token MCP,
   stocke dans le keychain OS (via `keytar` côté OpenCode).
3. Le user tape `/explore` ou *"lance le pipeline sur le projet AVV PICON"*.
4. L'agent (LLM du provider choisi) appelle les tools MCP exposés par
   `tendergraph-v3.fly.dev/mcp/` : `tendergraph_step`, `read_document`,
   `write_deliverable`, etc.
5. Les hooks TG locaux tournent avant/après les appels (lint markers,
   lock acquisition, trace logging).
6. L'user voit les livrables produits et peut les éditer manuellement,
   demander des critiques, basculer entre auto-pilote et mode libre.

## Où vivent quoi

| Couche | Emplacement | Exemple |
|---|---|---|
| Runtime agent (tool-use loop, streaming) | Upstream OpenCode | `packages/opencode/src/` |
| Providers LLM | Upstream OpenCode | `packages/opencode/src/providers/` |
| UI CLI / TUI | Upstream OpenCode | `packages/opencode/src/cli/` |
| App desktop Electron | Upstream OpenCode | `packages/desktop-electron/` |
| Rôles agents TG | Overlay | `.tendergraph/agents/*.md` |
| Slash commands TG | Overlay | `.tendergraph/commands/*.md` |
| Hooks déterministes TG | Overlay | `.tendergraph/hooks/*.sh` |
| Config MCP pré-câblée | Overlay | `.tendergraph/config/tendergraph.config.json` |
| Doctrine riche (prompts phase_*) | **Backend** | tendergraph-v3, servi via MCP resources |
| Validators fermés | **Backend** | tendergraph-v3, servi via MCP tools |

## Contrat d'alignement

Voir `ALIGNMENT.md` pour le détail. Résumé :

- 1 phase backend = 1 slash command studio (sinon CI fail)
- 1 tool backend public = 1 référence dans au moins 1 agent ou command
  (sinon warning CI)
- Tout changement backend qui casse ce contrat déclenche un PR auto dans
  `tendergraph-studio` via l'agent `tg-studio-aligner`.

## Décisions archivées

- **Pas de port de l'IP doctrinale côté studio** : les prompts `phase_*.md` et les
  règles de validation restent côté serveur MCP. Un fork hostile qui cloenrait
  ce repo n'obtient qu'un wrapper OpenCode customisé — sans la valeur métier.
- **Pas de backend spécifique studio** : tout passe par MCP (workspace, locks,
  versioning, validators). Zero duplication de logique.
- **Pas de système de licence côté client** : l'accès au backend MCP est
  contrôlé par token Stripe/seat. Si le user n'a pas de seat actif, le backend
  refuse ses appels. Studio reste distribuable librement sous un modèle
  freemium : le binaire fonctionne, mais n'accède à rien sans seat.

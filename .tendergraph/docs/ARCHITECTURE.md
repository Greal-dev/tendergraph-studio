# Architecture — TenderGraph Desktop

## Vue d'ensemble

```
┌────────────────────────────────────────────────────────────────┐
│ TenderGraph Desktop (ce repo, fork OpenCode)                    │
│ Variante TITAN Local pour utilisateurs sans IDE IA              │
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
│  │   - commands/ (13 phases + utilities) │                       │
│  │   - hooks/ (validation, lock auto)    │                       │
│  │   - config/ (endpoint MCP pré-câblé)  │                       │
│  └──────────────────────────────────────┘                       │
└────────────────────────────────────────────────────────────────┘
                        │ HTTPS (MCP Streamable)
                        ▼
┌────────────────────────────────────────────────────────────────┐
│ TenderGraph MCP backend (repo séparé, prod Fly.io)              │
│                                                                  │
│  Serveur MCP TITAN :                                             │
│   - Doctrine pipeline 13 phases                                  │
│   - Helpers déterministes (workspace, locks, versioning)         │
│   - Validators (anti-forcing, scoring strategy, …)               │
│   - Prompts riches phase_*.md (IP doctrinale)                    │
│   - Auth OAuth → token MCP                                       │
│   - /api/mcp/catalog (source de vérité phases + tools)           │
└────────────────────────────────────────────────────────────────┘
```

## TITAN Local et ses fronts

TenderGraph distribue **TITAN** (Tender Intelligence Tracking and
Automation Nexus), un système cognitif spécialisé dans la réponse aux
appels d'offres publics IT. TITAN équipe le poste de chaque collaborateur
avant-vente.

Il existe deux fronts techniques équivalents pour installer TITAN sur un
poste utilisateur :

- **TITAN Local dans un IDE IA existant** : Claude Code, Cursor, Codex,
  Copilot — l'utilisateur a déjà un coding agent, TITAN s'y greffe via
  configuration MCP.
- **TenderGraph Desktop** *(ce repo)* : application desktop dédiée pour
  les utilisateurs qui n'ont pas d'IDE IA et n'en veulent pas. Le client
  est packagé avec un coding agent OpenCode pré-configuré.

Les deux fronts parlent au **même** serveur MCP backend et exécutent le
**même** pipeline 13 phases avec la **même** doctrine.

## Pourquoi un overlay ?

**Contrainte** : OpenCode évolue vite (cadence mensuelle upstream). Un
fork invasif qui modifie le code OpenCode en profondeur devient
impossible à rebaser après quelques mois.

**Solution** : toute personnalisation TG vit dans `.tendergraph/`. Le
runtime OpenCode n'est pas modifié — il lit simplement ce dossier au
démarrage (les agents/commands/hooks y étant déjà compatibles avec le
format OpenCode natif).

**Conséquence** : `git rebase upstream/dev` reste trivial. Les conflits
ne se produisent que sur `package.json`, `README.md`, et éventuellement
dans les fichiers de branding.

## Flux d'un run utilisateur

1. User lance `tendergraph` → le CLI démarre, charge `.tendergraph/config/`
   pour pré-remplir l'endpoint MCP et le provider par défaut.
2. `tendergraph login` → OAuth via tendergraph.app, récupère un token MCP,
   stocke dans le keychain OS (via `keytar` côté OpenCode).
3. Le user tape `/explore` ou *"lance le pipeline sur le projet AVV PICON"*.
4. L'agent (LLM du provider choisi) appelle les tools MCP exposés par
   le backend : `tendergraph_step`, `read_document`, `write_deliverable`,
   etc.
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
| Slash commands TG (13 phases + utilities) | Overlay | `.tendergraph/commands/*.md` |
| Hooks déterministes TG | Overlay | `.tendergraph/hooks/*.sh` |
| Config MCP pré-câblée | Overlay | `.tendergraph/config/tendergraph.config.json` |
| Doctrine riche (prompts phase_*) | **Backend MCP** | servi via MCP resources |
| Validators fermés | **Backend MCP** | servi via MCP tools |

## Contrat d'alignement

Voir `ALIGNMENT.md` pour le détail. Résumé :

- 1 phase backend = 1 slash command Desktop (sinon CI fail)
- 1 tool backend public = 1 référence dans au moins 1 agent ou command
  (sinon warning CI)
- Tout changement backend qui casse ce contrat déclenche un PR auto
  dans ce repo via l'agent `tg-studio-aligner` côté backend.

## Décisions archivées

- **Pas de port de l'IP doctrinale côté client** : les prompts
  `phase_*.md` et les règles de validation restent côté serveur MCP. Un
  fork hostile qui clonerait ce repo n'obtient qu'un wrapper OpenCode
  customisé — sans la valeur métier.
- **Pas de backend spécifique au client desktop** : tout passe par MCP
  (workspace, locks, versioning, validators). Zéro duplication de
  logique entre TITAN Local IDE et TenderGraph Desktop.
- **Pas de système de licence côté client** : l'accès au backend MCP est
  contrôlé par token côté serveur. Si l'utilisateur n'a pas d'accès
  actif, le backend refuse ses appels. Le binaire reste distribuable
  librement — il ne fait rien d'utile sans accès backend.

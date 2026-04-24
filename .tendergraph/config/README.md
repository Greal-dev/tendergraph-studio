# .tendergraph/config/

**Configuration par défaut Studio.** Ce dossier est lu au démarrage
par le runtime (via le chargeur overlay `.tendergraph/config/tendergraph.config.json`).

## Fichiers

| Fichier | Rôle |
|---|---|
| `tendergraph.config.json` | Endpoint MCP, providers disponibles, agents/commands/hooks activés |
| `tendergraph.config.schema.json` *(à venir)* | JSON Schema pour validation |

## Surcharge utilisateur

L'utilisateur peut surcharger cette config via :

1. **`~/.tendergraph/config.json`** (home) — merge deep
2. **`./tendergraph.config.json`** (cwd du projet) — merge deep
3. **Variables d'environnement** : `TG_MCP_URL`, `TG_DEFAULT_PROVIDER`, etc.

Ordre de priorité (plus haut = plus fort) :
env > projet > home > overlay `.tendergraph/`.

## Lecture par l'app

Le loader cherche ces chemins dans l'ordre, merge les JSON deep, valide
contre le schema, injecte dans le contexte runtime OpenCode.

## Ne pas modifier en prod

Ce fichier est **committé**. Pour des overrides locaux, utiliser
`~/.tendergraph/config.json` ou les env vars (jamais à commiter).

## Secrets

**Aucune clé API n'est stockée ici.** Les clés vivent dans le keychain OS
(référencées par `keychainKey`). Voir `.tendergraph/docs/ARCHITECTURE.md`
section "Secrets et keychain".

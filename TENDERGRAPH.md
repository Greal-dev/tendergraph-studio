# TenderGraph Studio

**Studio agent IA pour réponses aux appels d'offres publics.**

TenderGraph Studio est un fork de [OpenCode](https://github.com/sst/opencode)
(MIT, SST) pré-configuré pour le pipeline TenderGraph de réponse aux marchés
publics français. Multi-provider (Claude, GPT, Gemini, Grok, Kimi, GLM, local),
agents spécialisés métier, hooks déterministes, connecté au serveur
TenderGraph MCP.

## Positionnement dans l'offre TenderGraph

| Produit | Description | Tarif | LLM |
|---|---|---|---|
| **TenderGraph SaaS (managed)** | Pipeline entièrement orchestré côté serveur, UI web tendergraph.app | 899 € / dossier | Inclus (Claude) |
| **TenderGraph MCP** | Serveur MCP pour clients tiers (Claude Code, Codex, Cursor…) | 200 € / seat / mois | BYOK (client) |
| **TenderGraph Studio** | App de bureau agent IA multi-provider, pré-configurée TG | 200 € / seat / mois (inclus dans MCP) | BYOK (client) |

Studio = la même prestation MCP, packagée dans un client dédié pour les users
qui ne veulent pas installer Claude Code / Codex / Cursor / Claude Desktop.

## Architecture

Studio est une **couche overlay** sur OpenCode. Le code OpenCode reste intact
pour permettre les rebases sans conflit. Les personnalisations TG vivent dans
`.tendergraph/` :

```
.tendergraph/
├── agents/        Sub-agents spécialisés (dce-reviewer, bpu-analyst, …)
├── commands/      Slash commands miroir des 11 phases TG
├── hooks/         Hooks déterministes (lint markers, auto-lock, …)
├── config/        Config par défaut (endpoint MCP, provider presets)
└── docs/          ARCHITECTURE.md, ALIGNMENT.md
tools/
└── check-tg-alignment.ts   Vérifie cohérence studio ↔ backend TG
```

## Isolation et alignement

- **Code isolé** : ce repo est séparé de `tendergraph-v3` (SaaS + MCP).
  Maintenance indépendante, cadence de release propre, rebase upstream possible.
- **Alignement garanti** : `tools/check-tg-alignment.ts` fetche
  `tendergraph-v3.fly.dev/api/mcp/catalog` et vérifie que les slash commands
  couvrent toutes les phases backend, que les agents référencent des tools
  existants, qu'aucun nom de phase ne diverge. Bloque la CI si divergence.
- **Pas d'IP doctrinale ici** : les prompts riches TG restent côté serveur
  (servis via resources/read MCP). Studio n'embarque que des rôles courts,
  des hooks déterministes, et des slash commands minces.

## Développement

Voir `.tendergraph/docs/ARCHITECTURE.md` pour l'architecture détaillée et
`ALIGNMENT.md` pour le contrat de cohérence avec le backend.

## License

Apache-2.0 sur le code OpenCode upstream. Les additions TenderGraph (dossier
`.tendergraph/`, `tools/`, `TENDERGRAPH.md`, `README.TG.md`) sont publiées sous
licence **proprietary TenderGraph** — voir `LICENSE.TG`.

## Upstream

- Projet upstream : https://github.com/sst/opencode
- Pour rebaser : `git fetch upstream && git rebase upstream/dev`
- Merci à l'équipe SST pour OpenCode.

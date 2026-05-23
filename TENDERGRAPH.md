# TenderGraph Desktop

**Variante de TITAN Local pour utilisateurs sans IDE IA.**

TenderGraph Desktop est un fork de [OpenCode](https://github.com/sst/opencode)
(MIT, SST) pré-configuré pour le pipeline TenderGraph de réponse aux marchés
publics français IT. Il connecte le poste de l'utilisateur au serveur
TenderGraph MCP qui expose la doctrine et les helpers déterministes
TITAN (Tender Intelligence Tracking and Automation Nexus).

## Positionnement dans l'offre TenderGraph

TenderGraph distribue **TITAN** — un système cognitif spécialisé dans la
réponse aux appels d'offres publics IT — sous deux fronts techniques
équivalents :

- **TITAN Local** : à installer dans un coding agent IDE existant
  (Claude Code, Cursor, Codex, Copilot…) déjà utilisé par le collaborateur.
- **TenderGraph Desktop** *(ce produit)* : la même prestation, packagée dans
  une application desktop dédiée, pour les utilisateurs qui n'ont pas
  d'IDE IA installé et ne souhaitent pas en adopter un.

Dans les deux cas, le poste utilisateur devient un nœud TITAN connecté au
serveur TenderGraph MCP qui sert la doctrine, les validators et les helpers
déterministes du pipeline 13 phases.

Narratif produit et conditions commerciales : [tendergraph.app](https://tendergraph.app).

## Architecture

Desktop est une **couche overlay** sur OpenCode. Le code OpenCode reste
intact pour permettre les rebases sans conflit. Les personnalisations TG
vivent dans `.tendergraph/` :

```
.tendergraph/
├── agents/        Sous-agents spécialisés (dce-reviewer, bpu-analyst,
│                  mt-writer, risk-challenger, scoring-strategist,
│                  financial-analyst…)
├── commands/      Slash commands miroir des 13 phases backend + utilities
├── hooks/         Hooks déterministes (lint markers, auto-lock, …)
├── config/        Config par défaut (endpoint MCP, provider presets)
└── docs/          ARCHITECTURE.md, ALIGNMENT.md
tools/
└── check-tg-alignment.ts   Vérifie cohérence Desktop ↔ backend TG
```

## Isolation et alignement

- **Code isolé** : ce repo est séparé du backend TenderGraph.
  Maintenance indépendante, cadence de release propre, rebase upstream
  OpenCode possible.
- **Alignement garanti** : `tools/check-tg-alignment.ts` fetche
  `tendergraph-v3.fly.dev/api/mcp/catalog` et vérifie que les slash
  commands couvrent toutes les phases backend, que les agents référencent
  des tools existants, qu'aucun nom de phase ne diverge. Bloque la CI si
  divergence.
- **Pas d'IP doctrinale dans le client** : les prompts riches TG restent
  côté serveur (servis via `resources/read` MCP). Desktop n'embarque que
  des rôles courts d'agents, des hooks déterministes, et des slash
  commands minces qui délèguent au serveur via `tendergraph_step`.

## Souveraineté et LLM propriétaire

Desktop se connecte au LLM de votre choix via BYOK (Bring Your Own Key).
Sept providers sont déclarés nativement : Anthropic, OpenAI, Google,
xAI, Moonshot, Zhipu, ainsi qu'un connecteur générique compatible
OpenAI pour tout LLM auto-hébergé (Mistral sur OVH, Llama on-prem,
infrastructure GPU interne).

Conséquences pratiques :

- Les données du dossier restent sur le poste utilisateur dans un
  workspace local sandboxé. Elles ne transitent que vers le LLM que
  vous avez désigné dans la config.
- Aucune obligation d'utiliser un LLM hébergé hors UE.
- La configuration provider vit dans `.tendergraph/config/tendergraph.config.json`
  (cf. champ `providers.available`) avec un badge qualité (green / yellow / red)
  indiquant le niveau de couverture testé sur dossier AO.
- Voie privilégiée par les clients du secteur public, défense et santé
  qui doivent contraindre l'inférence LLM à une infrastructure souveraine.

Le serveur TenderGraph MCP, lui, n'effectue jamais d'inférence LLM :
il sert la doctrine, les helpers et les validators déterministes, mais
les générations de texte se font côté Desktop avec le LLM que vous avez
désigné. La séparation est nette.

## Développement

Voir `.tendergraph/docs/ARCHITECTURE.md` pour l'architecture détaillée et
`.tendergraph/docs/ALIGNMENT.md` pour le contrat de cohérence avec le
backend.

## License

Apache-2.0 sur le code OpenCode upstream. Les additions TenderGraph
(dossier `.tendergraph/`, `tools/`, `TENDERGRAPH.md`, `README.TG.md`) sont
publiées sous licence **proprietary TenderGraph** — voir `LICENSE.TG`.

## Upstream

- Projet upstream : https://github.com/sst/opencode
- Pour rebaser : `git fetch upstream && git rebase upstream/dev`
- Merci à l'équipe SST pour OpenCode.

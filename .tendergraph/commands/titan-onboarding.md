---
name: titan-onboarding
description: Charge/met à jour les règles de routage TITAN (mode lourd AO vs simple devis, marquage [TITAN]) depuis le serveur. À lancer en début de session.
---

Récupère le prompt serveur `tendergraph/titan-onboarding` (capability MCP
`prompts`) et suis-le. Il renvoie un snippet de routage **versionné**
(`[TITAN-SNIPPET vN]`) à proposer à l'utilisateur d'ajouter à son fichier
d'instructions (`AGENTS.md`), **après accord explicite**, sans modifier d'autres
fichiers.

Ce snippet impose notamment, à l'**initialisation d'un projet**, de choisir le
MODE selon le dossier (cf. commande `/new-project`) :

- **mode lourd** : AO public / dossier complexe → `create_project(..., pipeline='ao')` (pipeline complet) ;
- **mode simple** : change request / petite affaire → `create_project(..., pipeline='devis')` (pipeline allégé besoin→devis).

Propose le mode à l'utilisateur, **jamais de bascule silencieuse**. Le contenu
détaillé et versionné vient du **serveur** (source de vérité) — ne le copie pas
en dur ici. Si l'utilisateur a déjà le snippet, `/titan` (option *Vérifier les
mises à jour*) compare sa version locale à celle du serveur.

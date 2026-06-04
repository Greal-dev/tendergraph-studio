---
name: new-project
description: Démarre un nouveau dossier TITAN — choisit le mode (lourd AO 13 phases vs simple devis allégé) puis crée le projet.
---

À l'initialisation d'un dossier :

1. **Évalue le dossier** : lis les pièces EN LOCAL avec tes tools natifs
   (Read/Glob), n'uploade pas (mode local-first).
2. **Détermine le MODE et PROPOSE-le à l'utilisateur** (jamais de bascule
   silencieuse) :
   - **lourd** : AO public / dossier complexe (RC, CCTP, grille de notation
     pondérée) → pipeline `ao` (pipeline complet) ;
   - **simple** : change request / petite affaire / simple expression de besoin
     → pipeline `devis` (allégé besoin→devis).
3. **Après confirmation**, crée le projet : appelle d'abord
   `find_project_by_query(name)` pour éviter un doublon, puis
   `create_project(name=..., client=..., pipeline='ao'|'devis')`.
4. Préfixe ta réponse de la ligne `provenance` retournée (commence par `[TITAN]`),
   puis enchaîne avec `tendergraph_step` sur la première phase du pipeline.

La règle de routage complète (versionnée) vient du serveur via
`/titan-onboarding` — source de vérité, ne pas dupliquer la doctrine ici.

---
name: status
description: Affiche l'état du pipeline TG sur le projet courant : phase en cours, complétion, livrables présents, locks actifs.
---

Appelle `tendergraph_step` avec `action="status"` et `get_workspace_tree`
sur le projet courant. Retourne au user un résumé textuel :

- phase courante / total
- livrables présents par dossier (5-proposition-valeur/, 6-solution/, etc.)
- locks actifs s'il y en a (qui tient quoi)
- dernière action pipeline (date du dernier submit)

Ne modifie rien. Strictement en lecture.

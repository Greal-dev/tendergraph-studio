---
name: compare
description: Compare deux versions d'un livrable (diff unifié + stats). Usage typique - /compare <path> [v_from=0] [v_to=latest]. Utile pour analyser l'imitation gap (tg_inferred vs human_edit).
---

Args attendus :

- `path` : chemin du livrable (ex: `7-proposition/memoire-technique.md`)
- `v_from` : version source (défaut 0 = premier jet TG)
- `v_to` : version cible (défaut -1 = dernier snapshot)

Appelle `compare_deliverable_versions(project_id, path, v_from, v_to)`.

Affiche :
- les métadonnées des 2 versions (source, auteur, date, taille)
- les stats (lines_added/removed/modified, similarity)
- le diff unifié (tronqué à 200k chars si gros)
- **si `imitation_gap=true`** (v0 généré par l'IA, vN édité par l'humain) :
  ajoute une invitation explicite à demander à `risk-challenger` ou
  `positioning-critic` d'analyser les apports humains.

Ne modifie rien.

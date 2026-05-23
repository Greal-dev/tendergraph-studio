---
name: diagnostic-collecte
description: Collecte interactive des inputs manquants user
phase_backend: diagnostic_collecte
---

# Phase — diagnostic_collecte

Phase INTERACTIVE. Utilise `tendergraph_step(action="answer")` pour transmettre les réponses user.

## Protocole

1. Vérifie la phase courante via `tendergraph_step(action="status")`.
2. Si la phase courante n'est pas `diagnostic_collecte`, avertis l'user :
   *"Le pipeline est actuellement en phase X, cette commande s'applique à diagnostic_collecte.
   Voulez-vous forcer un saut ? (non recommandé)"*.
3. Sinon, appelle `tendergraph_step(action="continue")` pour récupérer les
   instructions + contexte + livrables attendus + validators.
4. Si la réponse est `interactive=true`, pause et demande l'input au user,
   puis `tendergraph_step(action="answer", payload=...)`.
5. Sinon, produis le(s) livrable(s) selon les instructions fournies.
6. Pour chaque livrable, `tendergraph_step(action="submit", deliverable_path=..., content=...)`.
7. Si `violations`, corrige et re-soumets jusqu'à succès.
8. Retourne un résumé textuel : livrables produits, temps écoulé, phase suivante.

Ne triche pas avec les validators. Si le brief demande un marquage [FD]/[FP]/[H],
respecte-le. Si le CRT impose un plan, respecte-le.

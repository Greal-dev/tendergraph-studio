---
name: explore
description: Lance/reprend la phase d'exploration du DCE
phase_backend: explore
---

# Phase 1 — exploration DCE

Produit les memos clarifiés par pièce DCE (memo-rc.md, memo-cctp.md, etc.) + l'inventaire 00-carte-dce.md

## Protocole

1. Vérifie la phase courante via `tendergraph_step(action="status")`.
2. Si la phase courante n'est pas `explore`, avertis l'user :
   *"Le pipeline est actuellement en phase X, cette commande s'applique à explore.
   Voulez-vous forcer un saut ? (non recommandé)"*.
3. Sinon, appelle `tendergraph_step(action="continue")` pour récupérer les
   instructions + contexte + livrables attendus + validators.
4. Produis le(s) livrable(s) selon les instructions fournies par le serveur.
5. Pour chaque livrable, `tendergraph_step(action="submit", deliverable_path=..., content=...)`.
6. Si `violations`, corrige et re-soumets jusqu'à succès.
7. Retourne un résumé textuel : livrables produits, temps écoulé, phase suivante.

Ne triche pas avec les validators. Si le brief demande un marquage [FD]/[FP]/[H],
respecte-le. Si le CRT impose un plan, respecte-le.

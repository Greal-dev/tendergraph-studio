---
name: resume
description: Reprend le pipeline là où il s'est arrêté. Appelle tendergraph_step(action="continue") en boucle jusqu'à is_done=true ou interruption user.
---

Boucle d'exécution automatique du pipeline :

1. `state = tendergraph_step(project_id, action="status")`
2. Tant que `state.is_done` est faux :
   a. `brief = tendergraph_step(project_id, action="continue")`
   b. Si `brief.interactive == true` (phase de collecte), pause et
      demande l'input au user, puis `action="answer"`.
   c. Sinon, produis le livrable selon `brief.instructions` + `brief.context`
      + `brief.upstream_data`. Utilise les agents spécialisés si pertinent
      (mt-writer pour phase production, bpu-analyst pour solutionning…).
   d. `result = tendergraph_step(project_id, action="submit", ...)` .
   e. Si `result.violations`, corrige et re-soumets jusqu'à `success=true`.
   f. Re-query status.
3. À la fin : affiche le `workspace_tree` complet au user.

Si le user dit "pause" ou "stop", interromps proprement sans perdre l'état.

Ne change jamais la phase manuellement (pas de force-skip, pas d'`advance_phase`
arbitraire).

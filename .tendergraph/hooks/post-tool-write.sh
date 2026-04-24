#!/usr/bin/env bash
# post-tool-write.sh — invalide les caches locaux post-écriture et
# synchronise l'affichage des versions.
set -u

case "${TG_HOOK_TOOL_NAME:-}" in
    write_deliverable|edit_section|"tendergraph_step") ;;
    *) exit 0 ;;
esac

path="${TG_HOOK_TOOL_ARG_path:-${TG_HOOK_TOOL_ARG_deliverable_path:-}}"
project_id="${TG_HOOK_TOOL_ARG_project_id:-}"

# Log structuré pour que la TUI puisse update la sidebar des livrables
# sans faire un round-trip à get_workspace_tree complet.
if [ -n "$path" ] && [ -n "$project_id" ]; then
    echo "[tg-hook:post-write] project=$project_id updated=$path" >&2
fi

exit 0

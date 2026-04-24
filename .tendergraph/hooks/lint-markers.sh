#!/usr/bin/env bash
# lint-markers.sh — post-tool-use hook.
# Audit non-bloquant des livrables écrits : compte les marqueurs, alerte si
# distribution déséquilibrée.
set -u

case "${TG_HOOK_TOOL_NAME:-}" in
    write_deliverable|edit_section|"tendergraph_step") ;;
    *) exit 0 ;;
esac

path="${TG_HOOK_TOOL_ARG_path:-${TG_HOOK_TOOL_ARG_deliverable_path:-}}"
content="${TG_HOOK_TOOL_ARG_content:-}"

[ -z "$content" ] && exit 0

fd=$(echo "$content" | grep -oE '\[FD\]' | wc -l | tr -d ' ')
fp=$(echo "$content" | grep -oE '\[FP\]' | wc -l | tr -d ' ')
h=$(echo "$content"  | grep -oE '\[H\]'  | wc -l | tr -d ' ')
total=$((fd + fp + h))

if [ "$total" = "0" ]; then
    exit 0
fi

# Ratio hypothèses > 50 % du total = signal d'alarme (livrable fragile)
if [ "$total" -ge 10 ] && [ "$h" -gt "$((total / 2))" ]; then
    echo "[tg-hook:lint-markers] INFO: livrable '$path' contient $h/$total marqueurs [H] (>50%)." >&2
    echo "                              Consolider les [H] en [FD] quand possible avant review." >&2
fi

exit 0

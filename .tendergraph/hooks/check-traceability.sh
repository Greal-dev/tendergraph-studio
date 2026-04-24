#!/usr/bin/env bash
# check-traceability.sh — pre-tool-use hook.
# Vérifie que le contenu qui va être écrit contient des marqueurs de
# traçabilité [FD] / [FP] / [H] si c'est un livrable dans 5-proposition-valeur/
# ou 6-solution/.
#
# Exit 0 : OK. Exit non-zero : bloque l'appel du tool.
# TG_HOOK_WARN_ONLY=1 : loggue au lieu de bloquer.
#
# Feature: F-mcp-014 (studio overlay)
set -u

# Variables injectées par OpenCode pour les hooks :
#   TG_HOOK_TOOL_NAME         — nom du tool appelé
#   TG_HOOK_TOOL_ARG_path     — argument "path" si présent
#   TG_HOOK_TOOL_ARG_content  — argument "content" (peut être long)

case "${TG_HOOK_TOOL_NAME:-}" in
    write_deliverable|edit_section|"tendergraph_step")
        ;;
    *) exit 0 ;;
esac

path="${TG_HOOK_TOOL_ARG_path:-${TG_HOOK_TOOL_ARG_deliverable_path:-}}"
content="${TG_HOOK_TOOL_ARG_content:-}"

# On n'applique le check qu'aux dossiers métier riches
case "$path" in
    5-proposition-valeur/*|6-solution/*) ;;
    *) exit 0 ;;
esac

# Au moins 1 marqueur attendu
if ! echo "$content" | grep -qE '\[(FD|FP|H)\]'; then
    msg="[tg-hook:check-traceability] WARN: livrable '$path' sans marqueur [FD]/[FP]/[H]."
    if [ "${TG_HOOK_WARN_ONLY:-0}" = "1" ]; then
        echo "$msg" >&2
        exit 0
    else
        echo "$msg" >&2
        echo "                                 Ajouter des marqueurs ou utiliser TG_HOOK_WARN_ONLY=1 pour bypass." >&2
        exit 1
    fi
fi

# Interdire les chaînes [H] -> [H]
if echo "$content" | grep -qE '\[H\][^[]*\[H\]'; then
    echo "[tg-hook:check-traceability] WARN: chaine [H] -> [H] detectee (hypothese sur hypothese)." >&2
    if [ "${TG_HOOK_WARN_ONLY:-0}" = "1" ]; then exit 0; else exit 1; fi
fi

exit 0

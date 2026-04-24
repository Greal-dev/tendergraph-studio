#!/usr/bin/env bash
# pre-tool-write.sh — acquiert un lock MCP avant toute écriture collaborative.
#
# Délègue en réalité au serveur MCP (auto-lock implicite côté write_deliverable,
# edit_section, tendergraph_step(submit)). Ce hook fait juste un audit local
# du context pour signaler si plusieurs agents locaux se marchent sur les pieds.
set -u

case "${TG_HOOK_TOOL_NAME:-}" in
    write_deliverable|edit_section|"tendergraph_step") ;;
    *) exit 0 ;;
esac

action="${TG_HOOK_TOOL_ARG_action:-}"
if [ "${TG_HOOK_TOOL_NAME}" = "tendergraph_step" ] && [ "$action" != "submit" ]; then
    exit 0
fi

path="${TG_HOOK_TOOL_ARG_path:-${TG_HOOK_TOOL_ARG_deliverable_path:-}}"
project_id="${TG_HOOK_TOOL_ARG_project_id:-}"

[ -z "$path" ] && exit 0
[ -z "$project_id" ] && exit 0

# Note : le vrai lock est acquis côté serveur via _acquire_write_lock
# (voir backend/src/mcp/tools_mcp.py). Ici on loggue juste l'intention
# pour faciliter le debug des conflits concurrents.
echo "[tg-hook:pre-write] session=$(id -un) intent=write project=$project_id path=$path" >&2
exit 0

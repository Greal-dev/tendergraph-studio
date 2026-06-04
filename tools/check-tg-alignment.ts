/**
 * check-tg-alignment.ts
 *
 * Vérifie la cohérence entre ce repo (tendergraph-studio) et le backend
 * TenderGraph (tendergraph-v3) via l'endpoint public /api/mcp/catalog.
 *
 * Exit 0 si aligné, 1 sinon. Utilisable en CI + pre-commit local.
 *
 * Usage :
 *   bun run tools/check-tg-alignment.ts
 *   bun run tools/check-tg-alignment.ts --fix   # écrit les propositions en stdout
 *   TG_CATALOG_URL=... bun run tools/check-tg-alignment.ts
 *
 * Feature: F-mcp-014 (studio side)
 */

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const DEFAULT_CATALOG_URL = "https://tendergraph-v3.fly.dev/api/mcp/catalog";
const CATALOG_URL = process.env.TG_CATALOG_URL ?? DEFAULT_CATALOG_URL;
const REPO_ROOT = process.cwd();

type Catalog = {
  phases: string[];
  phases_devis?: string[];
  tools_public: { name: string; description: string }[];
  validators: string[];
  resources: string[];
  schema_version: string;
  updated_at: string;
};

function color(code: string, s: string): string {
  return process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s;
}
const red = (s: string) => color("31", s);
const green = (s: string) => color("32", s);
const yellow = (s: string) => color("33", s);
const bold = (s: string) => color("1", s);

async function fetchCatalog(): Promise<Catalog> {
  const r = await fetch(CATALOG_URL);
  if (!r.ok) throw new Error(`Catalog fetch failed: ${r.status} ${r.statusText}`);
  return (await r.json()) as Catalog;
}

function readOverlay() {
  const commandsDir = join(REPO_ROOT, ".tendergraph", "commands");
  const agentsDir = join(REPO_ROOT, ".tendergraph", "agents");
  const configPath = join(REPO_ROOT, ".tendergraph", "config", "tendergraph.config.json");

  const commands: { file: string; name: string; phase_backend?: string; tools_used: string[] }[] = [];
  if (existsSync(commandsDir)) {
    for (const f of readdirSync(commandsDir).filter(f => f.endsWith(".md"))) {
      const content = readFileSync(join(commandsDir, f), "utf8");
      const name = basename(f, ".md");
      const phaseMatch = content.match(/^phase_backend:\s*(\S+)/m);
      const toolRegex = /tendergraph_step|tendergraph_kickoff|tendergraph_map_existing|tendergraph_submit_rex|tendergraph_cross_plan_scoring|get_workspace_tree|read_document|write_deliverable|edit_section|list_documents|search_in_document|query_requirements|get_requirements_summary|extract_imposed_plan|validate_plan|extract_scoring|simulate_price_curve|simulate_composite_weighting|analyze_bpu_dqe|analyze_form|advance_phase|validate_anti_forcing|validate_scoring_strategy|validate_briefs_coverage|validate_transition_artefact|list_my_projects|my_subscription|accept_project_invitation|create_project|find_project_by_query|acquire_lock|release_lock|wait_for_lock|list_active_locks|list_deliverable_versions|get_deliverable_version|compare_deliverable_versions|imitation_gap_report|get_user_guide|produce_phase_book_cv|produce_phase_production_mt|produce_phase_production_other|produce_phase_revue_coherence|produce_phase_revue_evaluateur|produce_phase_solution_design|propose_edit|propose_supports|resolve_pending_edit|list_pending_edits|start_requirement_mining|enter_copilot_mode|final_review_aggregate|final_review_corpus|final_review_p1|final_review_p2|final_review_prompt|recommend_models|upload_dce_file|download_file|generate_excel_capacity_plan|generate_excel_financial_model|generate_html_archmap|generate_html_dashboard|generate_html_deck|generate_pptx_from_brief|list_workspace_contents|list_sampling_phases_available|export_support_to_pdf|tendergraph_docx_add_comment|tendergraph_docx_list_comments|tendergraph_docx_resolve_comment|tendergraph_docx_delete_comment/g;
      const tools_used = Array.from(new Set(content.match(toolRegex) ?? []));
      commands.push({
        file: f, name,
        phase_backend: phaseMatch ? phaseMatch[1] : undefined,
        tools_used,
      });
    }
  }

  const agents: { file: string; name: string; tools_declared: string[] }[] = [];
  if (existsSync(agentsDir)) {
    for (const f of readdirSync(agentsDir).filter(f => f.endsWith(".md"))) {
      const content = readFileSync(join(agentsDir, f), "utf8");
      const name = basename(f, ".md");
      // Supporte deux formats de frontmatter :
      //   (a) inline CSV  : `tools: foo, bar, baz`
      //   (b) YAML mapping : `tools:\n  foo: true\n  bar: true`
      const tools_declared: string[] = [];
      const inlineMatch = content.match(/^tools:[ \t]*([^\n]+)$/m);
      if (inlineMatch && inlineMatch[1].trim() !== "") {
        for (const tok of inlineMatch[1].split(",")) {
          const t = tok.trim();
          if (t) tools_declared.push(t);
        }
      } else if (/^tools:\s*$/m.test(content)) {
        // Format YAML mapping : lit les lignes indentees jusqu'au prochain top-level key ou ---
        const lines = content.split(/\r?\n/);
        let inTools = false;
        for (const line of lines) {
          if (/^tools:\s*$/.test(line)) { inTools = true; continue; }
          if (!inTools) continue;
          if (/^[A-Za-z_][A-Za-z0-9_]*:/.test(line) || /^---\s*$/.test(line)) break;
          const m = line.match(/^\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(true|false)?/);
          if (m && (m[2] === undefined || m[2] === "true")) tools_declared.push(m[1]);
        }
      }
      agents.push({ file: f, name, tools_declared });
    }
  }

  let enabledCommands: string[] = [];
  let aliases: Record<string, string> = {};
  if (existsSync(configPath)) {
    const cfg = JSON.parse(readFileSync(configPath, "utf8"));
    enabledCommands = cfg.commands?.enabled ?? [];
    aliases = cfg.commands?.aliases ?? {};
  }

  return { commands, agents, enabledCommands, aliases };
}

type Divergence = {
  level: "error" | "warning";
  message: string;
  fix?: string;
};

function check(catalog: Catalog, overlay: ReturnType<typeof readOverlay>): Divergence[] {
  const out: Divergence[] = [];

  // Phases backend = pipeline AO (phases) + pipeline Besoin->Devis (phases_devis,
  // champ additif optionnel). Les deux exigent une slash command par phase.
  const backendPhases = [...catalog.phases, ...(catalog.phases_devis ?? [])];

  // 1. Chaque phase backend doit avoir une commande studio
  const phaseToCommand = new Map<string, string>();
  for (const c of overlay.commands) {
    if (c.phase_backend) phaseToCommand.set(c.phase_backend, c.name);
  }
  for (const [alias, target] of Object.entries(overlay.aliases)) {
    if (!phaseToCommand.has(alias) && phaseToCommand.has(target)) {
      // alias résolu, rien à faire
    }
  }
  for (const phase of backendPhases) {
    if (!phaseToCommand.has(phase)) {
      out.push({
        level: "error",
        message: `Phase backend '${phase}' sans slash command correspondante.`,
        fix: `Créer .tendergraph/commands/<name>.md avec 'phase_backend: ${phase}' dans la frontmatter.`,
      });
    }
  }

  // 2. Aucune commande avec phase_backend inconnue
  for (const c of overlay.commands) {
    if (c.phase_backend && !backendPhases.includes(c.phase_backend)) {
      out.push({
        level: "error",
        message: `Slash command '${c.name}' référence phase_backend='${c.phase_backend}' qui n'existe pas côté backend.`,
        fix: `Retirer ${c.file} ou mettre à jour phase_backend sur une phase valide : ${backendPhases.join(", ")}.`,
      });
    }
  }

  // 3. Chaque command enabled doit exister sur disque
  const existingCommandNames = new Set(overlay.commands.map(c => c.name));
  for (const name of overlay.enabledCommands) {
    const resolved = overlay.aliases[name] ?? name;
    if (!existingCommandNames.has(resolved)) {
      out.push({
        level: "error",
        message: `Command enabled '${name}' (resolved '${resolved}') absente de .tendergraph/commands/.`,
        fix: `Créer le fichier ou retirer de config.commands.enabled.`,
      });
    }
  }

  // 4. Agents : warning si un tool déclaré n'existe pas côté backend
  const backendToolNames = new Set(catalog.tools_public.map(t => t.name));
  for (const a of overlay.agents) {
    for (const t of a.tools_declared) {
      if (!backendToolNames.has(t)) {
        out.push({
          level: "warning",
          message: `Agent '${a.name}' déclare le tool '${t}' absent du catalog backend.`,
          fix: `Vérifier tendergraph-v3/backend/src/mcp/tools_mcp.py. Peut-être renommé ou retiré.`,
        });
      }
    }
  }

  // 5. Couverture : log les tools jamais référencés
  const referenced = new Set<string>();
  for (const c of overlay.commands) c.tools_used.forEach(t => referenced.add(t));
  for (const a of overlay.agents) a.tools_declared.forEach(t => referenced.add(t));
  const neverReferenced = [...backendToolNames].filter(t => !referenced.has(t));
  if (neverReferenced.length > 0) {
    out.push({
      level: "warning",
      message: `${neverReferenced.length} tool(s) backend non référencé(s) par aucun agent ni command : ${neverReferenced.slice(0, 5).join(", ")}${neverReferenced.length > 5 ? "…" : ""}.`,
    });
  }

  return out;
}

async function main() {
  console.log(bold("🔍 TenderGraph Studio ↔ Backend alignment check"));
  console.log(`   catalog: ${CATALOG_URL}`);

  let catalog: Catalog;
  try {
    catalog = await fetchCatalog();
  } catch (e) {
    console.error(red(`❌ Impossible de récupérer le catalog : ${(e as Error).message}`));
    console.error("   Si backend down ou réseau indisponible, skip via TG_SKIP_ALIGNMENT_CHECK=1.");
    if (process.env.TG_SKIP_ALIGNMENT_CHECK === "1") process.exit(0);
    process.exit(2);
  }

  console.log(`   catalog schema: ${catalog.schema_version}, mis à jour: ${catalog.updated_at}`);
  console.log(`   phases: ${catalog.phases.length}, tools: ${catalog.tools_public.length}, validators: ${catalog.validators.length}`);

  const overlay = readOverlay();
  console.log(`   studio: ${overlay.commands.length} commands, ${overlay.agents.length} agents`);

  const divergences = check(catalog, overlay);

  const errors = divergences.filter(d => d.level === "error");
  const warnings = divergences.filter(d => d.level === "warning");

  if (divergences.length === 0) {
    console.log(green("\n✓ Alignement OK — aucun écart détecté."));
    process.exit(0);
  }

  if (errors.length > 0) {
    console.log(red(`\n❌ ${errors.length} erreur(s) :`));
    for (const e of errors) {
      console.log(red(`  • ${e.message}`));
      if (e.fix) console.log(`    → ${e.fix}`);
    }
  }

  if (warnings.length > 0) {
    console.log(yellow(`\n⚠  ${warnings.length} avertissement(s) :`));
    for (const w of warnings) {
      console.log(yellow(`  • ${w.message}`));
      if (w.fix) console.log(`    → ${w.fix}`);
    }
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(e => {
  console.error(red(`Erreur fatale : ${(e as Error).message}`));
  process.exit(2);
});

import { Context, Effect, Layer } from "effect"

import { Instance } from "../project/instance"

// TITAN guardrail : un seul prompt persona pour tous les modeles.
// Les prompts upstream (anthropic.txt, default.txt, etc.) revelent l'identite
// "OpenCode" et le nom du modele, ce qui est strictement interdit en mode
// TenderGraph Desktop. titan.txt impose l'identite TITAN et les regles
// non-negociables anti-extraction.
import PROMPT_TITAN from "./prompt/titan.txt"
import type { Provider } from "@/provider"
import type { Agent } from "@/agent/agent"
import { Permission } from "@/permission"
import { Skill } from "@/skill"

export function provider(_model: Provider.Model) {
  // Tous les modeles passent par le prompt TITAN. Le model.api.id n'est
  // jamais expose dans le prompt — la couche backend reste la source
  // authoritative pour l'identite (defense en profondeur).
  return [PROMPT_TITAN]
}

export interface Interface {
  readonly environment: (model: Provider.Model) => string[]
  readonly skills: (agent: Agent.Info) => Effect.Effect<string | undefined>
}

export class Service extends Context.Service<Service, Interface>()("@opencode/SystemPrompt") {}

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const skill = yield* Skill.Service

    return Service.of({
      environment(_model) {
        // TITAN guardrail : on ne revele JAMAIS le model.api.id ni le providerID.
        // L'environnement est minimal — on ne donne que ce qui est strictement
        // necessaire au pilotage de l'agent (date, plateforme generique).
        return [
          [
            `Today's date: ${new Date().toDateString()}`,
            `Platform: ${process.platform}`,
          ].join("\n"),
        ]
      },

      skills: Effect.fn("SystemPrompt.skills")(function* (agent: Agent.Info) {
        if (Permission.disabled(["skill"], agent.permission).has("skill")) return

        const list = yield* skill.available(agent)

        return [
          "Skills provide specialized instructions and workflows for specific tasks.",
          "Use the skill tool to load a skill when a task matches its description.",
          // the agents seem to ingest the information about skills a bit better if we present a more verbose
          // version of them here and a less verbose version in tool description, rather than vice versa.
          Skill.fmt(list, { verbose: true }),
        ].join("\n")
      }),
    })
  }),
)

export const defaultLayer = layer.pipe(Layer.provide(Skill.defaultLayer))

export * as SystemPrompt from "./system"

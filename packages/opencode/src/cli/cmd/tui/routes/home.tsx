import { RGBA } from "@opentui/core"
import { Prompt, type PromptRef } from "@tui/component/prompt"
import { createEffect, createSignal, For } from "solid-js"
import { useProject } from "../context/project"
import { useSync } from "../context/sync"
import { Toast } from "../ui/toast"
import { useArgs } from "../context/args"
import { useRouteData } from "@tui/context/route"
import { usePromptRef } from "../context/prompt"
import { useLocal } from "../context/local"
import { TuiPluginRuntime } from "../plugin"

let once = false
const placeholder = {
  normal: ["Fix a TODO in the codebase", "What is the tech stack of this project?", "Fix broken tests"],
  shell: ["ls -la", "git status", "pwd"],
}

const TITAN_GOLD = RGBA.fromInts(218, 165, 32, 255)
const TITAN_GOLD_BRIGHT = RGBA.fromInts(255, 200, 70, 255)
const TITAN_GOLD_DIM = RGBA.fromInts(140, 105, 20, 255)
const TITAN_NAVY = RGBA.fromInts(11, 18, 36, 255)

// TITAN figlet 6 lignes x 39 chars, centré dans 53 cols (7 chars de padding latéral)
const TITAN_FRAMED = [
  "       ████████╗██╗████████╗ █████╗ ███╗   ██╗       ",
  "       ╚══██╔══╝██║╚══██╔══╝██╔══██╗████╗  ██║       ",
  "          ██║   ██║   ██║   ███████║██╔██╗ ██║       ",
  "          ██║   ██║   ██║   ██╔══██║██║╚██╗██║       ",
  "          ██║   ██║   ██║   ██║  ██║██║ ╚████║       ",
  "          ╚═╝   ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝       ",
]

// Labyrinthe asymétrique : murs irréguliers, dead-ends, embranchements imbriqués, croisements.
// 5 lignes top + 5 lignes bot, 53 cols chacune. Pattern construit pour ressembler à un vrai maze.
// Cadre labyrinthique : 4 corners + 4 cotes en arborescence (T-junctions, dead-ends, AUCUN loop ferme)
// ◉ start sur PCB_TL[0,0] → branches/methadres sur 4 cotes → ◉ end sur PCB_BR[4,7]
const PCB_TL = [
  "◉━●━━●━┓",
  "       ┃",
  "  ┏━●━━┻",
  "  ┃     ",
  "━━┻━●━●━",
]

const PCB_TOP = [
  "●━━●━━●━●━━●━━●━━●━━●━━●━━●━━●━━●━━●━━●━━●━━●━━●━━●━",
  "    ┃              ┃                 ┃              ",
  "●━●━┻━●━━●━●     ●━┻━●━━●━●━●     ●━━┻━●━●━━●━●━●━●━",
  "          ┃               ┃                 ┃        ",
  "━●━━●━●━━●┻━●━━●━━●━●━●━━━┻━●━●━━●━●━●━━●━●━┻━━●━●━●━",
]

const PCB_TR = [
  "●━●━━●━●",
  "       ┃",
  "┻━●━━┓ ┃",
  "     ┃ ┃",
  "●━●━●┻━┻",
]

const PCB_LEFT = [
  "  ┏━●━━●",
  "  ┃     ",
  "●━┻━●━━●",
  "        ",
  "━━●━●━●━",
  "        ",
  "  ┏━●━━●",
  "  ┃     ",
  "●━┻━●━━●",
]

const PCB_RIGHT = [
  "●━━●━┓  ",
  "     ┃  ",
  "●━━●━┻━●",
  "        ",
  "━●━●━●━━",
  "        ",
  "●━━●━┓  ",
  "     ┃  ",
  "●━━●━┻━●",
]

const PCB_BL = [
  "━━┻━●━●━",
  "  ┃     ",
  "  ┗━●━━┳",
  "       ┃",
  "◇━●━━●━┛",
]

const PCB_BOT = [
  "━●━━●━●━━●━━●━●━●━━●━━●━●━●━━●━━●━●━●━━●━━●━●━●━━●━━",
  "          ┃                 ┃                 ┃      ",
  "●━●━━●━●━━┻━●━━●━●     ●━●━━┻━●━●━●     ●━●━━┻━●━●━●━",
  "    ┃              ┃                 ┃              ",
  "●━━●┻━●━●━━●━●━━●━━┻━●━━●━●━●━━●━●━━●┻━●━●━━●━●━●━●━━",
]

const PCB_BR = [
  "●━●━●━━━",
  "     ┃  ",
  "┳━━●━┻━━",
  "┃       ",
  "┗━●━━●━◉",
]
const SUBTITLE_LINE = "  Tender Intelligence Tracking and Automation Nexus  "
const BYLINE_LINE = "                   by TenderGraph                    "

const PCB_NODE = new Set(["◉", "●", "◇"])
const PCB_JUNCTION = new Set(["┷", "┯", "┴", "┬", "┳", "┻", "┼", "╋"])
const PCB_CORNER = new Set(["╭", "╮", "╯", "╰", "┏", "┓", "┗", "┛"])
const PCB_TRACE = new Set(["━", "─", "│", "┃"])
const FIGLET_SHADOW = new Set(["╔", "╗", "╚", "╝", "═", "║"])

type LineMode = "pcb" | "figlet" | "subtitle" | "byline"

function colorFor(ch: string, mode: LineMode): RGBA {
  if (mode === "pcb") {
    if (PCB_NODE.has(ch)) return TITAN_GOLD_BRIGHT
    if (PCB_JUNCTION.has(ch)) return TITAN_GOLD
    if (PCB_CORNER.has(ch)) return TITAN_GOLD
    if (PCB_TRACE.has(ch)) return TITAN_GOLD_DIM
    return TITAN_GOLD_DIM
  }
  if (mode === "figlet") {
    if (ch === "█") return TITAN_GOLD_BRIGHT
    if (FIGLET_SHADOW.has(ch)) return TITAN_GOLD_DIM
    return TITAN_GOLD_DIM
  }
  if (mode === "subtitle") {
    if (ch === " ") return TITAN_GOLD_DIM
    return TITAN_GOLD_BRIGHT
  }
  // byline
  return TITAN_GOLD_DIM
}

function CircuitLine(props: { line: string; mode: LineMode }) {
  return (
    <box flexDirection="row" flexShrink={0}>
      <For each={Array.from(props.line)}>
        {(ch) => (
          <text fg={colorFor(ch, props.mode)} bg={TITAN_NAVY} selectable={false}>
            {ch}
          </text>
        )}
      </For>
    </box>
  )
}

export function Home() {
  const sync = useSync()
  const project = useProject()
  const route = useRouteData("home")
  const promptRef = usePromptRef()
  const [ref, setRef] = createSignal<PromptRef | undefined>()
  const args = useArgs()
  const local = useLocal()
  let sent = false

  const bind = (r: PromptRef | undefined) => {
    setRef(r)
    promptRef.set(r)
    if (once || !r) return
    if (route.prompt) {
      r.set(route.prompt)
      once = true
      return
    }
    if (!args.prompt) return
    r.set({ input: args.prompt, parts: [] })
    once = true
  }

  // Wait for sync and model store to be ready before auto-submitting --prompt
  createEffect(() => {
    const r = ref()
    if (sent) return
    if (!r) return
    if (!sync.ready || !local.model.ready) return
    if (!args.prompt) return
    if (r.current.input !== args.prompt) return
    sent = true
    r.submit()
  })

  return (
    <>
      <box flexGrow={1} alignItems="center" paddingLeft={2} paddingRight={2}>
        <box flexGrow={1} minHeight={0} />
        <box height={4} minHeight={0} flexShrink={1} />
        <box
          flexShrink={0}
          alignItems="center"
          backgroundColor={TITAN_NAVY}
          paddingTop={6}
          paddingBottom={6}
          paddingLeft={12}
          paddingRight={12}
        >
          <box flexDirection="row" flexShrink={0}>
            <box flexShrink={0}>
              <For each={PCB_TL}>{(line) => <CircuitLine line={line} mode="pcb" />}</For>
            </box>
            <box flexShrink={0}>
              <For each={PCB_TOP}>{(line) => <CircuitLine line={line} mode="pcb" />}</For>
            </box>
            <box flexShrink={0}>
              <For each={PCB_TR}>{(line) => <CircuitLine line={line} mode="pcb" />}</For>
            </box>
          </box>
          <box flexDirection="row" flexShrink={0}>
            <box flexShrink={0}>
              <For each={PCB_LEFT}>{(line) => <CircuitLine line={line} mode="pcb" />}</For>
            </box>
            <box flexShrink={0} alignItems="center">
              <TuiPluginRuntime.Slot name="home_logo" mode="replace">
                <box flexShrink={0} alignItems="center">
                  <For each={TITAN_FRAMED}>{(line) => <CircuitLine line={line} mode="figlet" />}</For>
                </box>
              </TuiPluginRuntime.Slot>
              <box height={1} minHeight={0} flexShrink={0} />
              <CircuitLine line={SUBTITLE_LINE} mode="subtitle" />
              <CircuitLine line={BYLINE_LINE} mode="byline" />
            </box>
            <box flexShrink={0}>
              <For each={PCB_RIGHT}>{(line) => <CircuitLine line={line} mode="pcb" />}</For>
            </box>
          </box>
          <box flexDirection="row" flexShrink={0}>
            <box flexShrink={0}>
              <For each={PCB_BL}>{(line) => <CircuitLine line={line} mode="pcb" />}</For>
            </box>
            <box flexShrink={0}>
              <For each={PCB_BOT}>{(line) => <CircuitLine line={line} mode="pcb" />}</For>
            </box>
            <box flexShrink={0}>
              <For each={PCB_BR}>{(line) => <CircuitLine line={line} mode="pcb" />}</For>
            </box>
          </box>
        </box>
        <box height={1} minHeight={0} flexShrink={1} />
        <box width="100%" maxWidth={75} zIndex={1000} paddingTop={1} flexShrink={0}>
          <TuiPluginRuntime.Slot
            name="home_prompt"
            mode="replace"
            workspace_id={project.workspace.current()}
            ref={bind}
          >
            <Prompt
              ref={bind}
              workspaceID={project.workspace.current()}
              right={<TuiPluginRuntime.Slot name="home_prompt_right" workspace_id={project.workspace.current()} />}
              placeholders={placeholder}
            />
          </TuiPluginRuntime.Slot>
        </box>
        <TuiPluginRuntime.Slot name="home_bottom" />
        <box flexGrow={1} minHeight={0} />
        <Toast />
      </box>
      <box width="100%" flexShrink={0}>
        <TuiPluginRuntime.Slot name="home_footer" mode="single_winner" />
      </box>
    </>
  )
}

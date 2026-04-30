// Titan Installer — Cloudflare Worker
// Sert :
//   GET /install.ps1  -> contenu live de raw.githubusercontent.com (branche dev)
//   GET /             -> page d'accueil HTML avec la commande d'installation
//   GET /healthz      -> 200 OK pour monitoring
//   *                  -> 404
//
// Bind custom domain : titan.tendergraph.app
// Source: https://github.com/Greal-dev/tendergraph-studio/blob/dev/infra/cloudflare-worker/titan-installer.js

const REPO = "Greal-dev/tendergraph-studio"
const BRANCH = "dev"
const RAW_INSTALL_PS1 = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/install.ps1`

const LANDING_HTML = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Titan — TenderGraph</title>
  <style>
    body { background:#0b1224; color:#e8e6dd; font-family:ui-monospace,Menlo,Consolas,monospace; margin:0; padding:0; min-height:100vh; display:flex; align-items:center; justify-content:center; }
    main { max-width:720px; padding:48px 24px; }
    h1 { color:#daa520; font-size:48px; margin:0 0 8px; letter-spacing:2px; }
    .subtitle { color:#daa520; opacity:0.7; font-size:14px; margin-bottom:8px; }
    .byline { color:#8c6914; font-size:12px; margin-bottom:40px; }
    .cmd { background:#000; padding:20px; border:1px solid #daa520; border-radius:4px; font-size:14px; overflow-x:auto; user-select:all; }
    .cmd::before { content:"PS> "; color:#daa520; opacity:0.6; }
    p { color:#a8a59a; line-height:1.6; }
    a { color:#ffc846; }
  </style>
</head>
<body>
  <main>
    <h1>TITAN</h1>
    <div class="subtitle">Tender Intelligence Tracking and Automation Nexus</div>
    <div class="byline">by TenderGraph</div>
    <p>Installation Windows en une commande :</p>
    <div class="cmd">iwr -useb https://titan.tendergraph.app/install.ps1 | iex</div>
    <p style="margin-top:32px; font-size:13px;">Source : <a href="https://github.com/${REPO}">github.com/${REPO}</a></p>
  </main>
</body>
</html>`

export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === "/healthz") {
      return new Response("ok", { status: 200, headers: { "content-type": "text/plain" } })
    }

    if (url.pathname === "/install.ps1") {
      const upstream = await fetch(RAW_INSTALL_PS1, {
        cf: { cacheTtl: 300, cacheEverything: true },
      })
      if (!upstream.ok) {
        return new Response(`Failed to fetch install.ps1 (HTTP ${upstream.status})`, { status: 502 })
      }
      return new Response(upstream.body, {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=300",
          "x-titan-source": `${REPO}@${BRANCH}`,
        },
      })
    }

    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(LANDING_HTML, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=600" },
      })
    }

    return new Response("Not Found", { status: 404 })
  },
}

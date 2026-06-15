export function renderHomePage(options = {}) {
  const apiUrl = options.apiUrl ?? "http://localhost:4000";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Atlas</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f7f7f4;
        color: #171713;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
      }

      main {
        width: min(720px, calc(100% - 48px));
      }

      h1 {
        margin: 0 0 12px;
        font-size: clamp(40px, 8vw, 84px);
        line-height: 0.95;
        font-weight: 720;
      }

      p {
        margin: 0;
        max-width: 560px;
        color: #55554a;
        font-size: 18px;
        line-height: 1.55;
      }

      code {
        font: inherit;
        color: #171713;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Atlas</h1>
      <p>Operational ontology platform skeleton. API health is expected at <code>${escapeHtml(apiUrl)}/health</code>.</p>
    </main>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

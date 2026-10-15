// Auditoria visual: captura screenshots das telas públicas em desktop e mobile.
// Uso: (com `npm run dev` rodando) -> node scripts/ui-audit.mjs [baseUrl]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.argv[2] || "http://localhost:3000";
const routes = ["/", "/login", "/register"];
const viewports = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const out = "audit/screenshots";
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const [name, viewport] of Object.entries(viewports)) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  for (const route of routes) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    const file = `${out}/${name}${route === "/" ? "-home" : route.replace(/\//g, "-")}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`✓ ${file}`);
  }
  if (errors.length) console.log(`[${name}] console errors:\n  ` + errors.join("\n  "));
  await page.close();
}
await browser.close();

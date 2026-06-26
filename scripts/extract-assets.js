// Post-build script: extracts hashed Vite asset URLs from dist/index.html
// and writes them to dist-server/ssr-assets.json for the Pages Function to import.
//
// This ensures the SSR document references the correct built assets
// (e.g. /assets/index-AbCd1234.js) instead of source paths like /src/main.jsx.

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const indexHtml = readFileSync(resolve(root, 'dist/index.html'), 'utf-8')

// Extract CSS link tags
const cssMatches = [...indexHtml.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]
const cssHrefs = cssMatches.map((m) => m[1])

// Extract JS module script tags
const jsMatches = [...indexHtml.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"[^>]*>/g)]
const jsSrcs = jsMatches.map((m) => m[1])

// Extract preload/prefetch links (fonts, etc.)
const preloadMatches = [...indexHtml.matchAll(/<link[^>]*rel="preconnect"[^>]*>/g)]
const preloads = preloadMatches.map((m) => m[0])

const fontMatches = [...indexHtml.matchAll(/<link[^>]*href="[^"]*fonts\.googleapis[^"]*"[^>]*>/g)]
const fontLinks = fontMatches.map((m) => m[0])

const assets = {
  css: cssHrefs,
  js: jsSrcs,
  preloads,
  fontLinks,
  generatedAt: new Date().toISOString(),
}

writeFileSync(
  resolve(root, 'dist-server/ssr-assets.json'),
  JSON.stringify(assets, null, 2),
)

console.log('[extract-assets] Wrote dist-server/ssr-assets.json')
console.log(`  CSS: ${cssHrefs.join(', ') || '(none)'}`)
console.log(`  JS:  ${jsSrcs.join(', ') || '(none)'}`)

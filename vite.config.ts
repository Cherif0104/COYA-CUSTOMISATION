import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Session debug COYA : écrit les POST JSON en NDJSON dans `debug-5fe008.log` (même origine que le dev server). */
function debugIngestPlugin(): Plugin {
  return {
    name: 'coya-debug-ingest-5fe008',
    configureServer(server) {
      const logFile = path.resolve(server.config.root, 'debug-5fe008.log')
      server.middlewares.use('/__debug/ingest', (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Debug-Session-Id')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'POST') {
          next()
          return
        }
        let raw = ''
        req.setEncoding('utf8')
        req.on('data', (chunk: string) => {
          raw += chunk
        })
        req.on('end', () => {
          try {
            const line = raw.trimEnd()
            if (line) fs.appendFileSync(logFile, `${line}\n`)
          } catch (e) {
            console.error('[coya-debug-ingest]', e)
          }
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.statusCode = 204
          res.end()
        })
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), debugIngestPlugin()],
  resolve: {
    // Évite deux copies de React (contextes useContext « vides » en dev / HMR).
    dedupe: ['react', 'react-dom'],
  },
  build: {
    // Objectif: limiter la mémoire en build (CI / machines modestes)
    sourcemap: false,
    minify: 'esbuild',
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
        },
      },
    },
  },
  server: {
    port: 5174,
    host: true,
    strictPort: false,
    /**
     * IMPORTANT:
     * Ne pas forcer `hmr.clientPort`.
     * Si le port 5174 est occupé, Vite bascule (5175/5176/...) mais le client tenterait
     * quand même de se connecter en WebSocket sur 5174 → page blanche + erreurs WS.
     */
  },
  // SUPPRIMÉ : Configuration dangereuse qui exposait toutes les variables d'environnement
  // Les variables VITE_* sont automatiquement disponibles via import.meta.env
  optimizeDeps: {
    // Forcer la re-optimisation des dépendances
    force: true
  }
})

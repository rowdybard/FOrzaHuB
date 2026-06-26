import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// SSR build config — builds the server entry point as an ESM module
// that can be imported by the Cloudflare Pages Function.
// Output goes to dist-server/ which is committed and imported by functions/.

export default defineConfig({
  plugins: [react()],
  build: {
    ssr: true,
    outDir: 'dist-server',
    rollupOptions: {
      input: 'src/entry-server.jsx',
      output: {
        format: 'es',
        entryFileNames: 'entry-server.js',
      },
    },
    // Don't externalize anything — bundle everything into one file
    // so the Pages Function can import it without a node_modules resolver
    target: 'esnext',
    minify: false,
  },
})

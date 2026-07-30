import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/* Match a package at a node_modules boundary on either path separator.
   Substring matching (`id.includes('three')`) is not safe here: under
   rolldown it let react/scheduler get swept into the 3D group, which
   dragged all of three.js onto the critical path of every page. */
const nm = (pkgs) => new RegExp(`node_modules[\\\\/](${pkgs})[\\\\/]`)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.glb'],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        /* rolldown's native grouping. The old `manualChunks` callback is a
           compat shim here and was silently ignored for some modules — react
           itself ended up inside vendor-3d, so every visitor downloaded
           ~864 KB of three.js before React could boot. Highest priority wins,
           so react/scheduler are claimed by vendor-core before the 3D group
           can reach them. */
        codeSplitting: {
          groups: [
            { name: 'vendor-core', test: nm('react|react-dom|scheduler|react-router|react-router-dom'), priority: 100 },
            /* framer-motion and lenis are used by App/main eagerly, so this
               chunk is unavoidably on the critical path. gsap is NOT — only
               the lazy mobile nav uses it — so it gets its own group; grouped
               with the others it would be dragged back onto first paint. */
            { name: 'vendor-animation', test: nm('framer-motion|motion-dom|motion-utils|lenis'), priority: 90 },
            { name: 'vendor-gsap', test: nm('gsap'), priority: 85 },
            /* No @mediapipe group: the playground pulls tasks-vision straight
               from jsDelivr at start(), so it never enters the bundle graph. */
            { name: 'vendor-3d', test: nm('three|@react-three'), priority: 70 },
          ],
        },
      }
    }
  }
})

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

// Config follows the Cornerstone3D + Vite guidance:
// - dicom-image-loader must NOT be pre-bundled (it spawns ES module web workers)
// - dicom-parser is CommonJS and must be pre-bundled
export default defineConfig({
  plugins: [react(), viteCommonjs()],
  optimizeDeps: {
    exclude: ['@cornerstonejs/dicom-image-loader'],
    include: ['dicom-parser'],
  },
  worker: { format: 'es' },
  server: { port: 5173 },
});

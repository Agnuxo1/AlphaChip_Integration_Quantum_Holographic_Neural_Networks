import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true
      },
      protocolImports: true
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tensorflow/tfjs-node': '@tensorflow/tfjs'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    },
    include: ['long', '@tensorflow/tfjs']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei'],
          quantum: ['./src/lib/quantum/QuantumMath.ts', './src/lib/quantum/QuantumProcessor.ts'],
          network: ['./src/lib/p2p/P2PNetwork.ts'],
          tensorflow: ['@tensorflow/tfjs']
        }
      }
    }
  }
});
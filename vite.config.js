import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'dist',
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            // Isolate Firebase packages into their own specific file
                            name: 'firebase-vendor',
                            test: /node_modules[\\/]firebase/,
                            priority: 20,
                        },
                        {
                            // Fallback chunk for any future npm packages
                            name: 'vendor',
                            test: /node_modules/,
                            priority: 10,
                        },
                    ],
                },
            },
        },
        // Raise the warning limit slightly so the isolated firebase file doesn't trigger it
        chunkSizeWarningLimit: 600,
        cssMinify: 'esbuild',
    },
})

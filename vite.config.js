import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts';


const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [dts()],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'bbbubble',
            // the proper extensions will be added
            fileName: 'bbbubble',
        },
        rollupOptions: {
        },
    },
})
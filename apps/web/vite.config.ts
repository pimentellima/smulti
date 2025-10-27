import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import dotenv from 'dotenv'

dotenv.config({ path: resolve(__dirname, '../../.env') })

export default defineConfig(() => ({
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
}))

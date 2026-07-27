import { defineConfig } from 'vitest/config'
import path from 'path'
export default defineConfig({
  test: { environment: 'node', globals: true, include: ['__tests__/_live_match_proof.test.ts'] },
  resolve: { alias: { '@': path.resolve(process.cwd(), '.') } }
})

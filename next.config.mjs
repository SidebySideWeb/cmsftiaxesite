import { withPayload } from '@payloadcms/next/withPayload'

import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    // Resolve TypeScript path aliases
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      '@payload-config': path.resolve(__dirname, './payload.config.ts'),
      '@': path.resolve(__dirname, './src'),
    }

    // Exclude v0-analyzer from build (it's a script, not part of the app)
    webpackConfig.module = webpackConfig.module || {}
    webpackConfig.module.rules = webpackConfig.module.rules || []
    webpackConfig.module.rules.push({
      test: /v0-analyzer/,
      use: 'ignore-loader',
    })

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

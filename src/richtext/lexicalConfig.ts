import { lexicalEditor } from '@payloadcms/richtext-lexical'

/**
 * Lexical editor configuration with full toolbar
 */
export const lexicalConfig = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
  ],
})


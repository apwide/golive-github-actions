import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: './src/swagger.json',
  output: 'src/client',
  plugins: [
    {
      name: '@hey-api/client-fetch',
      throwOnError: true
    },
    {
      name: '@hey-api/schemas'
    },
    {
      name: '@hey-api/typescript',
      enums: 'javascript'
      // exportInlineEnums: true,
    },
    // {
    //   name: '@hey-api/transformers',
    //   // dates: true,
    // },
    {
      name: '@hey-api/sdk',
      operations: {
        strategy: 'byTags',
        containerName: '{{name}}Service',
        nesting: 'operationId'
      },
      // classStructure: 'off',
      responseStyle: 'data'
      // transformer: true
    }
  ]
})

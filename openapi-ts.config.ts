import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
  input: 'src/swagger.json',
  output: 'src/client',
  types: {
    enums: 'typescript'
  },
  schemas: {
    export: true,
    type: 'json'
  },
  services: {
    asClass: true,
    export: true,
    response: 'body',
    operationId: true
  },
  exportCore: true,
  client: 'fetch'
})

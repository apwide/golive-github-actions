import { ApplicationService, EnvironmentService, OpenAPI } from '../src/client'
import { expect, test } from 'vitest'

test('should call dev with basic auth', async () => {
  OpenAPI.BASE = process.env.goliveDcUrl!
  OpenAPI.USERNAME = process.env.goliveUsername
  OpenAPI.PASSWORD = process.env.golivePassword
  const apps = await ApplicationService.getApplications({ expand: false })
  expect(apps.length).gt(1)
})

test('should call int with token', async () => {
  OpenAPI.BASE = process.env.goliveUrl!
  OpenAPI.USERNAME = undefined
  OpenAPI.PASSWORD = undefined
  OpenAPI.TOKEN = process.env.goliveToken
  const apps = await ApplicationService.getApplications({ expand: false })
  expect(apps.length).gt(1)
  const info = await EnvironmentService.postEnvironmentInformation({
    requestBody: {
      environmentSelector: {
        environment: {
          id: 58
        }
      },
      status: {
        name: 'Up'
      },
      environment: {}
    }
  })
  expect(info).not.toBeNull()
})

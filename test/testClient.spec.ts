import { ApplicationService, EnvironmentService } from '../src/client'
import { expect, test } from 'vitest'
import { setupGolive } from '../src/core/GoliveClient'

test('should call dev with basic auth', async () => {
  setupGolive({
    goliveUrl: process.env.goliveDcUrl!,
    goliveUsername: process.env.goliveUsername,
    golivePassword: process.env.golivePassword
  })
  const apps = await ApplicationService.getApplications({
    query: { _expand: false }
  })
  expect(apps.length).gt(1)
})

test('should call int with token', async () => {
  setupGolive({
    goliveUrl: process.env.goliveUrl!,
    goliveToken: process.env.goliveToken
  })
  const apps = await ApplicationService.getApplications({
    query: { _expand: false }
  })
  expect(apps.length).gt(1)
  const info = await EnvironmentService.postEnvironmentInformation({
    body: {
      environmentSelector: {
        environment: {
          id: 18
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

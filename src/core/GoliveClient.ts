import {
  ApiError,
  ApplicationService,
  EnvironmentInfoRequest,
  EnvironmentService,
  OpenAPI,
  type PostEnvironmentInformationResponse,
  PostVersionResponse,
  VersionInfoRequest,
  VersionService
} from '../client'
import { debug, error } from '@actions/core'
import { getString, s } from './utils'

export type GoliveClientConfig = {
  goliveToken?: string
  goliveUrl?: string
  goliveUsername?: string
  golivePassword?: string
}

export function goliveConfig(): GoliveClientConfig {
  return {
    goliveToken: getString('goliveToken'),
    goliveUrl: getString('goliveUrl'),
    goliveUsername: getString('goliveUsername'),
    golivePassword: getString('golivePassword')
  }
}

function setupGolive({ goliveUrl, goliveToken, goliveUsername, golivePassword }: GoliveClientConfig) {
  OpenAPI.BASE = goliveUrl || 'https://golive.apwide.net/api'
  if (goliveToken?.trim().length || 0 > 0) {
    OpenAPI.TOKEN = goliveToken
  } else {
    OpenAPI.USERNAME = goliveUsername
    OpenAPI.PASSWORD = golivePassword
  }
}

function removeUndefined<T>(obj: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = obj as any
  Object.keys(payload).forEach((key) => {
    payload[key] === undefined && delete payload[key]
    if (typeof payload[key] === 'object') {
      removeUndefined(payload[key])
    }
  })
  return payload
}

async function handleError<T>(f: () => Promise<T>): Promise<T> {
  try {
    return await f()
  } catch (e: unknown) {
    if (e instanceof ApiError) {
      error(`
        Golive error:
        - url: ${e.url}
        - request body: ${s(e.request?.body)}
        - message: ${e.message}
        - status: ${e.status}
        - statusText: ${e.statusText}
        - response body: ${s(e.body)}
        `)
    } else {
      error('non-ApiError thrown')
    }
    throw e
  }
}

export class GoliveClient {
  constructor(config: GoliveClientConfig) {
    setupGolive(config)
  }

  async sendEnvironmentInfo(info: EnvironmentInfoRequest): Promise<PostEnvironmentInformationResponse> {
    debug('sending environment info')
    return handleError(() =>
      EnvironmentService.postEnvironmentInformation({
        requestBody: removeUndefined(info)
      })
    )
  }

  async sendReleaseInfo(info: VersionInfoRequest): Promise<PostVersionResponse> {
    debug('sending release info')
    return handleError(() =>
      VersionService.postVersion({
        requestBody: removeUndefined(info)
      })
    )
  }

  async getApplicationByName(appName: string) {
    const apps = await ApplicationService.getApplications()
    return apps.find((app) => app.name === appName)
  }

  async createApplication(name: string) {
    return ApplicationService.postApplication({ requestBody: { name } })
  }
}

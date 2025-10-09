import {
  ApplicationService,
  EnvironmentInfoRequest,
  EnvironmentService,
  ErrorCollection,
  type PostEnvironmentInformationResponse,
  PostVersionResponse,
  VersionInfoRequest,
  VersionService
} from '../client'
import { debug, error } from '@actions/core'
import { getString, s } from './utils'
import { client } from '../client/client.gen'

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

function auth({ goliveToken, goliveUsername, golivePassword }: Omit<GoliveClientConfig, 'goliveUrl'>): Record<string, string> {
  if (goliveUsername) {
    const auth = `${goliveUsername}:${golivePassword}`
    const b64Auth = Buffer.from(auth).toString('base64')
    return {
      Authorization: `Basic ${b64Auth}`
    }
  } else if (goliveToken) {
    return {
      Authorization: `Bearer ${goliveToken}`
    }
  } else {
    return {}
  }
}

export function setupGolive({ goliveUrl, ...authConfig }: GoliveClientConfig) {
  client.setConfig({
    baseUrl: goliveUrl || 'https://golive.apwide.net/api',
    headers: {
      ...client.getConfig().headers || {},
      ...auth(authConfig)
    }
  })
}

function removeUndefined<T>(obj: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = obj as any
  Object.keys(payload).forEach((key) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    payload[key] === undefined && delete payload[key]
    if (typeof payload[key] === 'object') {
      removeUndefined(payload[key])
    }
  })
  return payload
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isErrorCollection(error: any): error is ErrorCollection {
  return error?.errorMessages || error?.errors || error?.status
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleError<T>(request:any, f: () => Promise<T>): Promise<T> {
  try {
    return await f()
  } catch (e: unknown) {
    if (isErrorCollection(e)) {
      error(`
        Golive error:
        - request body: ${s(request)}
        - status: ${e.status}
        - response body: ${s(e)}
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
    return handleError(info, () =>
      EnvironmentService.postEnvironmentInformation({
        body: removeUndefined(info)
      })
    )
  }

  async sendReleaseInfo(info: VersionInfoRequest): Promise<PostVersionResponse> {
    debug('sending release info')
    return handleError(info, () =>
      VersionService.postVersion({
        body: removeUndefined(info)
      })
    )
  }

  async getApplicationByName(appName: string) {
    const apps = await ApplicationService.getApplications()
    return apps.find((app) => app.name === appName)
  }

  async createApplication(name: string) {
    return ApplicationService.postApplication({ body: { name } })
  }
}

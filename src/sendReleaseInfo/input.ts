import { getBoolean, getIssueKeys, getNumber, getString } from '../core/utils'
import { GoliveClientConfig, goliveConfig } from '../core/GoliveClient'
import { githubConfig, GithubConfig } from '../core/GithubClient'
import { debug } from '@actions/core'

export type SendReleaseInfoInput = GithubConfig &
  GoliveClientConfig & {
    targetAutoCreate?: boolean
    targetApplicationId?: number
    targetApplicationName?: string
    versionName: string
    versionDescription?: string
    versionStartDate?: string
    versionReleaseDate?: string
    versionReleased?: boolean
    issueKeys?: string[]
    issueKeysFromCommitHistory?: boolean
    issuesFromJql?: string
    sendJiraNotification?: boolean
  }

export function sendReleaseInfoInput(): SendReleaseInfoInput {
  const inputs = {
    ...goliveConfig(),
    ...githubConfig(),

    targetAutoCreate: getBoolean('targetAutoCreate'),
    targetApplicationId: getNumber('targetApplicationId'),
    targetApplicationName: getString('targetApplicationName'),
    versionName: getString('versionName')!,
    versionDescription: getString('versionDescription'),
    versionStartDate: getString('versionStartDate'),
    versionReleaseDate: getString('versionReleaseDate'),
    versionReleased: getBoolean('versionReleased'),
    issueKeys: getIssueKeys('issueKeys'),
    issueKeysFromCommitHistory: getBoolean('issueKeysFromCommitHistory', false)!,
    issuesFromJql: getString('issuesFromJql'),
    sendJiraNotification: getBoolean('sendJiraNotification')
  }

  if (!inputs.targetApplicationId && !inputs.targetApplicationName) {
    throw new Error('At least one of applicationId/applicationName must be provided')
  }

  debug(`inputs are: ${JSON.stringify(inputs)}`)

  return inputs
}

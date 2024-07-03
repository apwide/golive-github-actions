import { getAttributes, getBoolean, getIssueKeys, getNumber, getString } from '../core/utils'
import { GoliveClientConfig, goliveConfig } from '../core/GoliveClient'
import { githubConfig, GithubConfig } from '../core/GithubClient'

export type SendEnvironmentInfoInput = GithubConfig &
  GoliveClientConfig & {
    targetEnvironmentId?: number
    targetEnvironmentName?: string
    targetEnvironmentAutoCreate?: boolean
    targetCategoryName?: string
    targetCategoryId?: number
    targetCategoryAutoCreate?: boolean
    targetApplicationId?: number
    targetApplicationName?: string
    targetApplicationAutoCreate?: boolean
    environmentStatusId?: number
    environmentStatusName?: string

    environmentUrl?: string
    environmentAttributes?: Record<string, string>

    deploymentVersionName?: string
    deploymentDeployedDate?: string
    deploymentBuildNumber?: string
    deploymentDescription?: string
    deploymentIssueKeys?: string[]
    deploymentIssueKeysFromCommitHistory: boolean
    deploymentIssuesFromJql?: string
    deploymentAttributes?: Record<string, string>
    deploymentSendJiraNotification: boolean
    deploymentAddDoneIssuesOfJiraVersion: boolean
    deploymentNoFixVersionUpdate: boolean
  }

export function parseInput(): SendEnvironmentInfoInput {
  return {
    ...goliveConfig(),
    ...githubConfig(),

    targetEnvironmentId: getNumber('targetEnvironmentId'),
    targetEnvironmentName: getString('targetEnvironmentName'),
    targetEnvironmentAutoCreate: getBoolean('targetEnvironmentAutoCreate'),
    targetCategoryName: getString('targetCategoryName'),
    targetCategoryId: getNumber('targetCategoryId'),
    targetCategoryAutoCreate: getBoolean('targetCategoryAutoCreate'),
    targetApplicationId: getNumber('targetApplicationId'),
    targetApplicationName: getString('targetApplicationName'),
    targetApplicationAutoCreate: getBoolean('targetApplicationAutoCreate'),
    environmentStatusId: getNumber('environmentStatusId'),
    environmentStatusName: getString('environmentStatusName'),
    environmentUrl: getString('environmentUrl'),
    environmentAttributes: getAttributes('environmentAttributes'),
    deploymentVersionName: getString('deploymentVersionName'),
    deploymentDeployedDate: getString('deploymentDeployedDate'),
    deploymentBuildNumber: getString('deploymentBuildNumber'),
    deploymentDescription: getString('deploymentDescription'),
    deploymentIssueKeys: getIssueKeys('deploymentIssueKeys'),
    deploymentIssueKeysFromCommitHistory: getBoolean('deploymentIssueKeysFromCommitHistory', false)!,
    deploymentIssuesFromJql: getString('deploymentIssuesFromJql'),
    deploymentAttributes: getAttributes('deploymentAttributes'),
    deploymentSendJiraNotification: getBoolean('deploymentSendJiraNotification', false)!,
    deploymentAddDoneIssuesOfJiraVersion: getBoolean('deploymentAddDoneIssuesOfJiraVersion', false)!,
    deploymentNoFixVersionUpdate: getBoolean('deploymentNoFixVersionUpdate', false)!
  }
}

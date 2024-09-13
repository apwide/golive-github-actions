import { debug, info, setFailed, setOutput } from '@actions/core'
import { DeploymentInfo, EnvironmentInfo, NamedReference } from '../client'
import { SendEnvironmentInfoInput, parseInput } from './input'
import { GoliveClient } from '../core/GoliveClient'
import { findIssueKeys } from '../core/scope'

async function toDeployment(input: SendEnvironmentInfoInput): Promise<DeploymentInfo | undefined> {
  const issueKeys = input.deploymentIssueKeysFromCommitHistory ? await findIssueKeys(input) : []
  info(`found issues '${issueKeys}'`)
  if (
    !input.deploymentVersionName &&
    !input.deploymentAttributes &&
    !input.deploymentBuildNumber &&
    !input.deploymentDescription &&
    !issueKeys.length
  ) {
    return undefined
  }

  return {
    versionName: input.deploymentVersionName,
    attributes: input.deploymentAttributes,
    buildNumber: input.deploymentBuildNumber,
    deployedDate: input.deploymentDeployedDate,
    description: input.deploymentDescription,
    issues: {
      issueKeys: issueKeys.length ? issueKeys : undefined,
      jql: input.deploymentIssuesFromJql,
      noFixVersionUpdate: input.deploymentNoFixVersionUpdate,
      addDoneIssuesFixedInVersion: input.deploymentAddDoneIssuesOfJiraVersion,
      sendJiraNotification: input.deploymentSendJiraNotification
    }
  }
}

function toStatus({
  environmentStatusId,
  environmentStatusName
}: SendEnvironmentInfoInput): NamedReference | undefined {
  if (!environmentStatusId && !environmentStatusName) {
    return undefined
  }
  return {
    id: environmentStatusId,
    name: environmentStatusName
  }
}

function toEnvironment({ environmentUrl, environmentAttributes }: SendEnvironmentInfoInput): EnvironmentInfo {
  if (!environmentUrl && !Object.keys(environmentAttributes || {}).length) {
    return {}
  }
  return {
    url: environmentUrl,
    attributes: environmentAttributes
  }
}

export async function sendEnvironmentInfo() {
  try {
    const input = parseInput()
    debug(`inputs are: ${JSON.stringify(input)}`)
    const goliveClient = new GoliveClient(input)

    const deployment = await toDeployment(input)
    const status = toStatus(input)
    const environment = toEnvironment(input)

    await goliveClient.sendEnvironmentInfo({
      environmentSelector: {
        environment: {
          id: input.targetEnvironmentId,
          name: input.targetEnvironmentName,
          autoCreate: input.targetEnvironmentAutoCreate
        },
        application: {
          id: input.targetApplicationId,
          name: input.targetApplicationName,
          autoCreate: input.targetApplicationAutoCreate
        },
        category: {
          id: input.targetCategoryId,
          name: input.targetCategoryName,
          autoCreate: input.targetCategoryAutoCreate
        }
      },
      environment,
      status,
      deployment
    })
    setOutput('status', 'success')
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message)
    }
    setOutput('status', 'failed')
  }
}

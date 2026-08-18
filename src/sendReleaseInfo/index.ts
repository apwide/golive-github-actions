import { SendReleaseInfoInput, sendReleaseInfoInput } from './input'
import { info, setFailed, setOutput } from '@actions/core'
import { GoliveClient } from '../core/GoliveClient'
import { s, unique } from '../core/utils'
import { findIssueKeys } from '../core/scope'

async function getTargetApplicationId(
  golive: GoliveClient,
  { targetApplicationId, targetApplicationName, targetAutoCreate }: SendReleaseInfoInput
) {
  if (targetApplicationId) {
    return targetApplicationId
  }

  if (!targetApplicationName?.length) {
    throw new Error(
      'Not able to identify application because none of targetApplicationId/targetApplicationName have been provided'
    )
  }

  let application = await golive.getApplicationByName(targetApplicationName)
  info(`Found application ${s(application)}`)
  if (application) {
    return application.id
  }
  if (!targetAutoCreate) {
    throw new Error(
      `no application id provided, not able to find application for name ${targetApplicationName} and targetAutoCreate set to false`
    )
  }
  info(`Create application with name ${targetApplicationName}`)
  application = await golive.createApplication(targetApplicationName)
  info(`Application created with id ${application.id}`)
  return application.id
}

async function loadIssueKeys(inputs: SendReleaseInfoInput): Promise<string[]> {
  let issueKeys: string[] = []
  if (inputs.issueKeys) {
    info('loading issue keys from input')
    issueKeys = [...issueKeys, ...inputs.issueKeys]
  }
  if (inputs.issueKeysFromCommitHistory) {
    issueKeys = [...issueKeys, ...(await findIssueKeys(inputs))]
  }
  const found = unique(issueKeys)
  info(`found issue keys ${found}`)
  return found
}

export async function sendReleaseInfo() {
  try {
    const input = sendReleaseInfoInput()
    const golive = new GoliveClient(input)
    const applicationId = await getTargetApplicationId(golive, input)

    await golive.sendReleaseInfo({
      application: {
        id: applicationId
      },
      versionDescription: input.versionDescription,
      versionName: input.versionName,
      startDate: input.versionStartDate,
      releaseDate: input.versionReleaseDate,
      released: input.versionReleased,
      issues: {
        issueKeys: await loadIssueKeys(input),
        jql: input.issuesFromJql,
        sendJiraNotification: input.sendJiraNotification
      }
    })

    setOutput('status', 'success')
  } catch (e) {
    setFailed(e instanceof Error ? e.message : String(e))
    setOutput('status', 'failed')
  }
}

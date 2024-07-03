import { debug, info } from '@actions/core'
import { execSync } from 'node:child_process'
import { extractIssueKeys, unique } from './utils'
import { context } from '@actions/github'
import { GithubClient, GithubConfig, RunOccurrence } from './GithubClient'

export async function findIssueKeys({ githubToken }: GithubConfig) {
  debug('looking for issue keys')
  const githubClient = new GithubClient({ githubToken })
  const runs = await githubClient.getAllRunsSinceLastSuccess()

  debug(`found ${runs.length} runs to process`)

  return unique([...extractIssueKeysFromCli(runs), ...extractIssueKeysFromRuns(runs)])
}

export function extractIssueKeysFromCli(runs: RunOccurrence[]): string[] {
  const fromCommitId = context.sha
  const oldestRun = runs.length > 0 ? runs[runs.length - 1] : null
  const toCommitId = oldestRun?.commitId || fromCommitId
  const issueKeys = fromCli(fromCommitId, toCommitId)
  debug(`found issues '${issueKeys}' with CLI in commits ${fromCommitId}..${toCommitId}`)
  return issueKeys
}

function fromCli(fromCommitId: string, toCommitId: string): string[] {
  try {
    info('Extract commits from git CLI')
    let issueKeys = []
    if (fromCommitId == toCommitId) {
      debug('fromCommit equals toCommit, use different strategy')
      const commitCount = Number(execSync('git rev-list HEAD --count').toString())
      if (commitCount == 1) {
        debug('Only 1 commits, search for entire git log')
        const logs = execSync(`git log --format="%s %b"`).toString()
        issueKeys = extractIssueKeys(logs)
      } else {
        debug(`Search in git log with HEAD~1..HEAD`)
        const logs = execSync(`git log "HEAD~1..HEAD" --format="%s %b"`).toString()
        issueKeys = extractIssueKeys(logs)
      }
    } else {
      const logs = execSync(`git log "${fromCommitId}..HEAD" --format="%s %b"`).toString()
      issueKeys = extractIssueKeys(logs)
    }
    info(`Issue keys found in commits from CLI: ${issueKeys}`)
    return issueKeys
  } catch (error) {
    info('Not able to parse git log (are you in shallow checkout ?)')
    debug(`Error when parsing git repository was: ${error}`)
    return []
  }
}

export function extractIssueKeysFromRuns(runs: RunOccurrence[]): string[] {
  const issueKeys = extractIssueKeys(runs.map((run) => `${run.title} ${run.commitMessage}`).join(' '))
  debug(`found issues '${issueKeys}' in runs detail`)
  return issueKeys
}

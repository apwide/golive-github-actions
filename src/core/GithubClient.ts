import { context, getOctokit } from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import { debug } from '@actions/core'
import { getString } from './utils'

export type RunOccurrence = {
  id: number
  title: string
  commitId?: string
  commitMessage?: string
}

export type GithubConfig = {
  githubToken: string
}

export function githubConfig(): GithubConfig {
  return {
    githubToken: getString('githubToken', true)!
  }
}

/**
 * could be:
 * if pr: refs/pull/<pr_number>/merge
 * if branch: refs/heads/<branch_name>
 * if tag: refs/tags/<tag_name>
 *
 * TODO should we change the way we get the content based on PR/tag/branch ?
 */
function getCurrentBranch() {
  return context.ref.replaceAll('/refs/heads/', '')
}

const MAX_RUNS_PER_PAGE = 100

export class GithubClient {
  private readonly octokit: InstanceType<typeof GitHub>

  constructor({ githubToken }: GithubConfig) {
    this.octokit = getOctokit(githubToken)
  }

  private get client() {
    return this.octokit.rest
  }

  async getAllRunsSinceLastSuccess() {
    const branch = getCurrentBranch()
    const scope: RunOccurrence[] = []
    let page = 1
    let foundBoundary = false
    let lastLoadedItems = MAX_RUNS_PER_PAGE
    let itemsTotal = MAX_RUNS_PER_PAGE + 1

    debug(`loading current run detail for run id ${context.runId}`)
    const currentRun = await this.client.actions.getWorkflowRun({
      ...context.repo,
      run_id: context.runId
    })

    const params = {
      branch,
      ...context.repo,
      workflow_id: currentRun.data.workflow_id
    }

    debug(`load last runs since last successful for params: ${JSON.stringify(params)}`)

    while (!foundBoundary && lastLoadedItems === MAX_RUNS_PER_PAGE && page * MAX_RUNS_PER_PAGE < itemsTotal) {
      const runs = await this.client.actions.listWorkflowRuns({
        ...params,
        page,
        per_page: MAX_RUNS_PER_PAGE
      })
      page++
      lastLoadedItems = runs.data.workflow_runs.length
      itemsTotal = runs.data.total_count
      for (const run of runs.data.workflow_runs) {
        if (run.conclusion !== 'success') {
          scope.push({
            id: run.id,
            title: run.display_title,
            commitId: run.head_commit?.id,
            commitMessage: run.head_commit?.message
            // run.head_commit?.tree_id ??
          })
        } else {
          foundBoundary = true
          break
        }
      }
    }
    return scope
  }
}

import { afterEach, beforeEach, describe, it, MockInstance, vi } from 'vitest'
import { sendEnvironmentInfo } from '../src/sendEnvironmentInfo'
import * as core from '@actions/core'

let getInputMock: MockInstance

vi.stubEnv('GITHUB_WORKFLOW', 'Build and Release')
vi.stubEnv('GITHUB_JOB', '')
vi.stubEnv('GITHUB_RUN_NUMBER', '12')
vi.stubEnv('GITHUB_RUN_ID', '9746284292')
vi.stubEnv('GITHUB_REF', 'main')
vi.stubEnv('GITHUB_SHA', '4427c3b70302948c3da23735534ead3c780ecd15')
vi.stubEnv('GITHUB_REPOSITORY', 'apwidejulien/test-github-actions')

describe('github action', async () => {
  beforeEach(() => {
    getInputMock = vi.spyOn(core, 'getInput')
    getInputMock.mockImplementation((key) => process.env[key])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call github', async () => {
    await sendEnvironmentInfo()
  })
})

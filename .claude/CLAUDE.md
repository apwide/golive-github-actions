# AGENTS.md - Golive GitHub Actions

## Project Overview

**Name**: `@apwide/golive-github-actions`  
**Version**: 1.8.0  
**Purpose**: GitHub Actions library for sending environment and release information to Apwide Golive (Jira environment management platform)

This repository provides two main GitHub Actions:

1. **golive-send-environment-info** - Sends deployment and environment status information
2. **golive-send-release-info** - Sends version/release information

## Architecture

### Directory Structure

```
src/
├── index.ts                    # Main exports
├── swagger.json                # OpenAPI spec for Golive API
├── client/                     # Generated API client (DO NOT EDIT)
│   ├── client.gen.ts
│   ├── schemas.gen.ts
│   ├── sdk.gen.ts
│   └── types.gen.ts
├── core/                       # Core utilities and clients
│   ├── GithubClient.ts         # GitHub API wrapper
│   ├── GoliveClient.ts         # Golive API wrapper
│   ├── scope.ts                # Issue key extraction from commits
│   └── utils.ts                # Input parsing and utilities
├── sendEnvironmentInfo/        # Environment info action
│   ├── index.ts
│   └── input.ts
└── sendReleaseInfo/            # Release info action
    ├── index.ts
    └── input.ts
```

### Key Components

#### 1. **GithubClient** (`src/core/GithubClient.ts`)

- Wraps GitHub Octokit API
- Retrieves workflow run history
- Main method: `getAllRunsSinceLastSuccess()` - Gets all failed runs since last successful run
- Used for extracting commit history and issue keys from commit messages

#### 2. **GoliveClient** (`src/core/GoliveClient.ts`)

- Wraps generated Golive API client
- Authentication: Supports both Bearer token and Basic auth
- Main methods:
    - `sendEnvironmentInfo()` - Posts environment deployment info
    - `sendReleaseInfo()` - Posts version/release info
    - `getApplicationByName()` - Finds application by name
    - `createApplication()` - Creates new application

#### 3. **Issue Key Extraction** (`src/core/scope.ts`)

- Extracts Jira issue keys from commit messages
- Two strategies:
    1. CLI-based: Uses `git log` command
    2. API-based: Uses GitHub workflow run metadata
- Regex pattern: `[A-Z][A-Z\d_]{1,255}-\d{1,100}` (standard Jira issue key format)

#### 4. **Input Parsing** (`src/core/utils.ts`)

- Helper functions for parsing GitHub Action inputs:
    - `getString()` - Parse string input
    - `getNumber()` - Parse number input
    - `getBoolean()` - Parse boolean input
    - `getAttributes()` - Parse JSON object input
    - `getIssueKeys()` - Parse comma-separated issue keys

## Code Generation

### OpenAPI Client Generation

**Command**: `npm run openapi-ts`  
**Config**: `openapi-ts.config.ts`  
**Source**: `src/swagger.json`  
**Output**: `src/client/` (auto-generated files)

⚠️ **NEVER manually edit files in `src/client/`** - They are generated from the OpenAPI spec.

To update the API client:

1. Update `src/swagger.json` with new OpenAPI spec
2. Run `npm run openapi-ts`
3. Review generated changes

## Build Process

### Commands

- `npm run build` - Build action bundle using `@vercel/ncc` → `dist/index.js`
- `npm run lint` - Run ESLint
- `npm run format:check` - Check code formatting
- `npm run format:write` - Auto-format code
- `npm test` - Run Vitest tests

### Build Tool

Uses `@vercel/ncc` to bundle entire action into a single `dist/index.js` file:

- Includes all dependencies
- Optimized for GitHub Actions runtime
- No `node_modules` needed at runtime

## CI/CD Pipeline

### Workflows

**1. CI Workflow** (`.github/workflows/ci.yml`)

- Triggers: Push to any branch except `release/**`
- Steps: Install, Lint, Build
- No tests run (commented out)

**2. Release Workflow** (`.github/workflows/release.yml`)

- Triggers: Push to `release/**` branches
- Steps:
    1. Bump version using `phips28/gh-action-bump-version`
    2. Build and publish to NPM
    3. Auto-update dependent action repos:
        - `apwide/golive-send-environment-info`
        - `apwide/golive-send-release-info`

### Versioning

- **Semantic versioning** triggered by commit messages:
    - `BREAKING` → major version bump
    - Default → minor version bump
- Version stored in `package.json`
- Published to NPM registry under `@apwide/golive-github-actions`

## Testing

### Current State

- Framework: Vitest
- Test files: `test/testAction.spec.ts`
- ⚠️ Tests are commented out in CI/CD pipeline
- Stub environment variables for GitHub context

### Running Tests Locally

```bash
npm test
```

## Common Patterns

### 1. Adding a New Input Parameter

**Example**: Adding a new environment attribute

1. **Update `action.yml`**:

```yaml
inputs:
  newParameter:
    required: false
    description: 'Description of the new parameter'
```

2. **Add to Input Type** (`src/sendEnvironmentInfo/input.ts` or `src/sendReleaseInfo/input.ts`):

```typescript
export type SendEnvironmentInfoInput = GithubConfig &
  GoliveClientConfig & {
    // ... existing fields
    newParameter?: string
  }
```

3. **Parse Input** (in `parseInput()` function):

```typescript
export function parseInput(): SendEnvironmentInfoInput {
  return {
    // ... existing parsing
    newParameter: getString('newParameter')
  }
}
```

4. **Use in Logic** (`src/sendEnvironmentInfo/index.ts`):

```typescript
await goliveClient.sendEnvironmentInfo({
  // ... existing fields
  newField: input.newParameter
})
```

### 2. Issue Key Extraction Pattern

When implementing commit history parsing:

- Always use `findIssueKeys()` from `src/core/scope.ts`
- It handles both shallow and deep git clones
- Falls back to API-based extraction if CLI fails

### 3. Error Handling Pattern

```typescript
try {
  // Action logic
  setOutput('status', 'success')
} catch (error) {
  if (error instanceof Error) {
    setFailed(error.message)
  }
  setOutput('status', 'failed')
}
```

### 4. Optional Data Pattern

Use undefined checking to send minimal payloads:

```typescript
function toDeployment(input: Input): DeploymentInfo | undefined {
  if (!input.field1 && !input.field2) {
    return undefined // Don't send empty objects
  }
  return {
    field1: input.field1,
    field2: input.field2
  }
}
```

## API Integration

### Golive API

- **Default URL**: `https://golive.apwide.net/api`
- **Authentication**:
    - Bearer token (preferred): `goliveToken`
    - Basic auth: `goliveUsername` + `golivePassword`
- **Client Setup**: Automatically configured in `GoliveClient` constructor

### GitHub API

- Uses `@actions/github` Octokit wrapper
- Requires `GITHUB_TOKEN` secret
- Main usage: Fetching workflow run history for commit analysis

## Dependencies

### Production Dependencies

- `@actions/core` - GitHub Actions toolkit
- `@actions/github` - GitHub API wrapper with Octokit
- `@octokit/plugin-rest-endpoint-methods` - GitHub REST API methods

### Key Dev Dependencies

- `@vercel/ncc` - Bundler for GitHub Actions
- `@hey-api/openapi-ts` - OpenAPI client generator
- `typescript` - TypeScript compiler
- `vitest` - Testing framework
- `eslint` + `prettier` - Linting and formatting

## Important Configuration Files

### `tsconfig.json`

- Target: ES2022
- Module: preserve (for OpenAPI compatibility)
- Output: `dist/` directory
- Strict mode enabled
- No implicit any

### `action.yml`

- Defines GitHub Action interface
- All inputs documented with descriptions
- Runs: `node20` runtime
- Entry point: `dist/index.js`

## Gotchas & Warnings

### 1. **Don't Edit Generated Files**

All files in `src/client/` with `.gen.ts` suffix are auto-generated. Changes will be overwritten.

### 2. **Bundling Required**

GitHub Actions need bundled code. Always run `npm run build` before testing or releasing.

### 3. **Environment Variables**

GitHub Actions uses environment variables for context:

- `GITHUB_WORKFLOW`, `GITHUB_JOB`, `GITHUB_RUN_NUMBER`, etc.
- Set via `context` from `@actions/github`

### 4. **Shallow Checkouts**

GitHub Actions default to shallow clones. Git history parsing includes fallback logic.

### 5. **Date Format Handling**

`fixDate()` utility handles Azure DevOps date format conversion (MM/DD/YYYY → ISO-8601).

### 6. **Boolean Parsing**

Booleans come as strings from inputs. Use `getBoolean()` which checks for `'true'` string.

### 7. **Auto-Create Pattern**

Many resources support auto-creation (environments, applications, categories):

- Always check `autoCreate` flag before attempting creation
- Requires proper permissions in Golive

## Debugging Tips

### Enable Debug Logging

```typescript
import { debug } from '@actions/core'
debug('your debug message')
```

View in GitHub Actions by setting secret: `ACTIONS_STEP_DEBUG=true`

### Testing Locally

Set environment variables before running:

```bash
export GITHUB_WORKFLOW="Test Workflow"
export GITHUB_RUN_NUMBER="1"
export GITHUB_REPOSITORY="owner/repo"
# ... etc
npm test
```

### Common Issues

**Issue**: `Cannot find module '@actions/core'`  
**Solution**: Run `npm ci` to install dependencies

**Issue**: Git log fails in actions  
**Solution**: Use `actions/checkout@v4` with `fetch-depth: 0` for full history

**Issue**: Authentication fails  
**Solution**: Verify token/credentials are set correctly in action inputs

## Related Repositories

This repository is used by two separate GitHub Action repositories:

1. `apwide/golive-send-environment-info`
2. `apwide/golive-send-release-info`

When published to NPM, these repos auto-update to the latest version via the release workflow.

## Future Development Notes

### Potential Improvements

- Enable tests in CI pipeline (currently commented out)
- Add integration tests with mock Golive API
- Add more comprehensive unit tests for edge cases
- Document API client schema updates process
- Add examples directory with common usage patterns

### Extension Points

- New actions can be added in `src/` following the same pattern
- Custom issue key extractors can extend `src/core/scope.ts`
- Additional API clients can be generated from other OpenAPI specs

---

**Last Updated**: 2026-02-13  
**Maintainer**: Apwide Team

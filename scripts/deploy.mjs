// `npm run deploy`: publishes dist/ (built by the predeploy script) to the gh-pages branch,
// which GitHub Pages serves (Settings → Pages → Deploy from a branch → gh-pages, / root).
// The same command runs locally and in CI. Plain git, no extra dependencies: dist/ is committed
// through a private index, so the working tree, the real index and the current branch are never touched.
import { execFileSync } from 'node:child_process'
import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const BRANCH = 'gh-pages'
const remote = process.env.DEPLOY_REMOTE || 'origin'
const dist = path.resolve('dist')
const git = (args, options = {}) =>
  (execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], ...options }) ?? '').trim()

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error('dist/index.html not found. Run `npm run build` first (`npm run deploy` does this for you).')
  process.exit(1)
}
// Serve the files exactly as built, without Jekyll processing.
writeFileSync(path.join(dist, '.nojekyll'), '')

const gitDir = git(['rev-parse', '--absolute-git-dir'])
const source = git(['describe', '--always', '--dirty'])
const index = path.join(tmpdir(), `gh-pages-index-${process.pid}`)
const inDist = (args) => git(['--git-dir', gitDir, '--work-tree', dist, ...args], { cwd: dist, env: { ...process.env, GIT_INDEX_FILE: index } })

try {
  inDist(['add', '--all', '.'])
  const tree = inDist(['write-tree'])
  const commit = git(['commit-tree', tree, '-m', `Deploy ${source}`])
  // gh-pages only ever holds the latest build, so each deploy replaces it.
  git(['push', '--force', remote, `${commit}:refs/heads/${BRANCH}`], { stdio: 'inherit' })
  console.log(`Published ${source} to ${BRANCH}. GitHub Pages updates in about a minute.`)
} finally {
  rmSync(index, { force: true })
}

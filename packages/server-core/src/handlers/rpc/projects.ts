import { existsSync, readFileSync } from 'fs'
import { join, basename } from 'path'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import { getWorkspaceByNameOrId } from '@craft-agent/shared/config'
import { pushTyped, type RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'

export const HANDLED_CHANNELS = [
  RPC_CHANNELS.projects.LIST,
  RPC_CHANNELS.projects.GET,
  RPC_CHANNELS.projects.CREATE,
] as const

export function registerProjectsHandlers(server: RpcServer, _deps: HandlerDeps): void {
  // List all projects for a workspace
  server.handle(RPC_CHANNELS.projects.LIST, async (_ctx, workspaceId: string) => {
    const workspace = getWorkspaceByNameOrId(workspaceId)
    if (!workspace) throw new Error('Workspace not found')

    const { listProjectSummaries, getWorkspaceProjectsPath } = await import('@craft-agent/shared/projects')
    const projects = listProjectSummaries(workspace.rootPath)
    const filePath = getWorkspaceProjectsPath(workspace.rootPath)

    return { projects, filePath }
  })

  // Get a single project with context files
  server.handle(RPC_CHANNELS.projects.GET, async (_ctx, workspaceId: string, slug: string) => {
    const workspace = getWorkspaceByNameOrId(workspaceId)
    if (!workspace) throw new Error('Workspace not found')

    const { loadProject, getProjectConfigPath } = await import('@craft-agent/shared/projects')
    const { expandPath } = await import('@craft-agent/shared/utils')
    const config = loadProject(workspace.rootPath, slug)
    if (!config) throw new Error(`Project not found: ${slug}`)

    const configPath = getProjectConfigPath(workspace.rootPath, slug)

    // Read CLAUDE.md and AGENTS.md from the project's target directory
    const projectDir = expandPath(config.path)
    let claudeMd: string | undefined
    let agentsMd: string | undefined

    const claudeMdPath = join(projectDir, 'CLAUDE.md')
    if (existsSync(claudeMdPath)) {
      try { claudeMd = readFileSync(claudeMdPath, 'utf-8') } catch { /* ignore */ }
    }

    const agentsMdPath = join(projectDir, 'AGENTS.md')
    if (existsSync(agentsMdPath)) {
      try { agentsMd = readFileSync(agentsMdPath, 'utf-8') } catch { /* ignore */ }
    }

    return { config, claudeMd, agentsMd, configPath }
  })

  // Create a new project from a folder path
  server.handle(RPC_CHANNELS.projects.CREATE, async (_ctx, workspaceId: string, folderPath: string) => {
    const workspace = getWorkspaceByNameOrId(workspaceId)
    if (!workspace) throw new Error('Workspace not found')

    const { generateProjectSlug, saveProject } = await import('@craft-agent/shared/projects')
    const { randomUUID } = await import('crypto')

    const name = basename(folderPath)
    const slug = generateProjectSlug(workspace.rootPath, name)
    const now = Date.now()

    // Pass absolute path — saveProject converts to portable form internally
    const config = {
      id: `proj_${randomUUID().replace(/-/g, '').slice(0, 8)}`,
      name,
      slug,
      path: folderPath,
      createdAt: now,
      updatedAt: now,
    }

    saveProject(workspace.rootPath, config)
    pushTyped(server, RPC_CHANNELS.projects.CHANGED, { to: 'workspace', workspaceId }, workspaceId)

    return { slug }
  })
}

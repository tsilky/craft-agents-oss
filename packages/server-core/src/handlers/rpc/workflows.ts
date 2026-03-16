import { join } from 'path'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import { getWorkspaceByNameOrId } from '@craft-agent/shared/config'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'

export const HANDLED_CHANNELS = [
  RPC_CHANNELS.workflows.GET,
  RPC_CHANNELS.workflows.DELETE,
  RPC_CHANNELS.workflows.OPEN_EDITOR,
  RPC_CHANNELS.workflows.OPEN_FINDER,
] as const

export function registerWorkflowsHandlers(server: RpcServer, deps: HandlerDeps): void {
  // Get all workflows for a workspace (and optionally project-level workflows from workingDirectory)
  server.handle(RPC_CHANNELS.workflows.GET, async (_ctx, workspaceId: string, workingDirectory?: string) => {
    deps.platform.logger?.info(`WORKFLOWS_GET: Loading workflows for workspace: ${workspaceId}${workingDirectory ? `, workingDirectory: ${workingDirectory}` : ''}`)
    const workspace = getWorkspaceByNameOrId(workspaceId)
    if (!workspace) {
      deps.platform.logger?.error(`WORKFLOWS_GET: Workspace not found: ${workspaceId}`)
      return []
    }
    const { loadAllWorkflows } = await import('@craft-agent/shared/workflows')
    const workflows = loadAllWorkflows(workspace.rootPath, workingDirectory)
    deps.platform.logger?.info(`WORKFLOWS_GET: Loaded ${workflows.length} workflows from ${workspace.rootPath}`)
    return workflows
  })

  // Delete a workflow from a workspace
  server.handle(RPC_CHANNELS.workflows.DELETE, async (_ctx, workspaceId: string, workflowSlug: string) => {
    const workspace = getWorkspaceByNameOrId(workspaceId)
    if (!workspace) throw new Error('Workspace not found')

    const { getWorkspaceWorkflowsPath } = await import('@craft-agent/shared/workspaces')
    const { rmSync } = await import('fs')

    const workflowsDir = getWorkspaceWorkflowsPath(workspace.rootPath)
    const workflowDir = join(workflowsDir, workflowSlug)
    rmSync(workflowDir, { recursive: true, force: true })
    deps.platform.logger?.info(`Deleted workflow: ${workflowSlug}`)
  })

  // Open workflow WORKFLOW.md in editor
  server.handle(RPC_CHANNELS.workflows.OPEN_EDITOR, async (_ctx, workspaceId: string, workflowSlug: string) => {
    const workspace = getWorkspaceByNameOrId(workspaceId)
    if (!workspace) throw new Error('Workspace not found')

    const { getWorkspaceWorkflowsPath } = await import('@craft-agent/shared/workspaces')

    const workflowsDir = getWorkspaceWorkflowsPath(workspace.rootPath)
    const workflowFile = join(workflowsDir, workflowSlug, 'WORKFLOW.md')
    await deps.platform.openPath?.(workflowFile)
  })

  // Open workflow folder in Finder/Explorer
  server.handle(RPC_CHANNELS.workflows.OPEN_FINDER, async (_ctx, workspaceId: string, workflowSlug: string) => {
    const workspace = getWorkspaceByNameOrId(workspaceId)
    if (!workspace) throw new Error('Workspace not found')

    const { getWorkspaceWorkflowsPath } = await import('@craft-agent/shared/workspaces')

    const workflowsDir = getWorkspaceWorkflowsPath(workspace.rootPath)
    const workflowDir = join(workflowsDir, workflowSlug)
    await deps.platform.showItemInFolder?.(workflowDir)
  })
}

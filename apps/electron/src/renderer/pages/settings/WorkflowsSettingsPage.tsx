import * as React from 'react'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { Loader2, Trash2, FolderOpen, FileEdit, Plus } from 'lucide-react'
import { useAppShellContext } from '@/context/AppShellContext'
import {
  SettingsSection,
  SettingsCard,
} from '@/components/settings'
import { routes } from '@/lib/navigate'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import type { LoadedWorkflow } from '../../../shared/types'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'workflows',
}

export default function WorkflowsSettingsPage() {
  const { activeWorkspaceId, activeSessionWorkingDirectory } = useAppShellContext()
  const [workflows, setWorkflows] = React.useState<LoadedWorkflow[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadWorkflows = React.useCallback(async () => {
    if (!activeWorkspaceId) return
    setIsLoading(true)
    setError(null)
    try {
      const loaded = await window.electronAPI.getWorkflows(activeWorkspaceId, activeSessionWorkingDirectory)
      setWorkflows(loaded || [])
    } catch (err) {
      console.error('[WorkflowsSettings] Failed to load workflows:', err)
      setError(String(err))
    } finally {
      setIsLoading(false)
    }
  }, [activeWorkspaceId, activeSessionWorkingDirectory])

  React.useEffect(() => {
    loadWorkflows()
  }, [loadWorkflows])

  const handleDelete = React.useCallback(async (slug: string) => {
    if (!activeWorkspaceId) return
    try {
      await window.electronAPI.deleteWorkflow(activeWorkspaceId, slug)
      setWorkflows(prev => prev.filter(w => w.slug !== slug))
    } catch (err) {
      console.error('[WorkflowsSettings] Failed to delete workflow:', err)
    }
  }, [activeWorkspaceId])

  const handleOpenInEditor = React.useCallback(async (slug: string) => {
    if (!activeWorkspaceId) return
    try {
      await window.electronAPI.openWorkflowInEditor(activeWorkspaceId, slug)
    } catch (err) {
      console.error('[WorkflowsSettings] Failed to open workflow:', err)
    }
  }, [activeWorkspaceId])

  const [newSlug, setNewSlug] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)

  const handleCreate = React.useCallback(async () => {
    if (!activeWorkspaceId || !newSlug.trim()) return
    const slug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    if (!slug) return
    setIsCreating(false)
    setNewSlug('')
    try {
      await window.electronAPI.createWorkflow(activeWorkspaceId, slug)
      await loadWorkflows()
    } catch (err) {
      console.error('[WorkflowsSettings] Failed to create workflow:', err)
    }
  }, [activeWorkspaceId, newSlug, loadWorkflows])

  const handleOpenInFinder = React.useCallback(async (slug: string) => {
    if (!activeWorkspaceId) return
    try {
      await window.electronAPI.openWorkflowInFinder(activeWorkspaceId, slug)
    } catch (err) {
      console.error('[WorkflowsSettings] Failed to open workflow folder:', err)
    }
  }, [activeWorkspaceId])

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="Workflows" actions={<HeaderMenu route={routes.view.settings('workflows')} />} />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
            <div className="space-y-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <SettingsSection title="Error">
                  <SettingsCard className="px-4 py-3.5">
                    <div className="text-sm text-destructive">{error}</div>
                  </SettingsCard>
                </SettingsSection>
              ) : (
                <>
                  <SettingsSection title="About Workflows">
                    <SettingsCard className="px-4 py-3.5">
                      <div className="text-sm text-muted-foreground leading-relaxed space-y-1.5">
                        <p>
                          Workflows define multi-step agent processes with structured phases, permission controls, and stop conditions. Select a workflow when starting a session to guide the agent through a defined process.
                        </p>
                        <p>
                          Each workflow has <span className="text-foreground/80 font-medium">steps</span> that define what the agent should do at each phase. Steps can set permission modes and stop conditions to control agent behavior.
                        </p>
                        <p>
                          Workflows are stored as <code className="bg-foreground/5 px-1 rounded">WORKFLOW.md</code> files with YAML frontmatter. They can be defined at three levels: global, workspace, or project.
                        </p>
                      </div>
                    </SettingsCard>
                  </SettingsSection>

                  <SettingsSection
                    title={`Loaded Workflows (${workflows.length})`}
                    description="All workflows discovered from global, workspace, and project sources."
                    action={
                      isCreating ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={newSlug}
                            onChange={(e) => setNewSlug(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCreate()
                              if (e.key === 'Escape') { setIsCreating(false); setNewSlug('') }
                            }}
                            placeholder="workflow-slug"
                            className="h-7 px-2 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring w-36"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleCreate}
                            disabled={!newSlug.trim()}
                            className="h-7 px-2.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                          >
                            Create
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsCreating(false); setNewSlug('') }}
                            className="h-7 px-2 text-xs rounded text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsCreating(true)}
                          className="flex items-center gap-1 h-7 px-2.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      )
                    }
                  >
                    {workflows.length > 0 ? (
                      <div className="space-y-2">
                        {workflows.map((workflow) => (
                          <SettingsCard key={workflow.slug} className="px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {workflow.metadata.icon && (
                                    <span className="text-base">{workflow.metadata.icon}</span>
                                  )}
                                  <span className="font-medium text-sm text-foreground">
                                    {workflow.metadata.name}
                                  </span>
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground">
                                    {workflow.source}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {workflow.metadata.description}
                                </p>
                                {workflow.metadata.steps.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {workflow.metadata.steps.map((step, i) => (
                                      <span
                                        key={step.id}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground"
                                      >
                                        {i + 1}. {step.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {workflow.metadata.defaultPermissionMode && (
                                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                                    Default mode: {workflow.metadata.defaultPermissionMode}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInEditor(workflow.slug)}
                                  className="p-1.5 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
                                  title="Open in editor"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenInFinder(workflow.slug)}
                                  className="p-1.5 rounded hover:bg-foreground/5 text-muted-foreground hover:text-foreground transition-colors"
                                  title="Show in Finder"
                                >
                                  <FolderOpen className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(workflow.slug)}
                                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                  title="Delete workflow"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </SettingsCard>
                        ))}
                      </div>
                    ) : (
                      <SettingsCard className="px-4 py-8">
                        <div className="text-center text-muted-foreground">
                          <p className="text-sm">No workflows found.</p>
                          <p className="text-xs mt-1 text-foreground/40">
                            Add workflow files to your workspace's <code className="bg-foreground/5 px-1 rounded">workflows/</code> directory.
                          </p>
                        </div>
                      </SettingsCard>
                    )}
                  </SettingsSection>
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

/**
 * ProjectsSettingsPage
 *
 * Displays workspace projects (named working directory entries with defaults).
 * Each project maps a local directory to session defaults like sources, permission mode, model.
 *
 * Data is loaded via the useProjects hook which subscribes to live config changes.
 */

import * as React from 'react'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { EditPopover, EditButton, getEditConfig } from '@/components/ui/EditPopover'
import { getDocUrl } from '@craft-agent/shared/docs/doc-links'
import { Loader2, FolderCog, ChevronRight } from 'lucide-react'
import { useAppShellContext, useActiveWorkspace } from '@/context/AppShellContext'
import { useProjects } from '@/hooks/useProjects'
import {
  SettingsSection,
  SettingsCard,
} from '@/components/settings'
import { navigate, routes } from '@/lib/navigate'
import { useNavigationState, isSettingsNavigation } from '@/contexts/NavigationContext'
import { ProjectDetailView } from './ProjectDetailView'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import type { ProjectSummary } from '@craft-agent/shared/projects'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'projects',
}

/** Badge for project defaults */
function DefaultBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
      {label}
    </span>
  )
}

/** A single project row — clickable to navigate to project detail */
function ProjectRow({ project, onClick }: { project: ProjectSummary; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-foreground/[0.03] transition-colors text-left"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {project.icon && (
            <span className="text-sm">{project.icon}</span>
          )}
          <span className="text-sm font-medium text-foreground">{project.name}</span>
          {project.hasDefaults && (
            <DefaultBadge label="defaults" />
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
          {project.path}
        </div>
        {project.tagline && (
          <div className="text-xs text-muted-foreground/70 mt-1">
            {project.tagline}
          </div>
        )}
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
    </button>
  )
}

export default function ProjectsSettingsPage() {
  const { activeWorkspaceId } = useAppShellContext()
  const activeWorkspace = useActiveWorkspace()
  const { projects, filePath, isLoading } = useProjects(activeWorkspaceId)
  const navState = useNavigationState()

  // If a project detail slug is in the navigation state, render the detail view
  const projectSlug = isSettingsNavigation(navState) ? navState.detail : undefined
  if (projectSlug && activeWorkspaceId) {
    return <ProjectDetailView slug={projectSlug} workspaceId={activeWorkspaceId} />
  }

  // Resolve edit config using the workspace root path
  const rootPath = activeWorkspace?.rootPath || ''
  const projectsEditConfig = getEditConfig('edit-projects', rootPath)

  // Secondary action: open the projects directory in system editor
  const editFileAction = filePath ? {
    label: 'Open Folder',
    filePath,
  } : undefined

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="Projects" actions={<HeaderMenu route={routes.view.settings('projects')} />} />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
            <div className="space-y-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* About Section */}
                  <SettingsSection title="About Projects">
                    <SettingsCard className="px-4 py-3.5">
                      <div className="text-sm text-muted-foreground leading-relaxed space-y-1.5">
                        <p>
                          Projects are named working directories with pre-configured defaults. When you select a project as your working directory, its defaults are applied to the session automatically.
                        </p>
                        <p>
                          Each project can set default <span className="text-foreground/80 font-medium">sources</span>, <span className="text-foreground/80 font-medium">permission mode</span>, <span className="text-foreground/80 font-medium">model</span>, and <span className="text-foreground/80 font-medium">thinking level</span>.
                        </p>
                        <p>
                          Projects are stored as <code className="bg-foreground/5 px-1 rounded">config.json</code> files in the <code className="bg-foreground/5 px-1 rounded">projects/</code> directory at your workspace root.
                        </p>
                        <p>
                          <button
                            type="button"
                            onClick={() => window.electronAPI?.openUrl(getDocUrl('projects'))}
                            className="text-foreground/70 hover:text-foreground underline underline-offset-2"
                          >
                            Learn more
                          </button>
                        </p>
                      </div>
                    </SettingsCard>
                  </SettingsSection>

                  {/* Projects List Section */}
                  <SettingsSection
                    title="Configured Projects"
                    description="Working directories with session defaults."
                    action={
                      <EditPopover
                        trigger={<EditButton />}
                        context={projectsEditConfig.context}
                        example={projectsEditConfig.example}
                        model={projectsEditConfig.model}
                        systemPromptPreset={projectsEditConfig.systemPromptPreset}
                        secondaryAction={editFileAction}
                      />
                    }
                  >
                    <SettingsCard className="p-0">
                      {projects.length > 0 ? (
                        <div>
                          {projects.map(project => (
                            <ProjectRow
                              key={project.slug}
                              project={project}
                              onClick={() => navigate(routes.view.settings('projects', project.slug))}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <FolderCog className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                          <p className="text-sm">No projects configured.</p>
                          <p className="text-xs mt-1 text-foreground/40">
                            Add projects to pre-configure working directories with default sources and settings.
                          </p>
                        </div>
                      )}
                    </SettingsCard>
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

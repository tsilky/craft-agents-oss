/**
 * ProjectDetailView
 *
 * Detail page for a single project, shown when navigating to settings/projects/{slug}.
 * Displays project info (name, path, defaults) and context files (CLAUDE.md, AGENTS.md).
 * Uses the same Info_* component pattern as SourceInfoPage.
 */

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { FolderCog } from 'lucide-react'
import { isEmoji } from '@craft-agent/shared/utils/icon-constants'
import {
  Info_Page,
  Info_Section,
  Info_Table,
  Info_Markdown,
} from '@/components/info'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { EditPopover, EditButton, getEditConfig } from '@/components/ui/EditPopover'
import { routes } from '@/lib/navigate'
import { useActiveWorkspace } from '@/context/AppShellContext'
import type { ProjectDetailResult } from '../../../shared/types'

interface ProjectDetailViewProps {
  slug: string
  workspaceId: string
}

export function ProjectDetailView({ slug, workspaceId }: ProjectDetailViewProps) {
  const [data, setData] = useState<ProjectDetailResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const activeWorkspace = useActiveWorkspace()

  const loadProject = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await window.electronAPI.getProject(workspaceId, slug)
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, slug])

  useEffect(() => {
    loadProject()
  }, [loadProject])

  // Subscribe to project changes for live updates
  useEffect(() => {
    const cleanup = window.electronAPI.onProjectsChanged((changedWorkspaceId) => {
      if (changedWorkspaceId === workspaceId) {
        loadProject()
      }
    })
    return cleanup
  }, [workspaceId, loadProject])

  const config = data?.config
  const projectName = config?.name || slug

  // EditPopover config
  const rootPath = activeWorkspace?.rootPath || ''
  const editConfig = getEditConfig('edit-projects', rootPath)
  const editFileAction = data?.configPath ? {
    label: 'Open Config',
    filePath: data.configPath,
  } : undefined

  const route = routes.view.settings('projects', slug)

  return (
    <Info_Page loading={isLoading} error={error ?? undefined}>
      <Info_Page.Header
        title={projectName}
        actions={<HeaderMenu route={route} />}
      />
      <Info_Page.Content>
        {/* Hero section */}
        <Info_Page.Hero
          avatar={
            <div className="h-full w-full flex items-center justify-center bg-foreground/5">
              {config?.icon && isEmoji(config.icon) ? (
                <span className="text-base">{config.icon}</span>
              ) : (
                <FolderCog className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          }
          title={projectName}
          tagline={config?.tagline}
        />

        {/* Project Info */}
        <Info_Section
          title="Project Info"
          actions={
            <EditPopover
              trigger={<EditButton />}
              context={editConfig.context}
              example={editConfig.example}
              model={editConfig.model}
              systemPromptPreset={editConfig.systemPromptPreset}
              secondaryAction={editFileAction}
            />
          }
        >
          <Info_Table>
            <Info_Table.Row label="Path">
              <span className="font-mono text-xs">{config?.path}</span>
            </Info_Table.Row>
            {config?.slug && (
              <Info_Table.Row label="Slug" value={config.slug} />
            )}
          </Info_Table>
        </Info_Section>

        {/* Defaults */}
        {config?.defaults && hasDefaults(config.defaults) && (
          <Info_Section title="Session Defaults" description="Applied automatically when this project is selected as the working directory.">
            <Info_Table>
              {config.defaults.permissionMode && (
                <Info_Table.Row label="Permission Mode" value={formatPermissionMode(config.defaults.permissionMode)} />
              )}
              {config.defaults.model && (
                <Info_Table.Row label="Model" value={config.defaults.model} />
              )}
              {config.defaults.thinkingLevel && (
                <Info_Table.Row label="Thinking" value={config.defaults.thinkingLevel} />
              )}
              {config.defaults.enabledSourceSlugs && config.defaults.enabledSourceSlugs.length > 0 && (
                <Info_Table.Row label="Sources">
                  <div className="flex flex-wrap gap-1.5">
                    {config.defaults.enabledSourceSlugs.map(s => (
                      <span key={s} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-foreground/5 text-foreground/70">
                        {s}
                      </span>
                    ))}
                  </div>
                </Info_Table.Row>
              )}
            </Info_Table>
          </Info_Section>
        )}

        {/* CLAUDE.md */}
        {data?.claudeMd && (
          <Info_Section title="CLAUDE.md" description="Project context file for Claude Code.">
            <Info_Markdown maxHeight={400} fullscreen>{data.claudeMd}</Info_Markdown>
          </Info_Section>
        )}

        {/* AGENTS.md */}
        {data?.agentsMd && (
          <Info_Section title="AGENTS.md" description="Agent-specific instructions for this project.">
            <Info_Markdown maxHeight={400} fullscreen>{data.agentsMd}</Info_Markdown>
          </Info_Section>
        )}
      </Info_Page.Content>
    </Info_Page>
  )
}

function hasDefaults(defaults: NonNullable<ProjectDetailResult['config']['defaults']>): boolean {
  return !!(
    defaults.permissionMode ||
    defaults.model ||
    defaults.thinkingLevel ||
    (defaults.enabledSourceSlugs && defaults.enabledSourceSlugs.length > 0)
  )
}

function formatPermissionMode(mode: string): string {
  switch (mode) {
    case 'safe': return 'Explore'
    case 'ask': return 'Ask to Edit'
    case 'allow-all': return 'Execute'
    default: return mode
  }
}

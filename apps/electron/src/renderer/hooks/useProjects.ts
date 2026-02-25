/**
 * useProjects Hook
 *
 * React hook to load and manage workspace projects.
 * Returns a list of configured projects (named working directories with defaults).
 * Auto-refreshes when workspace changes or projects config changes.
 */

import { useState, useEffect, useCallback } from 'react'
import type { ProjectListResult } from '../../shared/types'
import type { ProjectSummary } from '@craft-agent/shared/projects'

export interface UseProjectsResult {
  /** List of configured projects */
  projects: ProjectSummary[]
  /** Path to projects directory */
  filePath: string
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Load projects for a workspace via IPC.
 * Auto-refreshes when workspaceId changes.
 * Subscribes to live project config changes via PROJECTS_CHANGED event.
 */
export function useProjects(workspaceId: string | null): UseProjectsResult {
  const [data, setData] = useState<ProjectListResult>({ projects: [], filePath: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setData({ projects: [], filePath: '' })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const result = await window.electronAPI.listProjects(workspaceId)
      setData(result)
      setError(null)
    } catch (err) {
      console.error('[useProjects] Failed to load projects:', err)
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  // Load projects when workspace changes
  useEffect(() => {
    refresh()
  }, [refresh])

  // Subscribe to live project changes (config file changes)
  useEffect(() => {
    if (!workspaceId) return

    const cleanup = window.electronAPI.onProjectsChanged((changedWorkspaceId) => {
      // Only refresh if this is our workspace
      if (changedWorkspaceId === workspaceId) {
        refresh()
      }
    })

    return cleanup
  }, [workspaceId, refresh])

  return {
    projects: data.projects,
    filePath: data.filePath,
    isLoading,
    error,
    refresh,
  }
}

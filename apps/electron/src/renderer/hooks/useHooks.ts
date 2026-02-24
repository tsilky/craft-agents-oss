/**
 * useHooks Hook
 *
 * React hook to load and manage workspace hooks configuration.
 * Returns a summary of all configured hooks from hooks.json.
 * Auto-refreshes when workspace changes or hooks config changes.
 */

import { useState, useEffect, useCallback } from 'react'
import type { HookEventSummary, HooksListResult } from '../../shared/types'

export interface UseHooksResult {
  /** Summary of all configured hooks by event */
  hooks: HookEventSummary[]
  /** Whether hooks.json exists */
  hasConfig: boolean
  /** Path to hooks.json */
  filePath: string
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Load hooks for a workspace via IPC.
 * Auto-refreshes when workspaceId changes.
 * Subscribes to live hooks config changes via HOOKS_CHANGED event.
 */
export function useHooks(workspaceId: string | null): UseHooksResult {
  const [data, setData] = useState<HooksListResult>({ hooks: [], hasConfig: false, filePath: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!workspaceId) {
      setData({ hooks: [], hasConfig: false, filePath: '' })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const result = await window.electronAPI.listHooks(workspaceId)
      setData(result)
      setError(null)
    } catch (err) {
      console.error('[useHooks] Failed to load hooks:', err)
      setError(err instanceof Error ? err.message : 'Failed to load hooks')
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId])

  // Load hooks when workspace changes
  useEffect(() => {
    refresh()
  }, [refresh])

  // Subscribe to live hooks changes (config file changes)
  useEffect(() => {
    if (!workspaceId) return

    const cleanup = window.electronAPI.onHooksChanged((changedWorkspaceId) => {
      // Only refresh if this is our workspace
      if (changedWorkspaceId === workspaceId) {
        refresh()
      }
    })

    return cleanup
  }, [workspaceId, refresh])

  return {
    hooks: data.hooks,
    hasConfig: data.hasConfig,
    filePath: data.filePath,
    isLoading,
    error,
    refresh,
  }
}

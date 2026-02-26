/**
 * OrchestrationStatus - Shows child session status for Super Session orchestrators
 *
 * Displayed above the input area when the session is an active orchestrator.
 * Shows compact progress cards for each child with live activity info.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useNavigation } from '@/contexts/NavigationContext'
import type { OrchestrationState } from '@craft-agent/shared/sessions'
import type { Session } from '../../../shared/types'

type ChildProgress = NonNullable<Session['childProgress']>[string]

export interface OrchestrationStatusProps {
  /** Orchestration state from the session */
  orchestrationState?: OrchestrationState
  /** Whether orchestrator mode is enabled */
  orchestratorEnabled?: boolean
  /** Live child progress data */
  childProgress?: Session['childProgress']
  /** Additional CSS classes */
  className?: string
}

/**
 * Format tool activity into a human-readable string
 */
function formatActivity(toolName?: string, toolDetail?: string): string | undefined {
  if (!toolName) return undefined

  // Map tool names to friendly action verbs
  const actionMap: Record<string, string> = {
    Edit: 'Editing',
    Read: 'Reading',
    Write: 'Writing',
    Bash: 'Running',
    Grep: 'Searching',
    Glob: 'Finding files',
    Task: 'Running agent',
    WebFetch: 'Fetching',
    WebSearch: 'Searching web',
    TodoWrite: 'Updating tasks',
  }

  const action = actionMap[toolName] || `Using ${toolName}`

  if (toolDetail) {
    // Truncate long paths — show last component(s)
    const shortDetail = toolDetail.length > 60
      ? '...' + toolDetail.slice(-57)
      : toolDetail
    return `${action} ${shortDetail}`
  }

  return action
}

/**
 * Format cost from token usage
 */
function formatCost(tokenUsage?: Session['tokenUsage']): string | undefined {
  if (!tokenUsage?.costUsd) return undefined
  const cost = tokenUsage.costUsd
  if (cost < 0.01) return '<$0.01'
  return `$${cost.toFixed(2)}`
}

export function OrchestrationStatus({
  orchestrationState,
  orchestratorEnabled = false,
  childProgress,
  className,
}: OrchestrationStatusProps) {
  const { navigateToSession } = useNavigation()

  // Don't render if orchestrator is not enabled or no orchestration state
  if (!orchestratorEnabled || !orchestrationState) return null

  const { waitingFor, completedResults } = orchestrationState
  const runningCount = waitingFor.length
  const completedCount = completedResults.length
  const totalActive = runningCount + completedCount

  // Don't show if no children have been spawned
  if (totalActive === 0) return null

  // Build header text
  const parts: string[] = []
  if (runningCount > 0) parts.push(`${runningCount} running`)
  if (completedCount > 0) parts.push(`${completedCount} completed`)
  const headerText = `Children (${parts.join(', ')})`

  return (
    <div className={cn(
      'rounded-lg border border-foreground/10 bg-foreground/[0.02] text-xs mb-2',
      className,
    )}>
      {/* Header */}
      <div className="px-3 py-2 text-foreground/50 font-medium text-[11px]">
        {headerText}
      </div>

      {/* Child list */}
      <div className="px-2 pb-2 space-y-0.5">
        {/* Running children */}
        {waitingFor.map((childId) => {
          const progress: ChildProgress | undefined = childProgress?.[childId]
          const activity = formatActivity(progress?.lastToolName, progress?.lastToolDetail)
          const name = progress?.childName || childId.slice(0, 12) + '...'

          return (
            <button
              key={childId}
              type="button"
              onClick={() => navigateToSession(childId)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-foreground/5 transition-colors text-left group"
            >
              {/* Pulsing green dot */}
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              {/* Name + activity */}
              <div className="flex-1 min-w-0">
                <span className="text-foreground/70 font-medium truncate block">
                  {name}
                </span>
                {activity && (
                  <span className="text-foreground/40 truncate block text-[10px]">
                    {activity}
                  </span>
                )}
              </div>
            </button>
          )
        })}

        {/* Completed children */}
        {completedResults.map((child) => {
          const progress: ChildProgress | undefined = childProgress?.[child.sessionId]
          const cost = formatCost(progress?.tokenUsage || child.tokenUsage)

          return (
            <button
              key={child.sessionId}
              type="button"
              onClick={() => navigateToSession(child.sessionId)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-foreground/5 transition-colors text-left group"
            >
              {/* Static status dot */}
              <span className={cn(
                'inline-block w-2 h-2 rounded-full shrink-0',
                child.status === 'completed' && 'bg-emerald-500',
                child.status === 'error' && 'bg-destructive',
                child.status === 'cancelled' && 'bg-foreground/30',
              )} />
              {/* Name */}
              <span className="flex-1 truncate text-foreground/60">
                {child.name || child.sessionId.slice(0, 12)}
              </span>
              {/* Cost */}
              {cost && (
                <span className="text-foreground/30 text-[10px] shrink-0">
                  {cost}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

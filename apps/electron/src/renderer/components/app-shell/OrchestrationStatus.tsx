/**
 * OrchestrationStatus - Shows child session status for Super Session orchestrators
 *
 * Displayed above the input area when the session is an active orchestrator.
 * Shows a collapsible status bar with child session names and statuses.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { OrchestrationState } from '@craft-agent/shared/sessions'

export interface OrchestrationStatusProps {
  /** Orchestration state from the session */
  orchestrationState?: OrchestrationState
  /** Whether orchestrator mode is enabled */
  orchestratorEnabled?: boolean
  /** Callback to navigate to a child session */
  onNavigateToChild?: (sessionId: string) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * Status indicator dot with optional pulse animation
 */
function StatusDot({ status, pulse }: { status: 'waiting' | 'running' | 'completed' | 'idle'; pulse?: boolean }) {
  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full shrink-0',
        status === 'waiting' && 'bg-amber-500',
        status === 'running' && 'bg-emerald-500',
        status === 'completed' && 'bg-emerald-500',
        status === 'idle' && 'bg-foreground/30',
        pulse && 'animate-pulse',
      )}
    />
  )
}

export function OrchestrationStatus({
  orchestrationState,
  orchestratorEnabled = false,
  onNavigateToChild,
  className,
}: OrchestrationStatusProps) {
  const [expanded, setExpanded] = React.useState(false)

  // Don't render if orchestrator is not enabled or no orchestration state
  if (!orchestratorEnabled || !orchestrationState) return null

  const { waitingFor, waitMessage, completedResults } = orchestrationState
  const isWaiting = waitingFor.length > 0
  const completedCount = completedResults.length
  const totalActive = waitingFor.length + completedCount

  // Don't show if no children have been spawned
  if (totalActive === 0) return null

  // Determine overall status
  const status: 'waiting' | 'running' | 'completed' = isWaiting ? 'waiting' : completedCount > 0 ? 'completed' : 'running'

  // Build header text
  let headerText = ''
  if (isWaiting) {
    headerText = `Waiting for ${waitingFor.length} child${waitingFor.length === 1 ? '' : 'ren'}`
  } else if (completedCount > 0) {
    headerText = `${completedCount} child${completedCount === 1 ? '' : 'ren'} completed`
  }

  return (
    <div className={cn(
      'rounded-lg border border-foreground/10 bg-foreground/[0.02] text-xs mb-2',
      className,
    )}>
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-foreground/[0.03] transition-colors rounded-lg"
      >
        <StatusDot status={status} pulse={isWaiting} />
        <span className="flex-1 text-left text-foreground/70 font-medium">
          {headerText}
        </span>
        {totalActive > 0 && (
          expanded
            ? <ChevronDown className="h-3.5 w-3.5 text-foreground/40" />
            : <ChevronRight className="h-3.5 w-3.5 text-foreground/40" />
        )}
      </button>

      {/* Expanded child list */}
      {expanded && (
        <div className="px-3 pb-2 space-y-1">
          {/* Waiting children */}
          {waitingFor.map((childId) => (
            <button
              key={childId}
              type="button"
              onClick={() => onNavigateToChild?.(childId)}
              className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-foreground/5 transition-colors text-left"
            >
              <StatusDot status="running" pulse />
              <span className="flex-1 truncate text-foreground/60">
                {childId.slice(0, 12)}...
              </span>
              <span className="text-foreground/40 text-[10px]">executing</span>
            </button>
          ))}

          {/* Completed children */}
          {completedResults.map((child) => (
            <button
              key={child.sessionId}
              type="button"
              onClick={() => onNavigateToChild?.(child.sessionId)}
              className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-foreground/5 transition-colors text-left"
            >
              <StatusDot status="completed" />
              <span className="flex-1 truncate text-foreground/60">
                {child.name || child.sessionId.slice(0, 12)}
              </span>
              <span className={cn(
                "text-[10px]",
                child.status === 'completed' && 'text-emerald-500',
                child.status === 'error' && 'text-destructive',
                child.status === 'cancelled' && 'text-foreground/40',
              )}>
                {child.status}
              </span>
            </button>
          ))}

          {/* Wait message */}
          {waitMessage && (
            <p className="px-2 py-1 text-foreground/40 italic">
              {waitMessage}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

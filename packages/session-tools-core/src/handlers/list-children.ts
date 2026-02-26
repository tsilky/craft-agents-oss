/**
 * ListChildren Handler
 *
 * Gives the parent orchestrator a dashboard view of all child sessions.
 * Returns summary status for each child in a single call.
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

export interface ListChildrenArgs {
  /** Filter by status (optional) */
  statusFilter?: string[];
}

export interface ChildSummary {
  sessionId: string;
  name?: string;
  status: 'planning' | 'plan_submitted' | 'executing' | 'completed' | 'error' | 'cancelled' | 'idle';
  permissionMode: string;
  isProcessing: boolean;
  hasPendingPlan: boolean;
  messageCount: number;
  costUsd?: number;
}

export interface ListChildrenResponse {
  children: ChildSummary[];
  totalCount: number;
}

/**
 * Handle the ListChildren tool call.
 *
 * 1. Delegates to onListChildren callback
 * 2. Optionally filters by status
 * 3. Returns summary array
 */
export async function handleListChildren(
  ctx: SessionToolContext,
  args: ListChildrenArgs
): Promise<ToolResult> {
  const onListChildren = ctx.callbacks.onListChildren;
  if (!onListChildren) {
    return errorResponse('Orchestration is not available in this context.');
  }

  try {
    const result = await onListChildren(args);

    if (result.totalCount === 0) {
      return successResponse('No child sessions found.');
    }

    return successResponse(JSON.stringify(result, null, 2));
  } catch (error) {
    return errorResponse(
      `Failed to list children: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

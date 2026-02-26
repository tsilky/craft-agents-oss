/**
 * WaitForChildren Handler
 *
 * Suspends the parent orchestrator session until specified children
 * complete (or all active children if none specified).
 * The SessionManager handles the actual suspension via forceAbort.
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

export interface WaitForChildrenArgs {
  childSessionIds?: string[];
  message?: string;
}

/**
 * Handle the WaitForChildren tool call.
 *
 * 1. Delegates to onWaitForChildren callback
 * 2. Callback triggers forceAbort(WaitingForChildren) to suspend parent
 * 3. Return value may never be seen by the agent (forceAbort interrupts)
 */
export async function handleWaitForChildren(
  ctx: SessionToolContext,
  args: WaitForChildrenArgs
): Promise<ToolResult> {
  const onWaitForChildren = ctx.callbacks.onWaitForChildren;
  if (!onWaitForChildren) {
    return errorResponse('Orchestration is not available in this context.');
  }

  try {
    await onWaitForChildren(args);
    // This return may never be seen — forceAbort interrupts before response
    return successResponse('Waiting for child sessions to complete...');
  } catch (error) {
    return errorResponse(
      `Failed to wait for children: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

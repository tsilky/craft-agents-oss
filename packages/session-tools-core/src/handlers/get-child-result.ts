/**
 * GetChildResult Handler
 *
 * Pulls detailed results from a specific child session.
 * Can be used on-demand, not just at wave completion.
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

export interface GetChildResultArgs {
  childSessionId: string;
  includeMessages?: boolean;
  maxMessages?: number;
}

export interface ChildResultResponse {
  sessionId: string;
  name?: string;
  status: 'planning' | 'plan_submitted' | 'executing' | 'completed' | 'error' | 'cancelled' | 'idle';
  isProcessing: boolean;
  /** Child's current permission mode ('explore', 'ask', 'execute') */
  permissionMode: string;
  /** Whether the child has a submitted plan awaiting review */
  hasPendingPlan: boolean;
  summary: string;
  messageCount: number;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
  messages?: Array<{ role: string; content: string }>;
  planPath?: string;
  /** Plan content (first 4000 chars) if a plan was submitted */
  planContent?: string;
}

/**
 * Handle the GetChildResult tool call.
 *
 * 1. Validates childSessionId
 * 2. Delegates to onGetChildResult callback
 * 3. Returns structured result
 */
export async function handleGetChildResult(
  ctx: SessionToolContext,
  args: GetChildResultArgs
): Promise<ToolResult> {
  if (!args.childSessionId?.trim()) {
    return errorResponse('childSessionId is required.');
  }

  const onGetChildResult = ctx.callbacks.onGetChildResult;
  if (!onGetChildResult) {
    return errorResponse('Orchestration is not available in this context.');
  }

  try {
    const result = await onGetChildResult(args);
    return successResponse(JSON.stringify(result, null, 2));
  } catch (error) {
    return errorResponse(
      `Failed to get child result: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

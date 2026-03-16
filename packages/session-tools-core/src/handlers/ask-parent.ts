/**
 * AskParent Handler
 *
 * Available only in child sessions (sessions with parentSessionId).
 * Routes a question from the child to the parent orchestrator.
 * The child suspends via forceAbort('waiting_for_parent') until
 * the parent provides an answer via answer_child.
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

export interface AskParentQuestionOption {
  id: string;
  label: string;
  description?: string;
}

export interface AskParentArgs {
  question: string;
  context: string;
  options?: AskParentQuestionOption[];
  recommendation?: string;
  severity?: 'blocking' | 'informational';
}

/**
 * Handle the ask_parent tool call.
 *
 * 1. Validates required fields
 * 2. Delegates to onAskParent callback (SessionManager routes to parent)
 * 3. For blocking questions, child suspends via forceAbort — response may never be seen
 */
export async function handleAskParent(
  ctx: SessionToolContext,
  args: AskParentArgs
): Promise<ToolResult> {
  if (!args.question?.trim()) {
    return errorResponse('question is required and cannot be empty.');
  }

  if (!args.context?.trim()) {
    return errorResponse('context is required and cannot be empty.');
  }

  const onAskParent = ctx.callbacks.onAskParent;
  if (!onAskParent) {
    return errorResponse(
      'Question routing is not available. This tool is only available in child sessions with a parent orchestrator.'
    );
  }

  try {
    await onAskParent(args);
    // For blocking questions, forceAbort interrupts before this response
    return successResponse(
      'Question sent to parent orchestrator. Waiting for answer...'
    );
  } catch (error) {
    return errorResponse(
      `Failed to send question to parent: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

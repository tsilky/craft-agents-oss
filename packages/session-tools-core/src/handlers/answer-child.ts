/**
 * AnswerChild Handler
 *
 * Available only in parent orchestrator sessions.
 * Sends an answer back to a child session that called ask_parent.
 * The child resumes with the answer injected as a message.
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

export interface AnswerChildArgs {
  childSessionId: string;
  answerId?: string;
  answer: string;
  explanation?: string;
}

export interface AnswerChildResult {
  childSessionId: string;
  resumed: boolean;
}

/**
 * Handle the answer_child tool call.
 *
 * 1. Validates required fields
 * 2. Delegates to onAnswerChild callback (SessionManager delivers to child)
 * 3. Child resumes with the answer
 */
export async function handleAnswerChild(
  ctx: SessionToolContext,
  args: AnswerChildArgs
): Promise<ToolResult> {
  if (!args.childSessionId?.trim()) {
    return errorResponse('childSessionId is required.');
  }

  if (!args.answer?.trim()) {
    return errorResponse('answer is required and cannot be empty.');
  }

  const onAnswerChild = ctx.callbacks.onAnswerChild;
  if (!onAnswerChild) {
    return errorResponse('Orchestration is not available in this context.');
  }

  try {
    const result = await onAnswerChild(args);
    if (result.resumed) {
      return successResponse(
        `Answer delivered to child "${args.childSessionId}". Child has resumed execution.`
      );
    } else {
      return successResponse(
        `Answer delivered to child "${args.childSessionId}". Child will resume when ready.`
      );
    }
  } catch (error) {
    return errorResponse(
      `Failed to answer child: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * ReviewChildPlan Handler
 *
 * Parent approves or rejects a child's submitted plan (YOLO mode).
 * When approved, child switches to Execute mode and proceeds.
 * When rejected, child receives feedback and re-plans.
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

export interface ReviewChildPlanArgs {
  childSessionId: string;
  approved: boolean;
  feedback?: string;
  permissionMode?: 'ask' | 'allow-all';
}

export interface ReviewChildPlanResult {
  childSessionId: string;
  action: 'approved' | 'rejected';
  message: string;
}

/**
 * Handle the ReviewChildPlan tool call.
 *
 * 1. Validates childSessionId and args
 * 2. Delegates to onReviewChildPlan callback
 * 3. Returns action taken
 */
export async function handleReviewChildPlan(
  ctx: SessionToolContext,
  args: ReviewChildPlanArgs
): Promise<ToolResult> {
  if (!args.childSessionId?.trim()) {
    return errorResponse('childSessionId is required.');
  }

  if (!args.approved && !args.feedback?.trim()) {
    return errorResponse('feedback is required when rejecting a plan.');
  }

  const onReviewChildPlan = ctx.callbacks.onReviewChildPlan;
  if (!onReviewChildPlan) {
    return errorResponse('Orchestration is not available in this context.');
  }

  try {
    const result = await onReviewChildPlan(args);
    return successResponse(
      `${result.action === 'approved' ? 'Approved' : 'Rejected'}: ${result.message}`
    );
  } catch (error) {
    return errorResponse(
      `Failed to review child plan: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

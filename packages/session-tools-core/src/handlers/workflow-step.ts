/**
 * WorkflowStep Handler
 *
 * Allows the agent to report step transitions within a workflow.
 * When called, the current step updates, previous step is recorded
 * in history, and permission mode may change based on step config.
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

export interface WorkflowStepArgs {
  stepId: string;
  status?: 'started' | 'completed' | 'skipped' | 'failed';
}

export interface WorkflowStepResult {
  stepId: string;
  status: string;
  previousStepId?: string;
}

/**
 * Handle the workflow_step tool call.
 *
 * Delegates to onWorkflowStep callback in SessionManager which:
 * 1. Records previous step in workflowStepHistory
 * 2. Updates workflowStepId to the new step
 * 3. Optionally transitions permission mode per step config
 * 4. Emits workflow_step_changed event for UI
 * 5. Persists session
 */
export async function handleWorkflowStep(
  ctx: SessionToolContext,
  args: WorkflowStepArgs
): Promise<ToolResult> {
  if (!args.stepId?.trim()) {
    return errorResponse('stepId is required and cannot be empty.');
  }

  const onWorkflowStep = ctx.callbacks.onWorkflowStep;
  if (!onWorkflowStep) {
    return errorResponse('Workflow step tracking is not available in this context.');
  }

  try {
    const result = await onWorkflowStep(args);
    const lines = [`Step "${result.stepId}" ${args.status || 'started'}.`];
    if (result.previousStepId) {
      lines.push(`Previous step "${result.previousStepId}" recorded as completed.`);
    }
    return successResponse(lines.join('\n'));
  } catch (error) {
    return errorResponse(
      `Failed to update workflow step: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

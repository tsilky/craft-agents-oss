/**
 * SpawnChildSession Handler
 *
 * Creates a child session with specific instructions for a sub-task.
 * The parent orchestrator uses this to decompose large tasks into
 * independently executable child sessions.
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

export interface SpawnChildArgs {
  taskDescription: string;
  initialPrompt: string;
  workingDirectory?: string;
  permissionMode?: 'safe' | 'ask' | 'allow-all';
  autoApprove?: boolean;
  model?: string;
  name?: string;
  labels?: string[];
}

export interface SpawnChildResult {
  childSessionId: string;
  name?: string;
}

/**
 * Handle the SpawnChildSession tool call.
 *
 * 1. Validates required fields
 * 2. Delegates to onSpawnChild callback (SessionManager handles actual creation)
 * 3. Returns child session ID
 */
export async function handleSpawnChild(
  ctx: SessionToolContext,
  args: SpawnChildArgs
): Promise<ToolResult> {
  if (!args.taskDescription?.trim()) {
    return errorResponse('taskDescription is required and cannot be empty.');
  }

  if (!args.initialPrompt?.trim()) {
    return errorResponse('initialPrompt is required and cannot be empty.');
  }

  const onSpawnChild = ctx.callbacks.onSpawnChild;
  if (!onSpawnChild) {
    return errorResponse('Orchestration is not available in this context.');
  }

  try {
    const result = await onSpawnChild(args);
    return successResponse(
      `Child session "${result.name || result.childSessionId}" created. ` +
      `It will start planning in Explore mode.\n\n` +
      `Session ID: ${result.childSessionId}`
    );
  } catch (error) {
    return errorResponse(
      `Failed to create child session: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

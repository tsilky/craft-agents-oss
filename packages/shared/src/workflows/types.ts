/**
 * Workflow Types
 *
 * Type definitions for structured, multi-step agent workflows.
 * Workflows define ordered steps with permission modes, stop conditions,
 * and orchestration integration (child workflow assignment, question routing).
 */

import type { PermissionMode } from '../agent/mode-manager.ts';

/**
 * A single step within a workflow
 */
export interface WorkflowStep {
  /** Unique step ID within the workflow (e.g., "run-tests") */
  id: string;
  /** Display name (e.g., "Run Tests") */
  name: string;
  /** Shown in UI tooltip */
  description?: string;
  /** Override permission mode for this step */
  permissionMode?: PermissionMode;
  /** Natural language stop reasons — if any matches, agent should pause */
  stopConditions?: string[];
}

/**
 * Entry in a session's workflow step history
 */
export interface WorkflowStepHistoryEntry {
  stepId: string;
  completedAt: number;
  status: 'completed' | 'skipped' | 'failed';
}

/**
 * Workflow metadata from WORKFLOW.md YAML frontmatter
 */
export interface WorkflowMetadata {
  /** Display name (e.g., "Ship") */
  name: string;
  /** Brief description shown in workflow list */
  description: string;
  /** Emoji or URL icon */
  icon?: string;
  /** Default permission mode when workflow is activated */
  defaultPermissionMode?: PermissionMode;
  /** Ordered steps in the workflow */
  steps: WorkflowStep[];
  /** Map of stepId → workflow slug for child sessions spawned at that step */
  childWorkflows?: Record<string, string>;
}

/** Source of a loaded workflow */
export type WorkflowSource = 'global' | 'workspace' | 'project';

/**
 * A loaded workflow with parsed content
 */
export interface LoadedWorkflow {
  /** Directory name (slug) */
  slug: string;
  /** Parsed metadata from YAML frontmatter */
  metadata: WorkflowMetadata;
  /** Full WORKFLOW.md content (without frontmatter) — the instructions */
  content: string;
  /** Absolute path to icon file if exists */
  iconPath?: string;
  /** Absolute path to workflow directory */
  path: string;
  /** Where this workflow was loaded from */
  source: WorkflowSource;
}

/**
 * Pending question from a child session to the parent
 */
export interface ChildQuestion {
  /** Child session that asked */
  childSessionId: string;
  /** The question text */
  question: string;
  /** Context about what the child is doing */
  context: string;
  /** Structured options the child offered */
  options?: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  /** Child's own recommendation */
  recommendation?: string;
  /** Whether this blocks the child */
  severity: 'blocking' | 'informational';
  /** When the question was asked */
  askedAt: number;
}

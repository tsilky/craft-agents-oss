/**
 * Workflow Storage
 *
 * Discovery and loading for workspace workflows.
 * Workflows are stored in {workspace}/workflows/{slug}/ directories.
 * 3-tier discovery: project > workspace > global (same as skills).
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import matter from 'gray-matter';
import type { LoadedWorkflow, WorkflowMetadata, WorkflowSource, WorkflowStep } from './types.ts';
import { getWorkspaceWorkflowsPath } from '../workspaces/storage.ts';
import {
  validateIconValue,
  findIconFile,
} from '../utils/icon.ts';

// ============================================================
// Agent Workflow Paths
// ============================================================

/** Global agent workflows directory: ~/.agents/workflows/ */
export const GLOBAL_AGENT_WORKFLOWS_DIR = join(homedir(), '.agents', 'workflows');

/** Project-level agent workflows relative directory name */
export const PROJECT_AGENT_WORKFLOWS_DIR = '.agents/workflows';

// ============================================================
// Parsing
// ============================================================

/**
 * Parse a single workflow step from frontmatter data.
 * Returns null if the step is missing required fields.
 */
function parseWorkflowStep(raw: unknown): WorkflowStep | null {
  if (!raw || typeof raw !== 'object') return null;
  const step = raw as Record<string, unknown>;
  if (typeof step.id !== 'string' || typeof step.name !== 'string') return null;

  return {
    id: step.id,
    name: step.name,
    description: typeof step.description === 'string' ? step.description : undefined,
    permissionMode: typeof step.permissionMode === 'string'
      ? step.permissionMode as WorkflowStep['permissionMode']
      : undefined,
    stopConditions: Array.isArray(step.stopConditions)
      ? step.stopConditions.filter((s): s is string => typeof s === 'string')
      : undefined,
  };
}

/**
 * Parse WORKFLOW.md content and extract frontmatter + body
 */
function parseWorkflowFile(content: string): { metadata: WorkflowMetadata; body: string } | null {
  try {
    const parsed = matter(content);

    // Validate required fields
    if (!parsed.data.name || !parsed.data.description) {
      return null;
    }

    // Parse steps
    const rawSteps = Array.isArray(parsed.data.steps) ? parsed.data.steps : [];
    const steps = rawSteps
      .map(parseWorkflowStep)
      .filter((s): s is WorkflowStep => s !== null);

    // Validate icon
    const icon = validateIconValue(parsed.data.icon, 'Workflows');

    // Parse childWorkflows map
    let childWorkflows: Record<string, string> | undefined;
    if (parsed.data.childWorkflows && typeof parsed.data.childWorkflows === 'object') {
      childWorkflows = {};
      for (const [key, value] of Object.entries(parsed.data.childWorkflows)) {
        if (typeof value === 'string') {
          childWorkflows[key] = value;
        }
      }
      if (Object.keys(childWorkflows).length === 0) childWorkflows = undefined;
    }

    return {
      metadata: {
        name: parsed.data.name as string,
        description: parsed.data.description as string,
        icon,
        defaultPermissionMode: typeof parsed.data.defaultPermissionMode === 'string'
          ? parsed.data.defaultPermissionMode as WorkflowMetadata['defaultPermissionMode']
          : undefined,
        steps,
        childWorkflows,
      },
      body: parsed.content,
    };
  } catch {
    return null;
  }
}

// ============================================================
// Load Operations
// ============================================================

/**
 * Load a single workflow from a directory
 */
function loadWorkflowFromDir(workflowsDir: string, slug: string, source: WorkflowSource): LoadedWorkflow | null {
  const workflowDir = join(workflowsDir, slug);
  const workflowFile = join(workflowDir, 'WORKFLOW.md');

  if (!existsSync(workflowDir) || !statSync(workflowDir).isDirectory()) {
    return null;
  }

  if (!existsSync(workflowFile)) {
    return null;
  }

  let content: string;
  try {
    content = readFileSync(workflowFile, 'utf-8');
  } catch {
    return null;
  }

  const parsed = parseWorkflowFile(content);
  if (!parsed) {
    return null;
  }

  return {
    slug,
    metadata: parsed.metadata,
    content: parsed.body,
    iconPath: findIconFile(workflowDir),
    path: workflowDir,
    source,
  };
}

/**
 * Load all workflows from a directory
 */
function loadWorkflowsFromDir(workflowsDir: string, source: WorkflowSource): LoadedWorkflow[] {
  if (!existsSync(workflowsDir)) {
    return [];
  }

  const workflows: LoadedWorkflow[] = [];

  try {
    const entries = readdirSync(workflowsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const workflow = loadWorkflowFromDir(workflowsDir, entry.name, source);
      if (workflow) {
        workflows.push(workflow);
      }
    }
  } catch {
    // Ignore errors reading workflows directory
  }

  return workflows;
}

/**
 * Load a single workflow from a workspace
 */
export function loadWorkflow(workspaceRoot: string, slug: string): LoadedWorkflow | null {
  const workflowsDir = getWorkspaceWorkflowsPath(workspaceRoot);
  return loadWorkflowFromDir(workflowsDir, slug, 'workspace');
}

/**
 * Load all workflows from a workspace
 */
export function loadWorkspaceWorkflows(workspaceRoot: string): LoadedWorkflow[] {
  const workflowsDir = getWorkspaceWorkflowsPath(workspaceRoot);
  return loadWorkflowsFromDir(workflowsDir, 'workspace');
}

/**
 * Load all workflows from all sources (global, workspace, project).
 * Workflows with the same slug are overridden by higher-priority sources.
 * Priority: global (lowest) < workspace < project (highest)
 */
export function loadAllWorkflows(workspaceRoot: string, projectRoot?: string): LoadedWorkflow[] {
  const workflowsBySlug = new Map<string, LoadedWorkflow>();

  // 1. Global workflows (lowest priority): ~/.agents/workflows/
  for (const workflow of loadWorkflowsFromDir(GLOBAL_AGENT_WORKFLOWS_DIR, 'global')) {
    workflowsBySlug.set(workflow.slug, workflow);
  }

  // 2. Workspace workflows (medium priority)
  for (const workflow of loadWorkspaceWorkflows(workspaceRoot)) {
    workflowsBySlug.set(workflow.slug, workflow);
  }

  // 3. Project workflows (highest priority): {projectRoot}/.agents/workflows/
  if (projectRoot) {
    const projectWorkflowsDir = join(projectRoot, PROJECT_AGENT_WORKFLOWS_DIR);
    for (const workflow of loadWorkflowsFromDir(projectWorkflowsDir, 'project')) {
      workflowsBySlug.set(workflow.slug, workflow);
    }
  }

  return Array.from(workflowsBySlug.values());
}

/**
 * Load a single workflow by slug from all sources (project > workspace > global).
 * O(1) — only reads the specific slug directory.
 */
export function loadWorkflowBySlug(workspaceRoot: string, slug: string, projectRoot?: string): LoadedWorkflow | null {
  // Highest priority: project-level
  if (projectRoot) {
    const projectWorkflowsDir = join(projectRoot, PROJECT_AGENT_WORKFLOWS_DIR);
    const workflow = loadWorkflowFromDir(projectWorkflowsDir, slug, 'project');
    if (workflow) return workflow;
  }

  // Medium priority: workspace
  const workspaceWorkflow = loadWorkflowFromDir(getWorkspaceWorkflowsPath(workspaceRoot), slug, 'workspace');
  if (workspaceWorkflow) return workspaceWorkflow;

  // Lowest priority: global
  return loadWorkflowFromDir(GLOBAL_AGENT_WORKFLOWS_DIR, slug, 'global');
}

/**
 * Check if a workflow exists in any source
 */
export function workflowExists(workspaceRoot: string, slug: string, projectRoot?: string): boolean {
  return loadWorkflowBySlug(workspaceRoot, slug, projectRoot) !== null;
}

/**
 * List workflow slugs from a workspace
 */
export function listWorkflowSlugs(workspaceRoot: string): string[] {
  const workflowsDir = getWorkspaceWorkflowsPath(workspaceRoot);

  if (!existsSync(workflowsDir)) {
    return [];
  }

  try {
    return readdirSync(workflowsDir, { withFileTypes: true })
      .filter((entry) => {
        if (!entry.isDirectory()) return false;
        const workflowFile = join(workflowsDir, entry.name, 'WORKFLOW.md');
        return existsSync(workflowFile);
      })
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}

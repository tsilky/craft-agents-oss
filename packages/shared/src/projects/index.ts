/**
 * Projects Module
 *
 * Public exports for project management.
 */

// Types
export type { ProjectConfig, ProjectSummary } from './types.ts';

// Storage functions
export {
  // Path utilities
  getWorkspaceProjectsPath,
  getProjectConfigPath,
  getProjectPath,
  ensureProjectsDir,
  // Config operations
  loadProject,
  loadAllProjects,
  listProjectSummaries,
  saveProject,
  deleteProject,
  // Resolution
  resolveProjectForPath,
  // Create operations
  generateProjectSlug,
  projectExists,
} from './storage.ts';

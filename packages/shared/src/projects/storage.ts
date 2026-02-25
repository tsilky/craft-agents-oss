/**
 * Project Storage
 *
 * CRUD operations for workspace-scoped projects.
 * Projects are stored at {workspaceRootPath}/projects/{slug}/
 *
 * Note: All functions take `workspaceRootPath` (absolute path to workspace folder),
 * NOT a workspace slug.
 */

import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { ProjectConfig, ProjectSummary } from './types.ts';
import { readJsonFileSync, atomicWriteFileSync } from '../utils/files.ts';
import { expandPath, toPortablePath, pathStartsWith } from '../utils/paths.ts';

// ============================================================
// Path Utilities
// ============================================================

/**
 * Get path to workspace projects directory
 */
export function getWorkspaceProjectsPath(rootPath: string): string {
  return join(rootPath, 'projects');
}

/**
 * Get path to a project's config.json
 */
export function getProjectConfigPath(rootPath: string, slug: string): string {
  return join(getWorkspaceProjectsPath(rootPath), slug, 'config.json');
}

/**
 * Get path to a project folder
 */
export function getProjectPath(rootPath: string, slug: string): string {
  return join(getWorkspaceProjectsPath(rootPath), slug);
}

/**
 * Ensure projects directory exists for a workspace
 */
export function ensureProjectsDir(rootPath: string): void {
  const dir = getWorkspaceProjectsPath(rootPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// ============================================================
// Config Operations
// ============================================================

/**
 * Load a single project config
 */
export function loadProject(rootPath: string, slug: string): ProjectConfig | null {
  const configPath = getProjectConfigPath(rootPath, slug);
  if (!existsSync(configPath)) return null;

  try {
    return readJsonFileSync<ProjectConfig>(configPath);
  } catch {
    return null;
  }
}

/**
 * Load all projects for a workspace
 */
export function loadAllProjects(rootPath: string): ProjectConfig[] {
  const projectsDir = getWorkspaceProjectsPath(rootPath);
  if (!existsSync(projectsDir)) return [];

  const projects: ProjectConfig[] = [];
  try {
    const entries = readdirSync(projectsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const project = loadProject(rootPath, entry.name);
        if (project) {
          projects.push(project);
        }
      }
    }
  } catch {
    // Ignore errors scanning directory
  }

  return projects;
}

/**
 * List project summaries (lightweight, for UI lists)
 */
export function listProjectSummaries(rootPath: string): ProjectSummary[] {
  return loadAllProjects(rootPath).map((project) => ({
    slug: project.slug,
    name: project.name,
    path: expandPath(project.path),
    icon: project.icon,
    tagline: project.tagline,
    hasDefaults: !!(
      project.defaults &&
      (project.defaults.enabledSourceSlugs?.length ||
        project.defaults.permissionMode ||
        project.defaults.model ||
        project.defaults.thinkingLevel)
    ),
  }));
}

/**
 * Save a project config
 */
export function saveProject(rootPath: string, config: ProjectConfig): void {
  const dir = getProjectPath(rootPath, config.slug);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Store path in portable form
  const storageConfig: ProjectConfig = {
    ...config,
    path: toPortablePath(config.path),
    updatedAt: Date.now(),
  };

  atomicWriteFileSync(join(dir, 'config.json'), JSON.stringify(storageConfig, null, 2));
}

/**
 * Delete a project
 */
export function deleteProject(rootPath: string, slug: string): void {
  const dir = getProjectPath(rootPath, slug);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true });
  }
}

// ============================================================
// Project Resolution
// ============================================================

/**
 * Resolve a working directory path to a project.
 * Matches exact path or child paths. If paths overlap, the deepest matching project wins.
 *
 * @param rootPath - Workspace root path
 * @param dirPath - Absolute working directory path to resolve
 * @returns The matching ProjectConfig or null
 */
export function resolveProjectForPath(
  rootPath: string,
  dirPath: string
): ProjectConfig | null {
  const projects = loadAllProjects(rootPath);
  if (projects.length === 0) return null;

  let bestMatch: ProjectConfig | null = null;
  let bestMatchLength = 0;

  for (const project of projects) {
    const expandedProjectPath = expandPath(project.path);

    // Check if dirPath is the project path or a child of it
    if (pathStartsWith(dirPath, expandedProjectPath)) {
      // Deepest match wins (longest path)
      if (expandedProjectPath.length > bestMatchLength) {
        bestMatch = project;
        bestMatchLength = expandedProjectPath.length;
      }
    }
  }

  return bestMatch;
}

// ============================================================
// Create Operations
// ============================================================

/**
 * Generate URL-safe slug from name, with collision detection
 */
export function generateProjectSlug(rootPath: string, name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  if (!slug) {
    slug = 'project';
  }

  // Check for existing slugs
  const projectsDir = getWorkspaceProjectsPath(rootPath);
  const existingSlugs = new Set<string>();
  if (existsSync(projectsDir)) {
    const entries = readdirSync(projectsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        existingSlugs.add(entry.name);
      }
    }
  }

  if (!existingSlugs.has(slug)) {
    return slug;
  }

  let counter = 2;
  while (existingSlugs.has(`${slug}-${counter}`)) {
    counter++;
  }

  return `${slug}-${counter}`;
}

/**
 * Check if a project exists
 */
export function projectExists(rootPath: string, slug: string): boolean {
  return existsSync(getProjectConfigPath(rootPath, slug));
}

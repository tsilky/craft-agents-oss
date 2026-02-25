/**
 * Project Types
 *
 * Projects are named, pre-configured working directory entries.
 * Each project maps a local directory path to a set of session defaults
 * (sources, permission mode, model, thinking level).
 *
 * File structure:
 * ~/.craft-agent/workspaces/{workspaceId}/projects/{slug}/
 *   └── config.json   - Project settings
 */

import type { PermissionMode } from '../agent/mode-manager.ts';
import type { ThinkingLevel } from '../agent/thinking-levels.ts';

/**
 * Project configuration (stored in config.json)
 */
export interface ProjectConfig {
  id: string; // "proj_a1b2c3d4"
  name: string; // "Craft Agents"
  slug: string; // "craft-agents"
  path: string; // "~/projects/craft-agents-oss" (portable)

  /** Lucide icon name (e.g. "Code") or single emoji */
  icon?: string;
  /** Short description */
  tagline?: string;

  /** Session defaults applied when this project's directory is selected */
  defaults?: {
    enabledSourceSlugs?: string[];
    permissionMode?: PermissionMode;
    model?: string;
    thinkingLevel?: ThinkingLevel;
  };

  createdAt: number;
  updatedAt: number;
}

/**
 * Lightweight project summary for UI lists
 */
export interface ProjectSummary {
  slug: string;
  name: string;
  /** Expanded (absolute) path */
  path: string;
  icon?: string;
  tagline?: string;
  /** Quick check for UI badge — true if any defaults are configured */
  hasDefaults: boolean;
}

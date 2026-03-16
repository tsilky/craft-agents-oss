/**
 * Workflows Atom
 *
 * Simple atom for storing workspace workflows.
 * AppShell populates this when workflows are loaded.
 */

import { atom } from 'jotai'
import type { LoadedWorkflow } from '../../shared/types'

/**
 * Atom to store the current workspace's workflows.
 * AppShell populates this when workflows are loaded.
 */
export const workflowsAtom = atom<LoadedWorkflow[]>([])

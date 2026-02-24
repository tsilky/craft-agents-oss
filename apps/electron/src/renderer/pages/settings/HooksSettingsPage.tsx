/**
 * HooksSettingsPage
 *
 * Displays workspace hooks configuration in sections:
 * 1. About Hooks - overview of what hooks do
 * 2. Event Hooks - table of configured hooks per event
 * 3. Scheduled Hooks - table of cron-based hooks (SchedulerTick)
 *
 * Each section has an Edit button that opens an EditPopover for AI-assisted editing
 * of the underlying hooks.json file.
 *
 * Data is loaded via the useHooks hook which subscribes to live config changes.
 */

import * as React from 'react'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { EditPopover, EditButton, getEditConfig } from '@/components/ui/EditPopover'
import { getDocUrl } from '@craft-agent/shared/docs/doc-links'
import { Loader2 } from 'lucide-react'
import { useAppShellContext, useActiveWorkspace } from '@/context/AppShellContext'
import { useHooks } from '@/hooks/useHooks'
import {
  SettingsSection,
  SettingsCard,
} from '@/components/settings'
import { routes } from '@/lib/navigate'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import type { HookEventSummary } from '../../../shared/types'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'hooks',
}

/** Badge pill for hook types */
function HookTypeBadge({ type }: { type: 'command' | 'prompt' }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
      type === 'command'
        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
    }`}>
      {type}
    </span>
  )
}

/** A single event hook row */
function EventHookRow({ hook }: { hook: HookEventSummary }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border/50 last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{hook.event}</span>
          <div className="flex gap-1">
            {hook.types.map(type => (
              <HookTypeBadge key={type} type={type} />
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {hook.matcherCount} {hook.matcherCount === 1 ? 'matcher' : 'matchers'}, {hook.hookCount} {hook.hookCount === 1 ? 'hook' : 'hooks'}
        </div>
        {hook.matchers.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {hook.matchers.map((matcher, i) => (
              <div key={i} className="text-xs text-muted-foreground/70 font-mono">
                {matcher.matcher && <span>matcher: &quot;{matcher.matcher}&quot;</span>}
                {matcher.cron && <span>cron: &quot;{matcher.cron}&quot;</span>}
                {!matcher.matcher && !matcher.cron && <span>(all events)</span>}
                {matcher.enabled === false && <span className="ml-1 text-yellow-500">(disabled)</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HooksSettingsPage() {
  const { activeWorkspaceId } = useAppShellContext()
  const activeWorkspace = useActiveWorkspace()
  const { hooks, hasConfig, filePath, isLoading } = useHooks(activeWorkspaceId)

  // Resolve edit config using the workspace root path
  const rootPath = activeWorkspace?.rootPath || ''
  const hooksEditConfig = getEditConfig('edit-hooks', rootPath)

  // Secondary action: open the hooks.json file directly in system editor
  const editFileAction = filePath ? {
    label: 'Edit File',
    filePath,
  } : undefined

  // Split hooks into event hooks and scheduled hooks
  const eventHooks = hooks.filter(h => h.event !== 'SchedulerTick')
  const scheduledHooks = hooks.filter(h => h.event === 'SchedulerTick')

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="Hooks" actions={<HeaderMenu route={routes.view.settings('hooks')} />} />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
            <div className="space-y-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* About Section */}
                  <SettingsSection title="About Hooks">
                    <SettingsCard className="px-4 py-3.5">
                      <div className="text-sm text-muted-foreground leading-relaxed space-y-1.5">
                        <p>
                          Hooks let you automate actions in response to events — like running a script when a label is added, executing a command when the working directory changes, or injecting a prompt when a session starts.
                        </p>
                        <p>
                          Each hook has an <span className="text-foreground/80 font-medium">event</span> trigger, an optional <span className="text-foreground/80 font-medium">matcher</span> to filter which events fire it, and one or more <span className="text-foreground/80 font-medium">actions</span> (commands or prompts) to execute.
                        </p>
                        <p>
                          Hooks are configured in <code className="bg-foreground/5 px-1 rounded">hooks.json</code> at your workspace root.
                        </p>
                        <p>
                          <button
                            type="button"
                            onClick={() => window.electronAPI?.openUrl(getDocUrl('hooks'))}
                            className="text-foreground/70 hover:text-foreground underline underline-offset-2"
                          >
                            Learn more
                          </button>
                        </p>
                      </div>
                    </SettingsCard>
                  </SettingsSection>

                  {/* Event Hooks Section */}
                  <SettingsSection
                    title="Event Hooks"
                    description="Hooks that fire in response to app and agent events."
                    action={
                      <EditPopover
                        trigger={<EditButton />}
                        context={hooksEditConfig.context}
                        example={hooksEditConfig.example}
                        model={hooksEditConfig.model}
                        systemPromptPreset={hooksEditConfig.systemPromptPreset}
                        secondaryAction={editFileAction}
                      />
                    }
                  >
                    <SettingsCard className="p-0">
                      {eventHooks.length > 0 ? (
                        <div>
                          {eventHooks.map(hook => (
                            <EventHookRow key={hook.event} hook={hook} />
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <p className="text-sm">No event hooks configured.</p>
                          <p className="text-xs mt-1 text-foreground/40">
                            {hasConfig
                              ? 'Add event hooks to hooks.json to automate actions.'
                              : <>Create <code className="bg-foreground/5 px-1 rounded">hooks.json</code> in your workspace to get started.</>
                            }
                          </p>
                        </div>
                      )}
                    </SettingsCard>
                  </SettingsSection>

                  {/* Scheduled Hooks Section */}
                  <SettingsSection
                    title="Scheduled Hooks"
                    description="Hooks that run on a cron schedule via the SchedulerTick event."
                  >
                    <SettingsCard className="p-0">
                      {scheduledHooks.length > 0 ? (
                        <div>
                          {scheduledHooks.map(hook => (
                            <EventHookRow key={hook.event} hook={hook} />
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <p className="text-sm">No scheduled hooks configured.</p>
                          <p className="text-xs mt-1 text-foreground/40">
                            Add SchedulerTick hooks with a cron expression to run actions on a schedule.
                          </p>
                        </div>
                      )}
                    </SettingsCard>
                  </SettingsSection>
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

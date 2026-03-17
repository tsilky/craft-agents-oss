/**
 * Resolve a Lucide icon name (e.g. "Code", "Zap") to its React component.
 * Returns null if the name doesn't match any icon.
 */
import * as Icons from 'lucide-react'

export function getLucideIcon(name: string): React.ComponentType<{ className?: string }> | null {
  const IconComponent = Icons[name as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined
  return IconComponent ?? null
}

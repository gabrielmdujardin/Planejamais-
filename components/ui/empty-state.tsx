import * as React from "react"
import { LucideIcon, FolderOpen } from "lucide-react"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { emptyStateVariants } from "@/lib/design-system"

export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  secondaryActionLabel,
  onSecondaryAction,
  size,
  variant,
  className,
  children,
  ...props
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className={cn(emptyStateVariants({ size, variant, className }))}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 mb-4 shadow-sm">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {(actionLabel || secondaryActionLabel || children) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {secondaryActionLabel && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}

          {actionLabel && (
            <div>
              {actionHref ? (
                <Button asChild size="sm">
                  <a href={actionHref}>{actionLabel}</a>
                </Button>
              ) : (
                <Button onClick={onAction} size="sm">
                  {actionLabel}
                </Button>
              )}
            </div>
          )}

          {children}
        </div>
      )}
    </div>
  )
}

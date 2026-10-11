import * as React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800 motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  )
}

export const LoadingSkeleton = Skeleton

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando conteúdo..."
      className={cn(
        "p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm",
        className,
      )}
    >
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <span className="sr-only">Carregando...</span>
    </div>
  )
}

export function SkeletonTable({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando tabela..."
      className={cn("w-full space-y-3", className)}
    >
      <Skeleton className="h-10 w-full rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
      <span className="sr-only">Carregando...</span>
    </div>
  )
}

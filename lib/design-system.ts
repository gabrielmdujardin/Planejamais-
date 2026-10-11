import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-emerald-600 text-white shadow hover:bg-emerald-700 active:scale-[0.98]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-border bg-card shadow-sm",
        interactive:
          "border-border bg-card shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer active:scale-[0.99]",
        flat: "border-transparent bg-muted/40 shadow-none",
        outline: "border-border bg-transparent shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      inputSize: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2.5 py-1 text-xs rounded-md",
        lg: "h-11 px-4 py-3 text-base rounded-md",
      },
      error: {
        true: "border-destructive focus-visible:ring-destructive text-destructive-foreground",
        false: "",
      },
    },
    defaultVariants: {
      inputSize: "default",
      error: false,
    },
  },
)

export const badgeVariants = cva(
  "inline-flex items-center justify-center font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border border-slate-300 dark:border-slate-700 bg-transparent",
        success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
        warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
        info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
        paid: "border-emerald-300 bg-emerald-100 text-emerald-800 font-medium dark:bg-emerald-900/40 dark:text-emerald-300",
        pending: "border-amber-300 bg-amber-100 text-amber-800 font-medium dark:bg-amber-900/40 dark:text-amber-300",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs rounded-md",
        sm: "px-2 py-0.5 text-[11px] rounded-md",
        lg: "px-3 py-1 text-sm rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center rounded-xl border border-dashed transition-colors select-none",
  {
    variants: {
      size: {
        default: "p-8 my-4",
        sm: "p-4 my-2",
        lg: "p-12 my-6",
      },
      variant: {
        default: "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20",
        outline: "border-border bg-transparent",
        subtle: "border-transparent bg-muted/30",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
)

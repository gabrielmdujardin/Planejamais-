import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { inputVariants } from "@/lib/design-system"

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ inputSize, error, className }))}
        ref={ref}
        aria-invalid={error ? "true" : undefined}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input, inputVariants }

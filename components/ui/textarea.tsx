import * as React from "react"

import { cn } from "@/lib/utils"

// This extends HTMLTextAreaElement with no additional properties but provides a named type for our component
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  // This is a workaround to avoid the "empty interface" linter error
  _isTextareaComponent?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea } 
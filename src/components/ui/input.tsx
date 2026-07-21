import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-zinc-900/60 backdrop-blur-md px-4 py-2 text-sm transition-all outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:bg-white dark:focus-visible:bg-zinc-900 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-destructive shadow-xs",
        className
      )}
      {...props}
    />
  )
}

export { Input }

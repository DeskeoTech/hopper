import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  // Base styles: minimal radius, no shadows, translateY hover
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:ring-destructive/20 aria-invalid:border-destructive border",
  {
    variants: {
      variant: {
        // Primary: solid dark background with transform hover
        default:
          'bg-primary text-primary-foreground border-primary hover:-translate-y-px active:translate-y-0',
        // Destructive: uses error color
        destructive:
          'bg-destructive text-destructive-foreground border-destructive hover:-translate-y-px active:translate-y-0 focus-visible:ring-destructive/20',
        // Outline: transparent with border
        outline:
          'bg-transparent text-foreground border-border hover:-translate-y-px active:translate-y-0',
        // Secondary: transparent with border (same as outline for this design system)
        secondary:
          'bg-transparent text-foreground border-border hover:-translate-y-px active:translate-y-0',
        // Ghost: no border, subtle hover
        ghost:
          'border-transparent hover:bg-muted hover:text-foreground',
        // Link: underline style
        link: 'text-primary underline-offset-4 hover:underline border-transparent',
      },
      size: {
        default: 'h-9 px-4 py-2 rounded-sm has-[>svg]:px-3',
        sm: 'h-8 rounded-sm gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-sm px-6 has-[>svg]:px-4',
        icon: 'size-9 rounded-sm',
        'icon-sm': 'size-8 rounded-sm',
        'icon-lg': 'size-10 rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

import { cva, type VariantProps } from 'class-variance-authority';

export const inputVariants = cva(
  'w-full rounded-md border bg-surface text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-surface-elevated disabled:text-muted-foreground placeholder:text-muted',
  {
    variants: {
      variant: {
        default: 'border-border focus-visible:ring-ring',
        error: 'border-error focus-visible:ring-error',
      },
      size: {
        sm: 'h-8 px-2.5 text-sm',
        md: 'h-10 px-3 text-base',
        lg: 'h-12 px-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type InputVariants = VariantProps<typeof inputVariants>;

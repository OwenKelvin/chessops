import { cva, type VariantProps } from 'class-variance-authority';

export const inputVariants = cva(
  'w-full rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 font-body bg-surface/60 backdrop-blur-sm',
  {
    variants: {
      variant: {
        default: [
          'text-foreground border-border',
          'placeholder:text-muted',
          'hover:border-primary/50',
          'focus:border-primary focus:ring-ring',
        ],
        error: [
          'bg-error-light text-error border-error',
          'placeholder:text-error/70',
          'focus:ring-error/30',
        ],
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-5 py-3.5 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export type InputVariants = VariantProps<typeof inputVariants>;

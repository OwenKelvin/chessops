import { cva, type VariantProps } from 'class-variance-authority';

export const inputVariants = cva(
  'w-full rounded-md border transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 font-body',
  {
    variants: {
      variant: {
        default: [
          'bg-surface text-foreground border-border',
          'placeholder:text-muted/60',
          'focus:border-primary focus:ring-ring/30',
        ],
        error: [
          'bg-error-light text-error border-error',
          'placeholder:text-error/50',
          'focus:ring-error/20',
        ],
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-5 py-3 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export type InputVariants = VariantProps<typeof inputVariants>;

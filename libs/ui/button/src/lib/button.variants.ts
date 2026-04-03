import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:ring-primary',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover focus-visible:ring-secondary',
        accent: 'bg-accent text-accent-foreground hover:bg-accent-hover focus-visible:ring-accent',
        ghost: 'bg-ghost text-ghost-foreground hover:bg-ghost-hover focus-visible:ring-ghost',
        outline: 'border border-border bg-transparent text-foreground hover:bg-surface focus-visible:ring-ring',
        danger: 'bg-error text-error-foreground hover:bg-error/90 focus-visible:ring-error',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

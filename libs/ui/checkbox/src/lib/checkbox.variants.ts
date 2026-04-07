import { cva, type VariantProps } from 'class-variance-authority';

export const checkboxVariants = cva(
  'inline-flex items-center justify-center rounded transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer border-2',
  {
    variants: {
      variant: {
        default: 'bg-surface border-border text-primary-foreground',
        error: 'bg-error-light border-error text-error-foreground',
      },
      checked: {
        true: 'bg-caramel border-caramel text-white',
        false: '',
      },
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export type CheckboxVariants = VariantProps<typeof checkboxVariants>;

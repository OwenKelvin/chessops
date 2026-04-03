import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva(
  'block bg-surface rounded-lg',
  {
    variants: {
      variant: {
        default: 'shadow-sm',
        elevated: 'shadow-md bg-surface-elevated',
        outlined: 'border border-border shadow-none',
      },
      padding: {
        true: 'p-4',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: true,
    },
  }
);

export type CardVariants = VariantProps<typeof cardVariants>;

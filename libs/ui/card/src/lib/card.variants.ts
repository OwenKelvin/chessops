import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva(
  'block rounded-xl border border-border backdrop-blur-md',
  {
    variants: {
      variant: {
        default: 'bg-surface shadow-sm',
        elevated: 'bg-surface-elevated shadow-lg',
        outlined: 'bg-surface/50 shadow-none',
      },
      padding: {
        true: 'p-5',
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

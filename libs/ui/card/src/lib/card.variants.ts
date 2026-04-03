import { cva, type VariantProps } from 'class-variance-authority';

export const cardVariants = cva(
  'block bg-white rounded-lg',
  {
    variants: {
      variant: {
        default: 'shadow-sm',
        elevated: 'shadow-md',
        outlined: 'border border-gray-200 shadow-none',
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

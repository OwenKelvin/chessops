import { cva, type VariantProps } from 'class-variance-authority';

export const tableVariants = cva(
  'w-full border-collapse text-sm',
  {
    variants: {
      striped: {
        true: '',
        false: '',
      },
      hover: {
        true: '',
        false: '',
      },
      compact: {
        true: 'chessops-table--compact',
        false: '',
      },
    },
    defaultVariants: {
      striped: true,
      hover: true,
      compact: false,
    },
  }
);

export type TableVariants = VariantProps<typeof tableVariants>;

export const tableHeaderVariants = cva(
  'px-4 py-3 text-left font-semibold text-foreground border-b border-border',
  {
    variants: {
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
      sortable: {
        true: 'cursor-pointer select-none hover:bg-surface-elevated',
        false: '',
      },
    },
    defaultVariants: {
      align: 'left',
      sortable: false,
    },
  }
);

export const tableCellVariants = cva(
  'px-4 py-3 border-b border-border text-foreground',
  {
    variants: {
      align: {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right',
      },
    },
    defaultVariants: {
      align: 'left',
    },
  }
);

// Primary entry point - exports all components and modules
export * from './lib/ui.module';

// Components
export { ButtonComponent, buttonVariants, type ButtonVariant, type ButtonSize } from './lib/components/button/button.component';
export { InputComponent, inputVariants, type InputType, type InputSize } from './lib/components/input/input.component';
export { CardComponent, cardVariants, type CardVariants } from './lib/components/card/card.component';
export { TableComponent, tableVariants, tableHeaderVariants, tableCellVariants, type TableVariants, type ColumnDef } from './lib/components/table/table.component';

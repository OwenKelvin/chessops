import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  cellClass?: (row: T) => string;
}

export type SortableKey = string;

@Component({
  selector: 'chessops-table',
  template: `
    <div [class]="tableClass">
      <table class="chessops-table__table">
        <thead class="chessops-table__head">
          <tr class="chessops-table__row">
            <th
              *ngFor="let col of columns"
              [class]="getHeaderClass(col)"
              [style.width]="col.width"
              (click)="col.sortable ? onSort(col) : null"
              [class.chessops-table__header--sortable]="col.sortable"
            >
              {{ col.label }}
              <span *ngIf="col.sortable" class="chessops-table__sort-icon">
                <ng-container *ngIf="sortKey === col.key">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </ng-container>
              </span>
            </th>
          </tr>
        </thead>
        <tbody class="chessops-table__body">
          <tr
            *ngFor="let row of data; let i = index"
            [class]="getRowClass(i)"
            (click)="rowClick.emit(row)"
          >
            <td
              *ngFor="let col of columns"
              [class]="getCellClass(col, row)"
            >
              <ng-container *ngIf="getCellContent(col, row) as content">
                {{ content }}
              </ng-container>
              <ng-container *ngIf="!getCellContent(col, row)">
                <ng-content [select]="getCellSelector(col)"></ng-content>
              </ng-container>
            </td>
          </tr>
          <tr *ngIf="data.length === 0" class="chessops-table__row chessops-table__row--empty">
            <td [attr.colspan]="columns.length" class="chessops-table__cell chessops-table__cell--empty">
              {{ emptyMessage }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  standalone: false,
})
export class TableComponent<T> {
  @Input() columns: ColumnDef<T>[] = [];
  @Input() data: T[] = [];
  @Input() striped = true;
  @Input() hover = true;
  @Input() compact = false;
  @Input() emptyMessage = 'No data';
  @Input() sortKey?: string;
  @Input() sortDirection: 'asc' | 'desc' = 'asc';
  @Output() sort = new EventEmitter<string>();
  @Output() rowClick = new EventEmitter<T>();

  @HostBinding('class') get class() {
    return 'chessops-table';
  }

  get tableClass(): string {
    return `chessops-table__wrapper ${this.compact ? 'chessops-table--compact' : ''}`;
  }

  getHeaderClass(col: ColumnDef<T>): string {
    return `chessops-table__header chessops-table__header--${col.align || 'left'}`;
  }

  getRowClass(index: number): string {
    const classes = ['chessops-table__row'];
    if (this.striped && index % 2 === 1) classes.push('chessops-table__row--striped');
    if (this.hover) classes.push('chessops-table__row--hover');
    return classes.join(' ');
  }

  getCellClass(col: ColumnDef<T>, row: T): string {
    const classes = ['chessops-table__cell', `chessops-table__cell--${col.align || 'left'}`];
    if (col.cellClass) classes.push(col.cellClass(row));
    return classes.join(' ');
  }

  getCellContent(col: ColumnDef<T>, row: any): any {
    if (typeof col.key === 'string') {
      return row[col.key];
    }
    return undefined;
  }

  getCellSelector(col: ColumnDef<T>): string {
    return `[cell-${String(col.key)}]`;
  }

  onSort(col: ColumnDef<T>): void {
    this.sort.emit(String(col.key));
  }
}

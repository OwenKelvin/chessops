import { describe, it, expect } from 'vitest';
import { TableComponent, type ColumnDef } from './table.component';

interface TestData {
  id: number;
  name: string;
  email: string;
}

describe('TableComponent', () => {
  it('should create', () => {
    const component = new TableComponent<TestData>();
    expect(component).toBeTruthy();
  });

  it('should have default empty data', () => {
    const component = new TableComponent<TestData>();
    expect(component.data).toEqual([]);
  });

  it('should have striped enabled by default', () => {
    const component = new TableComponent<TestData>();
    expect(component.striped).toBe(true);
  });

  it('should have hover enabled by default', () => {
    const component = new TableComponent<TestData>();
    expect(component.hover).toBe(true);
  });

  it('should generate table wrapper class', () => {
    const component = new TableComponent<TestData>();
    expect(component.tableWrapperClass).toContain('overflow-x-auto');
  });

  it('should generate row class with striping', () => {
    const component = new TableComponent<TestData>();
    expect(component.getRowClass(0)).toContain('chessops-table__row');
    expect(component.getRowClass(1)).toContain('chessops-table__row--striped');
  });

  it('should emit sort event', () => {
    const component = new TableComponent<TestData>();
    let emittedKey: string | undefined;
    component.sort.subscribe((key) => {
      emittedKey = key;
    });
    const col: ColumnDef<TestData> = { key: 'name', label: 'Name', sortable: true };
    component.onSort(col);
    expect(emittedKey).toBe('name');
  });
});

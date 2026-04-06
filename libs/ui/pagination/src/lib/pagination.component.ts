import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { twMerge } from 'tailwind-merge';

@Component({
  selector: 'chessops-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages > 1) {
      <nav class="pagination" aria-label="Pagination">
        <button
          type="button"
          class="pagination-btn"
          [disabled]="currentPage === 1"
          (click)="previous()"
          aria-label="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        @for (page of visiblePages; track page) {
          @if (page === -1) {
            <span class="pagination-ellipsis">...</span>
          } @else {
            <button
              type="button"
              class="pagination-btn"
              [class.active]="page === currentPage"
              (click)="goToPage(page)"
              aria-label="Page {{ page }}"
              aria-current="page"
            >
              {{ page }}
            </button>
          }
        }

        <button
          type="button"
          class="pagination-btn"
          [disabled]="currentPage === totalPages"
          (click)="next()"
          aria-label="Next page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <span class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
      </nav>
    }
  `,
  styles: `
    .pagination {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .pagination-btn {
      min-width: 2.25rem;
      height: 2.25rem;
      padding: 0.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid var(--color-border);
      border-radius: 0.375rem;
      background: var(--color-surface);
      color: var(--color-foreground);
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pagination-btn:hover:not(:disabled) {
      background: var(--color-surface-elevated);
      border-color: var(--color-accent);
    }

    .pagination-btn.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: var(--color-primary-foreground);
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-ellipsis {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 2.25rem;
      color: var(--color-muted-foreground);
    }

    .pagination-info {
      font-size: 0.75rem;
      color: var(--color-muted-foreground);
      margin-left: 0.5rem;
    }
  `,
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() siblingCount = 1;
  @Output() pageChange = new EventEmitter<number>();

  get visiblePages(): (number | -1)[] {
    const totalVisible = this.siblingCount * 2 + 5; // first, last, 2*sibling, 2*ellipsis, current
    if (totalVisible >= this.totalPages) {
      return Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(this.currentPage - this.siblingCount, 1);
    const rightSiblingIndex = Math.min(this.currentPage + this.siblingCount, this.totalPages);

    const shouldShowLeftEllipsis = leftSiblingIndex > 2;
    const shouldShowRightEllipsis = rightSiblingIndex < this.totalPages - 1;

    const pages: (number | -1)[] = [];

    if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      const leftItemCount = 3 + this.siblingCount * 2;
      pages.push(...Array.from({ length: leftItemCount }, (_, i) => i + 1));
      pages.push(-1);
      pages.push(this.totalPages);
      return pages;
    }

    if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
      const rightItemCount = 3 + this.siblingCount * 2;
      pages.push(1);
      pages.push(-1);
      pages.push(...Array.from({ length: rightItemCount }, (_, i) => this.totalPages - rightItemCount + i + 1));
      return pages;
    }

    if (shouldShowLeftEllipsis && shouldShowRightEllipsis) {
      pages.push(1);
      pages.push(-1);
      pages.push(...Array.from({ length: this.siblingCount * 2 + 1 }, (_, i) => leftSiblingIndex + i));
      pages.push(-1);
      pages.push(this.totalPages);
      return pages;
    }

    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.pageChange.emit(page);
    }
  }

  previous(): void {
    this.goToPage(this.currentPage - 1);
  }

  next(): void {
    this.goToPage(this.currentPage + 1);
  }
}
